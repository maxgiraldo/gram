/**
 * Assessment API Routes
 * 
 * Main REST API endpoints for assessment management.
 * Supports CRUD operations for assessments with mastery learning.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAssessment,
  getAssessmentsByLesson,
  type CreateAssessmentData
} from '@/lib/db/queries';

// ===== GET /api/assessments =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId parameter is required' },
        { status: 400 }
      );
    }

    const assessments = await getAssessmentsByLesson(lessonId);

    return NextResponse.json({
      success: true,
      data: assessments,
      count: assessments.length
    });

  } catch (error) {
    console.error('GET /api/assessments error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assessments',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== POST /api/assessments =====

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    if (!body.type || !['diagnostic', 'formative', 'summative', 'retention_check'].includes(body.type)) {
      return NextResponse.json(
        { error: 'valid type is required (diagnostic, formative, summative, retention_check)' },
        { status: 400 }
      );
    }

    // Validate optional lesson association
    if (body.lessonId && typeof body.lessonId !== 'string') {
      return NextResponse.json(
        { error: 'lessonId must be a valid string' },
        { status: 400 }
      );
    }

    // Validate mastery threshold
    if (body.masteryThreshold !== undefined) {
      if (typeof body.masteryThreshold !== 'number' || body.masteryThreshold < 0 || body.masteryThreshold > 1) {
        return NextResponse.json(
          { error: 'masteryThreshold must be a number between 0 and 1' },
          { status: 400 }
        );
      }
    }

    // Validate max attempts
    if (body.maxAttempts !== undefined) {
      if (typeof body.maxAttempts !== 'number' || body.maxAttempts < 1) {
        return NextResponse.json(
          { error: 'maxAttempts must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Validate time limit
    if (body.timeLimit !== undefined) {
      if (typeof body.timeLimit !== 'number' || body.timeLimit < 0) {
        return NextResponse.json(
          { error: 'timeLimit must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    const assessmentData: CreateAssessmentData = {
      lessonId: body.lessonId,
      title: body.title,
      description: body.description,
      type: body.type,
      timeLimit: body.timeLimit,
      maxAttempts: body.maxAttempts,
      masteryThreshold: body.masteryThreshold,
      scheduledDelay: body.scheduledDelay,
      isPublished: body.isPublished
    };

    const assessment = await createAssessment(assessmentData);

    return NextResponse.json({
      success: true,
      data: assessment,
      message: 'Assessment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/assessments error:', error);
    
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
        error: 'Failed to create assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}