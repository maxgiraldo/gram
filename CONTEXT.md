# CLAUDE.md - AI Agent Context for Gram Project

## Project Overview

Gram is an interactive web application for learning grammar based on **mastery learning principles**. It's built with Next.js, React, and TypeScript, using pnpm as the package manager and SQLite for local data storage.

## 🎯 **IMPORTANT: Task Assignment System**

**Before starting any work, you MUST follow the new file-based task assignment process:**

### New Task Management Structure (Updated)

**All tasks are now in individual files in the `/tasks/` directory to prevent conflicts between agents:**

1. **Browse Available Tasks**: Check the `/tasks/` directory for files with 🟢 AVAILABLE status
2. **Select Your Task**: Choose a task file (format: `TRACK-TASK_ID-TITLE.md`)
3. **Claim Task**: Edit ONLY that specific task file and change status to `🟡 ASSIGNED` with your agent name. Use a unique name prefixed with your agent type, e.g. "Claude-Raptor", "Zencoder-Tom"
4. **Start Work**: Change status to `🔵 IN_PROGRESS` when you begin
5. **Complete**: Change status to `✅ COMPLETED` when finished and tested
6. **Update Dependencies**: Check which other task files can now become available
7. **No File Conflicts**: Each agent works on their own task file - no stepping on toes!
8. **Avoid blocking others**: Do NOT claim BLOCKED or ASSIGNED tasks.
9. **Clear task statuses**: Always update task statuses accurately.
10. **Log your work**: Update `{AGENT_NAME}-log.md` with details about what you did each day.
11. **Be respectful**: Avoid blocking others by working on assigned tasks.
12. **Clear task statuses**: Ensure accurate status updates to avoid confusion.

### Task File Naming Convention

- `1-1.1-database-schema-setup.md` (Track 1, Task 1.1)
- `8-8.1-core-ui-component-library.md` (Track 8, Task 8.1)
- `2-2.1-mastery-calculator-logic.md` (Track 2, Task 2.1)

**⚠️ ONLY work on tasks in their own dedicated files - this prevents merge conflicts**

### Current Priority Tasks (Day 1-2):

**Available in `/tasks/` directory:**

- Task 1.1: Database Schema Setup → [`1-1.1-database-schema-setup.md`](./tasks/1-1.1-database-schema-setup.md)
- Task 2.1: Mastery Calculator Logic → [`2-2.1-mastery-calculator-logic.md`](./tasks/2-2.1-mastery-calculator-logic.md)
- Task 8.1: Core UI Component Library → [`8-8.1-core-ui-component-library.md`](./tasks/8-8.1-core-ui-component-library.md)

**Need task files created:**

- Task 3.1: Lesson Content Models
- Task 4.1: Exercise Type Components
- Task 6.1: Challenge Generator
- Task 12.1: Testing Infrastructure Setup

## Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Database**: SQLite with Prisma ORM
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS
- **State Management**: Zustand (lightweight)
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with Next.js config

## Project Structure

```
gram/
├── src/
│   ├── app/            # Next.js app directory (pages, layouts, API routes)
│   ├── components/     # Organized by feature (ui/, content/, exercises/, etc.)
│   ├── lib/            # Business logic (db/, assessment/, adaptive/, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── styles/         # Global styles
├── prisma/             # Database schema and migrations
├── public/             # Static public assets
├── __tests__/          # Test files
├── CURRICULUM.md       # Complete learning curriculum
└── DEVELOPMENT_PLAN_TASKS.md  # Task assignment system
```

## Key Commands

```bash
# Development
pnpm run dev           # Start Next.js dev server on http://localhost:3000

# Database (Prisma)
npx prisma generate    # Generate Prisma client after schema changes
npx prisma migrate dev # Create and apply new migration
npx prisma db seed     # Seed database with sample data
npx prisma studio      # Open database browser

# Building
pnpm run build         # Build for production
pnpm run start         # Start production server

# Code Quality
pnpm run lint          # Run Next.js ESLint
pnpm run typecheck     # Run TypeScript compiler check (tsc --noEmit)

# Testing
pnpm run test          # Run Jest test suite
pnpm run test:watch    # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage report
```

## Development Guidelines

### Mastery Learning Implementation

- **80% threshold** for lesson progression
- **90% threshold** for unit completion
- **Immediate corrective instruction** for struggling learners
- **Enrichment activities** for quick masters
- **Competency-based progression** (not time-based)
- **Real-time formative assessment** throughout lessons

### Component Development

- Use functional components with TypeScript
- Implement proper TypeScript types for all props
- Keep components small and focused (single responsibility)
- Use custom hooks for reusable logic
- Follow React best practices (memo, useMemo, useCallback where appropriate)
- Use Next.js Image component for optimized images
- Implement proper Server/Client component patterns
- **Follow feature-based organization**: `/components/ui/`, `/components/exercises/`, etc.

### Database & API Patterns

- **All database access through Prisma** in `/lib/db/queries/`
- **No direct SQL** in components
- **TypeScript for all data models** and API responses
- **SQLite for local storage** (no authentication required)
- **RESTful API design** with proper error handling

### State Management

- **Zustand for app-wide state** (lightweight and component-friendly)
- **React's built-in state** for component-specific data
- **Keep state as local as possible**
- **Use custom hooks** for complex state logic

### Styling Approach

- **Tailwind CSS** for all styling
- **Mobile-first responsive design**
- **Component-based design system** in `/components/ui/`
- **Consistent spacing and color variables**
- **WCAG 2.1 AA accessibility compliance**

### Code Quality Standards

- All code must pass TypeScript compilation
- No `any` types unless absolutely necessary
- Write self-documenting code with clear variable names
- Add JSDoc comments for complex functions
- Follow ESLint rules

### Testing Strategy

- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for critical user flows
- Aim for 80% code coverage

## Implementation Priorities (Task-Based)

### Phase 1 - Foundation (Week 1-2)

**Available Tasks**: 1.1, 2.1, 3.1, 4.1, 6.1, 8.1, 10.1

- Database schema and Prisma setup
- Core UI component library (Tailwind)
- Mastery learning assessment logic
- Exercise type components
- Testing infrastructure

### Phase 2 - Core Systems (Week 3-4)

**Dependencies unlock**: Database → API → Components

- Core database queries and API routes
- Assessment engine and progress tracking
- Lesson content management system
- Exercise generation and validation

### Phase 3 - Learning Features (Week 5-6)

**Mastery learning specific features**:

- Corrective instruction for struggling learners
- Enrichment activities for quick masters
- Progress dashboard and analytics
- Adaptive difficulty adjustment

### Phase 4 - Advanced Features (Week 7-8)

**AI-powered personalization**:

- Learning path optimization
- Personalization engine
- Advanced analytics and insights
- Performance optimization

## API Design Patterns

- RESTful endpoints for CRUD operations
- GraphQL for complex data queries (future consideration)
- Implement proper error handling and loading states
- Use TypeScript interfaces for all API responses

## Performance Considerations

- Leverage Next.js automatic code splitting and lazy loading
- Use Next.js Image component for automatic optimization
- Implement virtual scrolling for long lists
- Monitor bundle size with Next.js analyzer
- Use React.memo and useMemo appropriately
- Utilize Server Components where possible for better performance

## Accessibility Requirements

- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels
- Color contrast ratios (WCAG AA)
- Focus management

## Security Best Practices

- Sanitize all user inputs
- Implement Content Security Policy
- Use environment variables for sensitive data
- Regular dependency updates
- XSS and CSRF protection

## Git Workflow

- Feature branches from main
- Meaningful commit messages
- PR reviews before merging
- Semantic versioning

## Common Patterns

### Custom Hook Example

```typescript
// useLesson.ts
export const useLesson = (lessonId: string) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch lesson logic
  }, [lessonId]);

  return { lesson, loading, error };
};
```

### Component Structure

```typescript
// LessonCard.tsx
interface LessonCardProps {
  lesson: Lesson;
  onComplete: (lessonId: string) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onComplete,
}) => {
  // Component logic
};
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=           # Backend API URL (client-side)
NEXT_PUBLIC_AUTH_DOMAIN=       # Auth service domain (client-side)
NEXT_PUBLIC_ANALYTICS_ID=      # Analytics tracking ID (client-side)
DATABASE_URL=                  # Database connection (server-side)
API_SECRET_KEY=                # API secret (server-side)
```

## Troubleshooting Common Issues

1. **Module not found**: Run `pnpm install`
2. **Type errors**: Check TypeScript version compatibility
3. **Build failures**: Clear cache with `rm -rf node_modules .pnpm-store .next && pnpm install`
4. **Port already in use**: Use `pnpm dev -p 3001` to run on different port

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io)

## Notes for AI Agents

### 🚨 **CRITICAL: Task Assignment Rules (Updated)**

1. **ALWAYS check `/tasks/` directory first** for available task files
2. **ONLY work on 🟢 AVAILABLE tasks** in their dedicated files
3. **MUST update task status** in the specific task file when taking/starting/completing
4. **NO work on BLOCKED/ASSIGNED/IN_PROGRESS** tasks
5. **Update dependencies** by checking which task files can become available
6. **ONE AGENT PER TASK FILE** to prevent conflicts

### Code Quality Requirements

- **80% test coverage minimum** for all business logic
- **Zero TypeScript errors** - no `any` types allowed
- **Follow established patterns** in existing codebase
- **Mastery learning principles** must be implemented correctly
- **Always run tests** before marking task as completed

### Development Workflow (Updated)

1. **Claim task** by editing the specific task file in `/tasks/` directory
2. **Create feature branch** from main
3. **Implement with tests** (TDD preferred)
4. **Run linting and typecheck**: `pnpm run lint && pnpm run typecheck`
5. **Test thoroughly**: `pnpm run test`
6. **Update task status** to completed in your task file
7. **Check which dependent task files** can now become available

### Key Principles

- **Mastery learning first** - 80/90% thresholds are non-negotiable
- **Component isolation** - clear interfaces between features
- **Database through Prisma only** - no direct SQL
- **TypeScript strict mode** - proper typing for everything
- **Accessibility compliance** - WCAG 2.1 AA standards
- **Mobile-first design** - responsive Tailwind components

### Documentation Requirements

- **Update README** if adding new commands/features
- **Document complex algorithms** with JSDoc comments
- **Update API documentation** for new endpoints
- **Add component examples** for reusable UI components

### Helpful Commands

```bash
# Before starting work
pnpm run typecheck && pnpm run lint

# After completing work
pnpm run test && pnpm run build

# Database work
npx prisma generate && npx prisma migrate dev
```
