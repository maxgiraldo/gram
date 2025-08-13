/**
 * Unit Database Queries
 * 
 * CRUD operations for Units including lessons, objectives, and progress tracking.
 * Implements mastery learning principles with proper validation and error handling.
 */

import { Prisma } from '@prisma/client';
import { 
  prisma, 
  executeQuery, 
  executePaginatedQuery, 
  PaginationOptions, 
  PaginatedResult,
  DatabaseError,
  ValidationError,
  NotFoundError
} from '../client';

// ===== TYPES AND INTERFACES =====

export interface CreateUnitData {
  title: string;
  description: string;
  orderIndex: number;
  masteryThreshold?: number;
  prerequisiteUnits?: string[];
  isPublished?: boolean;
}

export interface UpdateUnitData {
  title?: string;
  description?: string;
  orderIndex?: number;
  masteryThreshold?: number;
  prerequisiteUnits?: string[];
  isPublished?: boolean;
}

export interface UnitFilters {
  isPublished?: boolean;
  hasPrerequisites?: boolean;
  masteryThresholdRange?: {
    min?: number;
    max?: number;
  };
  searchText?: string;
}

export interface UnitWithRelations {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  masteryThreshold: number;
  prerequisiteUnits: string | null;
  isPublished: boolean;
  lessons: {
    id: string;
    title: string;
    orderIndex: number;
    isPublished: boolean;
    difficulty: string;
  }[];
  objectives: {
    id: string;
    title: string;
    category: string;
    masteryThreshold: number;
  }[];
  _count: {
    lessons: number;
    objectives: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ===== VALIDATION HELPERS =====

function validateUnitData(data: CreateUnitData | UpdateUnitData): void {
  if ('title' in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError('Title is required', 'validateUnit', 'title');
    }
    if (data.title.length > 255) {
      throw new ValidationError('Title must be 255 characters or less', 'validateUnit', 'title');
    }
  }

  if ('description' in data && data.description !== undefined) {
    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Description is required', 'validateUnit', 'description');
    }
    if (data.description.length > 2000) {
      throw new ValidationError('Description must be 2000 characters or less', 'validateUnit', 'description');
    }
  }

  if ('orderIndex' in data && data.orderIndex !== undefined) {
    if (data.orderIndex < 0) {
      throw new ValidationError('Order index must be non-negative', 'validateUnit', 'orderIndex');
    }
  }

  if ('masteryThreshold' in data && data.masteryThreshold !== undefined) {
    if (data.masteryThreshold < 0 || data.masteryThreshold > 1) {
      throw new ValidationError('Mastery threshold must be between 0 and 1', 'validateUnit', 'masteryThreshold');
    }
  }
}

function buildWhereClause(filters: UnitFilters): Prisma.UnitWhereInput {
  const where: Prisma.UnitWhereInput = {};

  if (filters.isPublished !== undefined) {
    where.isPublished = filters.isPublished;
  }

  if (filters.hasPrerequisites !== undefined) {
    where.prerequisiteUnits = filters.hasPrerequisites 
      ? { not: null }
      : null;
  }

  if (filters.masteryThresholdRange) {
    where.masteryThreshold = {};
    if (filters.masteryThresholdRange.min !== undefined) {
      where.masteryThreshold.gte = filters.masteryThresholdRange.min;
    }
    if (filters.masteryThresholdRange.max !== undefined) {
      where.masteryThreshold.lte = filters.masteryThresholdRange.max;
    }
  }

  if (filters.searchText) {
    where.OR = [
      { title: { contains: filters.searchText, mode: 'insensitive' } },
      { description: { contains: filters.searchText, mode: 'insensitive' } }
    ];
  }

  return where;
}

// ===== CREATE OPERATIONS =====

/**
 * Create a new unit with validation and duplicate checking
 */
export async function createUnit(data: CreateUnitData) {
  return executeQuery('createUnit', async () => {
    validateUnitData(data);

    // Check for duplicate order index
    const existingUnit = await prisma.unit.findUnique({
      where: { orderIndex: data.orderIndex },
      select: { id: true, title: true }
    });

    if (existingUnit) {
      throw new ValidationError(
        `Unit with order index ${data.orderIndex} already exists: ${existingUnit.title}`,
        'createUnit',
        'orderIndex'
      );
    }

    // Parse prerequisite units if provided
    let prerequisiteUnits: string | null = null;
    if (data.prerequisiteUnits && data.prerequisiteUnits.length > 0) {
      // Validate that prerequisite units exist
      const existingUnits = await prisma.unit.findMany({
        where: { id: { in: data.prerequisiteUnits } },
        select: { id: true }
      });

      if (existingUnits.length !== data.prerequisiteUnits.length) {
        const foundIds = existingUnits.map(u => u.id);
        const missingIds = data.prerequisiteUnits.filter(id => !foundIds.includes(id));
        throw new ValidationError(
          `Prerequisite units not found: ${missingIds.join(', ')}`,
          'createUnit',
          'prerequisiteUnits'
        );
      }

      prerequisiteUnits = JSON.stringify(data.prerequisiteUnits);
    }

    try {
      const unit = await prisma.unit.create({
        data: {
          title: data.title,
          description: data.description,
          orderIndex: data.orderIndex,
          masteryThreshold: data.masteryThreshold ?? 0.9,
          prerequisiteUnits,
          isPublished: data.isPublished ?? false
        },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              isPublished: true,
              difficulty: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          _count: {
            select: {
              lessons: true,
              objectives: true
            }
          }
        }
      });

      return unit;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('Order index must be unique', 'createUnit', 'orderIndex');
        }
      }
      throw new DatabaseError('Failed to create unit', 'createUnit', error);
    }
  });
}

// ===== READ OPERATIONS =====

/**
 * Get unit by ID with optional relations
 */
export async function getUnitById(
  id: string,
  includeRelations: boolean = true
): Promise<UnitWithRelations | null> {
  return executeQuery('getUnitById', async () => {
    if (!id) {
      throw new ValidationError('Unit ID is required', 'getUnitById', 'id');
    }

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: includeRelations ? {
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
            difficulty: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        _count: {
          select: {
            lessons: true,
            objectives: true
          }
        }
      } : undefined
    });

    return unit as UnitWithRelations | null;
  });
}

/**
 * Get unit by order index
 */
export async function getUnitByOrderIndex(orderIndex: number): Promise<UnitWithRelations | null> {
  return executeQuery('getUnitByOrderIndex', async () => {
    if (orderIndex < 0) {
      throw new ValidationError('Order index must be non-negative', 'getUnitByOrderIndex', 'orderIndex');
    }

    const unit = await prisma.unit.findUnique({
      where: { orderIndex },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
            difficulty: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        _count: {
          select: {
            lessons: true,
            objectives: true
          }
        }
      }
    });

    return unit as UnitWithRelations | null;
  });
}

/**
 * Get all units with optional filtering and pagination
 */
export async function getUnits(
  filters: UnitFilters = {},
  pagination: PaginationOptions = {}
): Promise<PaginatedResult<UnitWithRelations>> {
  return executeQuery('getUnits', async () => {
    const where = buildWhereClause(filters);

    return executePaginatedQuery(
      'getUnits',
      () => prisma.unit.count({ where }),
      (skip, take) => prisma.unit.findMany({
        where,
        skip,
        take,
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              isPublished: true,
              difficulty: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          _count: {
            select: {
              lessons: true,
              objectives: true
            }
          }
        }
      }),
      pagination
    );
  });
}

/**
 * Get published units for learners
 */
export async function getPublishedUnits(): Promise<UnitWithRelations[]> {
  return executeQuery('getPublishedUnits', async () => {
    const units = await prisma.unit.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
            difficulty: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        _count: {
          select: {
            lessons: true,
            objectives: true
          }
        }
      }
    });

    return units as UnitWithRelations[];
  });
}

/**
 * Get units accessible to a user based on prerequisites
 */
export async function getAccessibleUnits(userId: string): Promise<UnitWithRelations[]> {
  return executeQuery('getAccessibleUnits', async () => {
    // Get user's completed units (mastered)
    const completedUnits = await prisma.learnerProgress.findMany({
      where: {
        userId,
        masteryAchieved: true
      },
      select: { lesson: { select: { unitId: true } } }
    });

    const completedUnitIds = [...new Set(completedUnits.map(p => p.lesson.unitId))];

    // Get all published units
    const allUnits = await prisma.unit.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
            difficulty: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        _count: {
          select: {
            lessons: true,
            objectives: true
          }
        }
      }
    });

    // Filter units based on prerequisites
    const accessibleUnits = allUnits.filter(unit => {
      if (!unit.prerequisiteUnits) return true;
      
      try {
        const prerequisites = JSON.parse(unit.prerequisiteUnits) as string[];
        return prerequisites.every(prereqId => completedUnitIds.includes(prereqId));
      } catch {
        // If we can't parse prerequisites, assume accessible
        return true;
      }
    });

    return accessibleUnits as UnitWithRelations[];
  });
}

// ===== UPDATE OPERATIONS =====

/**
 * Update unit by ID
 */
export async function updateUnit(id: string, data: UpdateUnitData): Promise<UnitWithRelations> {
  return executeQuery('updateUnit', async () => {
    if (!id) {
      throw new ValidationError('Unit ID is required', 'updateUnit', 'id');
    }

    validateUnitData(data);

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id },
      select: { id: true, orderIndex: true }
    });

    if (!existingUnit) {
      throw new NotFoundError('Unit', id, 'updateUnit');
    }

    // Check for duplicate order index if changing
    if (data.orderIndex !== undefined && data.orderIndex !== existingUnit.orderIndex) {
      const duplicateUnit = await prisma.unit.findUnique({
        where: { orderIndex: data.orderIndex },
        select: { id: true, title: true }
      });

      if (duplicateUnit && duplicateUnit.id !== id) {
        throw new ValidationError(
          `Unit with order index ${data.orderIndex} already exists: ${duplicateUnit.title}`,
          'updateUnit',
          'orderIndex'
        );
      }
    }

    // Handle prerequisite units
    let prerequisiteUnits: string | null | undefined = undefined;
    if ('prerequisiteUnits' in data) {
      if (data.prerequisiteUnits && data.prerequisiteUnits.length > 0) {
        // Validate that prerequisite units exist
        const existingUnits = await prisma.unit.findMany({
          where: { id: { in: data.prerequisiteUnits } },
          select: { id: true }
        });

        if (existingUnits.length !== data.prerequisiteUnits.length) {
          const foundIds = existingUnits.map(u => u.id);
          const missingIds = data.prerequisiteUnits.filter(id => !foundIds.includes(id));
          throw new ValidationError(
            `Prerequisite units not found: ${missingIds.join(', ')}`,
            'updateUnit',
            'prerequisiteUnits'
          );
        }

        prerequisiteUnits = JSON.stringify(data.prerequisiteUnits);
      } else {
        prerequisiteUnits = null;
      }
    }

    try {
      const unit = await prisma.unit.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
          ...(data.masteryThreshold !== undefined && { masteryThreshold: data.masteryThreshold }),
          ...(prerequisiteUnits !== undefined && { prerequisiteUnits }),
          ...(data.isPublished !== undefined && { isPublished: data.isPublished })
        },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              isPublished: true,
              difficulty: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          _count: {
            select: {
              lessons: true,
              objectives: true
            }
          }
        }
      });

      return unit as UnitWithRelations;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('Order index must be unique', 'updateUnit', 'orderIndex');
        }
      }
      throw new DatabaseError('Failed to update unit', 'updateUnit', error);
    }
  });
}

/**
 * Reorder units by swapping order indices
 */
export async function reorderUnits(unitId: string, newOrderIndex: number): Promise<void> {
  return executeQuery('reorderUnits', async () => {
    if (!unitId) {
      throw new ValidationError('Unit ID is required', 'reorderUnits', 'unitId');
    }

    if (newOrderIndex < 0) {
      throw new ValidationError('Order index must be non-negative', 'reorderUnits', 'newOrderIndex');
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true, orderIndex: true }
    });

    if (!unit) {
      throw new NotFoundError('Unit', unitId, 'reorderUnits');
    }

    const currentOrderIndex = unit.orderIndex;
    if (currentOrderIndex === newOrderIndex) {
      return; // No change needed
    }

    // Find unit at target position
    const targetUnit = await prisma.unit.findUnique({
      where: { orderIndex: newOrderIndex },
      select: { id: true, orderIndex: true }
    });

    if (!targetUnit) {
      // Simple case: just update the order index
      await prisma.unit.update({
        where: { id: unitId },
        data: { orderIndex: newOrderIndex }
      });
      return;
    }

    // Swap order indices
    await prisma.$transaction([
      prisma.unit.update({
        where: { id: targetUnit.id },
        data: { orderIndex: currentOrderIndex }
      }),
      prisma.unit.update({
        where: { id: unitId },
        data: { orderIndex: newOrderIndex }
      })
    ]);
  });
}

// ===== DELETE OPERATIONS =====

/**
 * Delete unit by ID (soft delete by unpublishing first)
 */
export async function deleteUnit(id: string, force: boolean = false): Promise<void> {
  return executeQuery('deleteUnit', async () => {
    if (!id) {
      throw new ValidationError('Unit ID is required', 'deleteUnit', 'id');
    }

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        lessons: { select: { id: true } },
        objectives: { select: { id: true } }
      }
    });

    if (!unit) {
      throw new NotFoundError('Unit', id, 'deleteUnit');
    }

    if (!force) {
      // Soft delete: unpublish first
      if (unit.isPublished) {
        await prisma.unit.update({
          where: { id },
          data: { isPublished: false }
        });
        return;
      }
    }

    try {
      // Hard delete: remove unit and cascade to related records
      await prisma.unit.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new DatabaseError(
            'Cannot delete unit: it has dependent records. Consider unpublishing instead.',
            'deleteUnit',
            error
          );
        }
      }
      throw new DatabaseError('Failed to delete unit', 'deleteUnit', error);
    }
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get unit statistics
 */
export async function getUnitStats(id: string) {
  return executeQuery('getUnitStats', async () => {
    if (!id) {
      throw new ValidationError('Unit ID is required', 'getUnitStats', 'id');
    }

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessons: true,
            objectives: true
          }
        },
        lessons: {
          include: {
            _count: {
              select: {
                exercises: true,
                assessments: true,
                progress: true
              }
            }
          }
        }
      }
    });

    if (!unit) {
      throw new NotFoundError('Unit', id, 'getUnitStats');
    }

    const totalExercises = unit.lessons.reduce((sum, lesson) => sum + lesson._count.exercises, 0);
    const totalAssessments = unit.lessons.reduce((sum, lesson) => sum + lesson._count.assessments, 0);
    const totalLearnerProgress = unit.lessons.reduce((sum, lesson) => sum + lesson._count.progress, 0);

    return {
      unitId: id,
      lessonsCount: unit._count.lessons,
      objectivesCount: unit._count.objectives,
      exercisesCount: totalExercises,
      assessmentsCount: totalAssessments,
      activeLearners: totalLearnerProgress,
      isPublished: unit.isPublished,
      masteryThreshold: unit.masteryThreshold
    };
  });
}

/**
 * Validate unit prerequisites
 */
export async function validateUnitPrerequisites(unitId: string): Promise<{ isValid: boolean; issues: string[] }> {
  return executeQuery('validateUnitPrerequisites', async () => {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true, prerequisiteUnits: true, orderIndex: true }
    });

    if (!unit) {
      throw new NotFoundError('Unit', unitId, 'validateUnitPrerequisites');
    }

    const issues: string[] = [];

    if (unit.prerequisiteUnits) {
      try {
        const prerequisiteIds = JSON.parse(unit.prerequisiteUnits) as string[];
        
        // Check if all prerequisite units exist
        const prerequisites = await prisma.unit.findMany({
          where: { id: { in: prerequisiteIds } },
          select: { id: true, orderIndex: true, isPublished: true }
        });

        if (prerequisites.length !== prerequisiteIds.length) {
          const foundIds = prerequisites.map(p => p.id);
          const missingIds = prerequisiteIds.filter(id => !foundIds.includes(id));
          issues.push(`Missing prerequisite units: ${missingIds.join(', ')}`);
        }

        // Check that prerequisites have lower order indices
        const invalidOrder = prerequisites.filter(p => p.orderIndex >= unit.orderIndex);
        if (invalidOrder.length > 0) {
          issues.push(`Prerequisites should have lower order indices: ${invalidOrder.map(p => p.id).join(', ')}`);
        }

        // Check that prerequisites are published if this unit is published
        if (unit.orderIndex > 0) {
          const unpublishedPrereqs = prerequisites.filter(p => !p.isPublished);
          if (unpublishedPrereqs.length > 0) {
            issues.push(`Prerequisites should be published: ${unpublishedPrereqs.map(p => p.id).join(', ')}`);
          }
        }

      } catch (error) {
        issues.push('Invalid prerequisite units format');
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  });
}
