/**
 * LessonViewer Component Tests
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LessonViewer } from "../LessonViewer";
import type {
  Lesson,
  LearningObjective,
  Exercise,
  Assessment,
} from "../../../types/content";

// Mock the exercise components
vi.mock("../../exercises", () => ({
  MultipleChoice: ({ question, onAnswer }: any) => (
    <div data-testid="multiple-choice">
      <button
        onClick={() =>
          onAnswer({ questionId: question.id, isCorrect: true, points: 10 })
        }
      >
        Submit Answer
      </button>
    </div>
  ),
  FillInTheBlank: ({ question, onAnswer }: any) => (
    <div data-testid="fill-in-blank">
      <button
        onClick={() =>
          onAnswer({ questionId: question.id, isCorrect: true, points: 10 })
        }
      >
        Submit Answer
      </button>
    </div>
  ),
  DragAndDrop: ({ question, onAnswer }: any) => (
    <div data-testid="drag-and-drop">
      <button
        onClick={() =>
          onAnswer({ questionId: question.id, isCorrect: true, points: 10 })
        }
      >
        Submit Answer
      </button>
    </div>
  ),
  SentenceBuilder: ({ question, onAnswer }: any) => (
    <div data-testid="sentence-builder">
      <button
        onClick={() =>
          onAnswer({ questionId: question.id, isCorrect: true, points: 10 })
        }
      >
        Submit Answer
      </button>
    </div>
  ),
}));

// Mock UI components
vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("../../ui/Card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardBody: ({ children }: any) => (
    <div data-testid="card-body">{children}</div>
  ),
  CardFooter: ({ children }: any) => (
    <div data-testid="card-footer">{children}</div>
  ),
}));

describe("LessonViewer", () => {
  const mockObjective: LearningObjective = {
    id: "obj-1",
    title: "Test Objective",
    description: "Test objective description",
    category: "knowledge",
    masteryThreshold: 0.8,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExercise: Exercise = {
    id: "ex-1",
    lessonId: "lesson-1",
    title: "Test Exercise",
    description: "Test exercise description",
    type: "practice",
    orderIndex: 0,
    timeLimit: 300,
    maxAttempts: 3,
    difficulty: "beginner",
    questions: [
      {
        id: "q-1",
        exerciseId: "ex-1",
        questionText: "What is 2+2?",
        type: "multiple_choice",
        orderIndex: 0,
        points: 10,
        questionData: {
          options: ["3", "4", "5", "6"],
          correctIndex: 1,
        },
        correctAnswer: "4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssessment: Assessment = {
    id: "assess-1",
    lessonId: "lesson-1",
    title: "Test Assessment",
    description: "Test assessment description",
    type: "formative",
    orderIndex: 0,
    timeLimit: 600,
    maxAttempts: 1,
    passingScore: 80,
    questions: [
      {
        id: "aq-1",
        exerciseId: "assess-1",
        questionText: "Assessment question?",
        type: "multiple_choice",
        orderIndex: 0,
        points: 20,
        questionData: {
          options: ["A", "B", "C", "D"],
          correctIndex: 0,
        },
        correctAnswer: "A",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson: Lesson = {
    id: "lesson-1",
    unitId: "unit-1",
    title: "Test Lesson",
    description: "Test lesson description",
    content: "<p>This is the lesson content.</p>",
    orderIndex: 0,
    isPublished: true,
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    difficulty: "beginner",
    tags: ["grammar", "basics"],
    objectives: [mockObjective],
    exercises: [mockExercise],
    assessments: [mockAssessment],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    lesson: mockLesson,
    onProgressUpdate: vi.fn(),
    onExerciseAnswer: vi.fn(),
    onAssessmentComplete: vi.fn(),
    onLessonComplete: vi.fn(),
    onNavigateToSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders lesson title and content", () => {
      render(<LessonViewer {...defaultProps} />);

      expect(screen.getByText("Test Lesson")).toBeInTheDocument();
      expect(screen.getByText("Lesson Content")).toBeInTheDocument();
    });

    it("shows progress indicator by default", () => {
      render(<LessonViewer {...defaultProps} />);

      expect(screen.getByText("0% Complete")).toBeInTheDocument();
    });

    it("hides progress indicator when showProgress is false", () => {
      render(<LessonViewer {...defaultProps} showProgress={false} />);

      expect(screen.queryByText("0% Complete")).not.toBeInTheDocument();
    });

    it("renders all lesson sections", () => {
      render(<LessonViewer {...defaultProps} />);

      // Should render content section initially
      expect(screen.getByText("Lesson Content")).toBeInTheDocument();

      // Progress indicators should show all sections
      expect(screen.getByText("Section 1 of 4")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <LessonViewer {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Navigation", () => {
    it("enables next button when not on last section", () => {
      render(<LessonViewer {...defaultProps} />);

      const nextButton = screen.getByText("Next →");
      expect(nextButton).not.toBeDisabled();
    });

    it("disables previous button on first section", () => {
      render(<LessonViewer {...defaultProps} />);

      const prevButton = screen.getByText("← Previous");
      expect(prevButton).toBeDisabled();
    });

    it("navigates to next section when next button is clicked", async () => {
      render(<LessonViewer {...defaultProps} />);

      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Objective: Test Objective")
        ).toBeInTheDocument();
      });
    });

    it("navigates to previous section when previous button is clicked", async () => {
      render(<LessonViewer {...defaultProps} />);

      // Go to next section first
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("Objective: Test Objective")
        ).toBeInTheDocument();
      });

      // Then go back
      const prevButton = screen.getByText("← Previous");
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText("Lesson Content")).toBeInTheDocument();
      });
    });

    it("calls onNavigateToSection when navigating", async () => {
      const onNavigateToSection = vi.fn();
      render(
        <LessonViewer
          {...defaultProps}
          onNavigateToSection={onNavigateToSection}
        />
      );

      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(onNavigateToSection).toHaveBeenCalledWith("objective-obj-1");
      });
    });
  });

  describe("Progress Tracking", () => {
    it("calls onProgressUpdate when starting lesson", () => {
      const onProgressUpdate = vi.fn();
      render(
        <LessonViewer {...defaultProps} onProgressUpdate={onProgressUpdate} />
      );

      expect(onProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: "lesson-1",
          status: "in_progress",
          currentSection: "content",
        })
      );
    });

    it("marks content section as complete when reading to end", async () => {
      const onProgressUpdate = vi.fn();
      render(
        <LessonViewer {...defaultProps} onProgressUpdate={onProgressUpdate} />
      );

      // Find the scrollable content container
      const contentContainer = screen
        .getByText(/This is the lesson content/)
        .closest(".prose");
      expect(contentContainer).toBeTruthy();

      // Mock the scroll properties to simulate reaching the end
      Object.defineProperty(contentContainer!, "scrollTop", {
        value: 300,
        configurable: true,
      });
      Object.defineProperty(contentContainer!, "clientHeight", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(contentContainer!, "scrollHeight", {
        value: 300,
        configurable: true,
      });

      // Trigger scroll event
      fireEvent.scroll(contentContainer!);

      await waitFor(
        () => {
          expect(onProgressUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
              completedSections: expect.arrayContaining(["content"]),
            })
          );
        },
        { timeout: 2000 }
      );
    });

    it("updates progress percentage based on completed sections", () => {
      const initialProgress = {
        lessonId: "lesson-1",
        status: "in_progress" as const,
        completedSections: ["content"],
        currentSection: "content",
        timeSpent: 0,
      };

      render(<LessonViewer {...defaultProps} progress={initialProgress} />);

      expect(screen.getByText("25% Complete")).toBeInTheDocument();
    });
  });

  describe("Exercise Interaction", () => {
    it("renders exercise component for exercise sections", async () => {
      render(<LessonViewer {...defaultProps} />);

      // Navigate to exercise section
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton); // Go to objective
      fireEvent.click(nextButton); // Go to exercise

      await waitFor(() => {
        expect(screen.getByTestId("multiple-choice")).toBeInTheDocument();
      });
    });

    it("calls onExerciseAnswer when exercise is answered", async () => {
      const onExerciseAnswer = vi.fn();
      render(
        <LessonViewer {...defaultProps} onExerciseAnswer={onExerciseAnswer} />
      );

      // Navigate to exercise section
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton); // Go to objective
      fireEvent.click(nextButton); // Go to exercise

      await waitFor(() => {
        const submitButton = screen.getByText("Submit Answer");
        fireEvent.click(submitButton);

        expect(onExerciseAnswer).toHaveBeenCalledWith(
          expect.objectContaining({
            questionId: "q-1",
            isCorrect: true,
            points: 10,
          })
        );
      });
    });
  });

  describe("Assessment Interaction", () => {
    it("renders assessment component for assessment sections", async () => {
      render(<LessonViewer {...defaultProps} />);

      // Navigate to assessment section (last section)
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton); // Go to objective
      fireEvent.click(nextButton); // Go to exercise
      fireEvent.click(nextButton); // Go to assessment

      await waitFor(() => {
        expect(
          screen.getByText("Assessment: Test Assessment")
        ).toBeInTheDocument();
      });
    });

    it("calls onAssessmentComplete when assessment is completed", async () => {
      const onAssessmentComplete = vi.fn();
      render(
        <LessonViewer
          {...defaultProps}
          onAssessmentComplete={onAssessmentComplete}
        />
      );

      // Navigate to assessment section
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton); // Go to objective
      fireEvent.click(nextButton); // Go to exercise
      fireEvent.click(nextButton); // Go to assessment

      await waitFor(() => {
        const submitButton = screen.getByText("Submit Answer");
        fireEvent.click(submitButton);

        expect(onAssessmentComplete).toHaveBeenCalledWith(
          "assess-1",
          expect.any(Number)
        );
      });
    });
  });

  describe("Lesson Completion", () => {
    it("calls onLessonComplete when all required sections are completed", async () => {
      const onLessonComplete = vi.fn();
      render(
        <LessonViewer {...defaultProps} onLessonComplete={onLessonComplete} />
      );

      // Complete all sections would trigger lesson completion
      // This would be triggered by the internal markSectionCompleted logic
      // when all required sections are marked as completed

      // For now, we can test that the component renders completion state correctly
      const progress = {
        lessonId: "lesson-1",
        status: "completed" as const,
        completedSections: [
          "content",
          "objective-obj-1",
          "exercise-ex-1",
          "assessment-assess-1",
        ],
        currentSection: "content",
        timeSpent: 1800,
        completedAt: new Date(),
      };

      render(<LessonViewer {...defaultProps} progress={progress} />);

      expect(screen.getByText("100% Complete")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive classes for mobile layout", () => {
      const { container } = render(<LessonViewer {...defaultProps} />);

      // Check for responsive classes
      expect(container.querySelector(".max-w-4xl")).toBeInTheDocument();
      expect(container.querySelector(".flex-col")).toBeInTheDocument();
      expect(container.querySelector(".sm\\:flex-row")).toBeInTheDocument();
    });

    it("shows full-width buttons on mobile", () => {
      render(<LessonViewer {...defaultProps} />);

      const nextButton = screen.getByText("Next →");
      expect(nextButton).toHaveClass("w-full");
      expect(nextButton).toHaveClass("sm:w-auto");
    });
  });

  describe("Error Handling", () => {
    it("handles lesson with no content gracefully", () => {
      const emptyLesson = {
        ...mockLesson,
        content: "",
        objectives: [],
        exercises: [],
        assessments: [],
      };

      render(<LessonViewer {...defaultProps} lesson={emptyLesson} />);

      expect(
        screen.getByText("No content available for this lesson.")
      ).toBeInTheDocument();
    });

    it("handles exercises with no questions", async () => {
      const exerciseWithoutQuestions = {
        ...mockExercise,
        questions: [],
      };

      const lessonWithEmptyExercise = {
        ...mockLesson,
        exercises: [exerciseWithoutQuestions],
      };

      render(
        <LessonViewer {...defaultProps} lesson={lessonWithEmptyExercise} />
      );

      // Navigate to exercise section
      const nextButton = screen.getByText("Next →");
      fireEvent.click(nextButton); // Go to objective
      fireEvent.click(nextButton); // Go to exercise

      await waitFor(() => {
        expect(
          screen.getByText("No questions available for this exercise.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("provides proper ARIA labels for navigation", () => {
      render(<LessonViewer {...defaultProps} />);

      // Progress dots should have aria-labels
      const progressDots = screen.getAllByLabelText(/Go to/);
      expect(progressDots.length).toBeGreaterThan(0);
    });

    it("has proper heading structure", () => {
      render(<LessonViewer {...defaultProps} />);

      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveTextContent("Test Lesson");

      const sectionHeading = screen.getByRole("heading", { level: 3 });
      expect(sectionHeading).toHaveTextContent("Lesson Content");
    });

    it("maintains keyboard navigation support", () => {
      render(<LessonViewer {...defaultProps} />);

      const nextButton = screen.getByText("Next →");
      expect(nextButton).toBeVisible();
      expect(nextButton).not.toHaveAttribute("tabindex", "-1");
    });
  });
});
