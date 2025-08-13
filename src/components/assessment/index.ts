/**
 * Assessment Component Exports
 * 
 * Centralized exports for all assessment-related components
 */

// Main assessment components
export { AssessmentInterface } from './AssessmentInterface';
export type { AssessmentInterfaceProps } from './AssessmentInterface';

export { AssessmentWorkflow } from './AssessmentWorkflow';
export type { AssessmentWorkflowProps } from './AssessmentWorkflow';

export { ScoreDisplay } from './ScoreDisplay';
export type { 
  ScoreDisplayProps, 
  ScoreBreakdown, 
  TimeMetrics 
} from './ScoreDisplay';

export { MasteryIndicator } from './MasteryIndicator';
export type { 
  MasteryIndicatorProps, 
  MasteryData, 
  MasteryLevel 
} from './MasteryIndicator';

// Progress visualization components
export {
  ProgressTimeline,
  ObjectivesGrid,
  LessonProgressCards,
  PerformanceChart
} from './ProgressVisualization';
export type {
  ProgressTimelineProps,
  ObjectivesGridProps,
  LessonProgressCardsProps,
  PerformanceChartProps,
  ProgressDataPoint,
  ObjectiveProgress,
  LessonProgressSummary
} from './ProgressVisualization';

// Utility functions
export { 
  getMasteryColor, 
  getMasteryLabel, 
  calculateMasteryProgress 
} from './MasteryIndicator';