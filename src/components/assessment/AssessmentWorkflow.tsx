/**
 * Assessment Workflow Component
 * 
 * Orchestrates the complete assessment experience including pre-assessment,
 * assessment taking, and post-assessment results display.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardBody, LoadingSpinner } from '../ui';
import { StatusMessage, LiveAnnouncement } from '../ui/ScreenReaderComponents';
import { AssessmentInterface } from './AssessmentInterface';
import { ScoreDisplay } from './ScoreDisplay';
import { MasteryIndicator, type MasteryData } from './MasteryIndicator';
import {
  type AssessmentResponse,
  type AssessmentAttemptResponse,
  type CreateAssessmentAttemptRequest,
  type ApiResponse
} from '../../types/api';

export interface AssessmentWorkflowProps {
  assessmentId: string;
  userId: string;
  onComplete?: (attempt: AssessmentAttemptResponse) => void;
  onExit?: () => void;
  className?: string;
}

type WorkflowState = 
  | 'loading'
  | 'pre-assessment'
  | 'taking-assessment'
  | 'post-assessment'
  | 'error';

interface WorkflowData {
  assessment?: AssessmentResponse;
  currentAttempt?: AssessmentAttemptResponse;
  previousAttempts?: AssessmentAttemptResponse[];
  error?: string;
}

export function AssessmentWorkflow({
  assessmentId,
  userId,
  onComplete,
  onExit,
  className = ''
}: AssessmentWorkflowProps) {
  const [state, setState] = useState<WorkflowState>('loading');
  const [data, setData] = useState<WorkflowData>({});
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  }, []);

  // Load assessment data
  useEffect(() => {
    loadAssessmentData();
  }, [assessmentId, userId]);

  const loadAssessmentData = async () => {
    try {
      setState('loading');
      
      // Load assessment details
      const assessmentResponse = await fetch(`/api/assessments/${assessmentId}?includeQuestions=true`);
      if (!assessmentResponse.ok) {
        throw new Error('Failed to load assessment');
      }
      
      const assessmentData: ApiResponse<AssessmentResponse> = await assessmentResponse.json();
      
      if (!assessmentData.success || !assessmentData.data) {
        throw new Error(assessmentData.error || 'Assessment not found');
      }

      // Load previous attempts
      const attemptsResponse = await fetch(`/api/assessments/${assessmentId}/attempts?userId=${userId}`);
      const attemptsData: ApiResponse<AssessmentAttemptResponse[]> = attemptsResponse.ok 
        ? await attemptsResponse.json() 
        : { success: true, data: [] };

      setData({
        assessment: assessmentData.data,
        previousAttempts: attemptsData.data || []
      });

      setState('pre-assessment');
      announceToScreenReader(`Assessment "${assessmentData.data.title}" loaded successfully.`);

    } catch (error) {
      console.error('Error loading assessment:', error);
      setData({ error: error instanceof Error ? error.message : 'Failed to load assessment' });
      setState('error');
      announceToScreenReader('Error loading assessment. Please try again.');
    }
  };

  const startAssessment = async () => {
    if (!data.assessment) return;

    try {
      setState('loading');
      announceToScreenReader('Starting assessment...');

      // Check attempt limits
      const previousAttempts = data.previousAttempts || [];
      if (previousAttempts.length >= data.assessment.maxAttempts) {
        throw new Error(`Maximum attempts (${data.assessment.maxAttempts}) reached for this assessment.`);
      }

      // Create new attempt
      const attemptRequest: CreateAssessmentAttemptRequest = { userId };
      const response = await fetch(`/api/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const attemptData: ApiResponse<AssessmentAttemptResponse> = await response.json();
      
      if (!attemptData.success || !attemptData.data) {
        throw new Error(attemptData.error || 'Failed to create assessment attempt');
      }

      setData(prev => ({ ...prev, currentAttempt: attemptData.data }));
      setState('taking-assessment');
      announceToScreenReader('Assessment started. Good luck!');

    } catch (error) {
      console.error('Error starting assessment:', error);
      setData(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start assessment' }));
      setState('error');
      announceToScreenReader('Error starting assessment. Please try again.');
    }
  };

  const handleAssessmentComplete = useCallback((completedAttempt: AssessmentAttemptResponse) => {
    setData(prev => ({ 
      ...prev, 
      currentAttempt: completedAttempt,
      previousAttempts: [...(prev.previousAttempts || []), completedAttempt]
    }));
    setState('post-assessment');
    
    const masteryMessage = completedAttempt.achievedMastery 
      ? 'Congratulations! You have achieved mastery!'
      : 'Assessment completed. Review your results below.';
    
    announceToScreenReader(`Assessment submitted successfully. ${masteryMessage}`);
    
    if (onComplete) {
      onComplete(completedAttempt);
    }
  }, [onComplete]);

  const handleRetakeAssessment = () => {
    setState('pre-assessment');
    setData(prev => ({ ...prev, currentAttempt: undefined, error: undefined }));
    announceToScreenReader('Ready to retake assessment.');
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      announceToScreenReader('Exiting assessment.');
    }
  };

  // Calculate mastery data for current user
  const getMasteryData = (): MasteryData | null => {
    if (!data.assessment || !data.currentAttempt) return null;

    return {
      currentScore: data.currentAttempt.scorePercentage,
      targetThreshold: data.assessment.masteryThreshold,
      isAchieved: data.currentAttempt.achievedMastery,
      level: data.currentAttempt.achievedMastery ? 'mastered' : 'in-progress',
      attempts: (data.previousAttempts?.length || 0) + 1,
      lastAssessment: data.currentAttempt.completedAt || data.currentAttempt.startedAt
    };
  };

  const canRetake = () => {
    if (!data.assessment || !data.previousAttempts) return false;
    return data.previousAttempts.length < data.assessment.maxAttempts;
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <Card className="text-center">
            <CardBody>
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p>Loading assessment...</p>
            </CardBody>
          </Card>
        );

      case 'error':
        return (
          <Card>
            <CardBody>
              <StatusMessage 
                type="error" 
                message={data.error || 'An error occurred'} 
              />
              <div className="mt-4 flex gap-3">
                <Button onClick={loadAssessmentData}>Try Again</Button>
                <Button variant="secondary" onClick={handleExit}>Exit</Button>
              </div>
            </CardBody>
          </Card>
        );

      case 'pre-assessment':
        if (!data.assessment) return null;
        
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h1 className="text-2xl font-bold">{data.assessment.title}</h1>
                {data.assessment.description && (
                  <p className="text-gray-600 mt-2">{data.assessment.description}</p>
                )}
              </CardHeader>
              
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Assessment Details</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>Questions: {data.assessment.questions?.length || 0}</li>
                      <li>Type: {data.assessment.type}</li>
                      {data.assessment.timeLimit && (
                        <li>Time limit: {Math.floor(data.assessment.timeLimit / 60)} minutes</li>
                      )}
                      <li>Mastery threshold: {data.assessment.masteryThreshold}%</li>
                      <li>Max attempts: {data.assessment.maxAttempts}</li>
                    </ul>
                  </div>

                  {data.previousAttempts && data.previousAttempts.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Previous Attempts</h3>
                      <div className="space-y-2">
                        {data.previousAttempts.map((attempt, index) => (
                          <div key={attempt.id} className="text-sm">
                            <span className="text-gray-600">Attempt {index + 1}:</span>
                            <span className={`ml-2 font-medium ${
                              attempt.achievedMastery ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {attempt.scorePercentage}%
                              {attempt.achievedMastery && ' ✓'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 flex gap-3">
                  <Button 
                    onClick={startAssessment}
                    disabled={(data.previousAttempts?.length || 0) >= data.assessment.maxAttempts}
                  >
                    {data.previousAttempts && data.previousAttempts.length > 0 ? 'Retake Assessment' : 'Start Assessment'}
                  </Button>
                  <Button variant="secondary" onClick={handleExit}>
                    Cancel
                  </Button>
                </div>

                {(data.previousAttempts?.length || 0) >= data.assessment.maxAttempts && (
                  <StatusMessage 
                    type="warning" 
                    message={`You have reached the maximum number of attempts (${data.assessment.maxAttempts}) for this assessment.`}
                  />
                )}
              </CardBody>
            </Card>
          </div>
        );

      case 'taking-assessment':
        if (!data.assessment || !data.currentAttempt) return null;
        
        return (
          <AssessmentInterface
            assessment={data.assessment}
            attempt={data.currentAttempt}
            userId={userId}
            onComplete={handleAssessmentComplete}
            onExit={handleExit}
          />
        );

      case 'post-assessment':
        if (!data.currentAttempt) return null;
        
        const masteryData = getMasteryData();
        
        return (
          <div className="space-y-6">
            <ScoreDisplay 
              attempt={data.currentAttempt}
              showDetailedBreakdown={true}
              showTimeMetrics={true}
              showMasteryStatus={true}
            />

            {masteryData && (
              <MasteryIndicator 
                data={masteryData}
                variant="detailed"
                showDescription={true}
              />
            )}

            <Card>
              <CardBody className="flex gap-3">
                {canRetake() && !data.currentAttempt.achievedMastery && (
                  <Button onClick={handleRetakeAssessment}>
                    Try Again
                  </Button>
                )}
                <Button variant="secondary" onClick={handleExit}>
                  {data.currentAttempt.achievedMastery ? 'Continue Learning' : 'Exit'}
                </Button>
              </CardBody>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Screen reader announcements */}
      {announcements.map((message, index) => (
        <LiveAnnouncement key={index} message={message} priority="polite" />
      ))}

      {renderContent()}
    </div>
  );
}