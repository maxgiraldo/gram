/**
 * Mastery Indicator Component
 * 
 * Visual indicator for mastery progress with different display modes
 * and accessibility features for tracking learning objectives.
 */

'use client';

import React from 'react';
import { ScreenReaderText } from '../ui/ScreenReaderComponents';

export interface MasteryLevel {
  id: string;
  name: string;
  threshold: number;
  color: string;
  description: string;
}

export interface MasteryData {
  currentScore: number;
  targetThreshold: number;
  isAchieved: boolean;
  level: string;
  confidence?: number;
  attempts?: number;
  lastAssessment?: string;
}

export interface MasteryIndicatorProps {
  data: MasteryData;
  variant?: 'progress' | 'badge' | 'detailed' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
  showDescription?: boolean;
  animated?: boolean;
  className?: string;
}

const MASTERY_LEVELS: MasteryLevel[] = [
  {
    id: 'novice',
    name: 'Novice',
    threshold: 0,
    color: 'bg-gray-400',
    description: 'Beginning to learn the concept'
  },
  {
    id: 'developing',
    name: 'Developing',
    threshold: 40,
    color: 'bg-yellow-400',
    description: 'Understanding is emerging'
  },
  {
    id: 'proficient',
    name: 'Proficient',
    threshold: 70,
    color: 'bg-blue-500',
    description: 'Solid understanding demonstrated'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    threshold: 85,
    color: 'bg-green-500',
    description: 'Strong mastery of the concept'
  },
  {
    id: 'expert',
    name: 'Expert',
    threshold: 95,
    color: 'bg-purple-500',
    description: 'Exceptional understanding and application'
  }
];

export function MasteryIndicator({
  data,
  variant = 'progress',
  size = 'md',
  showLabel = true,
  showPercentage = true,
  showDescription = false,
  animated = true,
  className = ''
}: MasteryIndicatorProps) {
  const currentLevel = getCurrentLevel(data.currentScore);
  const nextLevel = getNextLevel(data.currentScore);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const progressBarHeight = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const badgeSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div 
          className={`${badgeSize[size]} rounded-full ${currentLevel.color} flex items-center justify-center`}
          title={`${currentLevel.name}: ${currentLevel.description}`}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        {showLabel && (
          <span className={`font-medium ${sizeClasses[size]}`}>
            {currentLevel.name}
          </span>
        )}
        <ScreenReaderText>
          Mastery level: {currentLevel.name}. {currentLevel.description}. 
          Current score: {data.currentScore}%.
        </ScreenReaderText>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`w-full bg-gray-200 rounded-full ${progressBarHeight[size]} relative overflow-hidden`}>
          <div 
            className={`${currentLevel.color} ${progressBarHeight[size]} rounded-full transition-all duration-500 ${animated ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.min(data.currentScore, 100)}%` }}
          />
          {data.targetThreshold && (
            <div 
              className="absolute top-0 w-0.5 bg-gray-600 h-full"
              style={{ left: `${data.targetThreshold}%` }}
              title={`Target: ${data.targetThreshold}%`}
            />
          )}
        </div>
        {showPercentage && (
          <span className={`font-mono font-medium ${sizeClasses[size]} text-gray-700 min-w-[3rem] text-right`}>
            {data.currentScore}%
          </span>
        )}
        <ScreenReaderText>
          Progress: {data.currentScore}% towards {data.targetThreshold}% mastery threshold.
        </ScreenReaderText>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-4 border rounded-lg bg-white ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${sizeClasses[size]}`}>Mastery Progress</h3>
          <div className={`px-3 py-1 rounded-full ${currentLevel.color} text-white text-sm font-medium`}>
            {currentLevel.name}
          </div>
        </div>

        <div className="space-y-3">
          {/* Current progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Current Score</span>
              <span>{data.currentScore}%</span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full ${progressBarHeight[size]}`}>
              <div 
                className={`${currentLevel.color} ${progressBarHeight[size]} rounded-full transition-all duration-1000`}
                style={{ width: `${Math.min(data.currentScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Target threshold */}
          {data.targetThreshold && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Target Threshold</span>
                <span>{data.targetThreshold}%</span>
              </div>
              <div className="text-xs text-gray-500">
                {data.isAchieved ? (
                  <span className="text-green-600 font-medium">✓ Target achieved!</span>
                ) : (
                  <span>
                    {data.targetThreshold - data.currentScore} points needed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Next level indicator */}
          {nextLevel && !data.isAchieved && (
            <div className="border-t pt-3">
              <div className="text-sm text-gray-600 mb-2">
                Next Level: <span className="font-medium">{nextLevel.name}</span>
              </div>
              <div className="text-xs text-gray-500">
                {nextLevel.threshold - data.currentScore} points to {nextLevel.name}
              </div>
            </div>
          )}

          {/* Additional metrics */}
          <div className="border-t pt-3 grid grid-cols-2 gap-4 text-sm">
            {data.attempts && (
              <div>
                <span className="text-gray-600">Attempts:</span>
                <span className="ml-1 font-medium">{data.attempts}</span>
              </div>
            )}
            {data.confidence && (
              <div>
                <span className="text-gray-600">Confidence:</span>
                <span className="ml-1 font-medium">{Math.round(data.confidence * 100)}%</span>
              </div>
            )}
          </div>

          {showDescription && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">{currentLevel.description}</p>
            </div>
          )}
        </div>

        <ScreenReaderText>
          Detailed mastery progress: Currently at {currentLevel.name} level with {data.currentScore}% score. 
          {data.isAchieved 
            ? `Target of ${data.targetThreshold}% has been achieved.`
            : `Working towards ${data.targetThreshold}% target, need ${data.targetThreshold - data.currentScore} more points.`
          }
          {nextLevel && ` Next level is ${nextLevel.name} at ${nextLevel.threshold}%.`}
        </ScreenReaderText>
      </div>
    );
  }

  // Default: progress variant
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`font-medium ${sizeClasses[size]}`}>
            {currentLevel.name} Level
          </span>
          {showPercentage && (
            <span className={`${sizeClasses[size]} text-gray-700`}>
              {data.currentScore}%
            </span>
          )}
        </div>
      )}

      <div className={`w-full bg-gray-200 rounded-full ${progressBarHeight[size]} relative`}>
        {/* Progress fill */}
        <div 
          className={`${currentLevel.color} ${progressBarHeight[size]} rounded-full transition-all duration-1000 ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(data.currentScore, 100)}%` }}
        />
        
        {/* Target threshold marker */}
        {data.targetThreshold && (
          <div 
            className="absolute top-0 w-0.5 bg-gray-600 h-full"
            style={{ left: `${Math.min(data.targetThreshold, 100)}%` }}
            title={`Target: ${data.targetThreshold}%`}
          />
        )}

        {/* Level boundaries */}
        {MASTERY_LEVELS.slice(1).map(level => (
          <div
            key={level.id}
            className="absolute top-0 w-px bg-gray-400 h-full opacity-30"
            style={{ left: `${Math.min(level.threshold, 100)}%` }}
            title={`${level.name}: ${level.threshold}%`}
          />
        ))}
      </div>

      {/* Level labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Novice</span>
        <span>Expert</span>
      </div>

      <ScreenReaderText>
        Mastery progress indicator showing {currentLevel.name} level at {data.currentScore}%.
        {data.targetThreshold && (
          data.isAchieved 
            ? ` Target of ${data.targetThreshold}% achieved.`
            : ` Working towards ${data.targetThreshold}% target.`
        )}
      </ScreenReaderText>
    </div>
  );
}

// Utility functions

function getCurrentLevel(score: number): MasteryLevel {
  const levels = [...MASTERY_LEVELS].reverse();
  return levels.find(level => score >= level.threshold) || MASTERY_LEVELS[0];
}

function getNextLevel(score: number): MasteryLevel | null {
  return MASTERY_LEVELS.find(level => score < level.threshold) || null;
}

export function getMasteryColor(score: number): string {
  return getCurrentLevel(score).color;
}

export function getMasteryLabel(score: number): string {
  return getCurrentLevel(score).name;
}

export function calculateMasteryProgress(currentScore: number, targetThreshold: number) {
  return {
    percentage: Math.min((currentScore / targetThreshold) * 100, 100),
    isAchieved: currentScore >= targetThreshold,
    pointsNeeded: Math.max(0, targetThreshold - currentScore)
  };
}