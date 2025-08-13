/**
 * Objective Progress API Routes
 * 
 * REST API endpoints for learning objective progress tracking.
 * Handles objective-level progress updates and analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserObjectiveProgress,
  getObjectiveProgress,
  upsertObjectiveProgress,
  type CreateObjectiveProgressData
} from '@/lib/db/queries';

// ===== GET /api/progress/objectives =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const objectiveId = searchParams.get('objectiveId');

    // Get all objective progress for a user
    if (userId && !objectiveId) {
      const progress = await getUserObjectiveProgress(userId);
      return NextResponse.json({
        success: true,
        data: progress,
        count: progress.length
      });
    }

    // Get specific objective progress
    if (userId && objectiveId) {
      const progress = await getObjectiveProgress(userId, objectiveId);
      
      if (!progress) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No progress found for this user and objective'
        });
      }

      return NextResponse.json({
        success: true,
        data: progress
      });
    }

    return NextResponse.json(
      { error: 'userId parameter is required, objectiveId is optional for specific progress' },
      { status: 400 }
    );

  } catch (error) {
    console.error('GET /api/progress/objectives error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve objective progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== POST /api/progress/objectives =====

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

    if (!body.objectiveId) {
      return NextResponse.json(
        { error: 'objectiveId is required' },
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

    // Validate attempt counts if provided
    if (body.totalAttempts !== undefined && (typeof body.totalAttempts !== 'number' || body.totalAttempts < 0)) {
      return NextResponse.json(
        { error: 'totalAttempts must be a non-negative number' },
        { status: 400 }
      );
    }

    if (body.correctAttempts !== undefined && (typeof body.correctAttempts !== 'number' || body.correctAttempts < 0)) {
      return NextResponse.json(
        { error: 'correctAttempts must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate that correctAttempts doesn't exceed totalAttempts
    if (body.totalAttempts !== undefined && body.correctAttempts !== undefined && body.correctAttempts > body.totalAttempts) {
      return NextResponse.json(
        { error: 'correctAttempts cannot exceed totalAttempts' },
        { status: 400 }
      );
    }

    const progressData: CreateObjectiveProgressData = {
      userId: body.userId,
      objectiveId: body.objectiveId,
      currentScore: body.currentScore,
      bestScore: body.bestScore,
      masteryAchieved: body.masteryAchieved,
      masteryDate: body.masteryDate ? new Date(body.masteryDate) : undefined,
      totalAttempts: body.totalAttempts,
      correctAttempts: body.correctAttempts
    };

    const progress = await upsertObjectiveProgress(progressData);

    return NextResponse.json({
      success: true,
      data: progress,
      message: 'Objective progress updated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/progress/objectives error:', error);
    
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
        error: 'Failed to update objective progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}