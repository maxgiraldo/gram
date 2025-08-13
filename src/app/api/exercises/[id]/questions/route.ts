/**
 * Exercise Question API Routes
 * 
 * Endpoints for exercise question management:
 * - GET: Get questions for an exercise
 * - POST: Create new question for exercise
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createExerciseQuestion,
  type CreateExerciseQuestionData 
} from '../../../../../lib/db/queries/exercises';
import { ValidationError, NotFoundError } from '../../../../../lib/db/client';
import { prisma } from '../../../../../lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questions = await prisma.exerciseQuestion.findMany({
      where: { exerciseId: id },
      orderBy: { orderIndex: 'asc' }
    });
    
    // Parse JSON fields for each question
    const questionsWithParsedData = questions.map(question => ({
      ...question,
      questionData: typeof question.questionData === 'string' 
        ? JSON.parse(question.questionData) 
        : question.questionData,
      correctAnswer: typeof question.correctAnswer === 'string'
        ? JSON.parse(question.correctAnswer)
        : question.correctAnswer,
      hints: question.hints 
        ? (typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints)
        : null
    }));
    
    return NextResponse.json({
      success: true,
      data: questionsWithParsedData,
      count: questionsWithParsedData.length
    });
    
  } catch (error) {
    console.error('Error fetching exercise questions:', error);
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
    
    // Validate required fields
    const requiredFields = ['questionText', 'type', 'orderIndex', 'questionData', 'correctAnswer'];
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
    
    // Validate question type
    const validTypes = ['multiple_choice', 'fill_in_blank', 'drag_and_drop', 'sentence_builder'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid question type',
          validTypes 
        },
        { status: 400 }
      );
    }
    
    // Validate question data structure based on type
    const validationError = validateQuestionData(body.type, body.questionData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    
    const questionData: CreateExerciseQuestionData = {
      exerciseId: id,
      objectiveId: body.objectiveId,
      questionText: body.questionText,
      type: body.type,
      orderIndex: parseInt(body.orderIndex),
      points: body.points ? parseInt(body.points) : 1,
      timeLimit: body.timeLimit ? parseInt(body.timeLimit) : undefined,
      questionData: body.questionData,
      correctAnswer: body.correctAnswer,
      hints: body.hints,
      correctFeedback: body.correctFeedback,
      incorrectFeedback: body.incorrectFeedback
    };
    
    const question = await createExerciseQuestion(questionData);
    
    // Parse JSON fields for response
    const questionWithParsedData = {
      ...question,
      questionData: typeof question.questionData === 'string' 
        ? JSON.parse(question.questionData) 
        : question.questionData,
      correctAnswer: typeof question.correctAnswer === 'string'
        ? JSON.parse(question.correctAnswer)
        : question.correctAnswer,
      hints: question.hints 
        ? (typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints)
        : null
    };
    
    return NextResponse.json({
      success: true,
      data: questionWithParsedData
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating exercise question:', error);
    
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

// ===== VALIDATION HELPERS =====

function validateQuestionData(type: string, questionData: any): string | null {
  try {
    switch (type) {
      case 'multiple_choice':
        if (!questionData.options || !Array.isArray(questionData.options)) {
          return 'Multiple choice questions must have an options array';
        }
        if (questionData.options.length < 2) {
          return 'Multiple choice questions must have at least 2 options';
        }
        break;
        
      case 'fill_in_blank':
        if (!questionData.template || typeof questionData.template !== 'string') {
          return 'Fill in blank questions must have a template string';
        }
        if (!questionData.blanks || !Array.isArray(questionData.blanks)) {
          return 'Fill in blank questions must have a blanks array';
        }
        break;
        
      case 'drag_and_drop':
        if (!questionData.items || !Array.isArray(questionData.items)) {
          return 'Drag and drop questions must have an items array';
        }
        if (!questionData.targets || !Array.isArray(questionData.targets)) {
          return 'Drag and drop questions must have a targets array';
        }
        break;
        
      case 'sentence_builder':
        if (!questionData.words || !Array.isArray(questionData.words)) {
          return 'Sentence builder questions must have a words array';
        }
        break;
        
      default:
        return `Unsupported question type: ${type}`;
    }
    
    return null;
  } catch (error) {
    return 'Invalid question data structure';
  }
}