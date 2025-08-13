# Gram - Interactive Grammar Learning Platform

## Vision

Gram aims to revolutionize grammar education by providing an interactive, engaging, and personalized learning experience. We believe that mastering grammar should be accessible, enjoyable, and tailored to individual learning styles and pace.

## Project Goals

- **Democratize Grammar Education**: Make high-quality grammar instruction available to learners worldwide, regardless of their background or resources
- **Personalized Learning Paths**: Create adaptive learning experiences that adjust to each student's proficiency level and learning speed
- **Engagement Through Interactivity**: Replace traditional rote memorization with interactive exercises, real-world examples, and gamified challenges
- **Comprehensive Coverage**: Build a complete curriculum covering grammar fundamentals to advanced concepts across multiple languages
- **Data-Driven Improvement**: Use analytics to continuously improve content and identify common learning obstacles

## Features

### Core Learning Features
- **Interactive Lessons**: Step-by-step grammar tutorials with inline practice exercises
- **Real-Time Feedback**: Instant corrections and explanations for mistakes
- **Progress Tracking**: Visual dashboards showing learning progress and mastery levels
- **Adaptive Difficulty**: Exercises that automatically adjust based on performance

### Content & Curriculum
- **Structured Courses**: Organized modules from beginner to advanced levels
- **Grammar Rules Database**: Comprehensive reference guide with examples
- **Practice Exercises**: Thousands of exercises covering all grammar topics
- **Real-World Context**: Examples from literature, news, and everyday communication

### Engagement & Gamification
- **Achievement System**: Badges and rewards for completing lessons and milestones
- **Daily Challenges**: Quick daily exercises to maintain consistent practice
- **Streak Tracking**: Motivation through consecutive day counters
- **Leaderboards**: Optional competitive elements for motivated learners

### Learning Tools
- **Grammar Checker**: AI-powered tool to check and explain grammar in user-submitted text
- **Writing Assistant**: Guided writing exercises with grammar suggestions
- **Vocabulary Integration**: Connect grammar lessons with vocabulary building
- **Multi-Language Support**: Initially English, with plans for other languages

### Accessibility & Customization
- **Multiple Learning Modes**: Visual, auditory, and kinesthetic learning options
- **Offline Mode**: Download lessons for learning without internet connection
- **Accessibility Features**: Screen reader support, adjustable fonts, and high contrast modes
- **Custom Study Plans**: Create personalized learning schedules and goals

## Technical Stack

### Core Technologies
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript 5.8
- **Package Manager**: pnpm
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)

### Frontend
- **UI Components**: React 19.1 with Server Components
- **Styling**: Tailwind CSS v4.1 with CSS-first configuration
- **Design System**: Linear-style UI with Catalyst UI Kit components
- **Animations**: Framer Motion
- **Icons**: Heroicons

### Backend & Data
- **API Routes**: Next.js API routes with TypeScript
- **Database ORM**: Prisma 6.14
- **Validation**: Zod schemas
- **Authentication**: TBD

### Testing & Quality
- **Test Framework**: Vitest with React Testing Library
- **Linting**: ESLint with TypeScript support
- **Type Checking**: Strict TypeScript configuration

### Key Features Implemented
- ✅ Mastery-based learning system with adaptive algorithms
- ✅ Real-time feedback engine with intelligent hint generation
- ✅ Multiple exercise types (Multiple Choice, Fill-in-the-Blank, Drag & Drop, Sentence Builder)
- ✅ Comprehensive assessment system with progress tracking
- ✅ Content management with structured lessons and objectives
- ✅ Accessibility-first design with screen reader support
- ✅ Modern, responsive UI with Tailwind CSS v4

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up database
pnpm prisma generate
pnpm prisma db push
pnpm run db:seed

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Database commands
pnpm run db:reset  # Reset and reseed database
```

## Project Structure

```
gram/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # React components
│   │   ├── ui/          # Catalyst UI Kit components
│   │   ├── exercises/   # Exercise type components
│   │   ├── assessment/  # Assessment components
│   │   └── content/     # Content display components
│   ├── lib/             # Business logic and utilities
│   │   ├── assessment/  # Mastery calculation and progress evaluation
│   │   ├── exercises/   # Exercise generation and feedback
│   │   ├── db/         # Database queries and providers
│   │   └── validation/ # Zod schemas
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript type definitions
├── prisma/             # Database schema and migrations
├── content/            # Lesson content markdown files
└── tasks/              # Development task tracking

## Contributing

We welcome contributions! Please see our contributing guidelines (coming soon) for more information.

## License

MIT License
