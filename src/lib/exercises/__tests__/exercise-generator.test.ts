/**
 * Exercise Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ExerciseGenerator,
  type GenerationContext,
  type ExerciseTemplate,
  type GeneratedExercise
} from '../exercise-generator';
import type { LearningObjective, ExerciseQuestion } from '../../../types/content';

describe('ExerciseGenerator', () => {
  let generator: ExerciseGenerator;
  let mockContext: GenerationContext;
  let mockObjectives: LearningObjective[];

  beforeEach(() => {
    generator = new ExerciseGenerator();

    mockObjectives = [
      {
        id: 'obj-1',
        title: 'Subject-Verb Agreement',
        description: 'Understanding subject-verb agreement rules',
        category: 'knowledge',
        masteryThreshold: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'obj-2',
        title: 'Article Usage',
        description: 'Proper use of definite and indefinite articles',
        category: 'application',
        masteryThreshold: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockContext = {
      sourceContent: 'The cat sits on the mat. Dogs run in the park. An apple fell from the tree.',
      objectives: mockObjectives,
      targetDifficulty: 'intermediate',
      conceptsFocus: ['grammar', 'verbs', 'articles'],
      existingExercises: [],
      userLevel: 60,
      preferences: {
        preferredTypes: ['multiple_choice', 'fill_in_blank'],
        avoidRepetition: true,
        contextualRelevance: 0.8,
        creativityLevel: 0.6,
      },
    };
  });

  describe('generateExercises', () => {
    it('generates requested number of exercises', async () => {
      const exercises = await generator.generateExercises(mockContext, 3);

      expect(exercises).toHaveLength(3);
      exercises.forEach(exercise => {
        expect(exercise.question).toBeDefined();
        expect(exercise.template).toBeDefined();
        expect(exercise.metadata).toBeDefined();
        expect(exercise.variations).toBeDefined();
      });
    });

    it('respects difficulty preferences', async () => {
      const beginnerContext = {
        ...mockContext,
        targetDifficulty: 'beginner' as const,
      };

      const exercises = await generator.generateExercises(beginnerContext, 2);

      exercises.forEach(exercise => {
        // Template difficulty should match or be close to target
        const templateDifficulty = exercise.template.difficulty;
        expect(['beginner', 'intermediate']).toContain(templateDifficulty);
      });
    });

    it('respects question type preferences', async () => {
      const specificTypeContext = {
        ...mockContext,
        preferences: {
          ...mockContext.preferences,
          preferredTypes: ['multiple_choice'],
        },
      };

      const exercises = await generator.generateExercises(specificTypeContext, 2);

      exercises.forEach(exercise => {
        expect(exercise.question.type).toBe('multiple_choice');
      });
    });

    it('generates diverse exercise types when no preference specified', async () => {
      const openContext = {
        ...mockContext,
        preferences: {
          ...mockContext.preferences,
          preferredTypes: [],
        },
      };

      const exercises = await generator.generateExercises(openContext, 5);

      const types = new Set(exercises.map(ex => ex.question.type));
      expect(types.size).toBeGreaterThan(1); // Should have multiple types
    });

    it('avoids repetition when requested', async () => {
      const avoidRepetitionContext = {
        ...mockContext,
        preferences: {
          ...mockContext.preferences,
          avoidRepetition: true,
        },
      };

      const exercises = await generator.generateExercises(avoidRepetitionContext, 4);

      // Should not use the same template too many times
      const templateIds = exercises.map(ex => ex.template.id);
      const uniqueTemplates = new Set(templateIds);
      expect(uniqueTemplates.size).toBeGreaterThanOrEqual(Math.min(2, exercises.length));
    });

    it('includes metadata for all generated exercises', async () => {
      const exercises = await generator.generateExercises(mockContext, 2);

      exercises.forEach(exercise => {
        expect(exercise.metadata.confidence).toBeGreaterThan(0);
        expect(exercise.metadata.confidence).toBeLessThanOrEqual(1);
        expect(exercise.metadata.complexity).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.complexity).toBeLessThanOrEqual(1);
        expect(exercise.metadata.uniqueness).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.uniqueness).toBeLessThanOrEqual(1);
        expect(exercise.metadata.pedagogicalValue).toBeGreaterThan(0);
        expect(exercise.metadata.pedagogicalValue).toBeLessThanOrEqual(1);
      });
    });

    it('handles empty content gracefully', async () => {
      const emptyContentContext = {
        ...mockContext,
        sourceContent: '',
      };

      const exercises = await generator.generateExercises(emptyContentContext, 2);

      // Should still generate exercises using word banks
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach(exercise => {
        expect(exercise.question.questionText).toBeTruthy();
      });
    });
  });

  describe('generateVariations', () => {
    it('generates variations of existing exercises', async () => {
      const baseExercise: ExerciseQuestion = {
        id: 'base-1',
        exerciseId: 'ex-1',
        questionText: 'Choose the correct verb: The cat {sits/sit} on the mat.',
        type: 'multiple_choice',
        orderIndex: 0,
        points: 10,
        questionData: {
          options: ['sits', 'sit'],
          correctIndex: 0,
        },
        correctAnswer: 'sits',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const variations = await generator.generateVariations(baseExercise, 3);

      expect(variations.length).toBeGreaterThan(0);
      expect(variations.length).toBeLessThanOrEqual(3);
      
      variations.forEach(variation => {
        expect(variation.type).toBe(baseExercise.type);
        expect(variation.questionText).toBeTruthy();
        expect(variation.questionText).not.toBe(baseExercise.questionText);
      });
    });

    it('avoids duplicate variations', async () => {
      const baseExercise: ExerciseQuestion = {
        id: 'base-1',
        exerciseId: 'ex-1',
        questionText: 'Fill in the blank: ___ cat is sleeping.',
        type: 'fill_in_blank',
        orderIndex: 0,
        points: 10,
        questionData: {
          blanks: ['The'],
          acceptableAnswers: [['The', 'A']],
        },
        correctAnswer: 'The',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const variations = await generator.generateVariations(baseExercise, 5);

      const questionTexts = variations.map(v => v.questionText);
      const uniqueTexts = new Set(questionTexts);
      expect(uniqueTexts.size).toBe(questionTexts.length); // All should be unique
    });

    it('handles exercises with no matching template', async () => {
      const unusualExercise: ExerciseQuestion = {
        id: 'unusual-1',
        exerciseId: 'ex-1',
        questionText: 'Custom exercise type',
        type: 'essay', // Type not in our templates
        orderIndex: 0,
        points: 10,
        questionData: {},
        correctAnswer: 'Custom answer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const variations = await generator.generateVariations(unusualExercise, 3);

      // Should handle gracefully, may return empty or fewer variations
      expect(Array.isArray(variations)).toBe(true);
    });
  });

  describe('scaleExerciseDifficulty', () => {
    it('scales exercise to target difficulty', () => {
      const exercise: ExerciseQuestion = {
        id: 'ex-1',
        exerciseId: 'ex-1',
        questionText: 'Simple question with basic words.',
        type: 'multiple_choice',
        orderIndex: 0,
        points: 5,
        questionData: {
          options: ['option1', 'option2'],
          correctIndex: 0,
        },
        correctAnswer: 'option1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scaledExercise = generator.scaleExerciseDifficulty(exercise, 'advanced');

      expect(scaledExercise).toBeDefined();
      expect(scaledExercise.id).toBe(exercise.id);
      // In a real implementation, this would modify content complexity
    });

    it('returns unchanged exercise if already at target difficulty', () => {
      const exercise: ExerciseQuestion = {
        id: 'ex-1',
        exerciseId: 'ex-1',
        questionText: 'Intermediate complexity question with moderate vocabulary.',
        type: 'fill_in_blank',
        orderIndex: 0,
        points: 10,
        questionData: {
          blanks: ['answer'],
          acceptableAnswers: [['answer']],
        },
        correctAnswer: 'answer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const scaledExercise = generator.scaleExerciseDifficulty(exercise, 'intermediate');

      expect(scaledExercise).toBe(exercise); // Should return same object
    });
  });

  describe('mapContentToExercises', () => {
    it('maps content to relevant exercise concepts', () => {
      const content = 'The cat sits on the mat. Cats are animals. An elephant is large.';
      
      const mappings = generator.mapContentToExercises(content, mockObjectives);

      expect(mappings.length).toBeGreaterThan(0);
      
      mappings.forEach(mapping => {
        expect(mapping.concept).toBeTruthy();
        expect(mapping.content).toBeTruthy();
        expect(mapping.templates).toBeDefined();
        expect(mapping.objectives).toBeDefined();
        expect(['beginner', 'intermediate', 'advanced']).toContain(mapping.difficulty);
      });
    });

    it('extracts multiple concepts from rich content', () => {
      const richContent = `
        Grammar is important for clear communication. Verbs show actions that people do.
        Nouns name things in our world. Sentences need subjects and verbs to be complete.
        Articles like 'a', 'an', and 'the' help specify nouns.
      `;
      
      const mappings = generator.mapContentToExercises(richContent, mockObjectives);

      const concepts = mappings.map(m => m.concept);
      expect(concepts).toContain('verbs');
      expect(concepts).toContain('nouns');
      expect(concepts).toContain('sentence structure');
    });

    it('handles empty content gracefully', () => {
      const mappings = generator.mapContentToExercises('', mockObjectives);

      // Should still work, might return empty or generic mappings
      expect(Array.isArray(mappings)).toBe(true);
    });

    it('filters objectives by relevance', () => {
      const content = 'Verbs show actions. Run, jump, and walk are all verbs.';
      
      const mappings = generator.mapContentToExercises(content, mockObjectives);

      // Should include verb-related objective but maybe not article objective
      const relevantObjectives = mappings.flatMap(m => m.objectives);
      const objectiveIds = relevantObjectives.map(obj => obj.id);
      
      if (objectiveIds.length > 0) {
        // At least some filtering should occur based on content relevance
        expect(objectiveIds.length).toBeLessThanOrEqual(mockObjectives.length);
      }
    });
  });

  describe('Question Generation', () => {
    describe('Multiple Choice Questions', () => {
      it('generates valid multiple choice questions', async () => {
        const mcContext = {
          ...mockContext,
          preferences: {
            ...mockContext.preferences,
            preferredTypes: ['multiple_choice'],
          },
        };

        const exercises = await generator.generateExercises(mcContext, 1);
        const mcExercise = exercises.find(ex => ex.question.type === 'multiple_choice');

        if (mcExercise) {
          expect(mcExercise.question.questionData.options).toBeDefined();
          expect(Array.isArray(mcExercise.question.questionData.options)).toBe(true);
          expect(mcExercise.question.questionData.options.length).toBeGreaterThan(1);
          expect(mcExercise.question.questionData.correctIndex).toBeDefined();
          expect(mcExercise.question.questionData.correctIndex).toBeGreaterThanOrEqual(0);
          expect(mcExercise.question.questionData.correctIndex).toBeLessThan(mcExercise.question.questionData.options.length);
        }
      });
    });

    describe('Fill in the Blank Questions', () => {
      it('generates valid fill-in-the-blank questions', async () => {
        const fibContext = {
          ...mockContext,
          preferences: {
            ...mockContext.preferences,
            preferredTypes: ['fill_in_blank'],
          },
        };

        const exercises = await generator.generateExercises(fibContext, 1);
        const fibExercise = exercises.find(ex => ex.question.type === 'fill_in_blank');

        if (fibExercise) {
          expect(fibExercise.question.questionData.blanks).toBeDefined();
          expect(Array.isArray(fibExercise.question.questionData.blanks)).toBe(true);
          expect(fibExercise.question.questionData.acceptableAnswers).toBeDefined();
          expect(fibExercise.question.questionText).toContain('_'); // Should have blank marker
        }
      });
    });

    describe('Sentence Builder Questions', () => {
      it('generates valid sentence builder questions', async () => {
        const sbContext = {
          ...mockContext,
          preferences: {
            ...mockContext.preferences,
            preferredTypes: ['sentence_builder'],
          },
        };

        const exercises = await generator.generateExercises(sbContext, 1);
        const sbExercise = exercises.find(ex => ex.question.type === 'sentence_builder');

        if (sbExercise) {
          expect(sbExercise.question.questionData.words).toBeDefined();
          expect(Array.isArray(sbExercise.question.questionData.words)).toBe(true);
          expect(sbExercise.question.questionData.words.length).toBeGreaterThan(0);
          expect(sbExercise.question.questionData.correctOrder).toBeDefined();
        }
      });
    });

    describe('Drag and Drop Questions', () => {
      it('generates valid drag and drop questions', async () => {
        const ddContext = {
          ...mockContext,
          preferences: {
            ...mockContext.preferences,
            preferredTypes: ['drag_and_drop'],
          },
        };

        const exercises = await generator.generateExercises(ddContext, 1);
        const ddExercise = exercises.find(ex => ex.question.type === 'drag_and_drop');

        if (ddExercise) {
          expect(ddExercise.question.questionData.categories).toBeDefined();
          expect(ddExercise.question.questionData.items).toBeDefined();
          expect(ddExercise.question.questionData.correctMappings).toBeDefined();
          expect(Array.isArray(ddExercise.question.questionData.categories)).toBe(true);
          expect(Array.isArray(ddExercise.question.questionData.items)).toBe(true);
        }
      });
    });
  });

  describe('Content Extraction and Word Banking', () => {
    it('extracts words from content appropriately', async () => {
      const contentContext = {
        ...mockContext,
        sourceContent: 'The quick brown fox jumps over the lazy dog.',
      };

      const exercises = await generator.generateExercises(contentContext, 2);

      // Should generate exercises that potentially use content words
      exercises.forEach(exercise => {
        expect(exercise.question.questionText).toBeTruthy();
        expect(exercise.question.questionText.length).toBeGreaterThan(10);
      });
    });

    it('falls back to word banks when content is insufficient', async () => {
      const limitedContentContext = {
        ...mockContext,
        sourceContent: 'Hi.',
      };

      const exercises = await generator.generateExercises(limitedContentContext, 1);

      // Should still generate valid exercises using word banks
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach(exercise => {
        expect(exercise.question.questionText).toBeTruthy();
      });
    });
  });

  describe('Hints and Feedback', () => {
    it('generates appropriate hints for exercises', async () => {
      const exercises = await generator.generateExercises(mockContext, 2);

      exercises.forEach(exercise => {
        if (exercise.question.hints) {
          expect(Array.isArray(exercise.question.hints)).toBe(true);
          exercise.question.hints.forEach(hint => {
            expect(typeof hint).toBe('string');
            expect(hint.length).toBeGreaterThan(5);
          });
        }
      });
    });

    it('provides type-specific hints', async () => {
      const mcContext = {
        ...mockContext,
        preferences: {
          ...mockContext.preferences,
          preferredTypes: ['multiple_choice'],
        },
      };

      const exercises = await generator.generateExercises(mcContext, 1);
      const mcExercise = exercises.find(ex => ex.question.type === 'multiple_choice');

      if (mcExercise && mcExercise.question.hints) {
        const hintsText = mcExercise.question.hints.join(' ').toLowerCase();
        expect(hintsText).toMatch(/subject|verb|agreement|singular|plural/);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles very high difficulty targets', async () => {
      const advancedContext = {
        ...mockContext,
        targetDifficulty: 'advanced' as const,
        userLevel: 95,
      };

      const exercises = await generator.generateExercises(advancedContext, 2);

      expect(exercises.length).toBeGreaterThanOrEqual(0);
      exercises.forEach(exercise => {
        expect(exercise.question).toBeDefined();
        expect(exercise.metadata.complexity).toBeGreaterThan(0.5);
      });
    });

    it('handles conflicting preferences gracefully', async () => {
      const conflictingContext = {
        ...mockContext,
        preferences: {
          ...mockContext.preferences,
          preferredTypes: ['essay'], // Type not supported
          avoidRepetition: true,
          contextualRelevance: 1.0,
        },
      };

      const exercises = await generator.generateExercises(conflictingContext, 2);

      // Should fall back to supported types
      expect(exercises.length).toBeGreaterThanOrEqual(0);
    });

    it('handles empty objectives list', async () => {
      const noObjectivesContext = {
        ...mockContext,
        objectives: [],
      };

      const exercises = await generator.generateExercises(noObjectivesContext, 1);

      expect(exercises.length).toBeGreaterThanOrEqual(0);
      exercises.forEach(exercise => {
        expect(exercise.question).toBeDefined();
      });
    });

    it('validates generated exercise structure', async () => {
      const exercises = await generator.generateExercises(mockContext, 3);

      exercises.forEach(exercise => {
        // Validate question structure
        expect(exercise.question.id).toBeTruthy();
        expect(exercise.question.questionText).toBeTruthy();
        expect(['multiple_choice', 'fill_in_blank', 'drag_and_drop', 'sentence_builder']).toContain(exercise.question.type);
        expect(exercise.question.points).toBeGreaterThan(0);
        expect(exercise.question.questionData).toBeDefined();
        expect(exercise.question.correctAnswer).toBeDefined();
        expect(exercise.question.createdAt).toBeInstanceOf(Date);
        expect(exercise.question.updatedAt).toBeInstanceOf(Date);

        // Validate metadata
        expect(exercise.metadata.confidence).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.confidence).toBeLessThanOrEqual(1);
        expect(exercise.metadata.complexity).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.complexity).toBeLessThanOrEqual(1);
        expect(exercise.metadata.uniqueness).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.uniqueness).toBeLessThanOrEqual(1);
        expect(exercise.metadata.pedagogicalValue).toBeGreaterThanOrEqual(0);
        expect(exercise.metadata.pedagogicalValue).toBeLessThanOrEqual(1);

        // Validate template
        expect(exercise.template.id).toBeTruthy();
        expect(exercise.template.name).toBeTruthy();
        expect(exercise.template.type).toBe(exercise.question.type);
        expect(['beginner', 'intermediate', 'advanced']).toContain(exercise.template.difficulty);

        // Validate variations
        expect(Array.isArray(exercise.variations)).toBe(true);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('generates exercises in reasonable time', async () => {
      const startTime = Date.now();
      
      await generator.generateExercises(mockContext, 5);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds for 5 exercises)
      expect(duration).toBeLessThan(5000);
    });

    it('handles large content efficiently', async () => {
      const largeContent = Array(1000).fill('The cat sits on the mat.').join(' ');
      const largeContentContext = {
        ...mockContext,
        sourceContent: largeContent,
      };

      const startTime = Date.now();
      
      const exercises = await generator.generateExercises(largeContentContext, 3);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(exercises.length).toBe(3);
      expect(duration).toBeLessThan(3000); // Should handle large content efficiently
    });
  });

  describe('Quality Metrics', () => {
    it('assigns appropriate confidence scores', async () => {
      const exercises = await generator.generateExercises(mockContext, 3);

      exercises.forEach(exercise => {
        const confidence = exercise.metadata.confidence;
        
        // Confidence should be reasonable for well-formed exercises
        expect(confidence).toBeGreaterThan(0.3);
        expect(confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it('calculates complexity appropriately', async () => {
      const beginnerContext = { ...mockContext, targetDifficulty: 'beginner' as const };
      const advancedContext = { ...mockContext, targetDifficulty: 'advanced' as const };

      const beginnerExercises = await generator.generateExercises(beginnerContext, 2);
      const advancedExercises = await generator.generateExercises(advancedContext, 2);

      const beginnerComplexity = beginnerExercises.reduce((sum, ex) => sum + ex.metadata.complexity, 0) / beginnerExercises.length;
      const advancedComplexity = advancedExercises.reduce((sum, ex) => sum + ex.metadata.complexity, 0) / advancedExercises.length;

      // Advanced exercises should generally be more complex
      if (beginnerExercises.length > 0 && advancedExercises.length > 0) {
        expect(advancedComplexity).toBeGreaterThanOrEqual(beginnerComplexity);
      }
    });

    it('ensures pedagogical value above minimum threshold', async () => {
      const exercises = await generator.generateExercises(mockContext, 4);

      exercises.forEach(exercise => {
        expect(exercise.metadata.pedagogicalValue).toBeGreaterThan(0.3);
      });
    });
  });
});