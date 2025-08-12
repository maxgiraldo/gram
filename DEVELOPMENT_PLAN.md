# Gram Development Plan

## Parallel Development Strategy for Mastery Learning Grammar App

---

## Architecture Overview

### Core Philosophy

- **Component-based architecture** for parallel development
- **SQLite local database** for data persistence
- **No authentication required** (single-user local app)
- **API-first design** with clear interfaces between components
- **Independent feature modules** to prevent development conflicts

### Technology Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **State Management**: Zustand (lightweight, component-friendly)
- **Testing**: Jest + React Testing Library

---

## Parallel Development Tracks

## 🏗️ **TRACK 1: Database & Core API**

_Foundation layer - should be completed first_

### Components:

- **Database Schema Design**
- **Prisma Setup & Models**
- **Core API Routes**
- **Data Access Layer**

### Deliverables:

```
/lib/db/
  ├── schema.prisma
  ├── migrations/
  ├── seed.ts
  └── queries/
/api/
  ├── lessons/
  ├── assessments/
  ├── progress/
  └── analytics/
```

---

## 🧠 **TRACK 2: Assessment Engine**

_Core mastery learning logic_

### Components:

- **Mastery Threshold Calculator**
- **Assessment Scoring System**
- **Progress Evaluation Logic**
- **Retention Check Scheduler**

### Deliverables:

```
/lib/assessment/
  ├── mastery-calculator.ts
  ├── scoring-engine.ts
  ├── progress-evaluator.ts
  └── retention-scheduler.ts
/components/assessment/
  ├── AssessmentInterface.tsx
  ├── ScoreDisplay.tsx
  └── MasteryIndicator.tsx
```

---

## 📚 **TRACK 3: Content Management System**

_Lesson content and structure_

### Components:

- **Lesson Content Renderer**
- **Exercise Type Components**
- **Content Navigation**
- **Learning Objective Tracker**

### Deliverables:

```
/components/content/
  ├── LessonViewer.tsx
  ├── ConceptExplainer.tsx
  ├── ExampleDisplay.tsx
  └── KeyConceptsList.tsx
/components/exercises/
  ├── MultipleChoice.tsx
  ├── DragAndDrop.tsx
  ├── FillInTheBlank.tsx
  ├── SentenceBuilder.tsx
  └── TextAnalysis.tsx
```

---

## 🎯 **TRACK 4: Exercise System**

_Interactive learning components_

### Components:

- **Exercise Generator**
- **Real-time Feedback System**
- **Difficulty Adjustment Logic**
- **Exercise Progress Tracking**

### Deliverables:

```
/lib/exercises/
  ├── exercise-generator.ts
  ├── feedback-engine.ts
  ├── difficulty-adjuster.ts
  └── exercise-validator.ts
/components/exercises/
  ├── ExerciseContainer.tsx
  ├── FeedbackPanel.tsx
  ├── HintSystem.tsx
  └── ProgressBar.tsx
```

---

## 🔄 **TRACK 5: Corrective Instruction System**

_Remediation and support features_

### Components:

- **Learning Gap Analyzer**
- **Alternative Explanation Generator**
- **Remediation Path Creator**
- **Support Resource Manager**

### Deliverables:

```
/lib/corrective/
  ├── gap-analyzer.ts
  ├── remediation-engine.ts
  ├── alternative-explanations.ts
  └── support-resources.ts
/components/corrective/
  ├── RemediationPanel.tsx
  ├── AlternativeExplanation.tsx
  ├── SupportHints.tsx
  └── RetryInterface.tsx
```

---

## 🚀 **TRACK 6: Enrichment System**

_Advanced challenges and extensions_

### Components:

- **Challenge Generator**
- **Creative Project Templates**
- **Advanced Exercise Creator**
- **Cross-Curricular Connections**

### Deliverables:

```
/lib/enrichment/
  ├── challenge-generator.ts
  ├── project-templates.ts
  ├── advanced-exercises.ts
  └── cross-curricular.ts
/components/enrichment/
  ├── ChallengeInterface.tsx
  ├── ProjectBuilder.tsx
  ├── AdvancedExercises.tsx
  └── CreativePrompts.tsx
```

---

## 📊 **TRACK 7: Progress Tracking & Analytics**

_Learning analytics and reporting_

### Components:

- **Progress Dashboard**
- **Learning Analytics Engine**
- **Performance Visualizations**
- **Competency Mapping**

### Deliverables:

```
/lib/analytics/
  ├── progress-calculator.ts
  ├── performance-analyzer.ts
  ├── competency-mapper.ts
  └── learning-insights.ts
/components/dashboard/
  ├── ProgressDashboard.tsx
  ├── MasteryMap.tsx
  ├── PerformanceCharts.tsx
  └── LearningInsights.tsx
```

---

## 🎨 **TRACK 8: UI/UX Components**

_User interface and experience_

### Components:

- **Layout Components**
- **Navigation System**
- **Responsive Design**
- **Accessibility Features**

### Deliverables:

```
/components/ui/
  ├── Layout.tsx
  ├── Navigation.tsx
  ├── Sidebar.tsx
  └── Modal.tsx
/components/common/
  ├── Button.tsx
  ├── Card.tsx
  ├── LoadingSpinner.tsx
  └── Toast.tsx
```

---

## 🧪 **TRACK 9: Adaptive Learning Engine**

_Personalization and optimization_

### Components:

- **Learning Path Optimizer**
- **Preference Analyzer**
- **Difficulty Calibrator**
- **Personalization Engine**

### Deliverables:

```
/lib/adaptive/
  ├── path-optimizer.ts
  ├── preference-analyzer.ts
  ├── difficulty-calibrator.ts
  └── personalization-engine.ts
/components/adaptive/
  ├── PathRecommendations.tsx
  ├── DifficultySettings.tsx
  └── LearningPreferences.tsx
```

---

## 🔧 **TRACK 10: Testing & Quality Assurance**

_Comprehensive testing strategy_

### Components:

- **Unit Tests for Core Logic**
- **Component Testing Suite**
- **Integration Tests**
- **Performance Testing**

### Deliverables:

```
/__tests__/
  ├── unit/
  ├── components/
  ├── integration/
  └── performance/
/cypress/
  ├── e2e/
  └── fixtures/
```

---

## Database Schema

### Core Tables

```sql
-- Users table (even without auth, for progress tracking)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  current_level INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum structure
CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  level INTEGER NOT NULL
);

CREATE TABLE lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER REFERENCES units(id),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  learning_objectives TEXT, -- JSON array
  prerequisites TEXT, -- JSON array of lesson IDs
  mastery_threshold REAL DEFAULT 0.8
);

-- Content and exercises
CREATE TABLE concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER REFERENCES lessons(id),
  name TEXT NOT NULL,
  explanation TEXT,
  examples TEXT, -- JSON array
  order_index INTEGER NOT NULL
);

CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER REFERENCES lessons(id),
  concept_id INTEGER REFERENCES concepts(id),
  type TEXT NOT NULL, -- 'multiple_choice', 'drag_drop', etc.
  content TEXT NOT NULL, -- JSON exercise data
  difficulty_level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 1
);

-- Assessment and progress
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  type TEXT NOT NULL, -- 'diagnostic', 'formative', 'mastery'
  score REAL NOT NULL,
  total_points INTEGER NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_mastery_achieved BOOLEAN DEFAULT FALSE
);

CREATE TABLE exercise_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  exercise_id INTEGER REFERENCES exercises(id),
  user_answer TEXT, -- JSON
  is_correct BOOLEAN,
  time_spent INTEGER, -- milliseconds
  hints_used INTEGER DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Progress tracking
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'mastered'
  current_step INTEGER DEFAULT 0,
  mastery_score REAL,
  time_spent INTEGER DEFAULT 0, -- total milliseconds
  attempts INTEGER DEFAULT 0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Corrective instruction
CREATE TABLE corrective_instructions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  error_patterns TEXT, -- JSON array of identified errors
  recommended_activities TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE
);

-- Enrichment activities
CREATE TABLE enrichment_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER REFERENCES lessons(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'challenge', 'project', 'creative'
  content TEXT, -- JSON activity data
  difficulty_level INTEGER DEFAULT 2
);

CREATE TABLE user_enrichment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  activity_id INTEGER REFERENCES enrichment_activities(id),
  status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
  started_at DATETIME,
  completed_at DATETIME
);
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Parallel Tracks**: 1, 8, 10

- Database setup and schema
- Basic UI components
- Testing infrastructure

### Phase 2: Core Systems (Week 3-4)

**Parallel Tracks**: 2, 3, 4

- Assessment engine
- Content management
- Exercise system

### Phase 3: Learning Features (Week 5-6)

**Parallel Tracks**: 5, 6, 7

- Corrective instruction
- Enrichment system
- Progress tracking

### Phase 4: Advanced Features (Week 7-8)

**Parallel Tracks**: 9

- Adaptive learning
- Advanced analytics
- Performance optimization

---

## API Interface Contracts

### Assessment API

```typescript
// GET /api/assessments/diagnostic/:lessonId
// POST /api/assessments/submit
// GET /api/assessments/mastery/:userId/:lessonId

interface AssessmentResult {
  id: string;
  score: number;
  totalPoints: number;
  masteryAchieved: boolean;
  incorrectAnswers: Array<{
    exerciseId: string;
    userAnswer: any;
    correctAnswer: any;
    concept: string;
  }>;
}
```

### Progress API

```typescript
// GET /api/progress/:userId
// POST /api/progress/update
// GET /api/progress/lesson/:lessonId

interface LessonProgress {
  lessonId: string;
  status: "not_started" | "in_progress" | "mastered";
  currentStep: number;
  masteryScore: number;
  timeSpent: number;
  prerequisitesMet: boolean;
}
```

### Exercise API

```typescript
// GET /api/exercises/:lessonId
// POST /api/exercises/submit
// GET /api/exercises/feedback/:attemptId

interface ExerciseSubmission {
  exerciseId: string;
  userAnswer: any;
  timeSpent: number;
  hintsUsed: number;
}
```

---

## Component Dependencies

### Dependency Graph

```
Database Layer (Track 1)
    ↓
Assessment Engine (Track 2) ← Exercise System (Track 4)
    ↓                              ↓
Progress Tracking (Track 7) ← Content Management (Track 3)
    ↓                              ↓
Corrective Instruction (Track 5) ← UI Components (Track 8)
    ↓                              ↓
Enrichment System (Track 6) ← Adaptive Learning (Track 9)
    ↓
Testing (Track 10)
```

---

## File Structure

```
gram/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (Track 1)
│   │   ├── lessons/           # Lesson pages (Track 3)
│   │   ├── dashboard/         # Progress dashboard (Track 7)
│   │   └── practice/          # Exercise interface (Track 4)
│   │
│   ├── components/
│   │   ├── ui/               # Basic UI components (Track 8)
│   │   ├── content/          # Content components (Track 3)
│   │   ├── exercises/        # Exercise components (Track 4)
│   │   ├── assessment/       # Assessment components (Track 2)
│   │   ├── corrective/       # Corrective instruction (Track 5)
│   │   ├── enrichment/       # Enrichment components (Track 6)
│   │   ├── dashboard/        # Analytics components (Track 7)
│   │   └── adaptive/         # Adaptive learning (Track 9)
│   │
│   ├── lib/
│   │   ├── db/               # Database layer (Track 1)
│   │   ├── assessment/       # Assessment logic (Track 2)
│   │   ├── exercises/        # Exercise logic (Track 4)
│   │   ├── corrective/       # Corrective instruction (Track 5)
│   │   ├── enrichment/       # Enrichment logic (Track 6)
│   │   ├── analytics/        # Analytics logic (Track 7)
│   │   └── adaptive/         # Adaptive learning (Track 9)
│   │
│   ├── types/                # TypeScript definitions
│   ├── hooks/                # Custom React hooks
│   └── utils/                # Utility functions
│
├── prisma/                   # Database schema and migrations
├── __tests__/                # Test files (Track 10)
├── docs/                     # Documentation
└── scripts/                  # Build and deployment scripts
```

---

## Development Guidelines for Parallel Work

### 1. Interface-First Development

- Define TypeScript interfaces before implementation
- Each track must export clear API contracts
- Use dependency injection for cross-track dependencies

### 2. Component Isolation

- Each component should be self-contained
- Use props/state for data, avoid global state initially
- Implement mock data for independent development

### 3. Database Access Patterns

- All database access through Prisma queries in `/lib/db/queries/`
- No direct SQL in components
- Use TypeScript for type safety

### 4. Testing Strategy

- Unit tests for all business logic
- Component tests for UI interactions
- Integration tests for API endpoints
- Each track responsible for their own tests

### 5. Communication Protocol

- Weekly sync meetings for interface changes
- Shared TypeScript types in `/types/` folder
- Documentation updates with each feature
- Use feature flags for incomplete functionality

---

This development plan allows up to 10 developers/agents to work in parallel while minimizing conflicts and dependencies. Each track has clear boundaries, deliverables, and interfaces that enable independent development while building toward the complete mastery learning system.
