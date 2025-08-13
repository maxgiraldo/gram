/**
 * Feedback Engine Tests
 *
 * Test suite for the real-time feedback generation system.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateFeedback,
  generateHintSequence,
  getNextHint,
  type FeedbackContext,
  type HintSequence,
  type FeedbackOptions,
} from "../feedback-engine";
import type { ExerciseQuestion } from "../../../types/content";

describe("Feedback Engine", () => {
  let mockQuestion: ExerciseQuestion;
  let mockContext: FeedbackContext;

  beforeEach(() => {
    mockQuestion = {
      id: "q1",
      exerciseId: "ex1",
      type: "multiple_choice",
      text: "What is the capital of France?",
      points: 10,
      orderIndex: 0,
      questionData: {
        options: ["London", "Paris", "Berlin", "Madrid"],
        correctAnswer: "Paris",
        shuffleOptions: false,
      },
      hints: [
        "Think about the country famous for the Eiffel Tower.",
        "It starts with the letter P.",
      ],
      explanation: "Paris is the capital city of France.",
      timeLimit: 30,
    };

    mockContext = {
      question: mockQuestion,
      userAnswer: "London",
      correctAnswer: "Paris",
      attemptNumber: 1,
      hintsUsed: 0,
      timeSpent: 15,
    };
  });

  describe("generateFeedback", () => {
    it("should generate correct feedback for correct answer", () => {
      const context = {
        ...mockContext,
        userAnswer: "Paris",
      };

      const feedback = generateFeedback(context);

      expect(feedback.type).toBe("correct");
      expect(feedback.title).toBe("Perfect!");
      expect(feedback.message).toContain("Well done");
    });

    it("should generate incorrect feedback for wrong answer", () => {
      const feedback = generateFeedback(mockContext);

      expect(feedback.type).toBe("incorrect");
      expect(feedback.title).toBe("Not quite right");
      expect(feedback.message).toContain("Not quite");
    });

    it("should generate partial feedback for fill-in-blank with partial credit", () => {
      const fillInBlankQuestion: ExerciseQuestion = {
        ...mockQuestion,
        type: "fill_in_blank",
        questionData: {
          blanks: ["Paris", "France"],
          acceptableAnswers: [["Paris"], ["France"]],
        },
      };

      const context: FeedbackContext = {
        question: fillInBlankQuestion,
        userAnswer: ["Paris", "French"],
        correctAnswer: ["Paris", "France"],
        attemptNumber: 1,
        hintsUsed: 0,
        timeSpent: 20,
      };

      const feedback = generateFeedback(context);

      expect(feedback.type).toBe("partial");
      expect(feedback.title).toBe("Almost there!");
      expect(feedback.message).toContain("%");
    });

    it("should include encouragement when enabled", () => {
      const options: FeedbackOptions = {
        enableEncouragement: true,
        tone: "encouraging",
      };

      const feedback = generateFeedback(mockContext, options);

      expect(feedback.encouragement).toBeDefined();
      expect(feedback.encouragement).toContain("effort");
    });

    it("should generate next steps", () => {
      const feedback = generateFeedback(mockContext);

      expect(feedback.nextSteps).toBeDefined();
      expect(feedback.nextSteps).toBeTruthy();
    });

    it("should adjust feedback based on attempt number", () => {
      const context1 = { ...mockContext, attemptNumber: 1 };
      const context2 = { ...mockContext, attemptNumber: 2 };
      const context3 = { ...mockContext, attemptNumber: 3 };

      const feedback1 = generateFeedback(context1);
      const feedback2 = generateFeedback(context2);
      const feedback3 = generateFeedback(context3);

      expect(feedback1.message).toContain("another look");
      expect(feedback2.message).toContain("Consider using a hint");
      expect(feedback3.message).toContain("Keep trying");
    });

    it("should adjust title based on hints used", () => {
      const contextNoHints = {
        ...mockContext,
        userAnswer: "Paris",
        hintsUsed: 0,
      };
      const contextWithHints = {
        ...mockContext,
        userAnswer: "Paris",
        hintsUsed: 2,
      };

      const feedbackNoHints = generateFeedback(contextNoHints);
      const feedbackWithHints = generateFeedback(contextWithHints);

      expect(feedbackNoHints.title).toBe("Perfect!");
      expect(feedbackWithHints.title).toBe("Correct!");
    });

    it("should detect spelling mistakes in fill-in-blank", () => {
      const fillInBlankQuestion: ExerciseQuestion = {
        ...mockQuestion,
        type: "fill_in_blank",
        questionData: {
          blanks: ["Paris"],
          acceptableAnswers: [["Paris"]],
        },
      };

      const context: FeedbackContext = {
        question: fillInBlankQuestion,
        userAnswer: ["Pares"],
        correctAnswer: ["Paris"],
        attemptNumber: 1,
        hintsUsed: 0,
        timeSpent: 10,
      };

      const feedback = generateFeedback(context);

      expect(feedback.type).toBe("partial");
      expect(feedback.details).toContain("Spelling error");
    });

    describe("Grammatical Variations", () => {
      it("should handle simple plural forms (word + s)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["cat"],
            acceptableAnswers: [["cat"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["cats"],
          correctAnswer: ["cat"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle -es plural endings (box → boxes)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["box"],
            acceptableAnswers: [["box"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["boxes"],
          correctAnswer: ["box"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle -y to -ies plural endings (city → cities)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["city"],
            acceptableAnswers: [["city"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["cities"],
          correctAnswer: ["city"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle -f/-fe to -ves plural endings (leaf → leaves)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["leaf"],
            acceptableAnswers: [["leaf"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["leaves"],
          correctAnswer: ["leaf"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle -o to -oes plural endings (hero → heroes)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["hero"],
            acceptableAnswers: [["hero"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["heroes"],
          correctAnswer: ["hero"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle irregular plurals (matrix → matrices)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["matrix"],
            acceptableAnswers: [["matrix"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["matrices"],
          correctAnswer: ["matrix"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Grammatical variation");
      });

      it("should handle multiple irregular plurals", () => {
        const testCases = [
          { singular: "child", plural: "children" },
          { singular: "foot", plural: "feet" },
          { singular: "mouse", plural: "mice" },
          { singular: "person", plural: "people" },
          { singular: "index", plural: "indices" },
          { singular: "vertex", plural: "vertices" },
        ];

        testCases.forEach(({ singular, plural }) => {
          const fillInBlankQuestion: ExerciseQuestion = {
            ...mockQuestion,
            type: "fill_in_blank",
            questionData: {
              blanks: [singular],
              acceptableAnswers: [[singular]],
            },
          };

          const context: FeedbackContext = {
            question: fillInBlankQuestion,
            userAnswer: [plural],
            correctAnswer: [singular],
            attemptNumber: 1,
            hintsUsed: 0,
            timeSpent: 10,
          };

          const feedback = generateFeedback(context);

          expect(feedback.type).toBe("partial");
          expect(feedback.details).toContain("Grammatical variation");
        });
      });

      it("should handle verb tense variations (run → running, ran)", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["run"],
            acceptableAnswers: [["run"]],
          },
        };

        const contexts = [
          {
            userAnswer: ["running"],
            expectedType: "partial" as const,
          },
          {
            userAnswer: ["runs"],
            expectedType: "partial" as const,
          },
        ];

        contexts.forEach(({ userAnswer, expectedType }) => {
          const context: FeedbackContext = {
            question: fillInBlankQuestion,
            userAnswer,
            correctAnswer: ["run"],
            attemptNumber: 1,
            hintsUsed: 0,
            timeSpent: 10,
          };

          const feedback = generateFeedback(context);

          expect(feedback.type).toBe(expectedType);
          expect(feedback.details).toContain("Grammatical variation");
        });
      });

      it("should not treat completely different words as grammatical variations", () => {
        const fillInBlankQuestion: ExerciseQuestion = {
          ...mockQuestion,
          type: "fill_in_blank",
          questionData: {
            blanks: ["cat"],
            acceptableAnswers: [["cat"]],
          },
        };

        const context: FeedbackContext = {
          question: fillInBlankQuestion,
          userAnswer: ["dog"],
          correctAnswer: ["cat"],
          attemptNumber: 1,
          hintsUsed: 0,
          timeSpent: 10,
        };

        const feedback = generateFeedback(context);

        expect(feedback.type).toBe("partial");
        expect(feedback.details).toContain("Incorrect");
        expect(feedback.details).not.toContain("Grammatical variation");
      });
    });

    it("should handle sentence builder with word order issues", () => {
      const sentenceQuestion: ExerciseQuestion = {
        ...mockQuestion,
        type: "sentence_builder",
        questionData: {
          words: ["The", "cat", "sat", "on", "the", "mat"],
          correctOrder: ["The", "cat", "sat", "on", "the", "mat"],
        },
      };

      const context: FeedbackContext = {
        question: sentenceQuestion,
        userAnswer: ["The", "cat", "on", "sat", "the", "mat"],
        correctAnswer: ["The", "cat", "sat", "on", "the", "mat"],
        attemptNumber: 1,
        hintsUsed: 0,
        timeSpent: 15,
      };

      const feedback = generateFeedback(context);

      expect(feedback.type).toBe("partial");
      expect(feedback.details).toContain("Word order");
    });

    it("should handle drag and drop with misplacements", () => {
      const dragDropQuestion: ExerciseQuestion = {
        ...mockQuestion,
        type: "drag_and_drop",
        questionData: {
          items: ["Apple", "Carrot", "Banana"],
          targets: ["Fruits", "Vegetables"],
          correctMapping: {
            Apple: "Fruits",
            Carrot: "Vegetables",
            Banana: "Fruits",
          },
        },
      };

      const context: FeedbackContext = {
        question: dragDropQuestion,
        userAnswer: {
          Apple: "Fruits",
          Carrot: "Fruits",
          Banana: "Vegetables",
        },
        correctAnswer: {
          Apple: "Fruits",
          Carrot: "Vegetables",
          Banana: "Fruits",
        },
        attemptNumber: 1,
        hintsUsed: 0,
        timeSpent: 20,
      };

      const feedback = generateFeedback(context);

      expect(feedback.type).toBe("partial");
      expect(feedback.details).toContain("Carrot");
      expect(feedback.details).toContain("Banana");
    });
  });

  describe("generateHintSequence", () => {
    it("should generate hint sequence from question hints", () => {
      const sequence = generateHintSequence(mockQuestion);

      expect(sequence.hints).toHaveLength(4); // 2 provided + 2 generated
      expect(sequence.maxHints).toBe(3);
      expect(sequence.currentIndex).toBe(-1);
      expect(sequence.adaptiveMode).toBe(true);
    });

    it("should generate type-specific hints for multiple choice", () => {
      const sequence = generateHintSequence(mockQuestion);
      const strategicHint = sequence.hints.find(
        (h) => h.category === "strategy"
      );

      expect(strategicHint).toBeDefined();
      expect(strategicHint?.content).toContain("eliminating");
    });

    it("should generate type-specific hints for fill-in-blank", () => {
      const fillInQuestion: ExerciseQuestion = {
        ...mockQuestion,
        type: "fill_in_blank",
        hints: [],
      };

      const sequence = generateHintSequence(fillInQuestion);
      const hints = sequence.hints.filter(
        (h) => h.category === "strategy" || h.category === "grammar"
      );

      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.content.includes("context"))).toBe(true);
    });

    it("should respect max hints option", () => {
      const options: FeedbackOptions = {
        enableAdaptive: false,
      };

      const sequence = generateHintSequence(mockQuestion, options);

      expect(sequence.maxHints).toBeLessThanOrEqual(3);
    });

    it("should sort hints by reveal percentage", () => {
      const sequence = generateHintSequence(mockQuestion);

      for (let i = 1; i < sequence.hints.length; i++) {
        expect(sequence.hints[i].revealPercentage).toBeGreaterThanOrEqual(
          sequence.hints[i - 1].revealPercentage
        );
      }
    });
  });

  describe("getNextHint", () => {
    let sequence: HintSequence;

    beforeEach(() => {
      sequence = generateHintSequence(mockQuestion);
    });

    it("should return first hint on first call", () => {
      const hint = getNextHint(sequence);

      expect(hint).toBeDefined();
      expect(sequence.currentIndex).toBe(0);
    });

    it("should return sequential hints", () => {
      const hint1 = getNextHint(sequence);
      const hint2 = getNextHint(sequence);

      expect(hint1).not.toBe(hint2);
      expect(sequence.currentIndex).toBe(1);
    });

    it("should return null when max hints reached", () => {
      // Get all available hints
      for (let i = 0; i < sequence.maxHints; i++) {
        getNextHint(sequence);
      }

      const extraHint = getNextHint(sequence);
      expect(extraHint).toBeNull();
    });

    it("should use adaptive hint selection when context provided", () => {
      const context: FeedbackContext = {
        ...mockContext,
        userProfile: {
          userId: "user1",
          strengthAreas: [],
          weaknessAreas: ["strategy"],
          preferredHintStyle: "detailed",
          averageResponseTime: 20,
          successRate: 0.6,
          commonMistakes: [
            {
              type: "strategy",
              frequency: 3,
              lastOccurrence: new Date(),
            },
          ],
        },
      };

      const hint = getNextHint(sequence, context);

      expect(hint).toBeDefined();
      // Should prioritize strategy hints when that's a weakness
      if (hint?.category) {
        expect(["strategy", "provided"]).toContain(hint.category);
      }
    });

    it("should handle empty hint sequence", () => {
      const emptySequence: HintSequence = {
        hints: [],
        currentIndex: -1,
        maxHints: 0,
        adaptiveMode: false,
      };

      const hint = getNextHint(emptySequence);
      expect(hint).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined user answer", () => {
      const context: FeedbackContext = {
        ...mockContext,
        userAnswer: "",
      };

      const feedback = generateFeedback(context);
      expect(feedback).toBeDefined();
      expect(feedback.type).toBe("incorrect");
    });

    it("should handle questions without hints", () => {
      const questionNoHints: ExerciseQuestion = {
        ...mockQuestion,
        hints: undefined,
      };

      const sequence = generateHintSequence(questionNoHints);
      expect(sequence.hints.length).toBeGreaterThan(0); // Should have generated hints
    });

    it("should handle very long user answers", () => {
      const longAnswer = "a".repeat(1000);
      const context: FeedbackContext = {
        ...mockContext,
        userAnswer: longAnswer,
      };

      const feedback = generateFeedback(context);
      expect(feedback).toBeDefined();
    });

    it("should handle special characters in answers", () => {
      const specialAnswer = "It's Paris!!! <3";
      const context: FeedbackContext = {
        ...mockContext,
        userAnswer: specialAnswer,
        correctAnswer: "It's Paris!!! <3",
      };

      const feedback = generateFeedback(context);
      expect(feedback).toBeDefined();
    });
  });
});
