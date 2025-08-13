/**
 * Exercise Analytics API Routes
 * 
 * Endpoints for exercise performance tracking and analytics:
 * - GET: Get analytics data with various filters
 * - POST: Record analytics events
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getExerciseStats,
  getUserExerciseAttempts
} from '../../../../lib/db/queries/exercises';
import { executeQuery } from '../../../../lib/db/client';
import { prisma } from '../../../../lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');
    const unitId = searchParams.get('unitId');
    const timeframe = searchParams.get('timeframe') || '30'; // days
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));
    
    // Get exercise-specific analytics
    if (exerciseId) {
      const stats = await getExerciseStats(exerciseId);
      
      // Get additional analytics data
      const analytics = await getExerciseAnalytics(exerciseId, startDate, endDate);
      
      return NextResponse.json({
        success: true,
        data: {
          ...stats,
          ...analytics,
          timeframe: `${timeframe} days`
        }
      });
    }
    
    // Get user-specific analytics
    if (userId) {
      const userStats = await getUserAnalytics(userId, lessonId || undefined, unitId || undefined, startDate, endDate);
      
      return NextResponse.json({
        success: true,
        data: {
          ...userStats,
          timeframe: `${timeframe} days`
        }
      });
    }
    
    // Get system-wide analytics
    const systemStats = await getSystemAnalytics(lessonId || undefined, unitId || undefined, startDate, endDate);
    
    return NextResponse.json({
      success: true,
      data: {
        ...systemStats,
        timeframe: `${timeframe} days`
      }
    });
    
  } catch (error) {
    console.error('Error fetching exercise analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields for analytics event
    if (!body.eventType || !body.userId) {
      return NextResponse.json(
        { error: 'eventType and userId are required' },
        { status: 400 }
      );
    }
    
    // Record analytics event (this would typically go to a separate analytics service)
    const analyticsEvent = {
      eventType: body.eventType,
      userId: body.userId,
      exerciseId: body.exerciseId,
      lessonId: body.lessonId,
      unitId: body.unitId,
      metadata: body.metadata || {},
      timestamp: new Date()
    };
    
    // For now, we'll just log it (in production, send to analytics service)
    console.log('Analytics Event:', analyticsEvent);
    
    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded'
    });
    
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ===== ANALYTICS HELPER FUNCTIONS =====

async function getExerciseAnalytics(exerciseId: string, startDate: Date, endDate: Date) {
  return executeQuery('getExerciseAnalytics', async () => {
    const [
      attemptsOverTime,
      scoreDistribution,
      commonErrors,
      timeAnalytics
    ] = await Promise.all([
      getAttemptsOverTime(exerciseId, startDate, endDate),
      getScoreDistribution(exerciseId),
      getCommonErrors(exerciseId),
      getTimeAnalytics(exerciseId)
    ]);
    
    return {
      attemptsOverTime,
      scoreDistribution,
      commonErrors,
      timeAnalytics
    };
  });
}

async function getUserAnalytics(userId: string, lessonId?: string, unitId?: string, startDate?: Date, endDate?: Date) {
  return executeQuery('getUserAnalytics', async () => {
    const whereClause: any = { userId };
    
    if (startDate && endDate) {
      whereClause.startedAt = {
        gte: startDate,
        lte: endDate
      };
    }
    
    if (lessonId) {
      whereClause.exercise = { lessonId };
    } else if (unitId) {
      whereClause.exercise = { lesson: { unitId } };
    }
    
    const attempts = await prisma.exerciseAttempt.findMany({
      where: whereClause,
      include: {
        exercise: {
          include: {
            lesson: {
              include: {
                unit: true
              }
            }
          }
        },
        responses: true
      }
    });
    
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completedAt).length;
    const passedAttempts = attempts.filter(a => a.isPassed).length;
    const totalScore = attempts.reduce((sum, a) => sum + a.scorePercentage, 0);
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    
    // Group by lesson for progress tracking
    const lessonProgress = attempts.reduce((acc, attempt) => {
      const lessonId = attempt.exercise.lessonId;
      if (!acc[lessonId]) {
        acc[lessonId] = {
          lessonTitle: attempt.exercise.lesson.title,
          attempts: 0,
          bestScore: 0,
          completed: false
        };
      }
      acc[lessonId].attempts++;
      acc[lessonId].bestScore = Math.max(acc[lessonId].bestScore, attempt.scorePercentage);
      if (attempt.isPassed) {
        acc[lessonId].completed = true;
      }
      return acc;
    }, {} as any);
    
    return {
      summary: {
        totalAttempts,
        completedAttempts,
        passedAttempts,
        averageScore: completedAttempts > 0 ? totalScore / completedAttempts : 0,
        passRate: completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0,
        totalTimeSpent: totalTime
      },
      lessonProgress: Object.values(lessonProgress)
    };
  });
}

async function getSystemAnalytics(lessonId?: string, unitId?: string, startDate?: Date, endDate?: Date) {
  return executeQuery('getSystemAnalytics', async () => {
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.startedAt = {
        gte: startDate,
        lte: endDate
      };
    }
    
    if (lessonId) {
      whereClause.exercise = { lessonId };
    } else if (unitId) {
      whereClause.exercise = { lesson: { unitId } };
    }
    
    const [
      totalAttempts,
      completedAttempts,
      passedAttempts,
      uniqueUsers,
      averageScoreData
    ] = await Promise.all([
      prisma.exerciseAttempt.count({ where: whereClause }),
      prisma.exerciseAttempt.count({ where: { ...whereClause, completedAt: { not: null } } }),
      prisma.exerciseAttempt.count({ where: { ...whereClause, isPassed: true } }),
      prisma.exerciseAttempt.findMany({ 
        where: whereClause,
        select: { userId: true },
        distinct: ['userId']
      }),
      prisma.exerciseAttempt.aggregate({
        where: { ...whereClause, completedAt: { not: null } },
        _avg: { scorePercentage: true },
        _sum: { timeSpent: true }
      })
    ]);
    
    return {
      totalAttempts,
      completedAttempts,
      passedAttempts,
      uniqueUsers: uniqueUsers.length,
      averageScore: averageScoreData._avg.scorePercentage || 0,
      passRate: completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0,
      totalTimeSpent: averageScoreData._sum.timeSpent || 0
    };
  });
}

async function getAttemptsOverTime(exerciseId: string, startDate: Date, endDate: Date) {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: {
      exerciseId,
      startedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      startedAt: true,
      scorePercentage: true,
      isPassed: true
    }
  });
  
  // Group by day
  const dailyStats = attempts.reduce((acc, attempt) => {
    const day = attempt.startedAt.toISOString().split('T')[0];
    if (!acc[day]) {
      acc[day] = { attempts: 0, passed: 0, totalScore: 0 };
    }
    acc[day].attempts++;
    if (attempt.isPassed) acc[day].passed++;
    acc[day].totalScore += attempt.scorePercentage;
    return acc;
  }, {} as any);
  
  return Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
    date,
    attempts: stats.attempts,
    passed: stats.passed,
    passRate: stats.attempts > 0 ? (stats.passed / stats.attempts) * 100 : 0,
    averageScore: stats.attempts > 0 ? stats.totalScore / stats.attempts : 0
  }));
}

async function getScoreDistribution(exerciseId: string) {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: {
      exerciseId,
      completedAt: { not: null }
    },
    select: { scorePercentage: true }
  });
  
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };
  
  attempts.forEach(attempt => {
    const score = attempt.scorePercentage;
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });
  
  return distribution;
}

async function getCommonErrors(exerciseId: string) {
  const responses = await prisma.exerciseResponse.findMany({
    where: {
      attempt: { exerciseId },
      isCorrect: false
    },
    include: {
      question: {
        select: {
          questionText: true,
          type: true
        }
      }
    }
  });
  
  // Group errors by question
  const errorsByQuestion = responses.reduce((acc, response) => {
    const questionId = response.questionId;
    if (!acc[questionId]) {
      acc[questionId] = {
        questionText: response.question.questionText,
        questionType: response.question.type,
        errorCount: 0,
        totalResponses: 0
      };
    }
    acc[questionId].errorCount++;
    return acc;
  }, {} as any);
  
  return Object.values(errorsByQuestion)
    .sort((a: any, b: any) => b.errorCount - a.errorCount)
    .slice(0, 10); // Top 10 questions with most errors
}

async function getTimeAnalytics(exerciseId: string) {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: {
      exerciseId,
      timeSpent: { not: null }
    },
    select: { timeSpent: true }
  });
  
  const times = attempts.map(a => a.timeSpent!).sort((a, b) => a - b);
  
  if (times.length === 0) {
    return { averageTime: 0, medianTime: 0, minTime: 0, maxTime: 0 };
  }
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const medianTime = times[Math.floor(times.length / 2)];
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  
  return { averageTime, medianTime, minTime, maxTime };
}