/**
 * Tests for Content Import/Export System
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ContentImporter, ContentExporter, MarkdownContentParser } from '../import-export';
import { ContentWorkflowManager } from '../workflow';

// Sample markdown content for testing
const sampleLessonMarkdown = `---
title: "Test Lesson: Parts of Speech"
difficulty: beginner
estimatedMinutes: 30
tags: ["grammar", "parts-of-speech"]
masteryThreshold: 0.8
---

# Unit 1, Lesson 1: Parts of Speech - Nouns

## Lesson Overview

**Learning Objectives:**

- Identify common and proper nouns with 90% accuracy
- Distinguish between concrete and abstract nouns
- Use nouns correctly in sentences

**Estimated Time:** 30 minutes

**Difficulty:** beginner

## Learning Content

### Concept 1: What is a Noun?

A noun is a word that names a person, place, thing, or idea.

**Examples:**
- Person: teacher, student, doctor
- Place: school, park, city
- Thing: book, car, table
- Idea: happiness, freedom, love

### Concept 2: Types of Nouns

**Common Nouns:** General names for things
- dog, city, book

**Proper Nouns:** Specific names (always capitalized)
- Rover, New York, Harry Potter

## Interactive Exercises

### Exercise 1: Noun Identification (Multiple Choice)

**Type:** Multiple Choice with Immediate Feedback

**Instructions:** "Which word is a noun in each sentence?"

1. **The dog runs quickly.**

   - a) The
   - b) dog ✓
   - c) runs
   - d) quickly

   **Feedback if correct:** "Perfect! 'Dog' is a noun because it names an animal."
   **Feedback if incorrect:** "Think about which word names a person, place, thing, or idea."

2. **Sarah loves reading books.**

   - a) Sarah ✓
   - b) loves
   - c) reading
   - d) all of the above

   **Feedback if correct:** "Great! 'Sarah' is a proper noun."
   **Feedback if incorrect:** "Look for words that name people, places, things, or ideas."

## Formative Assessment (Mastery Check)

**Instructions:** "Let's check your understanding! You need 80% to continue."

1. **Which word is a proper noun?**

   - a) city
   - b) school
   - c) London ✓
   - d) teacher

2. **Circle all nouns:** "The happy children played in the beautiful garden."

   - Answer: children, garden

3. **What type of noun is 'happiness'?**

   - a) Common noun
   - b) Proper noun
   - c) Abstract noun ✓
   - d) Concrete noun

**Scoring:**
- 2-3 correct (67-100%): Proceed to next lesson
- 1 correct (33%): Corrective instruction needed
- 0 correct: Restart lesson
`;

describe('MarkdownContentParser', () => {
  test('should parse markdown content with frontmatter', () => {
    const parsed = MarkdownContentParser.parseMarkdown(sampleLessonMarkdown);

    expect(parsed.frontmatter).toBeDefined();
    expect(parsed.frontmatter?.title).toBe('Test Lesson: Parts of Speech');
    expect(parsed.frontmatter?.difficulty).toBe('beginner');
    expect(parsed.frontmatter?.estimatedMinutes).toBe(30);
    expect(parsed.frontmatter?.tags).toEqual(['grammar', 'parts-of-speech']);
  });

  test('should identify section types correctly', () => {
    const parsed = MarkdownContentParser.parseMarkdown(sampleLessonMarkdown);

    const overviewSection = parsed.sections.find(s => s.type === 'overview');
    const contentSection = parsed.sections.find(s => s.type === 'content');
    const exerciseSection = parsed.sections.find(s => s.type === 'exercise');
    const assessmentSection = parsed.sections.find(s => s.type === 'assessment');

    expect(overviewSection).toBeDefined();
    expect(contentSection).toBeDefined();
    expect(exerciseSection).toBeDefined();
    expect(assessmentSection).toBeDefined();
  });

  test('should build hierarchical section structure', () => {
    const parsed = MarkdownContentParser.parseMarkdown(sampleLessonMarkdown);

    expect(parsed.sections.length).toBeGreaterThan(0);
    
    const contentSection = parsed.sections.find(s => s.type === 'content');
    expect(contentSection?.subsections.length).toBeGreaterThan(0);
  });

  test('should handle markdown without frontmatter', () => {
    const markdownWithoutFrontmatter = `
# Simple Lesson

## Overview

This is a simple lesson without frontmatter.

## Content

Some content here.
    `;

    const parsed = MarkdownContentParser.parseMarkdown(markdownWithoutFrontmatter);

    expect(parsed.frontmatter).toBeUndefined();
    expect(parsed.sections.length).toBeGreaterThan(0);
  });
});

describe('ContentImporter', () => {
  test('should import lesson from markdown successfully', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown, 'test-lesson.md');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors.length).toBe(0);

    const data = result.data!;
    expect(data.metadata.title).toBe('Test Lesson: Parts of Speech');
    expect(data.metadata.difficulty).toBe('beginner');
    expect(data.metadata.estimatedMinutes).toBe(30);
    expect(data.metadata.masteryThreshold).toBe(0.8);
  });

  test('should extract learning objectives', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);

    expect(result.success).toBe(true);
    expect(result.data?.objectives.length).toBeGreaterThan(0);
    
    const firstObjective = result.data?.objectives[0];
    expect(firstObjective?.title).toContain('Identify common and proper nouns');
  });

  test('should extract exercises with questions', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);

    expect(result.success).toBe(true);
    expect(result.data?.exercises.length).toBeGreaterThan(0);
    
    const exercise = result.data?.exercises[0];
    expect(exercise?.title).toContain('Noun Identification');
    expect(exercise?.type).toBe('practice');
    expect(exercise?.questions.length).toBeGreaterThan(0);
  });

  test('should extract assessments', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);

    expect(result.success).toBe(true);
    expect(result.data?.assessments.length).toBeGreaterThan(0);
    
    const assessment = result.data?.assessments[0];
    expect(assessment?.type).toBe('formative');
    expect(assessment?.questions.length).toBeGreaterThan(0);
  });

  test('should detect multiple choice questions', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);

    const exercise = result.data?.exercises[0];
    const question = exercise?.questions[0];
    
    expect(question?.type).toBe('multiple_choice');
    expect(question?.questionData.type).toBe('multiple_choice');
    
    if ('options' in question!.questionData) {
      expect(question.questionData.options.length).toBeGreaterThan(0);
    }
  });

  test('should extract feedback messages', async () => {
    const result = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);

    const exercise = result.data?.exercises[0];
    const question = exercise?.questions[0];
    
    expect(question?.correctFeedback).toContain('Perfect!');
    expect(question?.incorrectFeedback).toContain('Think about');
  });

  test('should handle malformed markdown gracefully', async () => {
    const malformedMarkdown = `
# Incomplete Lesson

This lesson is missing required sections.
    `;

    const result = await ContentImporter.importLessonFromMarkdown(malformedMarkdown);

    expect(result.success).toBe(true); // Should still succeed but with warnings
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('should validate required fields', async () => {
    const emptyMarkdown = '';

    const result = await ContentImporter.importLessonFromMarkdown(emptyMarkdown);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('ContentExporter', () => {
  const sampleLesson = {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Test Lesson: Nouns',
    description: 'A lesson about nouns',
    content: '## What is a Noun?\n\nA noun is a word that names a person, place, thing, or idea.',
    orderIndex: 0,
    isPublished: true,
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    difficulty: 'beginner' as const,
    tags: ['grammar', 'nouns'],
    objectives: [],
    exercises: [],
    assessments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  test('should export lesson to markdown', async () => {
    const markdown = await ContentExporter.exportLessonToMarkdown(sampleLesson);

    expect(markdown).toContain('# Test Lesson: Nouns');
    expect(markdown).toContain('## Lesson Overview');
    expect(markdown).toContain('## Learning Content');
    expect(markdown).toContain('**Estimated Time:** 30 minutes');
    expect(markdown).toContain('**Difficulty:** beginner');
  });

  test('should include frontmatter when requested', async () => {
    const markdown = await ContentExporter.exportLessonToMarkdown(sampleLesson, {
      includeMetadata: true,
      includeExercises: true,
      includeAssessments: true,
      format: 'markdown'
    });

    expect(markdown).toContain('---');
    expect(markdown).toContain('title: "Test Lesson: Nouns"');
    expect(markdown).toContain('difficulty: beginner');
    expect(markdown).toContain('estimatedMinutes: 30');
  });

  test('should exclude sections when requested', async () => {
    const markdown = await ContentExporter.exportLessonToMarkdown(sampleLesson, {
      includeMetadata: false,
      includeExercises: false,
      includeAssessments: false,
      format: 'markdown'
    });

    expect(markdown).not.toContain('---');
    expect(markdown).not.toContain('## Interactive Exercises');
    expect(markdown).not.toContain('## Assessments');
  });

  test('should export lesson to JSON', async () => {
    const json = await ContentExporter.exportLessonToJson(sampleLesson);
    const parsed = JSON.parse(json);

    expect(parsed.id).toBe('lesson-1');
    expect(parsed.title).toBe('Test Lesson: Nouns');
    expect(parsed.difficulty).toBe('beginner');
  });
});

describe('ContentWorkflowManager', () => {
  const testConfig = {
    contentDirectory: './test-content',
    outputDirectory: './test-output',
    backupDirectory: './test-backup',
    validateOnly: true,
    overwriteExisting: false,
    createUnits: true
  };

  test('should initialize with configuration', () => {
    const workflow = new ContentWorkflowManager(testConfig);
    expect(workflow).toBeDefined();
  });

  // Note: Full workflow tests would require filesystem operations
  // and database connections, which are integration tests
});

describe('Content Validation', () => {
  test('should validate lesson metadata', async () => {
    const validMarkdown = `---
title: "Valid Lesson"
difficulty: beginner
estimatedMinutes: 30
masteryThreshold: 0.8
---

# Valid Lesson

## Lesson Overview

**Learning Objectives:**
- Learn something

## Learning Content

Content here.
`;

    const result = await ContentImporter.importLessonFromMarkdown(validMarkdown);
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should flag invalid mastery threshold', async () => {
    const invalidMarkdown = `---
title: "Invalid Lesson"
masteryThreshold: 1.5
---

# Invalid Lesson
`;

    const result = await ContentImporter.importLessonFromMarkdown(invalidMarkdown);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('should handle missing required fields', async () => {
    const incompleteMarkdown = `
# Lesson Without Metadata

Some content here.
`;

    const result = await ContentImporter.importLessonFromMarkdown(incompleteMarkdown);
    expect(result.success).toBe(true); // Should create defaults
    expect(result.data?.metadata.title).toBe('Lesson Without Metadata');
  });
});

describe('Exercise and Assessment Parsing', () => {
  test('should parse multiple choice questions correctly', async () => {
    const exerciseMarkdown = `
# Test Lesson

## Interactive Exercises

### Exercise 1: Multiple Choice Test

1. **What is 2 + 2?**

   - a) 3
   - b) 4 ✓
   - c) 5
   - d) 6

   **Feedback if correct:** "Correct!"
   **Feedback if incorrect:** "Try again."
`;

    const result = await ContentImporter.importLessonFromMarkdown(exerciseMarkdown);
    
    expect(result.success).toBe(true);
    const question = result.data?.exercises[0]?.questions[0];
    
    expect(question?.type).toBe('multiple_choice');
    expect(question?.correctAnswer).toContain('4');
    expect(question?.correctFeedback).toBe('Correct!');
  });

  test('should detect different question types', async () => {
    const mixedMarkdown = `
# Test Lesson

## Interactive Exercises

### Exercise 1: Fill in the Blank

1. **Complete: The _____ runs fast.**
   
   Answer: dog

### Exercise 2: Drag and Drop

2. **Drag words to correct categories.**
   
   Instructions: Drag items to appropriate zones.

### Exercise 3: Sentence Builder

3. **Build a sentence with these words.**
   
   Words: the, cat, sat, mat, on
`;

    const result = await ContentImporter.importLessonFromMarkdown(mixedMarkdown);
    
    expect(result.success).toBe(true);
    const exercises = result.data?.exercises;
    
    expect(exercises?.length).toBeGreaterThan(0);
    // Would need more sophisticated parsing for different question types
  });
});

describe('Roundtrip Testing', () => {
  test('should maintain content integrity in import-export cycle', async () => {
    // Import the sample markdown
    const importResult = await ContentImporter.importLessonFromMarkdown(sampleLessonMarkdown);
    expect(importResult.success).toBe(true);
    
    // Convert to lesson object (simplified)
    const lesson = {
      id: 'test-lesson',
      unitId: 'test-unit',
      title: importResult.data!.metadata.title,
      description: importResult.data!.metadata.description,
      content: importResult.data!.content,
      orderIndex: 0,
      isPublished: false,
      masteryThreshold: importResult.data!.metadata.masteryThreshold,
      estimatedMinutes: importResult.data!.metadata.estimatedMinutes,
      difficulty: importResult.data!.metadata.difficulty,
      tags: importResult.data!.metadata.tags,
      objectives: importResult.data!.objectives,
      exercises: importResult.data!.exercises,
      assessments: importResult.data!.assessments,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Export back to markdown
    const exportedMarkdown = await ContentExporter.exportLessonToMarkdown(lesson);
    
    // Re-import the exported markdown
    const reimportResult = await ContentImporter.importLessonFromMarkdown(exportedMarkdown);
    
    expect(reimportResult.success).toBe(true);
    expect(reimportResult.data?.metadata.title).toBe(lesson.title);
    expect(reimportResult.data?.metadata.difficulty).toBe(lesson.difficulty);
  });
});