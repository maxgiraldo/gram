/**
 * Unit Database Queries Test Suite
 * 
 * Comprehensive tests for all Unit CRUD operations, validation,
 * error handling, and business logic.
 */

import { beforeAll, beforeEach, afterAll, describe, test, expect } from 'vitest';
import { 
  createUnit,
  getUnitById,
  getUnitByOrderIndex,
  getUnits,
  getPublishedUnits,
  updateUnit,
  reorderUnits,
  deleteUnit,
  getUnitStats,
  validateUnitPrerequisites,
  ValidationError,
  NotFoundError,
  prisma
} from '../queries';

// Test data
const testUnitData = {
  title: 'Test Unit 1',
  description: 'A comprehensive test unit for grammar fundamentals',
  orderIndex: 1,
  masteryThreshold: 0.9,
  isPublished: false
};

const testUnitData2 = {
  title: 'Test Unit 2',
  description: 'Advanced grammar concepts',
  orderIndex: 2,
  masteryThreshold: 0.85,
  isPublished: true
};

describe('Unit Database Operations', () => {
  // Clean up before and after tests
  beforeEach(async () => {
    // Clean up test data
    await prisma.unit.deleteMany({
      where: {
        title: {
          startsWith: 'Test Unit'
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.unit.deleteMany({
      where: {
        title: {
          startsWith: 'Test Unit'
        }
      }
    });
  });

  describe('Unit Creation', () => {
    test('should create a unit successfully', async () => {
      const unit = await createUnit(testUnitData);

      expect(unit).toBeDefined();
      expect(unit.title).toBe(testUnitData.title);
      expect(unit.description).toBe(testUnitData.description);
      expect(unit.orderIndex).toBe(testUnitData.orderIndex);
      expect(unit.masteryThreshold).toBe(testUnitData.masteryThreshold);
      expect(unit.isPublished).toBe(testUnitData.isPublished);
      expect(unit.id).toBeDefined();
      expect(unit.createdAt).toBeDefined();
      expect(unit.updatedAt).toBeDefined();
    });

    test('should create unit with default values', async () => {
      const minimalData = {
        title: 'Minimal Test Unit',
        description: 'Test with minimal data',
        orderIndex: 99
      };

      const unit = await createUnit(minimalData);

      expect(unit.masteryThreshold).toBe(0.9); // Default value
      expect(unit.isPublished).toBe(false); // Default value
      expect(unit.prerequisiteUnits).toBe(null);
    });

    test('should handle prerequisite units correctly', async () => {
      // Create a prerequisite unit first
      const prereqUnit = await createUnit({
        title: 'Prerequisite Unit',
        description: 'A prerequisite unit',
        orderIndex: 0
      });

      const unitWithPrereqs = await createUnit({
        title: 'Unit with Prerequisites',
        description: 'A unit that has prerequisites',
        orderIndex: 3,
        prerequisiteUnits: [prereqUnit.id]
      });

      expect(unitWithPrereqs.prerequisiteUnits).toBeDefined();
      
      // Parse and verify prerequisites
      const prerequisites = JSON.parse(unitWithPrereqs.prerequisiteUnits!);
      expect(prerequisites).toEqual([prereqUnit.id]);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        title: '',
        description: 'Valid description',
        orderIndex: 1
      };

      await expect(createUnit(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should validate mastery threshold range', async () => {
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description',
        orderIndex: 1,
        masteryThreshold: 1.5 // Invalid - should be 0-1
      };

      await expect(createUnit(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should prevent duplicate order indices', async () => {
      await createUnit(testUnitData);

      // Try to create another unit with same order index
      const duplicateData = {
        ...testUnitData,
        title: 'Different Title'
      };

      await expect(createUnit(duplicateData)).rejects.toThrow(ValidationError);
    });

    test('should validate prerequisite units exist', async () => {
      const dataWithInvalidPrereqs = {
        title: 'Unit with Invalid Prerequisites',
        description: 'Test unit',
        orderIndex: 5,
        prerequisiteUnits: ['invalid-unit-id']
      };

      await expect(createUnit(dataWithInvalidPrereqs)).rejects.toThrow(ValidationError);
    });
  });

  describe('Unit Retrieval', () => {
    let testUnit: any;
    let testUnit2: any;

    beforeEach(async () => {
      testUnit = await createUnit(testUnitData);
      testUnit2 = await createUnit(testUnitData2);
    });

    test('should get unit by ID', async () => {
      const retrievedUnit = await getUnitById(testUnit.id);

      expect(retrievedUnit).toBeDefined();
      expect(retrievedUnit!.id).toBe(testUnit.id);
      expect(retrievedUnit!.title).toBe(testUnit.title);
      expect(retrievedUnit!.lessons).toBeDefined();
      expect(retrievedUnit!.objectives).toBeDefined();
      expect(retrievedUnit!._count).toBeDefined();
    });

    test('should return null for non-existent unit ID', async () => {
      const result = await getUnitById('non-existent-id');
      expect(result).toBeNull();
    });

    test('should get unit by order index', async () => {
      const retrievedUnit = await getUnitByOrderIndex(testUnit.orderIndex);

      expect(retrievedUnit).toBeDefined();
      expect(retrievedUnit!.orderIndex).toBe(testUnit.orderIndex);
      expect(retrievedUnit!.title).toBe(testUnit.title);
    });

    test('should get all units with pagination', async () => {
      const result = await getUnits({}, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('should filter units correctly', async () => {
      const publishedResult = await getUnits({ isPublished: true });
      const unpublishedResult = await getUnits({ isPublished: false });

      expect(publishedResult.data.every(unit => unit.isPublished)).toBe(true);
      expect(unpublishedResult.data.every(unit => !unit.isPublished)).toBe(true);
    });

    test('should search units by text', async () => {
      const searchResult = await getUnits({ 
        searchText: 'Advanced'
      });

      expect(searchResult.data.length).toBeGreaterThan(0);
      expect(searchResult.data.some(unit => 
        unit.title.includes('Advanced') || unit.description.includes('Advanced')
      )).toBe(true);
    });

    test('should get published units only', async () => {
      const publishedUnits = await getPublishedUnits();

      expect(publishedUnits).toBeInstanceOf(Array);
      expect(publishedUnits.every(unit => unit.isPublished)).toBe(true);
    });
  });

  describe('Unit Updates', () => {
    let testUnit: any;

    beforeEach(async () => {
      testUnit = await createUnit(testUnitData);
    });

    test('should update unit successfully', async () => {
      const updateData = {
        title: 'Updated Unit Title',
        masteryThreshold: 0.95,
        isPublished: true
      };

      const updatedUnit = await updateUnit(testUnit.id, updateData);

      expect(updatedUnit.title).toBe(updateData.title);
      expect(updatedUnit.masteryThreshold).toBe(updateData.masteryThreshold);
      expect(updatedUnit.isPublished).toBe(updateData.isPublished);
      expect(updatedUnit.description).toBe(testUnit.description); // Should remain unchanged
    });

    test('should handle partial updates', async () => {
      const updateData = { isPublished: true };

      const updatedUnit = await updateUnit(testUnit.id, updateData);

      expect(updatedUnit.isPublished).toBe(true);
      expect(updatedUnit.title).toBe(testUnit.title); // Should remain unchanged
    });

    test('should validate update data', async () => {
      const invalidUpdate = { masteryThreshold: 2.0 };

      await expect(updateUnit(testUnit.id, invalidUpdate)).rejects.toThrow(ValidationError);
    });

    test('should prevent updating to duplicate order index', async () => {
      const anotherUnit = await createUnit({
        title: 'Another Unit',
        description: 'Another test unit',
        orderIndex: 10
      });

      await expect(updateUnit(testUnit.id, { orderIndex: 10 })).rejects.toThrow(ValidationError);
    });

    test('should fail for non-existent unit', async () => {
      await expect(updateUnit('non-existent-id', { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Unit Reordering', () => {
    let unit1: any, unit2: any, unit3: any;

    beforeEach(async () => {
      unit1 = await createUnit({
        title: 'Unit 1',
        description: 'First unit',
        orderIndex: 10
      });
      unit2 = await createUnit({
        title: 'Unit 2', 
        description: 'Second unit',
        orderIndex: 20
      });
      unit3 = await createUnit({
        title: 'Unit 3',
        description: 'Third unit', 
        orderIndex: 30
      });
    });

    test('should reorder units successfully', async () => {
      // Move unit1 to position 20 (swap with unit2)
      await reorderUnits(unit1.id, 20);

      const reorderedUnit1 = await getUnitById(unit1.id);
      const reorderedUnit2 = await getUnitById(unit2.id);

      expect(reorderedUnit1!.orderIndex).toBe(20);
      expect(reorderedUnit2!.orderIndex).toBe(10);
    });

    test('should handle moving to empty position', async () => {
      // Move unit1 to position 5 (empty position)
      await reorderUnits(unit1.id, 5);

      const reorderedUnit = await getUnitById(unit1.id);
      expect(reorderedUnit!.orderIndex).toBe(5);
    });

    test('should fail for non-existent unit', async () => {
      await expect(reorderUnits('non-existent-id', 5)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Unit Deletion', () => {
    let testUnit: any;

    beforeEach(async () => {
      testUnit = await createUnit(testUnitData);
    });

    test('should soft delete by unpublishing', async () => {
      // Publish first
      await updateUnit(testUnit.id, { isPublished: true });
      
      // Soft delete
      await deleteUnit(testUnit.id, false);

      const unit = await getUnitById(testUnit.id);
      expect(unit).toBeDefined();
      expect(unit!.isPublished).toBe(false);
    });

    test('should hard delete when forced', async () => {
      await deleteUnit(testUnit.id, true);

      const unit = await getUnitById(testUnit.id);
      expect(unit).toBeNull();
    });

    test('should fail for non-existent unit', async () => {
      await expect(deleteUnit('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Unit Statistics', () => {
    let testUnit: any;

    beforeEach(async () => {
      testUnit = await createUnit(testUnitData);
    });

    test('should get unit statistics', async () => {
      const stats = await getUnitStats(testUnit.id);

      expect(stats).toBeDefined();
      expect(stats.unitId).toBe(testUnit.id);
      expect(typeof stats.lessonsCount).toBe('number');
      expect(typeof stats.objectivesCount).toBe('number');
      expect(typeof stats.exercisesCount).toBe('number');
      expect(typeof stats.assessmentsCount).toBe('number');
      expect(typeof stats.activeLearners).toBe('number');
      expect(typeof stats.isPublished).toBe('boolean');
      expect(typeof stats.masteryThreshold).toBe('number');
    });

    test('should fail for non-existent unit', async () => {
      await expect(getUnitStats('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Prerequisites Validation', () => {
    let prereqUnit: any, testUnit: any;

    beforeEach(async () => {
      prereqUnit = await createUnit({
        title: 'Prerequisite Unit',
        description: 'A prerequisite',
        orderIndex: 5,
        isPublished: true
      });

      testUnit = await createUnit({
        title: 'Unit with Prerequisites',
        description: 'Has prerequisites',
        orderIndex: 10,
        prerequisiteUnits: [prereqUnit.id]
      });
    });

    test('should validate prerequisites successfully', async () => {
      const validation = await validateUnitPrerequisites(testUnit.id);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    test('should detect missing prerequisites', async () => {
      // Delete the prerequisite unit
      await deleteUnit(prereqUnit.id, true);

      const validation = await validateUnitPrerequisites(testUnit.id);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    test('should fail for non-existent unit', async () => {
      await expect(validateUnitPrerequisites('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty search results', async () => {
      const result = await getUnits({ 
        searchText: 'non-existent-search-term-xyz' 
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    test('should validate order index bounds', async () => {
      const invalidData = {
        title: 'Invalid Order Index',
        description: 'Test',
        orderIndex: -1
      };

      await expect(createUnit(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should handle very long text fields', async () => {
      const longTitle = 'A'.repeat(300);
      const longDescription = 'B'.repeat(3000);

      const invalidData = {
        title: longTitle,
        description: longDescription,
        orderIndex: 999
      };

      await expect(createUnit(invalidData)).rejects.toThrow(ValidationError);
    });

    test('should handle null and undefined values gracefully', async () => {
      await expect(getUnitById('')).rejects.toThrow(ValidationError);
      await expect(updateUnit('', {})).rejects.toThrow(ValidationError);
    });
  });
});
