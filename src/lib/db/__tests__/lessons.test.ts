/**
 * Lesson Database Queries Test Suite
 * 
 * Comprehensive tests for all Lesson CRUD operations, validation,
 * error handling, and business logic including progress tracking.
 */

import { beforeAll, beforeEach, afterAll, describe, test, expect } from 'vitest';
import { 
  createUnit,
  createLesson,
  getLessonById,
  getLessons,
  getLessonsByUnit,
  getPublishedLessons,
  getNextLessonForUser,
  updateLesson,
  reorderLessons,
  deleteLesson,
  getLessonStats,
  searchLessons,
  ValidationError,
  NotFoundError,
  prisma
} from '../queries';

// Test data
const testUnitData = {
  title: 'Test Unit for Lessons',
  description: 'A unit for testing lesson operations',
  orderIndex: 100,
  isPublished: true
};

const testLessonData = {
  title: 'Test Lesson 1',
  description: 'A comprehensive test lesson on basic grammar',
  content: '# Basic Grammar\n\nThis lesson covers fundamental grammar concepts...',
  orderIndex: 1,
  masteryThreshold: 0.8,
  estimatedMinutes: 45,
  difficulty: 'beginner' as const,
  tags: ['grammar', 'basics', 'nouns'],
  isPublished: false
};

const testLessonData2 = {
  title: 'Test Lesson 2',
  description: 'Advanced grammar concepts',
  content: '# Advanced Grammar\n\nThis lesson covers complex grammar topics...',
  orderIndex: 2,
  masteryThreshold: 0.85,
  estimatedMinutes: 60,
  difficulty: 'intermediate' as const,
  tags: ['grammar', 'advanced', 'verbs'],
  isPublished: true
};

describe('Lesson Database Operations', () => {
  let testUnit: any;

  // Set up test unit
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.lesson.deleteMany({
      where: { title: { startsWith: 'Test Lesson' } }
    });
    await prisma.unit.deleteMany({
      where: { title: { startsWith: 'Test Unit' } }
    });

    testUnit = await createUnit(testUnitData);
  });

  // Clean up between tests
  beforeEach(async () => {
    await prisma.lesson.deleteMany({
      where: { title: { startsWith: 'Test Lesson' } }
    });
  });

  afterAll(async () => {
    await prisma.lesson.deleteMany({
      where: { title: { startsWith: 'Test Lesson' } }
    });
    await prisma.unit.deleteMany({
      where: { title: { startsWith: 'Test Unit' } }
    });
  });

  describe('Lesson Creation', () => {
    test('should create a lesson successfully', async () => {
      const lessonData = { ...testLessonData, unitId: testUnit.id };
      const lesson = await createLesson(lessonData);

      expect(lesson).toBeDefined();
      expect(lesson.title).toBe(lessonData.title);
      expect(lesson.description).toBe(lessonData.description);
      expect(lesson.content).toBe(lessonData.content);
      expect(lesson.orderIndex).toBe(lessonData.orderIndex);
      expect(lesson.masteryThreshold).toBe(lessonData.masteryThreshold);
      expect(lesson.estimatedMinutes).toBe(lessonData.estimatedMinutes);
      expect(lesson.difficulty).toBe(lessonData.difficulty);
      expect(lesson.isPublished).toBe(lessonData.isPublished);
      expect(lesson.unitId).toBe(testUnit.id);
      expect(lesson.id).toBeDefined();
      expect(lesson.createdAt).toBeDefined();
      expect(lesson.updatedAt).toBeDefined();
      
      // Check relations are loaded
      expect(lesson.unit).toBeDefined();
      expect(lesson.objectives).toBeInstanceOf(Array);
      expect(lesson.exercises).toBeInstanceOf(Array);
      expect(lesson.assessments).toBeInstanceOf(Array);
      expect(lesson._count).toBeDefined();
    });

    test('should create lesson with default values', async () => {
      const minimalData = {
        unitId: testUnit.id,
        title: 'Minimal Test Lesson',
        description: 'Test with minimal data',
        content: 'Basic content',
        orderIndex: 99
      };

      const lesson = await createLesson(minimalData);

      expect(lesson.masteryThreshold).toBe(0.8); // Default value
      expect(lesson.estimatedMinutes).toBe(30); // Default value
      expect(lesson.difficulty).toBe('beginner'); // Default value
      expect(lesson.isPublished).toBe(false); // Default value
      expect(lesson.tags).toBe(null);
    });

    test('should handle tags correctly', async () => {
      const lessonWithTags = await createLesson({
        ...testLessonData,
        unitId: testUnit.id
      });

      expect(lessonWithTags.tags).toBeDefined();
      
      // Parse and verify tags
      const tags = JSON.parse(lessonWithTags.tags!);
      expect(tags).toEqual(testLessonData.tags);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        unitId: testUnit.id,
        title: '', // Invalid - empty title
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: 1
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should validate unit exists', async () => {
      const dataWithInvalidUnit = {
        unitId: 'non-existent-unit-id',
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: 1
      };

      await expect(createLesson(dataWithInvalidUnit)).rejects.toThrow(NotFoundError);
    });

    test('should validate mastery threshold range', async () => {
      const invalidData = {
        unitId: testUnit.id,
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: 1,
        masteryThreshold: 1.5 // Invalid - should be 0-1
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should validate difficulty values', async () => {
      const invalidData = {
        unitId: testUnit.id,
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: 1,
        difficulty: 'invalid' as any // Invalid difficulty
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should prevent duplicate order indices within unit', async () => {
      await createLesson({ ...testLessonData, unitId: testUnit.id });

      // Try to create another lesson with same order index in same unit
      const duplicateData = {
        ...testLessonData,
        title: 'Different Title',
        unitId: testUnit.id
      };

      await expect(createLesson(duplicateData)).rejects.toThrow(ValidationError);
    });
  });

  describe('Lesson Retrieval', () => {
    let testLesson: any;
    let testLesson2: any;

    beforeEach(async () => {
      testLesson = await createLesson({ ...testLessonData, unitId: testUnit.id });
      testLesson2 = await createLesson({ ...testLessonData2, unitId: testUnit.id });
    });

    test('should get lesson by ID', async () => {
      const retrievedLesson = await getLessonById(testLesson.id);

      expect(retrievedLesson).toBeDefined();
      expect(retrievedLesson!.id).toBe(testLesson.id);
      expect(retrievedLesson!.title).toBe(testLesson.title);
      expect(retrievedLesson!.unit).toBeDefined();
      expect(retrievedLesson!.objectives).toBeDefined();
      expect(retrievedLesson!.exercises).toBeDefined();
      expect(retrievedLesson!.assessments).toBeDefined();
      expect(retrievedLesson!._count).toBeDefined();
    });

    test('should return null for non-existent lesson ID', async () => {
      const result = await getLessonById('non-existent-id');
      expect(result).toBeNull();
    });

    test('should get lessons by unit', async () => {
      const lessons = await getLessonsByUnit(testUnit.id);

      expect(lessons).toBeInstanceOf(Array);
      expect(lessons.length).toBe(2);
      expect(lessons[0].orderIndex).toBeLessThan(lessons[1].orderIndex);
    });

    test('should get all lessons with pagination', async () => {
      const result = await getLessons({}, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('should filter lessons correctly', async () => {
      const beginnerResult = await getLessons({ difficulty: 'beginner' });
      const intermediateResult = await getLessons({ difficulty: 'intermediate' });

      expect(beginnerResult.data.every(lesson => lesson.difficulty === 'beginner')).toBe(true);
      expect(intermediateResult.data.every(lesson => lesson.difficulty === 'intermediate')).toBe(true);
    });

    test('should filter by unit', async () => {
      const unitLessons = await getLessons({ unitId: testUnit.id });

      expect(unitLessons.data.every(lesson => lesson.unitId === testUnit.id)).toBe(true);
    });

    test('should get published lessons only', async () => {
      const publishedLessons = await getPublishedLessons();

      expect(publishedLessons).toBeInstanceOf(Array);
      expect(publishedLessons.every(lesson => lesson.isPublished)).toBe(true);
    });

    test('should search lessons by text', async () => {
      const searchResult = await searchLessons('Advanced');

      expect(searchResult.length).toBeGreaterThan(0);
      expect(searchResult.some(lesson => 
        lesson.title.includes('Advanced') || 
        lesson.description.includes('Advanced') ||
        lesson.content.includes('Advanced')
      )).toBe(true);
    });
  });

  describe('Lesson Updates', () => {
    let testLesson: any;

    beforeEach(async () => {
      testLesson = await createLesson({ ...testLessonData, unitId: testUnit.id });
    });

    test('should update lesson successfully', async () => {
      const updateData = {
        title: 'Updated Lesson Title',
        masteryThreshold: 0.9,
        difficulty: 'advanced' as const,
        isPublished: true
      };

      const updatedLesson = await updateLesson(testLesson.id, updateData);

      expect(updatedLesson.title).toBe(updateData.title);
      expect(updatedLesson.masteryThreshold).toBe(updateData.masteryThreshold);
      expect(updatedLesson.difficulty).toBe(updateData.difficulty);
      expect(updatedLesson.isPublished).toBe(updateData.isPublished);
      expect(updatedLesson.description).toBe(testLesson.description); // Should remain unchanged
    });

    test('should handle partial updates', async () => {
      const updateData = { isPublished: true };

      const updatedLesson = await updateLesson(testLesson.id, updateData);

      expect(updatedLesson.isPublished).toBe(true);
      expect(updatedLesson.title).toBe(testLesson.title); // Should remain unchanged
    });

    test('should update tags correctly', async () => {
      const updateData = { tags: ['updated', 'tags'] };

      const updatedLesson = await updateLesson(testLesson.id, updateData);
      
      const tags = JSON.parse(updatedLesson.tags!);
      expect(tags).toEqual(['updated', 'tags']);
    });

    test('should validate update data', async () => {
      const invalidUpdate = { masteryThreshold: 2.0 };

      await expect(updateLesson(testLesson.id, invalidUpdate)).rejects.toThrow(ValidationError);
    });

    test('should prevent updating to duplicate order index', async () => {
      const anotherLesson = await createLesson({
        unitId: testUnit.id,
        title: 'Another Lesson',
        description: 'Another test lesson',
        content: 'Content',
        orderIndex: 10
      });

      await expect(updateLesson(testLesson.id, { orderIndex: 10 }))
        .rejects.toThrow(ValidationError);
    });

    test('should fail for non-existent lesson', async () => {
      await expect(updateLesson('non-existent-id', { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Lesson Reordering', () => {
    let lesson1: any, lesson2: any, lesson3: any;

    beforeEach(async () => {
      lesson1 = await createLesson({
        unitId: testUnit.id,
        title: 'Lesson 1',
        description: 'First lesson',
        content: 'Content 1',
        orderIndex: 10
      });
      lesson2 = await createLesson({
        unitId: testUnit.id,
        title: 'Lesson 2',
        description: 'Second lesson',
        content: 'Content 2',
        orderIndex: 20
      });
      lesson3 = await createLesson({
        unitId: testUnit.id,
        title: 'Lesson 3',
        description: 'Third lesson',
        content: 'Content 3',
        orderIndex: 30
      });
    });

    test('should reorder lessons successfully', async () => {
      // Move lesson1 to position 20 (swap with lesson2)
      await reorderLessons(lesson1.id, 20);

      const reorderedLesson1 = await getLessonById(lesson1.id);
      const reorderedLesson2 = await getLessonById(lesson2.id);

      expect(reorderedLesson1!.orderIndex).toBe(20);
      expect(reorderedLesson2!.orderIndex).toBe(10);
    });

    test('should handle moving to empty position', async () => {
      // Move lesson1 to position 5 (empty position)
      await reorderLessons(lesson1.id, 5);

      const reorderedLesson = await getLessonById(lesson1.id);
      expect(reorderedLesson!.orderIndex).toBe(5);
    });

    test('should fail for non-existent lesson', async () => {
      await expect(reorderLessons('non-existent-id', 5)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Lesson Deletion', () => {
    let testLesson: any;

    beforeEach(async () => {
      testLesson = await createLesson({ ...testLessonData, unitId: testUnit.id });
    });

    test('should soft delete by unpublishing', async () => {
      // Publish first
      await updateLesson(testLesson.id, { isPublished: true });
      
      // Soft delete
      await deleteLesson(testLesson.id, false);

      const lesson = await getLessonById(testLesson.id);
      expect(lesson).toBeDefined();
      expect(lesson!.isPublished).toBe(false);
    });

    test('should hard delete when forced', async () => {
      await deleteLesson(testLesson.id, true);

      const lesson = await getLessonById(testLesson.id);
      expect(lesson).toBeNull();
    });

    test('should fail for non-existent lesson', async () => {
      await expect(deleteLesson('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Lesson Statistics', () => {
    let testLesson: any;

    beforeEach(async () => {
      testLesson = await createLesson({ ...testLessonData, unitId: testUnit.id });
    });

    test('should get lesson statistics', async () => {
      const stats = await getLessonStats(testLesson.id);

      expect(stats).toBeDefined();
      expect(stats.lessonId).toBe(testLesson.id);
      expect(typeof stats.objectivesCount).toBe('number');
      expect(typeof stats.exercisesCount).toBe('number');
      expect(typeof stats.assessmentsCount).toBe('number');
      expect(typeof stats.activeLearners).toBe('number');
      expect(typeof stats.completionRate).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.totalTimeSpent).toBe('number');
      expect(typeof stats.isPublished).toBe('boolean');
      expect(typeof stats.difficulty).toBe('string');
      expect(typeof stats.masteryThreshold).toBe('number');
    });

    test('should fail for non-existent lesson', async () => {
      await expect(getLessonStats('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty search results', async () => {
      const result = await searchLessons('non-existent-search-term-xyz');

      expect(result).toEqual([]);
    });

    test('should validate required parameters', async () => {
      await expect(searchLessons('')).rejects.toThrow(ValidationError);
      await expect(getLessonById('')).rejects.toThrow(ValidationError);
      await expect(updateLesson('', {})).rejects.toThrow(ValidationError);
    });

    test('should handle very long text fields', async () => {
      const longTitle = 'A'.repeat(300);
      const longDescription = 'B'.repeat(3000);

      const invalidData = {
        unitId: testUnit.id,
        title: longTitle,
        description: longDescription,
        content: 'Valid content',
        orderIndex: 999
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should validate estimated minutes is positive', async () => {
      const invalidData = {
        unitId: testUnit.id,
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: 1,
        estimatedMinutes: -10 // Invalid
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should validate order index bounds', async () => {
      const invalidData = {
        unitId: testUnit.id,
        title: 'Valid Title',
        description: 'Valid description',
        content: 'Valid content',
        orderIndex: -1
      };

      await expect(createLesson(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('Progress Tracking Integration', () => {
    test('should get next lesson for user (empty progress)', async () => {
      const publishedLesson = await createLesson({
        ...testLessonData,
        unitId: testUnit.id,
        isPublished: true
      });

      const nextLesson = await getNextLessonForUser('test-user-id');

      expect(nextLesson).toBeDefined();
      // Should return the first published lesson since no progress exists
    });

    test('should handle non-existent user gracefully', async () => {
      const result = await getNextLessonForUser('non-existent-user');
      // Should not throw error, just return appropriate result
      expect(result).toBeDefined();
    });
  });
});
