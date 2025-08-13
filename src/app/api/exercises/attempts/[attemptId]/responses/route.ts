/**
 * Exercise Response Submission API Routes
 * 
 * Endpoints for submitting and validating exercise responses:
 * - POST: Submit response for validation and scoring
 * - GET: Get all responses for an attempt
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createExerciseResponse,
  getExerciseAttemptById,
  type CreateExerciseResponseData 
} from '../../../../../../lib/db/queries/exercises';
import { 
  validateExerciseResponse,
  generateHint,
  type ValidationOptions 
} from '../../../../../../lib/exercises/validation';
import { ValidationError, NotFoundError } from '../../../../../../lib/db/client';
import { prisma } from '../../../../../../lib/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.questionId || body.response === undefined) {
      return NextResponse.json(
        { error: 'questionId and response are required' },
        { status: 400 }
      );
    }
    
    // Get question details for validation
    const question = await prisma.exerciseQuestion.findUnique({
      where: { id: body.questionId }
    });
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Parse JSON fields and normalize null values
    const questionWithParsedData = {
      ...question,
      objectiveId: question.objectiveId || undefined,
      timeLimit: question.timeLimit || undefined,
      correctFeedback: question.correctFeedback || undefined,
      incorrectFeedback: question.incorrectFeedback || undefined,
      questionData: typeof question.questionData === 'string' 
        ? JSON.parse(question.questionData) 
        : question.questionData,
      correctAnswer: typeof question.correctAnswer === 'string'
        ? JSON.parse(question.correctAnswer)
        : question.correctAnswer,
      hints: question.hints 
        ? (typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints)
        : undefined
    };
    
    // Validation options
    const validationOptions: ValidationOptions = {
      allowPartialCredit: body.allowPartialCredit !== false,
      caseSensitive: body.caseSensitive === true,
      strictMatching: body.strictMatching === true,
      provideFeedback: body.provideFeedback !== false
    };
    
    // Validate the response
    const validationResult = validateExerciseResponse(
      questionWithParsedData,
      body.response,
      validationOptions
    );
    
    // Generate hint if requested
    let hint = null;
    if (body.requestHint) {
      const hintLevel = body.hintLevel || 1;
      hint = generateHint(questionWithParsedData, body.response, hintLevel);
    }
    
    // Save response to database
    const responseData: CreateExerciseResponseData = {
      attemptId: attemptId,
      questionId: body.questionId,
      response: body.response,
      isCorrect: validationResult.isCorrect,
      points: validationResult.points,
      timeSpent: body.timeSpent || 0,
      hintsUsed: body.hintsUsed || 0,
      feedback: validationResult.feedback
    };
    
    const savedResponse = await createExerciseResponse(responseData);
    
    // Prepare response
    const responsePayload = {
      success: true,
      data: {
        response: savedResponse,
        validation: validationResult,
        ...(hint && { hint })
      }
    };
    
    return NextResponse.json(responsePayload, { status: 201 });
    
  } catch (error) {
    console.error('Error submitting exercise response:', error);
    
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
      data: attempt.responses,
      count: attempt.responses.length
    });
    
  } catch (error) {
    console.error('Error fetching exercise responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}