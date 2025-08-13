/**
 * Assessment Attempts API Routes
 * 
 * REST API endpoints for managing assessment attempts.
 * Handles attempt creation and retrieval for specific assessments.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAssessmentAttempt,
  getUserAssessmentAttempts,
  getAssessmentById,
  getQuestionsByAssessment,
  type CreateAssessmentAttemptData
} from '@/lib/db/queries';

// ===== GET /api/assessments/[id]/attempts =====

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const attempts = await getUserAssessmentAttempts(userId, id);

    return NextResponse.json({
      success: true,
      data: attempts,
      count: attempts.length
    });

  } catch (error) {
    console.error(`GET /api/assessments/${id}/attempts error:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assessment attempts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== POST /api/assessments/[id]/attempts =====

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify assessment exists and get question count
    const [assessment, questions] = await Promise.all([
      getAssessmentById(id),
      getQuestionsByAssessment(id)
    ]);

    const attemptData: CreateAssessmentAttemptData = {
      userId: body.userId,
      assessmentId: id,
      totalQuestions: questions.length
    };

    const attempt = await createAssessmentAttempt(attemptData);

    return NextResponse.json({
      success: true,
      data: attempt,
      message: 'Assessment attempt created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error(`POST /api/assessments/${id}/attempts error:`, error);
    
    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Assessment not found',
          message: `Assessment with ID ${id} does not exist`
        },
        { status: 404 }
      );
    }

    // Handle validation errors (like max attempts exceeded)
    if (error instanceof Error && error.message.includes('Maximum attempts exceeded')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Maximum attempts exceeded',
          message: 'You have reached the maximum number of attempts for this assessment'
        },
        { status: 400 }
      );
    }
    
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
        error: 'Failed to create assessment attempt',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}