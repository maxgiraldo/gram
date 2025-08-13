/**
 * Individual Assessment API Routes
 * 
 * REST API endpoints for individual assessment operations.
 * Handles GET, PUT, and DELETE for specific assessments.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  type UpdateAssessmentData
} from '@/lib/db/queries';

// ===== GET /api/assessments/[id] =====

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const includeAttempts = searchParams.get('includeAttempts') === 'true';
    const includeLesson = searchParams.get('includeLesson') === 'true';

    const assessment = await getAssessmentById(id, {
      includeQuestions,
      includeAttempts,
      includeLesson
    });

    return NextResponse.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error(`GET /api/assessments/${id} error:`, error);
    
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
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== PUT /api/assessments/[id] =====

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate type if provided
    if (body.type && !['diagnostic', 'formative', 'summative', 'retention_check'].includes(body.type)) {
      return NextResponse.json(
        { error: 'valid type is required (diagnostic, formative, summative, retention_check)' },
        { status: 400 }
      );
    }

    // Validate mastery threshold if provided
    if (body.masteryThreshold !== undefined) {
      if (typeof body.masteryThreshold !== 'number' || body.masteryThreshold < 0 || body.masteryThreshold > 1) {
        return NextResponse.json(
          { error: 'masteryThreshold must be a number between 0 and 1' },
          { status: 400 }
        );
      }
    }

    // Validate max attempts if provided
    if (body.maxAttempts !== undefined) {
      if (typeof body.maxAttempts !== 'number' || body.maxAttempts < 1) {
        return NextResponse.json(
          { error: 'maxAttempts must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Validate time limit if provided
    if (body.timeLimit !== undefined) {
      if (typeof body.timeLimit !== 'number' || body.timeLimit < 0) {
        return NextResponse.json(
          { error: 'timeLimit must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    const updateData: UpdateAssessmentData = {
      title: body.title,
      description: body.description,
      type: body.type,
      timeLimit: body.timeLimit,
      maxAttempts: body.maxAttempts,
      masteryThreshold: body.masteryThreshold,
      scheduledDelay: body.scheduledDelay,
      isPublished: body.isPublished
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateAssessmentData] === undefined) {
        delete updateData[key as keyof UpdateAssessmentData];
      }
    });

    const assessment = await updateAssessment(id, updateData);

    return NextResponse.json({
      success: true,
      data: assessment,
      message: 'Assessment updated successfully'
    });

  } catch (error) {
    console.error(`PUT /api/assessments/${id} error:`, error);
    
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
        error: 'Failed to update assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===== DELETE /api/assessments/[id] =====

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteAssessment(id);

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    console.error(`DELETE /api/assessments/${id} error:`, error);
    
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
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}