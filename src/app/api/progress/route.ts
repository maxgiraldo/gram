/**
 * Progress API Routes
 * 
 * Main REST API endpoints for learner progress tracking and management.
 * Supports progress retrieval, updating, and analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProgress,
  getLessonProgressByLesson as getLessonProgress,
  getUserLessonProgress,
  upsertLearnerProgress,
  getProgressSummary,
  getUsersNeedingRemediation,
  getUsersEligibleForEnrichment,
  type CreateLearnerProgressData
} from '@/lib/db/queries';

// ===== GET /api/progress =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');
    const type = searchParams.get('type');

    // Handle different query types
    if (type === 'summary' && userId) {
      const summary = await getProgressSummary(userId);
      return NextResponse.json({
        success: true,
        data: summary
      });
    }

    if (type === 'remediation') {
      const users = await getUsersNeedingRemediation(lessonId || undefined);
      return NextResponse.json({
        success: true,
        data: users,
        count: users.length
      });
    }

    if (type === 'enrichment') {
      const users = await getUsersEligibleForEnrichment(lessonId || undefined);
      return NextResponse.json({
        success: true,
        data: users,
        count: users.length
      });
    }

    // Get progress by user
    if (userId && !lessonId) {
      const progress = await getUserProgress(userId);
      return NextResponse.json({
        success: true,
        data: progress,
        count: progress.length
      });
    }

    // Get progress by lesson
    if (lessonId && !userId) {
      const progress = await getLessonProgress(lessonId);
      return NextResponse.json({
        success: true,
        data: progress,
        count: progress.length
      });
    }

    // Both userId and lessonId required for specific progress
    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'userId or lessonId parameter is required, or specify type (summary, remediation, enrichment)' },
        { status: 400 }
      );
    }

    // Get specific user-lesson progress
    const { getLearnerProgress } = await import('@/lib/db/queries');
    const progress = await getLearnerProgress(userId, lessonId);

    if (!progress) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No progress found for this user and lesson'
      });
    }

    return NextResponse.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('GET /api/progress error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== POST /api/progress =====

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!body.lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['not_started', 'in_progress', 'completed', 'mastered'].includes(body.status)) {
      return NextResponse.json(
        { error: 'valid status is required (not_started, in_progress, completed, mastered)' },
        { status: 400 }
      );
    }

    // Validate scores if provided
    if (body.currentScore !== undefined && (typeof body.currentScore !== 'number' || body.currentScore < 0 || body.currentScore > 1)) {
      return NextResponse.json(
        { error: 'currentScore must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    if (body.bestScore !== undefined && (typeof body.bestScore !== 'number' || body.bestScore < 0 || body.bestScore > 1)) {
      return NextResponse.json(
        { error: 'bestScore must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Validate time if provided
    if (body.totalTimeSpent !== undefined && (typeof body.totalTimeSpent !== 'number' || body.totalTimeSpent < 0)) {
      return NextResponse.json(
        { error: 'totalTimeSpent must be a non-negative number' },
        { status: 400 }
      );
    }

    // Parse JSON fields if provided
    let remediationPath = body.remediationPath;
    let enrichmentActivities = body.enrichmentActivities;

    if (remediationPath && typeof remediationPath === 'object') {
      remediationPath = JSON.stringify(remediationPath);
    }

    if (enrichmentActivities && typeof enrichmentActivities === 'object') {
      enrichmentActivities = JSON.stringify(enrichmentActivities);
    }

    const progressData: CreateLearnerProgressData = {
      userId: body.userId,
      lessonId: body.lessonId,
      status: body.status,
      currentScore: body.currentScore,
      bestScore: body.bestScore,
      masteryAchieved: body.masteryAchieved,
      masteryDate: body.masteryDate ? new Date(body.masteryDate) : undefined,
      totalTimeSpent: body.totalTimeSpent,
      sessionsCount: body.sessionsCount,
      needsRemediation: body.needsRemediation,
      remediationPath,
      eligibleForEnrichment: body.eligibleForEnrichment,
      enrichmentActivities
    };

    const progress = await upsertLearnerProgress(progressData);

    return NextResponse.json({
      success: true,
      data: progress,
      message: 'Progress updated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/progress error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          message: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}