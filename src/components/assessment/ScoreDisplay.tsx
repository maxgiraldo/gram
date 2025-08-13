/**
 * Score Display Component
 * 
 * Displays assessment scores, progress, and performance metrics
 * with visual indicators and accessibility features.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui';
import { ScreenReaderText, StatusMessage } from '../ui/ScreenReaderComponents';
import { type AssessmentAttemptResponse } from '../../types/api';

export interface ScoreDisplayProps {
  attempt: AssessmentAttemptResponse;
  showDetailedBreakdown?: boolean;
  showTimeMetrics?: boolean;
  showMasteryStatus?: boolean;
  className?: string;
}

export interface ScoreBreakdown {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;
  pointsEarned: number;
  totalPoints: number;
  accuracy: number;
}

export interface TimeMetrics {
  totalTime: number;
  averageTimePerQuestion: number;
  timeEfficiency: 'fast' | 'average' | 'slow';
}

export function ScoreDisplay({
  attempt,
  showDetailedBreakdown = true,
  showTimeMetrics = true,
  showMasteryStatus = true,
  className = ''
}: ScoreDisplayProps) {
  const scoreBreakdown = calculateScoreBreakdown(attempt);
  const timeMetrics = calculateTimeMetrics(attempt);
  const masteryStatus = getMasteryStatus(attempt);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <h2 className="text-xl font-semibold">Assessment Results</h2>
      </CardHeader>
      
      <CardBody className="space-y-6">
        {/* Main Score Display */}
        <div className="text-center">
          <div className="mb-4">
            <div 
              className={`text-4xl font-bold ${getScoreColor(scoreBreakdown.scorePercentage)}`}
              aria-label={`Score: ${scoreBreakdown.scorePercentage}%`}
            >
              {scoreBreakdown.scorePercentage}%
            </div>
            <div className="text-gray-600 text-sm">
              {scoreBreakdown.pointsEarned} out of {scoreBreakdown.totalPoints} points
            </div>
          </div>

          {/* Visual score indicator */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(scoreBreakdown.scorePercentage)}`}
              style={{ width: `${scoreBreakdown.scorePercentage}%` }}
            />
          </div>
          
          <ScreenReaderText>
            You scored {scoreBreakdown.scorePercentage} percent, earning {scoreBreakdown.pointsEarned} out of {scoreBreakdown.totalPoints} total points.
          </ScreenReaderText>
        </div>

        {/* Mastery Status */}
        {showMasteryStatus && (
          <div className="flex items-center justify-center space-x-3">
            <div 
              className={`w-4 h-4 rounded-full ${
                masteryStatus.achieved ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-hidden="true"
            />
            <span className={`font-medium ${
              masteryStatus.achieved ? 'text-green-700' : 'text-gray-600'
            }`}>
              {masteryStatus.achieved ? 'Mastery Achieved!' : 'Mastery Not Yet Achieved'}
            </span>
            <ScreenReaderText>
              {masteryStatus.achieved 
                ? `Congratulations! You have achieved mastery with a score of ${scoreBreakdown.scorePercentage}%, which exceeds the required ${masteryStatus.threshold}%.`
                : `You scored ${scoreBreakdown.scorePercentage}%, but need ${masteryStatus.threshold}% to achieve mastery. Keep practicing!`
              }
            </ScreenReaderText>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetailedBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {scoreBreakdown.correctAnswers}
              </div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {scoreBreakdown.incorrectAnswers}
              </div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {scoreBreakdown.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-600">Accuracy</div>
            </div>
          </div>
        )}

        {/* Time Metrics */}
        {showTimeMetrics && timeMetrics && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Time Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Time:</span>
                <span className="font-medium">{formatDuration(timeMetrics.totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. per Question:</span>
                <span className="font-medium">{formatDuration(timeMetrics.averageTimePerQuestion)}</span>
              </div>
            </div>
            
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-gray-600">Pace:</span>
              <span className={`font-medium ${getTimeEfficiencyColor(timeMetrics.timeEfficiency)}`}>
                {getTimeEfficiencyLabel(timeMetrics.timeEfficiency)}
              </span>
            </div>
          </div>
        )}

        {/* Performance Message */}
        <div className="border-t pt-4">
          <StatusMessage 
            type={getPerformanceMessageType(scoreBreakdown.scorePercentage, masteryStatus.achieved)}
            message={getPerformanceMessage(scoreBreakdown.scorePercentage, masteryStatus.achieved)}
          />
        </div>
      </CardBody>
    </Card>
  );
}

// Utility functions

function calculateScoreBreakdown(attempt: AssessmentAttemptResponse): ScoreBreakdown {
  const totalQuestions = attempt.totalQuestions;
  const correctAnswers = attempt.correctAnswers;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const scorePercentage = Math.round(attempt.scorePercentage);
  
  // Calculate points (assuming responses are available)
  const pointsEarned = Math.round((scorePercentage / 100) * totalQuestions * 10); // Assuming 10 points per question
  const totalPoints = totalQuestions * 10;
  
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    scorePercentage,
    pointsEarned,
    totalPoints,
    accuracy
  };
}

function calculateTimeMetrics(attempt: AssessmentAttemptResponse): TimeMetrics | null {
  if (!attempt.timeSpent || !attempt.totalQuestions) return null;

  const totalTime = attempt.timeSpent; // in seconds
  const averageTimePerQuestion = totalTime / attempt.totalQuestions;
  
  // Determine time efficiency (this could be configurable)
  let timeEfficiency: 'fast' | 'average' | 'slow' = 'average';
  if (averageTimePerQuestion < 30) {
    timeEfficiency = 'fast';
  } else if (averageTimePerQuestion > 120) {
    timeEfficiency = 'slow';
  }

  return {
    totalTime,
    averageTimePerQuestion,
    timeEfficiency
  };
}

function getMasteryStatus(attempt: AssessmentAttemptResponse) {
  return {
    achieved: attempt.achievedMastery,
    threshold: attempt.assessment?.masteryThreshold || 80 // Default threshold
  };
}

function getScoreColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 80) return 'text-blue-600';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 80) return 'bg-blue-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getTimeEfficiencyColor(efficiency: 'fast' | 'average' | 'slow'): string {
  switch (efficiency) {
    case 'fast': return 'text-green-600';
    case 'average': return 'text-blue-600';
    case 'slow': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
}

function getTimeEfficiencyLabel(efficiency: 'fast' | 'average' | 'slow'): string {
  switch (efficiency) {
    case 'fast': return 'Quick';
    case 'average': return 'Steady';
    case 'slow': return 'Thoughtful';
    default: return 'Unknown';
  }
}

function getPerformanceMessageType(percentage: number, masteryAchieved: boolean): 'success' | 'warning' | 'error' | 'info' {
  if (masteryAchieved) return 'success';
  if (percentage >= 70) return 'warning';
  if (percentage >= 50) return 'info';
  return 'error';
}

function getPerformanceMessage(percentage: number, masteryAchieved: boolean): string {
  if (masteryAchieved) {
    return 'Excellent work! You have demonstrated mastery of this material.';
  }
  
  if (percentage >= 80) {
    return 'Great job! You\'re very close to mastery. Review the areas you missed and try again.';
  }
  
  if (percentage >= 70) {
    return 'Good effort! You understand most of the material. Focus on the challenging areas and practice more.';
  }
  
  if (percentage >= 50) {
    return 'You\'re making progress! Review the material and practice the concepts you found difficult.';
  }
  
  return 'Keep practicing! Review the material thoroughly and don\'t hesitate to ask for help.';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}