# Gram Database Schema Documentation

This document describes the database schema for the Gram interactive grammar learning platform, designed around mastery learning principles.

## Core Design Principles

1. **Mastery Learning**: 80% threshold for lesson progression, 90% for unit completion
2. **Individual Progress Tracking**: Each learner's journey is tracked independently
3. **Adaptive Learning**: System adapts based on performance and patterns
4. **Comprehensive Analytics**: Detailed tracking for insights and improvement

## Database Overview

The schema consists of several main areas:

- **User Management**: Users, profiles, and preferences
- **Content Management**: Units, lessons, objectives, and content
- **Exercise System**: Practice exercises with various question types
- **Assessment System**: Formative and summative assessments
- **Progress Tracking**: Individual learner progress and mastery
- **Analytics**: Learning insights and performance data

## Entity Relationship Overview

```
Users
├── UserProfile (1:1)
├── UserPreferences (1:1)
├── LearnerProgress (1:N)
├── ObjectiveProgress (1:N)
├── AssessmentAttempts (1:N)
├── ExerciseAttempts (1:N)
└── UserAnalytics (1:N)

Content Hierarchy
Units (1:N)
├── Lessons (1:N)
│   ├── LearningObjectives (1:N)
│   ├── Exercises (1:N)
│   │   └── ExerciseQuestions (1:N)
│   └── Assessments (1:N)
│       └── AssessmentQuestions (1:N)
└── LearningObjectives (1:N)
```

## Table Descriptions

### User Management

#### Users

Primary user accounts with authentication information.

**Key Fields:**

- `id`: Unique identifier (CUID)
- `email`: User email (unique)
- `name`: Display name
- `createdAt`, `updatedAt`: Timestamps

#### UserProfile

Detailed user information for personalized learning.

**Key Fields:**

- `userId`: Foreign key to User
- `age`, `gradeLevel`: Demographic information
- `learningGoals`: User's stated objectives
- `preferredDifficulty`: User's skill level preference
- `learningStyle`: Visual, auditory, kinesthetic, or mixed

#### UserPreferences

UI and learning preference settings.

**Key Fields:**

- `theme`: Light, dark, or auto
- `dailyGoalMinutes`: Target daily study time
- `enableNotifications`, `enableSounds`, `showHints`: Feature toggles
- Accessibility preferences: `fontSize`, `highContrast`, `reducedMotion`

### Content Management

#### Units

Top-level learning modules (e.g., "Foundation Skills").

**Key Fields:**

- `title`, `description`: Content metadata
- `orderIndex`: Sequence in curriculum
- `masteryThreshold`: Required score for unit completion (default 0.9)
- `prerequisiteUnits`: JSON array of prerequisite unit IDs

#### Lessons

Individual learning sessions within units.

**Key Fields:**

- `unitId`: Parent unit
- `title`, `description`, `content`: Lesson content (Markdown)
- `orderIndex`: Sequence within unit
- `masteryThreshold`: Required score for lesson progression (default 0.8)
- `estimatedMinutes`: Expected completion time
- `difficulty`: Beginner, intermediate, advanced
- `tags`: JSON array of topic tags

#### LearningObjectives

Specific, measurable learning goals.

**Key Fields:**

- `title`, `description`: Objective details
- `category`: Bloom's taxonomy level (knowledge, comprehension, application, etc.)
- `masteryThreshold`: Required score for objective mastery

### Exercise System

#### Exercises

Practice activities within lessons.

**Key Fields:**

- `lessonId`: Parent lesson
- `type`: Practice, reinforcement, challenge, enrichment
- `timeLimit`: Optional time constraint
- `maxAttempts`: Maximum number of attempts allowed
- `difficulty`: Easy, medium, hard

#### ExerciseQuestions

Individual questions within exercises.

**Key Fields:**

- `exerciseId`: Parent exercise
- `objectiveId`: Related learning objective
- `type`: multiple_choice, fill_in_blank, drag_and_drop, sentence_builder
- `questionData`: JSON containing type-specific question configuration
- `correctAnswer`: JSON containing correct answer(s)
- `hints`: JSON array of progressive hints
- `correctFeedback`, `incorrectFeedback`: Response messages

#### ExerciseAttempts & ExerciseResponses

Tracking user exercise performance.

**Key Fields:**

- `userId`: User taking the exercise
- `startedAt`, `completedAt`: Time tracking
- `scorePercentage`: Final score
- `isPassed`: Whether attempt met mastery threshold

### Assessment System

#### Assessments

Formal evaluations of learning.

**Key Fields:**

- `lessonId`: Optional parent lesson
- `type`: Diagnostic, formative, summative, retention_check
- `masteryThreshold`: Required score for mastery
- `scheduledDelay`: For retention checks (days after lesson completion)

#### AssessmentQuestions

Questions within assessments.

**Similar structure to ExerciseQuestions but includes:**

- `difficulty`: Easy, medium, hard classification
- `distractors`: JSON array of wrong answers for analysis

#### AssessmentAttempts & AssessmentResponses

Tracking formal assessment performance.

**Key Fields:**

- `achievedMastery`: Whether attempt met mastery threshold
- `errorType`: Classification of errors for analytics
- `confidence`: User's confidence level (0-1)

### Progress Tracking

#### LearnerProgress

Individual progress through lessons.

**Key Fields:**

- `userId`, `lessonId`: User and lesson identifiers
- `status`: not_started, in_progress, completed, mastered
- `currentScore`, `bestScore`: Performance tracking
- `masteryAchieved`, `masteryDate`: Mastery status
- `totalTimeSpent`, `sessionsCount`: Engagement metrics
- `needsRemediation`: Flag for corrective instruction
- `eligibleForEnrichment`: Flag for advanced activities
- `enrichmentActivities`: JSON array of completed enrichment IDs

#### ObjectiveProgress

Granular progress tracking for learning objectives.

**Key Fields:**

- `userId`, `objectiveId`: User and objective identifiers
- `currentScore`, `bestScore`: Performance tracking
- `totalAttempts`, `correctAttempts`: Attempt tracking

### Analytics & Insights

#### UserAnalytics

Daily aggregated learning metrics.

**Key Fields:**

- `userId`, `date`: User and date identifiers
- `timeSpent`: Daily learning time
- `lessonsStarted`, `lessonsCompleted`: Daily progress
- `averageScore`, `masteryRate`, `retentionRate`: Performance metrics
- `preferredTimeOfDay`: Learning pattern insights
- `streakDays`: Consecutive days of activity

#### LearningInsight

AI-generated insights and recommendations.

**Key Fields:**

- `userId`: Target user
- `type`: Strength, weakness, recommendation, achievement
- `category`: Grammar_topic, learning_pattern, performance_trend
- `title`, `description`: Insight content
- `recommendations`: JSON array of suggested actions
- `confidence`: AI confidence in insight (0-1)
- `priority`: Low, medium, high

### System Tables

#### SystemConfig

Application-wide configuration settings.

**Key Fields:**

- `key`: Configuration parameter name
- `value`: Configuration value
- `description`: Human-readable description

#### ContentRevision

Version control for content changes.

**Key Fields:**

- `entityType`, `entityId`: Content being tracked
- `version`: Revision number
- `changes`: JSON describing modifications
- `status`: Draft, review, approved, published

## Data Types and Constraints

### Mastery Thresholds

- **Lesson Progression**: 80% (0.8)
- **Unit Completion**: 90% (0.9)
- **Objective Mastery**: 80% (0.8)
- **Retention Check**: 85% (0.85)

### Question Types

- `multiple_choice`: Single or multiple correct answers
- `fill_in_blank`: Text input with pattern matching
- `drag_and_drop`: Interactive element placement
- `sentence_builder`: Word/phrase arrangement
- `essay`: Open-ended text response (assessments only)

### JSON Field Structures

#### Question Data Examples

```json
// Multiple Choice
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0,
  "allowMultiple": false
}

// Fill in the Blank
{
  "template": "The {blank} jumped over the {blank}.",
  "blanks": [
    {"acceptedAnswers": ["cat", "dog", "animal"], "caseSensitive": false},
    {"acceptedAnswers": ["fence", "wall"], "caseSensitive": false}
  ]
}
```

#### Hints Structure

```json
[
  "First hint - gentle nudge",
  "Second hint - more specific",
  "Third hint - nearly gives away answer"
]
```

## Indexes and Performance

The schema includes logical indexes on frequently queried fields:

- User lookups: `email`, `userId` fields
- Content hierarchy: `unitId`, `lessonId`, `orderIndex`
- Progress tracking: `userId + lessonId`, `userId + objectiveId`
- Time-based queries: `createdAt`, `updatedAt`, `date` fields
- Analytics: `userId + date` for daily metrics

## Migration Strategy

1. **Initial Schema**: Complete database structure
2. **Seed Data**: Sample content and users for development
3. **Incremental Updates**: Schema versioning with Prisma migrations
4. **Data Validation**: Constraints and checks for data integrity

## Security Considerations

- User data isolation through proper foreign key relationships
- No sensitive data stored in plain text
- Audit trail through revision tracking
- Performance optimization through strategic indexing

This schema supports the full mastery learning cycle: content delivery → practice → assessment → progress tracking → adaptive instruction.
