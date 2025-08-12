/**
 * Example Content Structures
 * 
 * Comprehensive examples of how to structure lesson content, exercises,
 * assessments, and learning objectives. These examples demonstrate proper
 * relationships and best practices for content creation.
 */

import {
  type Unit,
  type Lesson,
  type LearningObjective,
  type Exercise,
  type ExerciseQuestion,
  type Assessment,
  type AssessmentQuestion,
  type MultipleChoiceData,
  type FillInBlankData,
  type DragAndDropData,
  type SentenceBuilderData,
} from '../../types/content';

// ===== EXAMPLE UNIT =====

/**
 * Example unit: Basic Grammar Fundamentals
 */
export const exampleUnit: Unit = {
  id: 'unit-basic-grammar',
  title: 'Basic Grammar Fundamentals',
  description: 'Introduction to essential grammar concepts including parts of speech, sentence structure, and basic punctuation.',
  orderIndex: 1,
  isPublished: true,
  masteryThreshold: 0.9, // 90% for unit completion
  prerequisiteUnits: [], // No prerequisites for first unit
  lessons: [], // Will be populated with lessons
  objectives: [], // Will be populated with objectives
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ===== EXAMPLE LESSONS =====

/**
 * Example lesson: Introduction to Nouns
 */
export const exampleLesson: Lesson = {
  id: 'lesson-intro-nouns',
  unitId: 'unit-basic-grammar',
  title: 'Introduction to Nouns',
  description: 'Learn about nouns, their types, and how to identify them in sentences.',
  content: `# Introduction to Nouns

## What is a Noun?

A noun is a word that names a person, place, thing, or idea. Nouns are one of the most important parts of speech in English.

## Types of Nouns

### 1. Common Nouns
Common nouns name general things, people, or places:
- **Person**: teacher, student, doctor
- **Place**: school, park, city
- **Thing**: book, computer, chair

### 2. Proper Nouns
Proper nouns name specific people, places, or things and are always capitalized:
- **Person**: John, Mary, Shakespeare
- **Place**: London, America, Central Park
- **Thing**: iPhone, Toyota, Monday

### 3. Abstract Nouns
Abstract nouns name ideas, feelings, or concepts that you cannot touch:
- happiness, love, freedom, justice

### 4. Concrete Nouns
Concrete nouns name things you can see, hear, touch, smell, or taste:
- apple, music, flower, perfume

## Practice
Try to identify the nouns in these sentences:
1. The cat sat on the mat.
2. Sarah loves chocolate ice cream.
3. Happiness is important for health.`,
  orderIndex: 1,
  isPublished: true,
  masteryThreshold: 0.8, // 80% for lesson progression
  estimatedMinutes: 25,
  difficulty: 'beginner',
  tags: ['nouns', 'parts-of-speech', 'grammar-basics'],
  objectives: [], // Will be populated
  exercises: [], // Will be populated
  assessments: [], // Will be populated
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ===== EXAMPLE LEARNING OBJECTIVES =====

/**
 * Example learning objectives for the nouns lesson
 */
export const exampleObjectives: LearningObjective[] = [
  {
    id: 'obj-identify-nouns',
    lessonId: 'lesson-intro-nouns',
    title: 'Identify Nouns in Sentences',
    description: 'Students will be able to identify nouns in given sentences with 80% accuracy.',
    category: 'knowledge',
    masteryThreshold: 0.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'obj-classify-noun-types',
    lessonId: 'lesson-intro-nouns',
    title: 'Classify Types of Nouns',
    description: 'Students will be able to distinguish between common, proper, abstract, and concrete nouns.',
    category: 'comprehension',
    masteryThreshold: 0.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'obj-use-nouns-context',
    lessonId: 'lesson-intro-nouns',
    title: 'Use Nouns in Context',
    description: 'Students will be able to create sentences using different types of nouns appropriately.',
    category: 'application',
    masteryThreshold: 0.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ===== EXAMPLE EXERCISES =====

/**
 * Example exercise: Noun Identification Practice
 */
export const exampleExercise: Exercise = {
  id: 'exercise-noun-identification',
  lessonId: 'lesson-intro-nouns',
  title: 'Noun Identification Practice',
  description: 'Practice identifying nouns in various sentences.',
  type: 'practice',
  orderIndex: 1,
  timeLimit: 300, // 5 minutes
  maxAttempts: 3,
  difficulty: 'beginner',
  questions: [], // Will be populated with questions
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Example exercise questions with different types
 */
export const exampleExerciseQuestions: ExerciseQuestion[] = [
  // Multiple Choice Question
  {
    id: 'eq-mc-noun-identify',
    exerciseId: 'exercise-noun-identification',
    objectiveId: 'obj-identify-nouns',
    questionText: 'Which word in this sentence is a noun? "The happy dog barked loudly."',
    type: 'multiple_choice',
    orderIndex: 1,
    points: 1,
    questionData: {
      type: 'multiple_choice',
      options: ['happy', 'dog', 'barked', 'loudly'],
      shuffleOptions: true,
    } as MultipleChoiceData,
    correctAnswer: 'dog',
    hints: [
      'A noun is a person, place, thing, or idea.',
      'Look for the word that names something.',
      'Think about what or who is doing the action.',
    ],
    correctFeedback: 'Correct! "Dog" is a noun because it names an animal (a thing).',
    incorrectFeedback: 'Not quite. Remember, a noun names a person, place, thing, or idea.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Fill in the Blank Question
  {
    id: 'eq-fib-noun-types',
    exerciseId: 'exercise-noun-identification',
    objectiveId: 'obj-classify-noun-types',
    questionText: 'Complete the sentence with the correct type of noun.',
    type: 'fill_in_blank',
    orderIndex: 2,
    points: 2,
    questionData: {
      type: 'fill_in_blank',
      template: '"London" is a {blank1} noun, while "city" is a {blank2} noun.',
      blanks: [
        {
          id: 'blank1',
          position: 1,
          acceptableAnswers: ['proper', 'Proper'],
          caseSensitive: false,
        },
        {
          id: 'blank2',
          position: 2,
          acceptableAnswers: ['common', 'Common'],
          caseSensitive: false,
        },
      ],
    } as FillInBlankData,
    correctAnswer: ['proper', 'common'],
    hints: [
      'Think about which nouns are capitalized and which are not.',
      'Specific names are one type, general names are another.',
    ],
    correctFeedback: 'Excellent! You understand the difference between proper and common nouns.',
    incorrectFeedback: 'Remember: proper nouns name specific things and are capitalized, common nouns are general.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Drag and Drop Question
  {
    id: 'eq-dad-noun-categories',
    exerciseId: 'exercise-noun-identification',
    objectiveId: 'obj-classify-noun-types',
    questionText: 'Drag each noun to the correct category.',
    type: 'drag_and_drop',
    orderIndex: 3,
    points: 4,
    questionData: {
      type: 'drag_and_drop',
      items: [
        { id: 'item1', content: 'happiness', category: 'abstract' },
        { id: 'item2', content: 'apple', category: 'concrete' },
        { id: 'item3', content: 'London', category: 'proper' },
        { id: 'item4', content: 'teacher', category: 'common' },
      ],
      targets: [
        { id: 'target1', label: 'Abstract Nouns', acceptsCategory: 'abstract' },
        { id: 'target2', label: 'Concrete Nouns', acceptsCategory: 'concrete' },
        { id: 'target3', label: 'Proper Nouns', acceptsCategory: 'proper' },
        { id: 'target4', label: 'Common Nouns', acceptsCategory: 'common' },
      ],
    } as DragAndDropData,
    correctAnswer: {
      'target1': 'happiness',
      'target2': 'apple',
      'target3': 'London',
      'target4': 'teacher',
    },
    hints: [
      'Abstract nouns are ideas or feelings you cannot touch.',
      'Concrete nouns are things you can experience with your senses.',
      'Proper nouns are capitalized and name specific things.',
    ],
    correctFeedback: 'Perfect! You\'ve correctly categorized all the noun types.',
    incorrectFeedback: 'Some nouns are in the wrong category. Think about the definitions of each type.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Sentence Builder Question
  {
    id: 'eq-sb-noun-sentence',
    exerciseId: 'exercise-noun-identification',
    objectiveId: 'obj-use-nouns-context',
    questionText: 'Arrange these words to create a grammatically correct sentence.',
    type: 'sentence_builder',
    orderIndex: 4,
    points: 3,
    questionData: {
      type: 'sentence_builder',
      words: ['The', 'student', 'studied', 'grammar', 'carefully', '.'],
      shuffleWords: true,
    } as SentenceBuilderData,
    correctAnswer: ['The', 'student', 'studied', 'grammar', 'carefully', '.'],
    hints: [
      'Start with a capital letter.',
      'Think about subject-verb-object order.',
      'End with proper punctuation.',
    ],
    correctFeedback: 'Great! You\'ve built a correct sentence with two nouns: "student" and "grammar".',
    incorrectFeedback: 'Check your word order. Remember: subject + verb + object is a common pattern.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ===== EXAMPLE ASSESSMENT =====

/**
 * Example assessment: Nouns Mastery Check
 */
export const exampleAssessment: Assessment = {
  id: 'assessment-nouns-mastery',
  lessonId: 'lesson-intro-nouns',
  title: 'Nouns Mastery Assessment',
  description: 'Formal assessment to evaluate mastery of noun concepts.',
  type: 'summative',
  timeLimit: 600, // 10 minutes
  maxAttempts: 2,
  masteryThreshold: 0.8,
  questions: [], // Will be populated
  isPublished: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Example assessment questions
 */
export const exampleAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'aq-comprehensive-nouns',
    assessmentId: 'assessment-nouns-mastery',
    objectiveId: 'obj-identify-nouns',
    questionText: 'Read the following paragraph and identify all the nouns: "Yesterday, Sarah visited the museum with her friends. They admired the beautiful paintings and learned about ancient history. The experience brought them great joy."',
    type: 'multiple_choice',
    orderIndex: 1,
    points: 5,
    difficulty: 'beginner',
    questionData: {
      type: 'multiple_choice',
      options: [
        'Sarah, museum, friends, paintings, history, experience, joy',
        'Yesterday, Sarah, museum, beautiful, ancient, great',
        'visited, admired, learned, brought',
        'Sarah, her, they, them',
      ],
    } as MultipleChoiceData,
    correctAnswer: 'Sarah, museum, friends, paintings, history, experience, joy',
    distractors: ['visited, admired, learned, brought'], // Verbs as distractors
    feedback: 'Nouns are words that name people (Sarah, friends), places (museum), things (paintings), ideas (history, experience, joy).',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'aq-noun-classification',
    assessmentId: 'assessment-nouns-mastery',
    objectiveId: 'obj-classify-noun-types',
    questionText: 'Classify the following nouns as either "concrete" or "abstract": love, table, freedom, book, happiness',
    type: 'fill_in_blank',
    orderIndex: 2,
    points: 5,
    difficulty: 'intermediate',
    questionData: {
      type: 'fill_in_blank',
      template: 'love: {blank1}, table: {blank2}, freedom: {blank3}, book: {blank4}, happiness: {blank5}',
      blanks: [
        { id: 'blank1', position: 1, acceptableAnswers: ['abstract'], caseSensitive: false },
        { id: 'blank2', position: 2, acceptableAnswers: ['concrete'], caseSensitive: false },
        { id: 'blank3', position: 3, acceptableAnswers: ['abstract'], caseSensitive: false },
        { id: 'blank4', position: 4, acceptableAnswers: ['concrete'], caseSensitive: false },
        { id: 'blank5', position: 5, acceptableAnswers: ['abstract'], caseSensitive: false },
      ],
    } as FillInBlankData,
    correctAnswer: ['abstract', 'concrete', 'abstract', 'concrete', 'abstract'],
    feedback: 'Concrete nouns can be experienced through the senses, while abstract nouns represent ideas and feelings.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ===== EXAMPLE CONTENT HIERARCHY =====

/**
 * Complete example content structure showing relationships
 */
export const exampleContentHierarchy = {
  unit: exampleUnit,
  lessons: [exampleLesson],
  objectives: exampleObjectives,
  exercises: [exampleExercise],
  exerciseQuestions: exampleExerciseQuestions,
  assessments: [exampleAssessment],
  assessmentQuestions: exampleAssessmentQuestions,
};

// ===== CONTENT CREATION TEMPLATES =====

/**
 * Template for creating a new lesson
 */
export function createLessonTemplate(
  unitId: string,
  title: string,
  description: string,
  orderIndex: number
): Partial<Lesson> {
  return {
    unitId,
    title,
    description,
    content: `# ${title}

## Introduction
[Provide an introduction to the topic]

## Key Concepts
[List the main concepts to be learned]

## Examples
[Provide clear examples]

## Summary
[Summarize the key points]

## Next Steps
[Preview what comes next]`,
    orderIndex,
    isPublished: false,
    masteryThreshold: 0.8,
    estimatedMinutes: 30,
    difficulty: 'beginner',
    tags: [],
  };
}

/**
 * Template for creating a learning objective
 */
export function createObjectiveTemplate(
  lessonId: string,
  title: string,
  description: string,
  category: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation'
): Partial<LearningObjective> {
  return {
    lessonId,
    title,
    description,
    category,
    masteryThreshold: 0.8,
  };
}

/**
 * Template for creating a multiple choice question
 */
export function createMultipleChoiceTemplate(
  exerciseId: string,
  questionText: string,
  options: string[],
  correctAnswer: string,
  objectiveId?: string
): Partial<ExerciseQuestion> {
  return {
    exerciseId,
    objectiveId,
    questionText,
    type: 'multiple_choice',
    points: 1,
    questionData: {
      type: 'multiple_choice',
      options,
      shuffleOptions: true,
    } as MultipleChoiceData,
    correctAnswer,
    hints: ['Think carefully about the question.', 'Consider what you learned in the lesson.'],
  };
}

/**
 * Best practices documentation
 */
export const contentBestPractices = {
  lessons: {
    structure: [
      'Start with clear learning objectives',
      'Provide examples and non-examples',
      'Include interactive elements',
      'End with a summary and preview',
      'Keep lessons under 30 minutes',
    ],
    content: [
      'Use simple, clear language',
      'Break up text with headings and bullet points',
      'Include visuals when helpful',
      'Provide multiple examples',
      'Connect to real-world applications',
    ],
  },
  exercises: {
    design: [
      'Align with learning objectives',
      'Provide immediate feedback',
      'Include progressive hints',
      'Vary question types',
      'Allow multiple attempts',
    ],
    difficulty: [
      'Start with easy questions',
      'Gradually increase complexity',
      'Provide scaffolding',
      'Include challenge activities',
      'Offer remediation paths',
    ],
  },
  assessments: {
    validity: [
      'Test what was taught',
      'Use authentic tasks',
      'Include various question types',
      'Provide clear rubrics',
      'Allow adequate time',
    ],
    reliability: [
      'Use consistent scoring',
      'Pilot test questions',
      'Review for bias',
      'Provide clear instructions',
      'Train reviewers',
    ],
  },
};