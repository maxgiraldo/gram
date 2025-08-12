/**
 * Content Relationships and Dependencies
 * 
 * Utilities for managing relationships between units, lessons, objectives,
 * exercises, and assessments. Handles dependency resolution and prerequisite checking.
 */

import {
  type Unit,
  type Lesson,
  type LearningObjective,
  type Exercise,
  type Assessment,
  type LearnerProgress,
  type ObjectiveProgress,
  type ProgressStatus,
} from '../../types/content';

// ===== RELATIONSHIP TYPES =====

/**
 * Content dependency graph node
 */
export interface ContentNode {
  id: string;
  type: 'unit' | 'lesson' | 'objective' | 'exercise' | 'assessment';
  title: string;
  dependencies: string[]; // IDs of prerequisite content
  dependents: string[]; // IDs of content that depends on this
}

/**
 * Learning path segment
 */
export interface LearningPathSegment {
  contentId: string;
  contentType: 'unit' | 'lesson' | 'objective' | 'exercise' | 'assessment';
  title: string;
  isRequired: boolean;
  isUnlocked: boolean;
  progress: ProgressStatus;
  estimatedMinutes?: number;
}

/**
 * Content relationship map
 */
export interface ContentRelationshipMap {
  nodes: Map<string, ContentNode>;
  units: Map<string, Unit>;
  lessons: Map<string, Lesson>;
  objectives: Map<string, LearningObjective>;
  exercises: Map<string, Exercise>;
  assessments: Map<string, Assessment>;
}

// ===== RELATIONSHIP BUILDER =====

/**
 * Builds a complete content relationship map
 */
export function buildContentRelationshipMap(
  units: Unit[],
  lessons: Lesson[],
  objectives: LearningObjective[],
  exercises: Exercise[],
  assessments: Assessment[]
): ContentRelationshipMap {
  const nodes = new Map<string, ContentNode>();
  const unitMap = new Map(units.map(u => [u.id, u]));
  const lessonMap = new Map(lessons.map(l => [l.id, l]));
  const objectiveMap = new Map(objectives.map(o => [o.id, o]));
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  const assessmentMap = new Map(assessments.map(a => [a.id, a]));

  // Create nodes for all content
  units.forEach(unit => {
    nodes.set(unit.id, {
      id: unit.id,
      type: 'unit',
      title: unit.title,
      dependencies: unit.prerequisiteUnits || [],
      dependents: [],
    });
  });

  lessons.forEach(lesson => {
    nodes.set(lesson.id, {
      id: lesson.id,
      type: 'lesson',
      title: lesson.title,
      dependencies: [lesson.unitId], // Lesson depends on its unit
      dependents: [],
    });
  });

  objectives.forEach(objective => {
    const dependencies: string[] = [];
    if (objective.unitId) dependencies.push(objective.unitId);
    if (objective.lessonId) dependencies.push(objective.lessonId);

    nodes.set(objective.id, {
      id: objective.id,
      type: 'objective',
      title: objective.title,
      dependencies,
      dependents: [],
    });
  });

  exercises.forEach(exercise => {
    nodes.set(exercise.id, {
      id: exercise.id,
      type: 'exercise',
      title: exercise.title,
      dependencies: [exercise.lessonId], // Exercise depends on its lesson
      dependents: [],
    });
  });

  assessments.forEach(assessment => {
    const dependencies: string[] = [];
    if (assessment.lessonId) dependencies.push(assessment.lessonId);

    nodes.set(assessment.id, {
      id: assessment.id,
      type: 'assessment',
      title: assessment.title,
      dependencies,
      dependents: [],
    });
  });

  // Build dependent relationships
  nodes.forEach(node => {
    node.dependencies.forEach(depId => {
      const depNode = nodes.get(depId);
      if (depNode && !depNode.dependents.includes(node.id)) {
        depNode.dependents.push(node.id);
      }
    });
  });

  return {
    nodes,
    units: unitMap,
    lessons: lessonMap,
    objectives: objectiveMap,
    exercises: exerciseMap,
    assessments: assessmentMap,
  };
}

// ===== DEPENDENCY RESOLUTION =====

/**
 * Checks if prerequisites are met for a piece of content
 */
export function arePrerequisitesMet(
  contentId: string,
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[]
): boolean {
  const node = relationshipMap.nodes.get(contentId);
  if (!node) return false;

  const progressMap = new Map(learnerProgress.map(p => [p.lessonId, p]));
  const objectiveProgressMap = new Map(objectiveProgress.map(p => [p.objectiveId, p]));

  return node.dependencies.every(depId => {
    const depNode = relationshipMap.nodes.get(depId);
    if (!depNode) return false;

    switch (depNode.type) {
      case 'unit':
        // Unit is complete if all its lessons are mastered
        return isUnitComplete(depId, relationshipMap, learnerProgress);
      
      case 'lesson':
        const lessonProgress = progressMap.get(depId);
        return lessonProgress?.masteryAchieved || false;
      
      case 'objective':
        const objProgress = objectiveProgressMap.get(depId);
        return objProgress?.masteryAchieved || false;
      
      default:
        return false;
    }
  });
}

/**
 * Checks if a unit is complete based on lesson mastery
 */
export function isUnitComplete(
  unitId: string,
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[]
): boolean {
  const unit = relationshipMap.units.get(unitId);
  if (!unit) return false;

  const unitLessons = Array.from(relationshipMap.lessons.values())
    .filter(lesson => lesson.unitId === unitId);

  if (unitLessons.length === 0) return false;

  const progressMap = new Map(learnerProgress.map(p => [p.lessonId, p]));
  const masteredLessons = unitLessons.filter(lesson => 
    progressMap.get(lesson.id)?.masteryAchieved
  );

  const masteryPercentage = masteredLessons.length / unitLessons.length;
  return masteryPercentage >= unit.masteryThreshold;
}

/**
 * Gets the next available content for a learner
 */
export function getNextAvailableContent(
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[]
): LearningPathSegment[] {
  const availableContent: LearningPathSegment[] = [];

  // Check all lessons for availability
  relationshipMap.lessons.forEach(lesson => {
    if (arePrerequisitesMet(lesson.id, relationshipMap, learnerProgress, objectiveProgress)) {
      const progress = learnerProgress.find(p => p.lessonId === lesson.id);
      
      if (!progress || progress.status !== 'mastered') {
        availableContent.push({
          contentId: lesson.id,
          contentType: 'lesson',
          title: lesson.title,
          isRequired: true,
          isUnlocked: true,
          progress: progress?.status || 'not_started',
          estimatedMinutes: lesson.estimatedMinutes,
        });
      }
    }
  });

  // Check exercises for available lessons
  relationshipMap.exercises.forEach(exercise => {
    if (arePrerequisitesMet(exercise.id, relationshipMap, learnerProgress, objectiveProgress)) {
      const lessonProgress = learnerProgress.find(p => p.lessonId === exercise.lessonId);
      
      if (lessonProgress && lessonProgress.status === 'in_progress') {
        availableContent.push({
          contentId: exercise.id,
          contentType: 'exercise',
          title: exercise.title,
          isRequired: exercise.type === 'practice' || exercise.type === 'reinforcement',
          isUnlocked: true,
          progress: 'not_started', // TODO: Track exercise-specific progress
        });
      }
    }
  });

  return availableContent.sort((a, b) => {
    // Sort by required status, then by content type priority
    if (a.isRequired !== b.isRequired) {
      return a.isRequired ? -1 : 1;
    }
    
    const typePriority = { lesson: 1, exercise: 2, assessment: 3, objective: 4, unit: 5 };
    return typePriority[a.contentType] - typePriority[b.contentType];
  });
}

/**
 * Gets content that's blocked by prerequisites
 */
export function getBlockedContent(
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[]
): LearningPathSegment[] {
  const blockedContent: LearningPathSegment[] = [];

  relationshipMap.lessons.forEach(lesson => {
    if (!arePrerequisitesMet(lesson.id, relationshipMap, learnerProgress, objectiveProgress)) {
      const progress = learnerProgress.find(p => p.lessonId === lesson.id);
      
      blockedContent.push({
        contentId: lesson.id,
        contentType: 'lesson',
        title: lesson.title,
        isRequired: true,
        isUnlocked: false,
        progress: progress?.status || 'not_started',
        estimatedMinutes: lesson.estimatedMinutes,
      });
    }
  });

  return blockedContent;
}

// ===== LEARNING PATH GENERATION =====

/**
 * Generates a complete learning path for a learner
 */
export function generateLearningPath(
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[],
  targetUnitId?: string
): LearningPathSegment[] {
  const path: LearningPathSegment[] = [];
  
  // Filter units to target unit if specified
  const targetUnits = targetUnitId 
    ? [relationshipMap.units.get(targetUnitId)].filter(Boolean) as Unit[]
    : Array.from(relationshipMap.units.values());

  targetUnits.forEach(unit => {
    // Add unit lessons in order
    const unitLessons = Array.from(relationshipMap.lessons.values())
      .filter(lesson => lesson.unitId === unit.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    unitLessons.forEach(lesson => {
      const progress = learnerProgress.find(p => p.lessonId === lesson.id);
      const isUnlocked = arePrerequisitesMet(lesson.id, relationshipMap, learnerProgress, objectiveProgress);

      path.push({
        contentId: lesson.id,
        contentType: 'lesson',
        title: lesson.title,
        isRequired: true,
        isUnlocked,
        progress: progress?.status || 'not_started',
        estimatedMinutes: lesson.estimatedMinutes,
      });

      // Add lesson exercises
      const lessonExercises = Array.from(relationshipMap.exercises.values())
        .filter(exercise => exercise.lessonId === lesson.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      lessonExercises.forEach(exercise => {
        path.push({
          contentId: exercise.id,
          contentType: 'exercise',
          title: exercise.title,
          isRequired: exercise.type === 'practice' || exercise.type === 'reinforcement',
          isUnlocked: isUnlocked && (progress?.status === 'in_progress' || progress?.masteryAchieved === true),
          progress: 'not_started', // TODO: Track exercise progress
        });
      });

      // Add lesson assessments
      const lessonAssessments = Array.from(relationshipMap.assessments.values())
        .filter(assessment => assessment.lessonId === lesson.id);

      lessonAssessments.forEach(assessment => {
        path.push({
          contentId: assessment.id,
          contentType: 'assessment',
          title: assessment.title,
          isRequired: assessment.type === 'summative',
          isUnlocked: isUnlocked && progress?.masteryAchieved === true,
          progress: 'not_started', // TODO: Track assessment progress
        });
      });
    });
  });

  return path;
}

/**
 * Gets recommended content based on learner performance
 */
export function getRecommendedContent(
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[]
): {
  remediation: LearningPathSegment[];
  enrichment: LearningPathSegment[];
  nextSteps: LearningPathSegment[];
} {
  const remediation: LearningPathSegment[] = [];
  const enrichment: LearningPathSegment[] = [];
  const nextSteps: LearningPathSegment[] = [];

  // Find content needing remediation
  learnerProgress.forEach(progress => {
    if (progress.needsRemediation) {
      const lesson = relationshipMap.lessons.get(progress.lessonId);
      if (lesson) {
        remediation.push({
          contentId: lesson.id,
          contentType: 'lesson',
          title: `Review: ${lesson.title}`,
          isRequired: true,
          isUnlocked: true,
          progress: 'not_started',
          estimatedMinutes: lesson.estimatedMinutes,
        });
      }
    }
  });

  // Find enrichment opportunities
  learnerProgress.forEach(progress => {
    if (progress.eligibleForEnrichment) {
      const lesson = relationshipMap.lessons.get(progress.lessonId);
      if (lesson) {
        // Find enrichment exercises for this lesson
        const enrichmentExercises = Array.from(relationshipMap.exercises.values())
          .filter(exercise => exercise.lessonId === lesson.id && exercise.type === 'enrichment');

        enrichmentExercises.forEach(exercise => {
          enrichment.push({
            contentId: exercise.id,
            contentType: 'exercise',
            title: exercise.title,
            isRequired: false,
            isUnlocked: true,
            progress: 'not_started',
          });
        });
      }
    }
  });

  // Get next available steps
  nextSteps.push(...getNextAvailableContent(relationshipMap, learnerProgress, objectiveProgress));

  return {
    remediation,
    enrichment,
    nextSteps: nextSteps.slice(0, 5), // Limit to top 5
  };
}

// ===== PROGRESS ANALYSIS =====

/**
 * Analyzes learning progress across the curriculum
 */
export function analyzeProgressAcrossCurriculum(
  relationshipMap: ContentRelationshipMap,
  learnerProgress: LearnerProgress[],
  objectiveProgress: ObjectiveProgress[]
): {
  overallProgress: number;
  unitProgress: { unitId: string; title: string; progress: number }[];
  completedLessons: number;
  totalLessons: number;
  masteredObjectives: number;
  totalObjectives: number;
} {
  const progressMap = new Map(learnerProgress.map(p => [p.lessonId, p]));
  const objProgressMap = new Map(objectiveProgress.map(p => [p.objectiveId, p]));

  const totalLessons = relationshipMap.lessons.size;
  const completedLessons = learnerProgress.filter(p => p.masteryAchieved).length;

  const totalObjectives = relationshipMap.objectives.size;
  const masteredObjectives = objectiveProgress.filter(p => p.masteryAchieved).length;

  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const unitProgress = Array.from(relationshipMap.units.values()).map(unit => {
    const unitLessons = Array.from(relationshipMap.lessons.values())
      .filter(lesson => lesson.unitId === unit.id);
    
    const masteredLessons = unitLessons.filter(lesson => 
      progressMap.get(lesson.id)?.masteryAchieved
    ).length;

    const progress = unitLessons.length > 0 ? (masteredLessons / unitLessons.length) * 100 : 0;

    return {
      unitId: unit.id,
      title: unit.title,
      progress,
    };
  });

  return {
    overallProgress,
    unitProgress,
    completedLessons,
    totalLessons,
    masteredObjectives,
    totalObjectives,
  };
}