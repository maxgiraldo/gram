/**
 * Tests for content relationships and dependencies
 */

import { describe, test, expect } from 'vitest';
import {
  buildContentRelationshipMap,
  arePrerequisitesMet,
  isUnitComplete,
  getNextAvailableContent,
  getBlockedContent,
  generateLearningPath,
  getRecommendedContent,
  analyzeProgressAcrossCurriculum,
} from '../relationships';
import {
  type Unit,
  type Lesson,
  type LearningObjective,
  type Exercise,
  type Assessment,
  type LearnerProgress,
  type ObjectiveProgress,
} from '../../../types/content';

// Test data setup
const testUnits: Unit[] = [
  {
    id: 'unit-1',
    title: 'Basic Grammar',
    description: 'Introduction to grammar',
    orderIndex: 1,
    isPublished: true,
    masteryThreshold: 0.9,
    lessons: [],
    objectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'unit-2',
    title: 'Advanced Grammar',
    description: 'Advanced grammar concepts',
    orderIndex: 2,
    isPublished: true,
    masteryThreshold: 0.9,
    prerequisiteUnits: ['unit-1'],
    lessons: [],
    objectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const testLessons: Lesson[] = [
  {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Nouns',
    description: 'Learn about nouns',
    content: 'Lesson content',
    orderIndex: 1,
    isPublished: true,
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    difficulty: 'beginner',
    objectives: [],
    exercises: [],
    assessments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lesson-2',
    unitId: 'unit-1',
    title: 'Verbs',
    description: 'Learn about verbs',
    content: 'Lesson content',
    orderIndex: 2,
    isPublished: true,
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    difficulty: 'beginner',
    objectives: [],
    exercises: [],
    assessments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lesson-3',
    unitId: 'unit-2',
    title: 'Complex Sentences',
    description: 'Advanced sentence structure',
    content: 'Lesson content',
    orderIndex: 1,
    isPublished: true,
    masteryThreshold: 0.8,
    estimatedMinutes: 45,
    difficulty: 'advanced',
    objectives: [],
    exercises: [],
    assessments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const testObjectives: LearningObjective[] = [
  {
    id: 'obj-1',
    lessonId: 'lesson-1',
    title: 'Identify Nouns',
    description: 'Students can identify nouns',
    category: 'knowledge',
    masteryThreshold: 0.8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const testExercises: Exercise[] = [
  {
    id: 'exercise-1',
    lessonId: 'lesson-1',
    title: 'Noun Practice',
    type: 'practice',
    orderIndex: 1,
    timeLimit: 300,
    maxAttempts: 3,
    difficulty: 'beginner',
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'exercise-2',
    lessonId: 'lesson-1',
    title: 'Noun Enrichment',
    type: 'enrichment',
    orderIndex: 2,
    maxAttempts: 1,
    difficulty: 'intermediate',
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const testAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    lessonId: 'lesson-1',
    title: 'Noun Quiz',
    type: 'summative',
    maxAttempts: 2,
    masteryThreshold: 0.8,
    questions: [],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Content Relationship Map Building', () => {
  test('builds complete relationship map', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    expect(map.nodes.size).toBe(8); // 2 units + 3 lessons + 1 objective + 2 exercises + 1 assessment
    expect(map.units.size).toBe(2);
    expect(map.lessons.size).toBe(3);
    expect(map.objectives.size).toBe(1);
    expect(map.exercises.size).toBe(2);
    expect(map.assessments.size).toBe(1);
  });

  test('creates correct dependencies', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    // Unit 2 depends on Unit 1
    const unit2Node = map.nodes.get('unit-2');
    expect(unit2Node?.dependencies).toEqual(['unit-1']);

    // Lesson depends on its unit
    const lesson1Node = map.nodes.get('lesson-1');
    expect(lesson1Node?.dependencies).toEqual(['unit-1']);

    // Exercise depends on its lesson
    const exercise1Node = map.nodes.get('exercise-1');
    expect(exercise1Node?.dependencies).toEqual(['lesson-1']);

    // Objective depends on its lesson
    const obj1Node = map.nodes.get('obj-1');
    expect(obj1Node?.dependencies).toEqual(['lesson-1']);
  });

  test('creates correct dependents', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    // Unit 1 has Unit 2 and lessons as dependents
    const unit1Node = map.nodes.get('unit-1');
    expect(unit1Node?.dependents).toContain('unit-2');
    expect(unit1Node?.dependents).toContain('lesson-1');
    expect(unit1Node?.dependents).toContain('lesson-2');

    // Lesson 1 has exercises, objectives, and assessments as dependents
    const lesson1Node = map.nodes.get('lesson-1');
    expect(lesson1Node?.dependents).toContain('exercise-1');
    expect(lesson1Node?.dependents).toContain('exercise-2');
    expect(lesson1Node?.dependents).toContain('obj-1');
    expect(lesson1Node?.dependents).toContain('assessment-1');
  });
});

describe('Prerequisite Checking', () => {
  test('checks simple lesson prerequisites', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [];
    const objectiveProgress: ObjectiveProgress[] = [];

    // Lesson 1 should be available (no prerequisites)
    expect(arePrerequisitesMet('lesson-1', map, learnerProgress, objectiveProgress)).toBe(true);

    // Unit 2 lesson should not be available (unit 1 not complete)
    expect(arePrerequisitesMet('lesson-3', map, learnerProgress, objectiveProgress)).toBe(false);
  });

  test('checks prerequisites with progress', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'mastered',
        currentScore: 90,
        bestScore: 90,
        masteryAchieved: true,
        masteryDate: new Date(),
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'progress-2',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: 'mastered',
        currentScore: 85,
        bestScore: 85,
        masteryAchieved: true,
        masteryDate: new Date(),
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Now Unit 2 lesson should be available (Unit 1 complete)
    expect(arePrerequisitesMet('lesson-3', map, learnerProgress, [])).toBe(true);
  });

  test('checks unit completion', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const partialProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'mastered',
        currentScore: 90,
        bestScore: 90,
        masteryAchieved: true,
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // lesson-2 not mastered
    ];

    // Unit 1 not complete (only 1 of 2 lessons mastered = 50% < 90%)
    expect(isUnitComplete('unit-1', map, partialProgress)).toBe(false);

    const completeProgress: LearnerProgress[] = [
      ...partialProgress,
      {
        id: 'progress-2',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: 'mastered',
        currentScore: 95,
        bestScore: 95,
        masteryAchieved: true,
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Unit 1 complete (2 of 2 lessons mastered = 100% >= 90%)
    expect(isUnitComplete('unit-1', map, completeProgress)).toBe(true);
  });
});

describe('Available Content Detection', () => {
  test('gets next available content', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'in_progress',
        currentScore: 75,
        bestScore: 75,
        masteryAchieved: false,
        totalTimeSpent: 900,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const available = getNextAvailableContent(map, learnerProgress, []);

    // Should include lesson-1 (in progress) and lesson-2 (available)
    expect(available.length).toBeGreaterThan(0);
    
    const lessonTitles = available
      .filter(item => item.contentType === 'lesson')
      .map(item => item.title);
    
    expect(lessonTitles).toContain('Nouns');
    expect(lessonTitles).toContain('Verbs');
    
    // Should not include lesson-3 (prerequisites not met)
    expect(lessonTitles).not.toContain('Complex Sentences');
  });

  test('gets blocked content', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [];

    const blocked = getBlockedContent(map, learnerProgress, []);

    // lesson-3 should be blocked (unit-2 prerequisites not met)
    const blockedTitles = blocked.map(item => item.title);
    expect(blockedTitles).toContain('Complex Sentences');
  });
});

describe('Learning Path Generation', () => {
  test('generates complete learning path', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [];

    const path = generateLearningPath(map, learnerProgress, [], 'unit-1');

    // Should include lessons, exercises, and assessments for unit-1
    expect(path.length).toBeGreaterThan(0);

    const contentTypes = path.map(item => item.contentType);
    expect(contentTypes).toContain('lesson');
    expect(contentTypes).toContain('exercise');
    expect(contentTypes).toContain('assessment');

    // Should be in correct order (lessons first, then exercises)
    const lessonIndices = path
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.contentType === 'lesson')
      .map(({ index }) => index);

    const exerciseIndices = path
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.contentType === 'exercise')
      .map(({ index }) => index);

    // Exercises should come after their corresponding lessons
    expect(Math.min(...exerciseIndices)).toBeGreaterThan(Math.min(...lessonIndices));
  });

  test('generates path with progress tracking', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'mastered',
        currentScore: 90,
        bestScore: 90,
        masteryAchieved: true,
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const path = generateLearningPath(map, learnerProgress, [], 'unit-1');

    // lesson-1 should show as mastered
    const lesson1 = path.find(item => item.contentId === 'lesson-1');
    expect(lesson1?.progress).toBe('mastered');

    // lesson-2 should show as not started
    const lesson2 = path.find(item => item.contentId === 'lesson-2');
    expect(lesson2?.progress).toBe('not_started');
  });
});

describe('Content Recommendations', () => {
  test('gets remediation recommendations', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'completed',
        currentScore: 60,
        bestScore: 60,
        masteryAchieved: false,
        totalTimeSpent: 1800,
        sessionsCount: 2,
        lastAccessedAt: new Date(),
        needsRemediation: true,
        eligibleForEnrichment: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const recommendations = getRecommendedContent(map, learnerProgress, []);

    expect(recommendations.remediation.length).toBeGreaterThan(0);
    expect(recommendations.remediation[0].title).toContain('Review:');
  });

  test('gets enrichment recommendations', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'mastered',
        currentScore: 95,
        bestScore: 95,
        masteryAchieved: true,
        totalTimeSpent: 1200,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const recommendations = getRecommendedContent(map, learnerProgress, []);

    expect(recommendations.enrichment.length).toBeGreaterThan(0);
    
    // Should include enrichment exercises
    const enrichmentTitles = recommendations.enrichment.map(item => item.title);
    expect(enrichmentTitles).toContain('Noun Enrichment');
  });
});

describe('Progress Analysis', () => {
  test('analyzes overall curriculum progress', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const learnerProgress: LearnerProgress[] = [
      {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'mastered',
        currentScore: 90,
        bestScore: 90,
        masteryAchieved: true,
        totalTimeSpent: 1800,
        sessionsCount: 1,
        lastAccessedAt: new Date(),
        needsRemediation: false,
        eligibleForEnrichment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const objectiveProgress: ObjectiveProgress[] = [
      {
        id: 'obj-progress-1',
        userId: 'user-1',
        objectiveId: 'obj-1',
        currentScore: 85,
        bestScore: 85,
        masteryAchieved: true,
        totalAttempts: 3,
        correctAttempts: 2,
        lastAttemptAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const analysis = analyzeProgressAcrossCurriculum(map, learnerProgress, objectiveProgress);

    expect(analysis.totalLessons).toBe(3);
    expect(analysis.completedLessons).toBe(1);
    expect(analysis.overallProgress).toBeCloseTo(33.33, 2); // 1/3 lessons

    expect(analysis.totalObjectives).toBe(1);
    expect(analysis.masteredObjectives).toBe(1);

    expect(analysis.unitProgress).toHaveLength(2);
    
    // Unit 1 should have some progress (1 of 2 lessons)
    const unit1Progress = analysis.unitProgress.find(up => up.unitId === 'unit-1');
    expect(unit1Progress?.progress).toBe(50); // 1 of 2 lessons

    // Unit 2 should have no progress
    const unit2Progress = analysis.unitProgress.find(up => up.unitId === 'unit-2');
    expect(unit2Progress?.progress).toBe(0);
  });

  test('handles empty progress correctly', () => {
    const map = buildContentRelationshipMap(
      testUnits,
      testLessons,
      testObjectives,
      testExercises,
      testAssessments
    );

    const analysis = analyzeProgressAcrossCurriculum(map, [], []);

    expect(analysis.overallProgress).toBe(0);
    expect(analysis.completedLessons).toBe(0);
    expect(analysis.masteredObjectives).toBe(0);

    analysis.unitProgress.forEach(up => {
      expect(up.progress).toBe(0);
    });
  });
});

describe('Edge Cases', () => {
  test('handles content without relationships', () => {
    const isolatedLesson: Lesson = {
      id: 'isolated-lesson',
      unitId: 'nonexistent-unit',
      title: 'Isolated Lesson',
      description: 'Lesson without unit',
      content: 'Content',
      orderIndex: 1,
      isPublished: true,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
      objectives: [],
      exercises: [],
      assessments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const map = buildContentRelationshipMap([], [isolatedLesson], [], [], []);

    expect(arePrerequisitesMet('isolated-lesson', map, [], [])).toBe(false);
  });

  test('handles circular dependencies gracefully', () => {
    // This shouldn't happen in practice, but test robustness
    const circularUnits: Unit[] = [
      {
        id: 'unit-a',
        title: 'Unit A',
        description: 'First unit',
        orderIndex: 1,
        isPublished: true,
        masteryThreshold: 0.9,
        prerequisiteUnits: ['unit-b'], // Circular reference
        lessons: [],
        objectives: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'unit-b',
        title: 'Unit B',
        description: 'Second unit',
        orderIndex: 2,
        isPublished: true,
        masteryThreshold: 0.9,
        prerequisiteUnits: ['unit-a'], // Circular reference
        lessons: [],
        objectives: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const map = buildContentRelationshipMap(circularUnits, [], [], [], []);

    // Both units should be blocked by circular dependencies
    expect(arePrerequisitesMet('unit-a', map, [], [])).toBe(false);
    expect(arePrerequisitesMet('unit-b', map, [], [])).toBe(false);
  });

  test('handles large content datasets efficiently', () => {
    // Create many units, lessons, etc. to test performance
    const manyUnits = Array.from({length: 50}, (_, i) => ({
      id: `unit-${i}`,
      title: `Unit ${i}`,
      description: `Description ${i}`,
      orderIndex: i,
      isPublished: true,
      masteryThreshold: 0.9,
      prerequisiteUnits: i > 0 ? [`unit-${i-1}`] : [],
      lessons: [],
      objectives: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const manyLessons = manyUnits.flatMap(unit => 
      Array.from({length: 5}, (_, i) => ({
        id: `lesson-${unit.id}-${i}`,
        unitId: unit.id,
        title: `Lesson ${i}`,
        description: `Description ${i}`,
        content: 'Content',
        orderIndex: i,
        isPublished: true,
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner' as const,
        objectives: [],
        exercises: [],
        assessments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    const startTime = Date.now();
    const map = buildContentRelationshipMap(manyUnits, manyLessons, [], [], []);
    const endTime = Date.now();

    expect(map.nodes.size).toBe(300); // 50 units + 250 lessons
    expect(endTime - startTime).toBeLessThan(100); // Should be fast
  });
});