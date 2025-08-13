---
description: Repository Information Overview
alwaysApply: true
---

# Gram - Interactive Grammar Learning Platform

## Summary

Gram is an interactive grammar learning platform designed to provide personalized, engaging grammar education. The project aims to democratize grammar education through adaptive learning paths, interactive exercises, and comprehensive curriculum coverage.

## Structure

- **src/**: Main application source code
  - **app/**: Next.js application pages and layouts
  - **components/**: Reusable UI components
  - **hooks/**: Custom React hooks
  - **services/**: Service layer for API interactions
  - **styles/**: CSS and styling files
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions
- **content/**: Grammar lesson content in markdown format
- **public/**: Static assets
- **tests/**: Test files (currently empty)

## Language & Runtime

**Language**: TypeScript
**Version**: ~5.8.3
**Framework**: Next.js (^15.4.6)
**Package Manager**: pnpm

## Dependencies

**Main Dependencies**:

- next: ^15.4.6
- react: ^19.1.1
- react-dom: ^19.1.1

**Development Dependencies**:

- typescript: ~5.8.3
- eslint: ^9.33.0
- tailwindcss: ^4.1.11
- postcss: ^8.5.6
- autoprefixer: ^10.4.21
- @types/react: ^19.1.10
- @types/node: ^24.2.1

## Build & Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Type checking
pnpm run typecheck
```

## Application Structure

**Entry Point**: src/app/page.tsx
**Layout**: src/app/layout.tsx
**Styling**: Tailwind CSS with PostCSS
**Routing**: Next.js App Router

## Content Management

**Format**: Markdown files in the content/ directory
**Lesson Structure**: Organized by units and lessons (e.g., unit-1-lesson-1-nouns.md)
**Template**: lesson-content-template.md provides the standard format for lesson content

## Configuration

**TypeScript**: tsconfig.json with strict type checking
**Next.js**: next.config.mjs with ESLint and TypeScript configuration
**Module Aliases**: Path aliases configured (@/_ for src/_)
**PostCSS**: postcss.config.mjs for CSS processing
**Tailwind**: tailwind.config.js for utility-first CSS framework
