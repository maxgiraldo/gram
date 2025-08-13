/**
 * Lesson Viewer Component
 *
 * Main component for rendering lesson content with dynamic content rendering
 * and navigation between lesson sections.
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "../ui/Card";
import {
  MultipleChoice,
  FillInTheBlank,
  DragAndDrop,
  SentenceBuilder,
} from "../exercises";
import type {
  Lesson,
  Exercise,
  Assessment,
  LearningObjective,
  ProgressStatus,
  ExerciseQuestion,
  QuestionType,
} from "../../types/content";
import type { ExerciseAnswer } from "../exercises/types";

export interface LessonProgress {
  lessonId: string;
  status: ProgressStatus;
  completedSections: string[];
  currentSection: string;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
  score?: number;
}

export interface LessonViewerProps {
  lesson: Lesson;
  progress?: LessonProgress;
  onProgressUpdate?: (progress: LessonProgress) => void;
  onExerciseAnswer?: (answer: ExerciseAnswer) => void;
  onAssessmentComplete?: (assessmentId: string, score: number) => void;
  onLessonComplete?: (lessonId: string, finalScore: number) => void;
  onNavigateToSection?: (sectionId: string) => void;
  className?: string;
  showProgress?: boolean;
  autoAdvance?: boolean;
}

type LessonSection = {
  id: string;
  type: "content" | "exercise" | "assessment" | "objective";
  title: string;
  data: any;
  isCompleted: boolean;
  isRequired: boolean;
};

/**
 * Lesson Viewer Component
 */
export function LessonViewer({
  lesson,
  progress,
  onProgressUpdate,
  onExerciseAnswer,
  onAssessmentComplete,
  onLessonComplete,
  onNavigateToSection,
  className = "",
  showProgress = true,
  autoAdvance = false,
}: LessonViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [localProgress, setLocalProgress] = useState<LessonProgress>(
    () =>
      progress || {
        lessonId: lesson.id,
        status: "not_started",
        completedSections: [],
        currentSection: "",
        timeSpent: 0,
      }
  );

  // Create lesson sections from lesson content
  const lessonSections = useMemo((): LessonSection[] => {
    const sections: LessonSection[] = [];

    // Main content section
    if (lesson.content && lesson.content.trim()) {
      sections.push({
        id: "content",
        type: "content",
        title: "Lesson Content",
        data: lesson.content,
        isCompleted: localProgress.completedSections.includes("content"),
        isRequired: true,
      });
    }

    // Learning objectives
    if (lesson.objectives && lesson.objectives.length > 0) {
      lesson.objectives.forEach((objective, index) => {
        sections.push({
          id: `objective-${objective.id}`,
          type: "objective",
          title: `Objective: ${objective.title}`,
          data: objective,
          isCompleted: localProgress.completedSections.includes(
            `objective-${objective.id}`
          ),
          isRequired: true,
        });
      });
    }

    // Exercises
    if (lesson.exercises && lesson.exercises.length > 0) {
      lesson.exercises
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((exercise) => {
          sections.push({
            id: `exercise-${exercise.id}`,
            type: "exercise",
            title: exercise.title,
            data: exercise,
            isCompleted: localProgress.completedSections.includes(
              `exercise-${exercise.id}`
            ),
            isRequired: exercise.type !== "enrichment",
          });
        });
    }

    // Assessments
    if (lesson.assessments && lesson.assessments.length > 0) {
      lesson.assessments.forEach((assessment) => {
        sections.push({
          id: `assessment-${assessment.id}`,
          type: "assessment",
          title: `Assessment: ${assessment.title}`,
          data: assessment,
          isCompleted: localProgress.completedSections.includes(
            `assessment-${assessment.id}`
          ),
          isRequired: assessment.type !== "enrichment",
        });
      });
    }

    return sections;
  }, [lesson, localProgress.completedSections]);

  // Current section
  const currentSection = lessonSections[currentSectionIndex];

  // Navigation functions
  const canNavigateNext = useCallback(() => {
    return currentSectionIndex < lessonSections.length - 1;
  }, [currentSectionIndex, lessonSections.length]);

  const canNavigatePrev = useCallback(() => {
    return currentSectionIndex > 0;
  }, [currentSectionIndex]);

  const navigateToSection = useCallback(
    (index: number) => {
      if (index >= 0 && index < lessonSections.length) {
        setCurrentSectionIndex(index);
        const section = lessonSections[index];

        // Update current section in progress
        const updatedProgress = {
          ...localProgress,
          currentSection: section.id,
          status: "in_progress" as ProgressStatus,
        };

        setLocalProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);
        onNavigateToSection?.(section.id);
      }
    },
    [lessonSections, localProgress, onProgressUpdate, onNavigateToSection]
  );

  const navigateNext = useCallback(() => {
    if (canNavigateNext()) {
      navigateToSection(currentSectionIndex + 1);
    }
  }, [canNavigateNext, navigateToSection, currentSectionIndex]);

  const navigatePrev = useCallback(() => {
    if (canNavigatePrev()) {
      navigateToSection(currentSectionIndex - 1);
    }
  }, [canNavigatePrev, navigateToSection, currentSectionIndex]);

  // Mark section as completed
  const markSectionCompleted = useCallback(
    (sectionId: string) => {
      if (!localProgress.completedSections.includes(sectionId)) {
        const updatedProgress = {
          ...localProgress,
          completedSections: [...localProgress.completedSections, sectionId],
        };

        // Check if all required sections are completed
        const requiredSections = lessonSections.filter((s) => s.isRequired);
        const completedRequiredSections = requiredSections.filter((s) =>
          updatedProgress.completedSections.includes(s.id)
        );

        if (completedRequiredSections.length === requiredSections.length) {
          updatedProgress.status = "completed";
          updatedProgress.completedAt = new Date();

          // Calculate final score based on exercises and assessments
          const finalScore = calculateLessonScore(lesson, updatedProgress);
          onLessonComplete?.(lesson.id, finalScore);
        }

        setLocalProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);

        // Auto-advance if enabled and not the last section
        if (autoAdvance && canNavigateNext()) {
          setTimeout(() => navigateNext(), 1500);
        }
      }
    },
    [
      localProgress,
      lessonSections,
      autoAdvance,
      canNavigateNext,
      navigateNext,
      lesson,
      onProgressUpdate,
      onLessonComplete,
    ]
  );

  // Handle exercise answer
  const handleExerciseAnswer = useCallback(
    (answer: ExerciseAnswer) => {
      onExerciseAnswer?.(answer);

      // Mark exercise section as completed if answer is correct or attempts exhausted
      if (answer.isCorrect || answer.isLastAttempt) {
        markSectionCompleted(`exercise-${answer.exerciseId}`);
      }
    },
    [onExerciseAnswer, markSectionCompleted]
  );

  // Handle assessment completion
  const handleAssessmentComplete = useCallback(
    (assessmentId: string, score: number) => {
      onAssessmentComplete?.(assessmentId, score);
      markSectionCompleted(`assessment-${assessmentId}`);
    },
    [onAssessmentComplete, markSectionCompleted]
  );

  // Handle content section completion
  const handleContentComplete = useCallback(() => {
    markSectionCompleted("content");
  }, [markSectionCompleted]);

  // Handle objective review completion
  const handleObjectiveComplete = useCallback(
    (objectiveId: string) => {
      markSectionCompleted(`objective-${objectiveId}`);
    },
    [markSectionCompleted]
  );

  // Initialize current section on mount
  useEffect(() => {
    if (currentSection && localProgress.currentSection !== currentSection.id) {
      const updatedProgress = {
        ...localProgress,
        currentSection: currentSection.id,
        status: "in_progress" as ProgressStatus,
        startedAt: localProgress.startedAt || new Date(),
      };

      setLocalProgress(updatedProgress);
      onProgressUpdate?.(updatedProgress);
    }
  }, [currentSection, localProgress, onProgressUpdate]);

  // Progress calculation
  const progressPercentage = useMemo(() => {
    const totalSections = lessonSections.filter((s) => s.isRequired).length;
    const completedSections = lessonSections.filter(
      (s) => s.isRequired && localProgress.completedSections.includes(s.id)
    ).length;

    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  }, [lessonSections, localProgress.completedSections]);

  // Render section content
  const renderSectionContent = useCallback(
    (section: LessonSection) => {
      switch (section.type) {
        case "content":
          return (
            <ContentRenderer
              content={section.data}
              onComplete={handleContentComplete}
              isCompleted={section.isCompleted}
            />
          );

        case "objective":
          return (
            <ObjectiveRenderer
              objective={section.data}
              onComplete={() => handleObjectiveComplete(section.data.id)}
              isCompleted={section.isCompleted}
            />
          );

        case "exercise":
          return (
            <ExerciseRenderer
              exercise={section.data}
              onAnswer={handleExerciseAnswer}
              isCompleted={section.isCompleted}
            />
          );

        case "assessment":
          return (
            <AssessmentRenderer
              assessment={section.data}
              onComplete={(score) =>
                handleAssessmentComplete(section.data.id, score)
              }
              isCompleted={section.isCompleted}
            />
          );

        default:
          return <div>Unknown section type</div>;
      }
    },
    [
      handleContentComplete,
      handleObjectiveComplete,
      handleExerciseAnswer,
      handleAssessmentComplete,
    ]
  );

  if (!currentSection) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-gray-500">
              No content available for this lesson.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={`lesson-viewer max-w-4xl mx-auto ${className}`}>
      {/* Progress indicator */}
      {showProgress && (
        <Card className="mb-4 md:mb-6">
          <CardBody className="py-3 md:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
              <h2 className="text-lg md:text-xl font-semibold truncate">
                {lesson.title}
              </h2>
              <span className="text-sm text-gray-600 flex-shrink-0">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Section navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
              <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
                {lessonSections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => navigateToSection(index)}
                    className={`
                      w-3 h-3 flex-shrink-0 rounded-full border-2 transition-all duration-200
                      ${
                        index === currentSectionIndex
                          ? "border-blue-600 bg-blue-600"
                          : ""
                      }
                      ${
                        section.isCompleted
                          ? "bg-green-500 border-green-500"
                          : ""
                      }
                      ${
                        !section.isCompleted && index !== currentSectionIndex
                          ? "border-gray-300"
                          : ""
                      }
                    `}
                    title={section.title}
                    aria-label={`Go to ${section.title}`}
                  />
                ))}
              </div>

              <span className="text-sm text-gray-600 flex-shrink-0">
                Section {currentSectionIndex + 1} of {lessonSections.length}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main content */}
      <Card className="min-h-[60vh]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg md:text-xl font-semibold">
              {currentSection.title}
            </h3>
            {currentSection.isCompleted && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 self-start sm:self-center">
                ✓ Completed
              </span>
            )}
          </div>
        </CardHeader>

        <CardBody className="flex-grow">
          {renderSectionContent(currentSection)}
        </CardBody>

        <CardFooter>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Button
              variant="outline"
              onClick={navigatePrev}
              disabled={!canNavigatePrev()}
              className="nav-button w-full sm:w-auto"
            >
              ← Previous
            </Button>

            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center">
              {lesson.estimatedMinutes && (
                <span className="text-sm text-gray-600">
                  Est. {lesson.estimatedMinutes} min
                </span>
              )}

              {currentSection.isRequired && (
                <span className="text-sm text-blue-600 font-medium">
                  Required
                </span>
              )}
            </div>

            <Button
              variant="primary"
              onClick={navigateNext}
              disabled={!canNavigateNext()}
              className="nav-button w-full sm:w-auto"
            >
              Next →
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to calculate lesson score
function calculateLessonScore(
  lesson: Lesson,
  progress: LessonProgress
): number {
  // This would integrate with the mastery calculator
  // For now, return a simple completion-based score
  const totalSections =
    (lesson.exercises?.length || 0) + (lesson.assessments?.length || 0);
  const completedSections = progress.completedSections.filter(
    (id) => id.startsWith("exercise-") || id.startsWith("assessment-")
  ).length;

  return totalSections > 0 ? (completedSections / totalSections) * 100 : 100;
}

// Content renderer component
interface ContentRendererProps {
  content: string;
  onComplete: () => void;
  isCompleted: boolean;
}

function ContentRenderer({
  content,
  onComplete,
  isCompleted,
}: ContentRendererProps) {
  const [hasReadToEnd, setHasReadToEnd] = useState(false);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const hasScrolledToEnd =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 10;

      if (hasScrolledToEnd && !hasReadToEnd) {
        setHasReadToEnd(true);
      }
    },
    [hasReadToEnd]
  );

  useEffect(() => {
    if (hasReadToEnd && !isCompleted) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [hasReadToEnd, isCompleted, onComplete]);

  return (
    <div
      className="prose max-w-none max-h-96 overflow-y-auto p-4 border rounded-lg"
      onScroll={handleScroll}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />

      {!isCompleted && hasReadToEnd && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Content reviewed! Moving to next section...
          </p>
        </div>
      )}
    </div>
  );
}

// Objective renderer component
interface ObjectiveRendererProps {
  objective: LearningObjective;
  onComplete: () => void;
  isCompleted: boolean;
}

function ObjectiveRenderer({
  objective,
  onComplete,
  isCompleted,
}: ObjectiveRendererProps) {
  const handleMarkUnderstood = useCallback(() => {
    if (!isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Learning Objective</h4>
        <p className="text-blue-800">{objective.description}</p>
        <div className="mt-2 text-sm text-blue-600">
          Category: {objective.category} | Mastery Threshold:{" "}
          {(objective.masteryThreshold * 100).toFixed(0)}%
        </div>
      </div>

      {!isCompleted && (
        <div className="text-center">
          <Button
            variant="primary"
            onClick={handleMarkUnderstood}
            className="mark-understood-button"
          >
            I Understand This Objective
          </Button>
        </div>
      )}
    </div>
  );
}

// Exercise renderer component
interface ExerciseRendererProps {
  exercise: Exercise;
  onAnswer: (answer: ExerciseAnswer) => void;
  isCompleted: boolean;
}

function ExerciseRenderer({
  exercise,
  onAnswer,
  isCompleted,
}: ExerciseRendererProps) {
  if (!exercise.questions || exercise.questions.length === 0) {
    return <div>No questions available for this exercise.</div>;
  }

  // For now, render the first question
  const question = exercise.questions[0];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">{exercise.title}</h4>
        {exercise.description && (
          <p className="text-yellow-800 text-sm">{exercise.description}</p>
        )}
        <div className="mt-2 text-sm text-yellow-600">
          Type: {exercise.type} | Difficulty: {exercise.difficulty}
          {exercise.timeLimit && ` | Time Limit: ${exercise.timeLimit}s`}
        </div>
      </div>

      <ExerciseQuestionRenderer
        question={question}
        onAnswer={onAnswer}
        disabled={isCompleted}
      />
    </div>
  );
}

// Exercise question renderer
interface ExerciseQuestionRendererProps {
  question: ExerciseQuestion;
  onAnswer: (answer: ExerciseAnswer) => void;
  disabled: boolean;
}

function ExerciseQuestionRenderer({
  question,
  onAnswer,
  disabled,
}: ExerciseQuestionRendererProps) {
  const handleAnswer = useCallback(
    (answer: ExerciseAnswer) => {
      onAnswer({
        ...answer,
        exerciseId: question.exerciseId,
        questionId: question.id,
      });
    },
    [question, onAnswer]
  );

  const commonProps = {
    question,
    onAnswer: handleAnswer,
    disabled,
    showFeedback: true,
    timeLimit: question.timeLimit,
  };

  switch (question.type) {
    case "multiple_choice":
      return <MultipleChoice {...commonProps} />;
    case "fill_in_blank":
      return <FillInTheBlank {...commonProps} />;
    case "drag_and_drop":
      return <DragAndDrop {...commonProps} />;
    case "sentence_builder":
      return <SentenceBuilder {...commonProps} />;
    default:
      return <div>Unsupported question type: {question.type}</div>;
  }
}

// Assessment renderer component
interface AssessmentRendererProps {
  assessment: Assessment;
  onComplete: (score: number) => void;
  isCompleted: boolean;
}

function AssessmentRenderer({
  assessment,
  onComplete,
  isCompleted,
}: AssessmentRendererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);

  const handleQuestionAnswer = useCallback(
    (answer: ExerciseAnswer) => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      // Move to next question or complete assessment
      if (currentQuestionIndex < assessment.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // Calculate final score
        const totalPoints = assessment.questions.reduce(
          (sum, q) => sum + q.points,
          0
        );
        const earnedPoints = newAnswers.reduce((sum, a) => sum + a.points, 0);
        const score = (earnedPoints / totalPoints) * 100;

        onComplete(score);
      }
    },
    [answers, currentQuestionIndex, assessment.questions, onComplete]
  );

  if (!assessment.questions || assessment.questions.length === 0) {
    return <div>No questions available for this assessment.</div>;
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-2">
          {assessment.title}
        </h4>
        {assessment.description && (
          <p className="text-purple-800 text-sm">{assessment.description}</p>
        )}
        <div className="mt-2 text-sm text-purple-600">
          Question {currentQuestionIndex + 1} of {assessment.questions.length} |
          Type: {assessment.type}
          {assessment.timeLimit && ` | Time Limit: ${assessment.timeLimit}s`}
        </div>
      </div>

      {!isCompleted && (
        <ExerciseQuestionRenderer
          question={currentQuestion}
          onAnswer={handleQuestionAnswer}
          disabled={false}
        />
      )}

      {isCompleted && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">Assessment completed!</p>
        </div>
      )}
    </div>
  );
}

// Default export
export default LessonViewer;
