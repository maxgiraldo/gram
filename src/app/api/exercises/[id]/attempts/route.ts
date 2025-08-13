/**
 * Exercise Attempt API Routes
 * 
 * Endpoints for exercise attempt management:
 * - GET: Get user's attempts for this exercise
 * - POST: Start new exercise attempt
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createExerciseAttempt,
  getUserExerciseAttempts,
  type CreateExerciseAttemptData 
} from '../../../../../lib/db/queries/exercises';
import { ValidationError, NotFoundError } from '../../../../../lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }
    
    const attempts = await getUserExerciseAttempts(userId, id);
    
    return NextResponse.json({
      success: true,
      data: attempts,
      count: attempts.length
    });
    
  } catch (error) {
    console.error('Error fetching exercise attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const attemptData: CreateExerciseAttemptData = {
      userId: body.userId,
      exerciseId: id
    };
    
    const attempt = await createExerciseAttempt(attemptData);
    
    return NextResponse.json({
      success: true,
      data: attempt
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating exercise attempt:', error);
    
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