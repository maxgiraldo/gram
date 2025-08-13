/**
 * Exercise Attempt Management API Routes
 * 
 * Endpoints for individual attempt operations:
 * - GET: Get attempt details with responses
 * - PUT: Update attempt (complete, update timing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getExerciseAttemptById,
  updateExerciseAttempt,
  completeExerciseAttempt,
  type UpdateExerciseAttemptData 
} from '../../../../../lib/db/queries/exercises';
import { ValidationError, NotFoundError } from '../../../../../lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const attempt = await getExerciseAttemptById(attemptId);
    
    if (!attempt) {
      return NextResponse.json(
        { error: 'Exercise attempt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: attempt
    });
    
  } catch (error) {
    console.error('Error fetching exercise attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;
    
    if (action === 'complete') {
      // Complete the attempt with automatic scoring
      const attempt = await completeExerciseAttempt(attemptId);
      
      return NextResponse.json({
        success: true,
        data: attempt,
        message: 'Exercise attempt completed successfully'
      });
    }
    
    // Regular update - include required fields
    const data: UpdateExerciseAttemptData = {
      totalQuestions: updateData.totalQuestions || 0,
      correctAnswers: updateData.correctAnswers || 0,
      scorePercentage: updateData.scorePercentage || 0,
      isPassed: updateData.isPassed || false
    };
    
    if (updateData.timeSpent !== undefined) {
      data.timeSpent = parseInt(updateData.timeSpent);
    }
    
    if (updateData.completedAt) {
      data.completedAt = new Date(updateData.completedAt);
    }
    
    if (updateData.totalQuestions !== undefined) {
      data.totalQuestions = parseInt(updateData.totalQuestions);
    }
    
    if (updateData.correctAnswers !== undefined) {
      data.correctAnswers = parseInt(updateData.correctAnswers);
    }
    
    if (updateData.scorePercentage !== undefined) {
      data.scorePercentage = parseFloat(updateData.scorePercentage);
    }
    
    if (updateData.isPassed !== undefined) {
      data.isPassed = Boolean(updateData.isPassed);
    }
    
    const attempt = await updateExerciseAttempt(attemptId, data);
    
    return NextResponse.json({
      success: true,
      data: attempt
    });
    
  } catch (error) {
    console.error('Error updating exercise attempt:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}