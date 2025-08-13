/**
 * Progress Visualization Components
 * 
 * Collection of components for visualizing learning progress, including
 * charts, timelines, and interactive progress displays.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '../ui';
import { ScreenReaderText } from '../ui/ScreenReaderComponents';
import { MasteryIndicator, type MasteryData } from './MasteryIndicator';

// ===== TYPES =====

export interface ProgressDataPoint {
  date: string;
  score: number;
  assessmentType: string;
  masteryAchieved: boolean;
}

export interface ObjectiveProgress {
  id: string;
  title: string;
  category: string;
  currentScore: number;
  targetThreshold: number;
  masteryAchieved: boolean;
  attempts: number;
  lastAttempt?: string;
}

export interface LessonProgressSummary {
  lessonId: string;
  title: string;
  totalObjectives: number;
  masteredObjectives: number;
  currentScore: number;
  timeSpent: number;
  lastAccessed: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
}

// ===== PROGRESS TIMELINE =====

export interface ProgressTimelineProps {
  data: ProgressDataPoint[];
  className?: string;
}

export function ProgressTimeline({ data, className = '' }: ProgressTimelineProps) {
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Progress Timeline</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {sortedData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assessment data available yet.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
              
              {sortedData.map((point, index) => (
                <div key={`${point.date}-${index}`} className="relative flex items-center space-x-4 pb-6">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-8 h-8 rounded-full border-4 border-white ${
                    point.masteryAchieved ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {point.assessmentType} Assessment
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(point.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          point.masteryAchieved ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {point.score}%
                        </p>
                        {point.masteryAchieved && (
                          <p className="text-sm text-green-600">Mastery ✓</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ScreenReaderText>
          Progress timeline showing {sortedData.length} assessment attempts. 
          {sortedData.filter(p => p.masteryAchieved).length} achieved mastery.
          Most recent score: {sortedData[sortedData.length - 1]?.score || 0}%.
        </ScreenReaderText>
      </CardBody>
    </Card>
  );
}

// ===== OBJECTIVES GRID =====

export interface ObjectivesGridProps {
  objectives: ObjectiveProgress[];
  className?: string;
}

export function ObjectivesGrid({ objectives, className = '' }: ObjectivesGridProps) {
  const groupedObjectives = objectives.reduce((groups, objective) => {
    const category = objective.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(objective);
    return groups;
  }, {} as Record<string, ObjectiveProgress[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Learning Objectives Progress</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {Object.entries(groupedObjectives).map(([category, categoryObjectives]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryObjectives.map(objective => {
                  const masteryData: MasteryData = {
                    currentScore: objective.currentScore,
                    targetThreshold: objective.targetThreshold,
                    isAchieved: objective.masteryAchieved,
                    level: objective.masteryAchieved ? 'mastered' : 'in-progress',
                    attempts: objective.attempts,
                    lastAssessment: objective.lastAttempt
                  };

                  return (
                    <div 
                      key={objective.id}
                      className="p-4 border rounded-lg bg-gray-50"
                    >
                      <h5 className="font-medium text-sm mb-2">{objective.title}</h5>
                      <MasteryIndicator 
                        data={masteryData}
                        variant="compact"
                        size="sm"
                        showLabel={false}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        {objective.attempts} attempt{objective.attempts !== 1 ? 's' : ''}
                        {objective.lastAttempt && (
                          <span className="ml-2">
                            Last: {new Date(objective.lastAttempt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <ScreenReaderText>
          Learning objectives grid showing progress for {objectives.length} objectives 
          across {Object.keys(groupedObjectives).length} categories.
          {objectives.filter(o => o.masteryAchieved).length} objectives mastered.
        </ScreenReaderText>
      </CardBody>
    </Card>
  );
}

// ===== LESSON PROGRESS CARDS =====

export interface LessonProgressCardsProps {
  lessons: LessonProgressSummary[];
  className?: string;
}

export function LessonProgressCards({ lessons, className = '' }: LessonProgressCardsProps) {
  const getStatusColor = (status: LessonProgressSummary['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'completed': return 'bg-yellow-100 text-yellow-600';
      case 'mastered': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Lesson Progress</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map(lesson => {
          const progressPercentage = lesson.totalObjectives > 0 
            ? (lesson.masteredObjectives / lesson.totalObjectives) * 100 
            : 0;

          return (
            <Card key={lesson.lessonId} className="relative">
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-sm">{lesson.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                    {lesson.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Objectives</span>
                    <span>{lesson.masteredObjectives}/{lesson.totalObjectives}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Current Score:</span>
                    <span className="font-medium">{lesson.currentScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <span className="font-medium">{formatTime(lesson.timeSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Accessed:</span>
                    <span className="font-medium">
                      {new Date(lesson.lastAccessed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ScreenReaderText>
        Lesson progress showing {lessons.length} lessons.
        {lessons.filter(l => l.status === 'mastered').length} lessons mastered,
        {lessons.filter(l => l.status === 'completed').length} completed,
        {lessons.filter(l => l.status === 'in_progress').length} in progress.
      </ScreenReaderText>
    </div>
  );
}

// ===== PERFORMANCE CHART =====

export interface PerformanceChartProps {
  data: ProgressDataPoint[];
  targetThreshold?: number;
  className?: string;
}

export function PerformanceChart({ 
  data, 
  targetThreshold = 80, 
  className = '' 
}: PerformanceChartProps) {
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const maxScore = Math.max(100, Math.max(...sortedData.map(d => d.score), targetThreshold));
  const minScore = Math.min(0, Math.min(...sortedData.map(d => d.score)));
  const scoreRange = maxScore - minScore;

  const getYPosition = (score: number) => {
    return ((maxScore - score) / scoreRange) * 100;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Performance Trend</h3>
      </CardHeader>
      <CardBody>
        <div className="relative h-64 bg-gray-50 rounded p-4">
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No performance data available yet
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
                <span>{maxScore}%</span>
                <span>{Math.round((maxScore + minScore) / 2)}%</span>
                <span>{minScore}%</span>
              </div>

              {/* Target threshold line */}
              {targetThreshold >= minScore && targetThreshold <= maxScore && (
                <div 
                  className="absolute w-full border-t-2 border-dashed border-green-500"
                  style={{ top: `${getYPosition(targetThreshold)}%` }}
                >
                  <span className="absolute right-0 -top-2 text-xs text-green-600 bg-white px-1">
                    Target: {targetThreshold}%
                  </span>
                </div>
              )}

              {/* Data points and line */}
              <div className="relative w-full h-full">
                {sortedData.map((point, index) => {
                  const x = (index / (sortedData.length - 1)) * 100;
                  const y = getYPosition(point.score);

                  return (
                    <div key={`${point.date}-${index}`}>
                      {/* Line to next point */}
                      {index < sortedData.length - 1 && (
                        <svg className="absolute inset-0 w-full h-full">
                          <line
                            x1={`${x}%`}
                            y1={`${y}%`}
                            x2={`${((index + 1) / (sortedData.length - 1)) * 100}%`}
                            y2={`${getYPosition(sortedData[index + 1].score)}%`}
                            stroke="#3B82F6"
                            strokeWidth="2"
                          />
                        </svg>
                      )}

                      {/* Data point */}
                      <div
                        className={`absolute w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 ${
                          point.masteryAchieved ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`${point.score}% on ${new Date(point.date).toLocaleDateString()}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 mt-2">
                <span>{new Date(sortedData[0].date).toLocaleDateString()}</span>
                <span>{new Date(sortedData[sortedData.length - 1].date).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        <ScreenReaderText>
          Performance chart showing score progression over {sortedData.length} assessments.
          {sortedData.length > 0 && (
            <>
              Starting score: {sortedData[0].score}%.
              Latest score: {sortedData[sortedData.length - 1].score}%.
              {sortedData.filter(d => d.masteryAchieved).length} assessments achieved mastery.
            </>
          )}
        </ScreenReaderText>
      </CardBody>
    </Card>
  );
}