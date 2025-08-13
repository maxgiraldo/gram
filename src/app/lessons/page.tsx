'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/ui/Layout';
import { LessonViewer } from '@/components/content/LessonViewer';
import { sampleData, getLessonWithContent } from '@/lib/sample-data/lessons';
import type { Lesson } from '@/types/content';
import type { LessonProgress } from '@/components/content/LessonViewer';

export default function LessonsPage() {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});

  // Get the selected lesson with all content
  const selectedLesson = selectedLessonId ? getLessonWithContent(selectedLessonId) : null;
  
  // Calculate overall progress
  const totalLessons = sampleData.lessons.length;
  const completedLessons = Object.values(lessonProgress).filter(p => p.status === 'completed').length;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Handle lesson selection
  const handleLessonSelect = (lessonId: string) => {
    setSelectedLessonId(lessonId);
  };

  // Handle navigation back to lesson list
  const handleBackToList = () => {
    setSelectedLessonId(null);
  };

  // Handle progress update
  const handleProgressUpdate = (progress: LessonProgress) => {
    setLessonProgress(prev => ({
      ...prev,
      [progress.lessonId]: progress
    }));
  };

  // Handle lesson completion
  const handleLessonComplete = (lessonId: string, score: number) => {
    console.log(`Lesson ${lessonId} completed with score: ${score}`);
    
    // Update progress
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        status: 'completed',
        completedAt: new Date(),
        score
      } as LessonProgress
    }));

    // Show completion message then go back to list
    setTimeout(() => {
      handleBackToList();
    }, 2000);
  };

  // If a lesson is selected, show the lesson viewer
  if (selectedLesson) {
    return (
      <Layout>
        <div className="container-app animate-in">
          {/* Back Button */}
          <div className="mb-6">
            <button
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              onClick={handleBackToList}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lessons
            </button>
          </div>

          {/* Lesson Viewer */}
          <LessonViewer
            lesson={selectedLesson as Lesson}
            progress={lessonProgress[selectedLessonId]}
            onProgressUpdate={handleProgressUpdate}
            onLessonComplete={handleLessonComplete}
            showProgress={true}
            autoAdvance={false}
          />
        </div>
      </Layout>
    );
  }

  // Show lesson list
  return (
    <Layout>
      <div className="container-app animate-in">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">Grammar Lessons</h1>
          <p className="text-lg text-gray-600 max-w-2xl">Master the fundamentals of English grammar with our interactive lessons.</p>
        
        {/* Overall Progress */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-soft hover-lift">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-900">Overall Progress</span>
            <span className="text-sm text-gray-500">
              {completedLessons} of {totalLessons} lessons completed
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-violet-500 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Units and Lessons */}
      {sampleData.units.map(unit => (
        <div key={unit.id} className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {unit.title}
          </h2>
          <p className="text-gray-500 mb-6">{unit.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleData.lessons
              .filter(lesson => lesson.unitId === unit.id)
              .map((lesson, index) => {
                const progress = lessonProgress[lesson.id];
                const isCompleted = progress?.status === 'completed';
                const isInProgress = progress?.status === 'in_progress';
                // Fix locking logic - get filtered lessons array first
                const unitLessons = sampleData.lessons.filter(l => l.unitId === unit.id);
                const isLocked = index > 0 && !lessonProgress[unitLessons[index - 1]?.id]?.status;
                
                return (
                  <div 
                    key={lesson.id}
                    className={`
                      group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
                      ${isLocked ? 'opacity-60 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'}
                      ${isCompleted ? 'border-green-400 bg-gradient-to-br from-green-50 to-white' : ''}
                      ${isInProgress ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white' : ''}
                    `}
                    onClick={() => !isLocked && handleLessonSelect(lesson.id)}
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {lesson.description}
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="ml-4">
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Progress
                            </span>
                          )}
                          {isLocked && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              🔒 Locked
                            </span>
                          )}
                          {!isCompleted && !isInProgress && !isLocked && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="px-6 pb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">
                            📚 {lesson.exercises?.length || 0} exercises
                          </span>
                          <span className="text-gray-500">
                            ⏱️ {lesson.estimatedMinutes} min
                          </span>
                          <span className="text-gray-500">
                            🎯 {lesson.difficulty}
                          </span>
                        </div>
                        
                        {progress?.score !== undefined && (
                          <span className="font-semibold text-green-600">
                            Score: {Math.round(progress.score)}%
                          </span>
                        )}
                      </div>
                      
                      {/* Lesson Progress Bar */}
                      {isInProgress && progress && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out rounded-full"
                              style={{ width: `${(progress.completedSections?.length || 0) * 20}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <button
                        className={`
                          w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                          ${isCompleted 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md' 
                            : isInProgress 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                          ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        disabled={isLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) {
                            handleLessonSelect(lesson.id);
                          }
                        }}
                      >
                        {isCompleted ? 'Review Lesson' : isInProgress ? 'Continue' : 'Start Lesson'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      {/* Quick Stats */}
      <div className="mt-16 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 text-center hover-lift">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
            {sampleData.lessons.length}
          </div>
          <div className="text-sm font-medium text-gray-600">Total Lessons</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 text-center hover-lift">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
            {completedLessons}
          </div>
          <div className="text-sm font-medium text-gray-600">Completed</div>
        </div>
        
        <div className="bg-gradient-to-br from-violet-50 to-white p-6 rounded-xl border border-violet-100 text-center hover-lift">
          <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent mb-2">
            {Math.round(overallProgress)}%
          </div>
          <div className="text-sm font-medium text-gray-600">Progress</div>
        </div>
      </div>
      </div>
    </Layout>
  );
}