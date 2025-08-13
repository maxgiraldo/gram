/**
 * Lesson Database Queries
 * 
 * CRUD operations for Lessons including exercises, assessments, objectives, and progress tracking.
 * Implements mastery learning principles with content management and learner progress tracking.
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

export interface CreateLessonData {
  unitId: string;
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  masteryThreshold?: number;
  estimatedMinutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  orderIndex?: number;
  masteryThreshold?: number;
  estimatedMinutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublished?: boolean;
}

export interface LessonFilters {
  unitId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
  masteryThresholdRange?: {
    min?: number;
    max?: number;
  };
  estimatedTimeRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  searchText?: string;
}

export interface LessonWithRelations {
  id: string;
  unitId: string;
  unit: {
    id: string;
    title: string;
    orderIndex: number;
  };
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  masteryThreshold: number;
  estimatedMinutes: number;
  difficulty: string;
  tags: string | null;
  isPublished: boolean;
  objectives: {
    id: string;
    title: string;
    category: string;
    masteryThreshold: number;
  }[];
  exercises: {
    id: string;
    title: string;
    type: string;
    orderIndex: number;
    difficulty: string;
    _count: {
      questions: number;
    };
  }[];
  assessments: {
    id: string;
    title: string;
    type: string;
    masteryThreshold: number;
    _count: {
      questions: number;
    };
  }[];
  _count: {
    objectives: number;
    exercises: number;
    assessments: number;
    progress: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  lessonId: string;
  lesson: {
    title: string;
    difficulty: string;
    masteryThreshold: number;
  };
  status: string;
  currentScore: number;
  bestScore: number;
  masteryAchieved: boolean;
  masteryDate: Date | null;
  totalTimeSpent: number;
  sessionsCount: number;
  lastAccessedAt: Date;
  needsRemediation: boolean;
  eligibleForEnrichment: boolean;
}

// ===== VALIDATION HELPERS =====

function validateLessonData(data: CreateLessonData | UpdateLessonData): void {
  if ('title' in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError('Title is required', 'validateLesson', 'title');
    }
    if (data.title.length > 255) {
      throw new ValidationError('Title must be 255 characters or less', 'validateLesson', 'title');
    }
  }

  if ('description' in data && data.description !== undefined) {
    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Description is required', 'validateLesson', 'description');
    }
    if (data.description.length > 2000) {
      throw new ValidationError('Description must be 2000 characters or less', 'validateLesson', 'description');
    }
  }

  if ('content' in data && data.content !== undefined) {
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Content is required', 'validateLesson', 'content');
    }
  }

  if ('orderIndex' in data && data.orderIndex !== undefined) {
    if (data.orderIndex < 0) {
      throw new ValidationError('Order index must be non-negative', 'validateLesson', 'orderIndex');
    }
  }

  if ('masteryThreshold' in data && data.masteryThreshold !== undefined) {
    if (data.masteryThreshold < 0 || data.masteryThreshold > 1) {
      throw new ValidationError('Mastery threshold must be between 0 and 1', 'validateLesson', 'masteryThreshold');
    }
  }

  if ('estimatedMinutes' in data && data.estimatedMinutes !== undefined) {
    if (data.estimatedMinutes <= 0) {
      throw new ValidationError('Estimated minutes must be positive', 'validateLesson', 'estimatedMinutes');
    }
  }

  if ('difficulty' in data && data.difficulty !== undefined) {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(data.difficulty)) {
      throw new ValidationError(
        `Difficulty must be one of: ${validDifficulties.join(', ')}`, 
        'validateLesson', 
        'difficulty'
      );
    }
  }
}

function buildWhereClause(filters: LessonFilters): Prisma.LessonWhereInput {
  const where: Prisma.LessonWhereInput = {};

  if (filters.unitId) {
    where.unitId = filters.unitId;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.isPublished !== undefined) {
    where.isPublished = filters.isPublished;
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

  if (filters.estimatedTimeRange) {
    where.estimatedMinutes = {};
    if (filters.estimatedTimeRange.min !== undefined) {
      where.estimatedMinutes.gte = filters.estimatedTimeRange.min;
    }
    if (filters.estimatedTimeRange.max !== undefined) {
      where.estimatedMinutes.lte = filters.estimatedTimeRange.max;
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    // For SQLite, we'll use string contains for JSON tags
    where.tags = {
      contains: filters.tags[0] // Simplified for now
    };
  }

  if (filters.searchText) {
    where.OR = [
      { title: { contains: filters.searchText, mode: 'insensitive' } },
      { description: { contains: filters.searchText, mode: 'insensitive' } },
      { content: { contains: filters.searchText, mode: 'insensitive' } }
    ];
  }

  return where;
}

// ===== CREATE OPERATIONS =====

/**
 * Create a new lesson with validation and unit checking
 */
export async function createLesson(data: CreateLessonData): Promise<LessonWithRelations> {
  return executeQuery('createLesson', async () => {
    validateLessonData(data);

    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
      select: { id: true, title: true }
    });

    if (!unit) {
      throw new NotFoundError('Unit', data.unitId, 'createLesson');
    }

    // Check for duplicate order index within unit
    const existingLesson = await prisma.lesson.findUnique({
      where: { 
        unitId_orderIndex: {
          unitId: data.unitId,
          orderIndex: data.orderIndex
        }
      },
      select: { id: true, title: true }
    });

    if (existingLesson) {
      throw new ValidationError(
        `Lesson with order index ${data.orderIndex} already exists in this unit: ${existingLesson.title}`,
        'createLesson',
        'orderIndex'
      );
    }

    // Parse tags
    let tags: string | null = null;
    if (data.tags && data.tags.length > 0) {
      tags = JSON.stringify(data.tags);
    }

    try {
      const lesson = await prisma.lesson.create({
        data: {
          unitId: data.unitId,
          title: data.title,
          description: data.description,
          content: data.content,
          orderIndex: data.orderIndex,
          masteryThreshold: data.masteryThreshold ?? 0.8,
          estimatedMinutes: data.estimatedMinutes ?? 30,
          difficulty: data.difficulty ?? 'beginner',
          tags,
          isPublished: data.isPublished ?? false
        },
        include: {
          unit: {
            select: {
              id: true,
              title: true,
              orderIndex: true
            }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          exercises: {
            select: {
              id: true,
              title: true,
              type: true,
              orderIndex: true,
              difficulty: true,
              _count: {
                select: { questions: true }
              }
            },
            orderBy: { orderIndex: 'asc' }
          },
          assessments: {
            select: {
              id: true,
              title: true,
              type: true,
              masteryThreshold: true,
              _count: {
                select: { questions: true }
              }
            }
          },
          _count: {
            select: {
              objectives: true,
              exercises: true,
              assessments: true,
              progress: true
            }
          }
        }
      });

      return lesson as LessonWithRelations;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('Order index must be unique within unit', 'createLesson', 'orderIndex');
        }
      }
      throw new DatabaseError('Failed to create lesson', 'createLesson', error);
    }
  });
}

// ===== READ OPERATIONS =====

/**
 * Get lesson by ID with optional relations
 */
export async function getLessonById(
  id: string, 
  includeRelations: boolean = true
): Promise<LessonWithRelations | null> {
  return executeQuery('getLessonById', async () => {
    if (!id) {
      throw new ValidationError('Lesson ID is required', 'getLessonById', 'id');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: includeRelations ? {
        unit: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        exercises: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            difficulty: true,
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
            masteryThreshold: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        }
      } : undefined
    });

    return lesson as LessonWithRelations | null;
  });
}

/**
 * Get all lessons with optional filtering and pagination
 */
export async function getLessons(
  filters: LessonFilters = {},
  pagination: PaginationOptions = {}
): Promise<PaginatedResult<LessonWithRelations>> {
  return executeQuery('getLessons', async () => {
    const where = buildWhereClause(filters);

    return executePaginatedQuery(
      'getLessons',
      () => prisma.lesson.count({ where }),
      (skip, take) => prisma.lesson.findMany({
        where,
        skip,
        take,
        orderBy: [
          { unit: { orderIndex: 'asc' } },
          { orderIndex: 'asc' }
        ],
        include: {
          unit: {
            select: {
              id: true,
              title: true,
              orderIndex: true
            }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          exercises: {
            select: {
              id: true,
              title: true,
              type: true,
              orderIndex: true,
              difficulty: true,
              _count: {
                select: { questions: true }
              }
            },
            orderBy: { orderIndex: 'asc' }
          },
          assessments: {
            select: {
              id: true,
              title: true,
              type: true,
              masteryThreshold: true,
              _count: {
                select: { questions: true }
              }
            }
          },
          _count: {
            select: {
              objectives: true,
              exercises: true,
              assessments: true,
              progress: true
            }
          }
        }
      }),
      pagination
    );
  });
}

/**
 * Get lessons for a specific unit
 */
export async function getLessonsByUnit(unitId: string): Promise<LessonWithRelations[]> {
  return executeQuery('getLessonsByUnit', async () => {
    if (!unitId) {
      throw new ValidationError('Unit ID is required', 'getLessonsByUnit', 'unitId');
    }

    const lessons = await prisma.lesson.findMany({
      where: { unitId },
      orderBy: { orderIndex: 'asc' },
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        exercises: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            difficulty: true,
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
            masteryThreshold: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        }
      }
    });

    return lessons as LessonWithRelations[];
  });
}

/**
 * Get published lessons for learners
 */
export async function getPublishedLessons(unitId?: string): Promise<LessonWithRelations[]> {
  return executeQuery('getPublishedLessons', async () => {
    const where: Prisma.LessonWhereInput = {
      isPublished: true,
      unit: { isPublished: true }
    };

    if (unitId) {
      where.unitId = unitId;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: [
        { unit: { orderIndex: 'asc' } },
        { orderIndex: 'asc' }
      ],
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        exercises: {
          where: { // Only include published exercises
            // Note: Exercise doesn't have isPublished in schema, assuming all are available
          },
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            difficulty: true,
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assessments: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            type: true,
            masteryThreshold: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        }
      }
    });

    return lessons as LessonWithRelations[];
  });
}

/**
 * Get next lesson for a user based on their progress
 */
export async function getNextLessonForUser(userId: string): Promise<LessonWithRelations | null> {
  return executeQuery('getNextLessonForUser', async () => {
    if (!userId) {
      throw new ValidationError('User ID is required', 'getNextLessonForUser', 'userId');
    }

    // Get user's progress
    const progress = await prisma.learnerProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        masteryAchieved: true,
        lesson: {
          select: {
            unitId: true,
            orderIndex: true,
            unit: {
              select: { orderIndex: true }
            }
          }
        }
      }
    });

    const completedLessons = progress
      .filter(p => p.masteryAchieved)
      .map(p => p.lessonId);

    // Find the next lesson that's not completed
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        isPublished: true,
        unit: { isPublished: true },
        NOT: { id: { in: completedLessons } }
      },
      orderBy: [
        { unit: { orderIndex: 'asc' } },
        { orderIndex: 'asc' }
      ],
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        exercises: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            difficulty: true,
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assessments: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            type: true,
            masteryThreshold: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        }
      }
    });

    return nextLesson as LessonWithRelations | null;
  });
}

// ===== UPDATE OPERATIONS =====

/**
 * Update lesson by ID
 */
export async function updateLesson(id: string, data: UpdateLessonData): Promise<LessonWithRelations> {
  return executeQuery('updateLesson', async () => {
    if (!id) {
      throw new ValidationError('Lesson ID is required', 'updateLesson', 'id');
    }

    validateLessonData(data);

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, unitId: true, orderIndex: true }
    });

    if (!existingLesson) {
      throw new NotFoundError('Lesson', id, 'updateLesson');
    }

    // Check for duplicate order index if changing
    if (data.orderIndex !== undefined && data.orderIndex !== existingLesson.orderIndex) {
      const duplicateLesson = await prisma.lesson.findUnique({
        where: { 
          unitId_orderIndex: {
            unitId: existingLesson.unitId,
            orderIndex: data.orderIndex
          }
        },
        select: { id: true, title: true }
      });

      if (duplicateLesson && duplicateLesson.id !== id) {
        throw new ValidationError(
          `Lesson with order index ${data.orderIndex} already exists in this unit: ${duplicateLesson.title}`,
          'updateLesson',
          'orderIndex'
        );
      }
    }

    // Handle tags
    let tags: string | null | undefined = undefined;
    if ('tags' in data) {
      tags = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null;
    }

    try {
      const lesson = await prisma.lesson.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
          ...(data.masteryThreshold !== undefined && { masteryThreshold: data.masteryThreshold }),
          ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
          ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
          ...(tags !== undefined && { tags }),
          ...(data.isPublished !== undefined && { isPublished: data.isPublished })
        },
        include: {
          unit: {
            select: {
              id: true,
              title: true,
              orderIndex: true
            }
          },
          objectives: {
            select: {
              id: true,
              title: true,
              category: true,
              masteryThreshold: true
            }
          },
          exercises: {
            select: {
              id: true,
              title: true,
              type: true,
              orderIndex: true,
              difficulty: true,
              _count: {
                select: { questions: true }
              }
            },
            orderBy: { orderIndex: 'asc' }
          },
          assessments: {
            select: {
              id: true,
              title: true,
              type: true,
              masteryThreshold: true,
              _count: {
                select: { questions: true }
              }
            }
          },
          _count: {
            select: {
              objectives: true,
              exercises: true,
              assessments: true,
              progress: true
            }
          }
        }
      });

      return lesson as LessonWithRelations;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('Order index must be unique within unit', 'updateLesson', 'orderIndex');
        }
      }
      throw new DatabaseError('Failed to update lesson', 'updateLesson', error);
    }
  });
}

/**
 * Reorder lessons within a unit
 */
export async function reorderLessons(lessonId: string, newOrderIndex: number): Promise<void> {
  return executeQuery('reorderLessons', async () => {
    if (!lessonId) {
      throw new ValidationError('Lesson ID is required', 'reorderLessons', 'lessonId');
    }

    if (newOrderIndex < 0) {
      throw new ValidationError('Order index must be non-negative', 'reorderLessons', 'newOrderIndex');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, unitId: true, orderIndex: true }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson', lessonId, 'reorderLessons');
    }

    const currentOrderIndex = lesson.orderIndex;
    if (currentOrderIndex === newOrderIndex) {
      return; // No change needed
    }

    // Find lesson at target position in the same unit
    const targetLesson = await prisma.lesson.findUnique({
      where: { 
        unitId_orderIndex: {
          unitId: lesson.unitId,
          orderIndex: newOrderIndex
        }
      },
      select: { id: true, orderIndex: true }
    });

    if (!targetLesson) {
      // Simple case: just update the order index
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { orderIndex: newOrderIndex }
      });
      return;
    }

    // Swap order indices
    await prisma.$transaction([
      prisma.lesson.update({
        where: { id: targetLesson.id },
        data: { orderIndex: currentOrderIndex }
      }),
      prisma.lesson.update({
        where: { id: lessonId },
        data: { orderIndex: newOrderIndex }
      })
    ]);
  });
}

// ===== DELETE OPERATIONS =====

/**
 * Delete lesson by ID (soft delete by unpublishing first)
 */
export async function deleteLesson(id: string, force: boolean = false): Promise<void> {
  return executeQuery('deleteLesson', async () => {
    if (!id) {
      throw new ValidationError('Lesson ID is required', 'deleteLesson', 'id');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: { select: { id: true } },
        assessments: { select: { id: true } },
        objectives: { select: { id: true } },
        progress: { select: { id: true } }
      }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson', id, 'deleteLesson');
    }

    if (!force) {
      // Soft delete: unpublish first
      if (lesson.isPublished) {
        await prisma.lesson.update({
          where: { id },
          data: { isPublished: false }
        });
        return;
      }
    }

    try {
      // Hard delete: remove lesson and cascade to related records
      await prisma.lesson.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new DatabaseError(
            'Cannot delete lesson: it has dependent records. Consider unpublishing instead.',
            'deleteLesson',
            error
          );
        }
      }
      throw new DatabaseError('Failed to delete lesson', 'deleteLesson', error);
    }
  });
}

// ===== PROGRESS TRACKING =====

/**
 * Get lesson progress for a user
 */
export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  return executeQuery('getLessonProgress', async () => {
    if (!userId || !lessonId) {
      throw new ValidationError('User ID and Lesson ID are required', 'getLessonProgress');
    }

    const progress = await prisma.learnerProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        lesson: {
          select: {
            title: true,
            difficulty: true,
            masteryThreshold: true
          }
        }
      }
    });

    return progress as LessonProgress | null;
  });
}

/**
 * Get all lesson progress for a user
 */
export async function getAllLessonProgress(userId: string): Promise<LessonProgress[]> {
  return executeQuery('getAllLessonProgress', async () => {
    if (!userId) {
      throw new ValidationError('User ID is required', 'getAllLessonProgress', 'userId');
    }

    const progress = await prisma.learnerProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            title: true,
            difficulty: true,
            masteryThreshold: true
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    return progress as LessonProgress[];
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get lesson statistics
 */
export async function getLessonStats(id: string) {
  return executeQuery('getLessonStats', async () => {
    if (!id) {
      throw new ValidationError('Lesson ID is required', 'getLessonStats', 'id');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        },
        progress: {
          select: {
            masteryAchieved: true,
            currentScore: true,
            totalTimeSpent: true
          }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson', id, 'getLessonStats');
    }

    const completionRate = lesson.progress.length > 0 
      ? lesson.progress.filter(p => p.masteryAchieved).length / lesson.progress.length 
      : 0;

    const averageScore = lesson.progress.length > 0
      ? lesson.progress.reduce((sum, p) => sum + p.currentScore, 0) / lesson.progress.length
      : 0;

    const totalTimeSpent = lesson.progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);

    return {
      lessonId: id,
      objectivesCount: lesson._count.objectives,
      exercisesCount: lesson._count.exercises,
      assessmentsCount: lesson._count.assessments,
      activeLearners: lesson._count.progress,
      completionRate,
      averageScore,
      totalTimeSpent, // in seconds
      isPublished: lesson.isPublished,
      difficulty: lesson.difficulty,
      masteryThreshold: lesson.masteryThreshold
    };
  });
}

/**
 * Search lessons by content
 */
export async function searchLessons(
  searchTerm: string, 
  filters: Omit<LessonFilters, 'searchText'> = {}
): Promise<LessonWithRelations[]> {
  return executeQuery('searchLessons', async () => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required', 'searchLessons', 'searchTerm');
    }

    const where = buildWhereClause({ ...filters, searchText: searchTerm.trim() });

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: [
        { unit: { orderIndex: 'asc' } },
        { orderIndex: 'asc' }
      ],
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        },
        objectives: {
          select: {
            id: true,
            title: true,
            category: true,
            masteryThreshold: true
          }
        },
        exercises: {
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            difficulty: true,
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
            masteryThreshold: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: {
            objectives: true,
            exercises: true,
            assessments: true,
            progress: true
          }
        }
      }
    });

    return lessons as LessonWithRelations[];
  });
}
