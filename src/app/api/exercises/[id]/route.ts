/**
 * Individual Exercise API Routes
 * 
 * Endpoints for specific exercise operations:
 * - GET: Get exercise by ID
 * - PUT: Update exercise
 * - DELETE: Delete exercise
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getExerciseById, 
  updateExercise, 
  deleteExercise,
  getExerciseStats,
  type UpdateExerciseData 
} from '../../../../lib/db/queries/exercises';
import { ValidationError, NotFoundError } from '../../../../lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    
    const exercise = await getExerciseById(id);
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    let stats = null;
    if (includeStats) {
      stats = await getExerciseStats(id);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...exercise,
        ...(stats && { stats })
      }
    });
    
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate exercise type if provided
    if (body.type) {
      const validTypes = ['practice', 'reinforcement', 'challenge', 'enrichment'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { 
            error: 'Invalid exercise type',
            validTypes 
          },
          { status: 400 }
        );
      }
    }
    
    // Validate difficulty if provided
    if (body.difficulty) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(body.difficulty)) {
        return NextResponse.json(
          { 
            error: 'Invalid difficulty level',
            validDifficulties 
          },
          { status: 400 }
        );
      }
    }
    
    const updateData: UpdateExerciseData = {};
    
    // Only include fields that are provided
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type) updateData.type = body.type;
    if (body.orderIndex !== undefined) updateData.orderIndex = parseInt(body.orderIndex);
    if (body.timeLimit !== undefined) updateData.timeLimit = body.timeLimit ? parseInt(body.timeLimit) : undefined;
    if (body.maxAttempts !== undefined) updateData.maxAttempts = parseInt(body.maxAttempts);
    if (body.difficulty) updateData.difficulty = body.difficulty;
    
    const exercise = await updateExercise(id, updateData);
    
    return NextResponse.json({
      success: true,
      data: exercise
    });
    
  } catch (error) {
    console.error('Error updating exercise:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteExercise(id);
    
    return NextResponse.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting exercise:', error);
    
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