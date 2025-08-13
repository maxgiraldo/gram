/**
 * Exercise API Routes
 * 
 * Main endpoints for exercise operations:
 * - GET: List exercises with filtering
 * - POST: Create new exercise
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createExercise, 
  getExercisesByLesson,
  type CreateExerciseData 
} from '../../../lib/db/queries/exercises';
import { ValidationError, NotFoundError } from '../../../lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId query parameter is required' },
        { status: 400 }
      );
    }
    
    const exercises = await getExercisesByLesson(lessonId);
    
    return NextResponse.json({
      success: true,
      data: exercises,
      count: exercises.length
    });
    
  } catch (error) {
    console.error('Error fetching exercises:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['lessonId', 'title', 'type', 'orderIndex'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }
    
    // Validate exercise type
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
    
    const exerciseData: CreateExerciseData = {
      lessonId: body.lessonId,
      title: body.title,
      description: body.description,
      type: body.type,
      orderIndex: parseInt(body.orderIndex),
      timeLimit: body.timeLimit ? parseInt(body.timeLimit) : undefined,
      maxAttempts: body.maxAttempts ? parseInt(body.maxAttempts) : undefined,
      difficulty: body.difficulty || 'beginner'
    };
    
    const exercise = await createExercise(exerciseData);
    
    return NextResponse.json({
      success: true,
      data: exercise
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating exercise:', error);
    
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