/**
 * Sample Lesson Data for MVP
 * 
 * This file contains hardcoded sample lessons with exercises for the MVP.
 * In production, this would come from a database.
 */

import type { 
  Lesson,
  Unit,
  Exercise,
  ExerciseQuestion,
  Assessment,
  AssessmentQuestion,
  LearningObjective
} from '../../types/content';

// ===== UNITS =====

export const sampleUnits: Unit[] = [
  {
    id: 'unit-1',
    title: 'Parts of Speech Fundamentals',
    description: 'Master the building blocks of English grammar - nouns, verbs, adjectives, and more.',
    orderIndex: 0,
    masteryThreshold: 0.9,
    prerequisiteUnits: null,
    isPublished: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== LEARNING OBJECTIVES =====

export const sampleObjectives: LearningObjective[] = [
  {
    id: 'obj-1',
    title: 'Identify Common and Proper Nouns',
    description: 'Identify common and proper nouns with 90% accuracy',
    category: 'knowledge',
    masteryThreshold: 0.9,
    unitId: 'unit-1',
    lessonId: 'lesson-1',
    assessmentCriteria: 'Can correctly identify nouns in sentences',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'obj-2',
    title: 'Distinguish Concrete vs Abstract Nouns',
    description: 'Distinguish between concrete and abstract nouns in context',
    category: 'comprehension',
    masteryThreshold: 0.85,
    unitId: 'unit-1',
    lessonId: 'lesson-1',
    assessmentCriteria: 'Can categorize nouns as concrete or abstract',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'obj-3',
    title: 'Apply Plural Forms',
    description: 'Apply correct singular and plural forms in writing',
    category: 'application',
    masteryThreshold: 0.9,
    unitId: 'unit-1',
    lessonId: 'lesson-1',
    assessmentCriteria: 'Can form correct plurals including irregular forms',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== LESSONS =====

export const sampleLessons: Lesson[] = [
  {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Parts of Speech - Nouns',
    description: 'Learn about nouns - words that name people, places, things, and ideas.',
    content: `
      <h2>What is a Noun?</h2>
      <p>A noun is a word that names a <strong>person</strong>, <strong>place</strong>, <strong>thing</strong>, or <strong>idea</strong>.</p>
      
      <h3>Examples:</h3>
      <ul>
        <li><strong>Person:</strong> mom, teacher, doctor, Maria</li>
        <li><strong>Place:</strong> school, park, kitchen, Chicago</li>
        <li><strong>Thing:</strong> book, car, pencil, cookie</li>
        <li><strong>Idea:</strong> happiness, love, friendship, courage</li>
      </ul>
      
      <div class="tip">
        <strong>Memory Trick:</strong> If you can put 'a', 'an', or 'the' in front of it, it's probably a noun!
      </div>
      
      <h3>Common vs Proper Nouns</h3>
      <p><strong>Common Nouns</strong> name general people, places, or things (not capitalized).</p>
      <p><strong>Proper Nouns</strong> name specific people, places, or things (always capitalized).</p>
      
      <table>
        <tr><th>Common Noun</th><th>Proper Noun</th></tr>
        <tr><td>dog</td><td>Rover</td></tr>
        <tr><td>city</td><td>Chicago</td></tr>
        <tr><td>teacher</td><td>Mrs. Smith</td></tr>
      </table>
      
      <h3>Concrete vs Abstract Nouns</h3>
      <p><strong>Concrete Nouns:</strong> Things you can see, touch, hear, taste, or smell (pizza, music, flower)</p>
      <p><strong>Abstract Nouns:</strong> Ideas, feelings, or concepts you can't physically touch (happiness, courage, love)</p>
      
      <div class="tip">
        <strong>The Box Test:</strong> Can you put it in a box?<br>
        Pizza → Yes! (concrete)<br>
        Happiness → No! (abstract)
      </div>
    `,
    orderIndex: 0,
    masteryThreshold: 0.8,
    estimatedMinutes: 20,
    difficulty: 'beginner',
    tags: JSON.stringify(['grammar', 'nouns', 'parts-of-speech']),
    isPublished: true,
    exercises: [], // Will be populated below
    assessments: [], // Will be populated below
    objectives: [], // Will be populated below
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'lesson-2',
    unitId: 'unit-1',
    title: 'Action Words - Verbs',
    description: 'Discover verbs - the action words that bring sentences to life.',
    content: `
      <h2>What is a Verb?</h2>
      <p>A verb is a word that shows <strong>action</strong> or a <strong>state of being</strong>.</p>
      
      <h3>Action Verbs</h3>
      <p>These verbs show what someone or something does:</p>
      <ul>
        <li><strong>Physical actions:</strong> run, jump, eat, write, dance</li>
        <li><strong>Mental actions:</strong> think, believe, imagine, remember</li>
      </ul>
      
      <h3>Being Verbs (State of Being)</h3>
      <p>These verbs don't show action but describe a state or condition:</p>
      <ul>
        <li><strong>Forms of "be":</strong> am, is, are, was, were, been, being</li>
        <li><strong>Other linking verbs:</strong> seem, become, appear, feel</li>
      </ul>
      
      <div class="example">
        <strong>Examples in sentences:</strong><br>
        • The cat <u>runs</u> quickly. (action)<br>
        • She <u>is</u> happy. (state of being)<br>
        • They <u>think</u> about the problem. (mental action)
      </div>
      
      <h3>Verb Tenses</h3>
      <p>Verbs change form to show when something happens:</p>
      <table>
        <tr><th>Past</th><th>Present</th><th>Future</th></tr>
        <tr><td>walked</td><td>walk/walks</td><td>will walk</td></tr>
        <tr><td>ate</td><td>eat/eats</td><td>will eat</td></tr>
        <tr><td>thought</td><td>think/thinks</td><td>will think</td></tr>
      </table>
    `,
    orderIndex: 1,
    masteryThreshold: 0.8,
    estimatedMinutes: 25,
    difficulty: 'beginner',
    tags: JSON.stringify(['grammar', 'verbs', 'parts-of-speech']),
    isPublished: true,
    exercises: [],
    assessments: [],
    objectives: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== EXERCISES =====

export const sampleExercises: Exercise[] = [
  {
    id: 'ex-1',
    lessonId: 'lesson-1',
    title: 'Noun Detective',
    description: 'Find and identify nouns in sentences',
    type: 'practice',
    orderIndex: 0,
    difficulty: 'beginner',
    timeLimit: 300, // 5 minutes
    maxAttempts: 3,
    passingScore: 0.8,
    questions: [], // Will be populated below
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'ex-2',
    lessonId: 'lesson-1',
    title: 'Common vs Proper Nouns',
    description: 'Categorize nouns as common or proper',
    type: 'reinforcement',
    orderIndex: 1,
    difficulty: 'beginner',
    timeLimit: 300,
    maxAttempts: 3,
    passingScore: 0.8,
    questions: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'ex-3',
    lessonId: 'lesson-1',
    title: 'Make It Plural',
    description: 'Practice forming plural nouns',
    type: 'practice',
    orderIndex: 2,
    difficulty: 'intermediate',
    timeLimit: 300,
    maxAttempts: 3,
    passingScore: 0.8,
    questions: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'ex-4',
    lessonId: 'lesson-2',
    title: 'Verb Finder',
    description: 'Identify verbs in sentences',
    type: 'practice',
    orderIndex: 0,
    difficulty: 'beginner',
    timeLimit: 300,
    maxAttempts: 3,
    passingScore: 0.8,
    questions: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== EXERCISE QUESTIONS =====

export const sampleQuestions: ExerciseQuestion[] = [
  // Exercise 1: Noun Detective
  {
    id: 'q1-1',
    exerciseId: 'ex-1',
    type: 'multiple_choice',
    questionText: 'Which word is a noun in this sentence: "The big elephant stomped loudly."',
    points: 10,
    orderIndex: 0,
    questionData: {
      options: ['big', 'elephant', 'stomped', 'loudly'],
      correctAnswer: 'elephant',
      shuffleOptions: true
    },
    correctAnswer: 'elephant',
    explanation: 'Elephant is a noun because it names an animal (thing). "Big" is an adjective, "stomped" is a verb, and "loudly" is an adverb.',
    hints: [
      'Look for a word that names a person, place, thing, or idea.',
      'Which word could you put "the" or "a" in front of?'
    ],
    timeLimit: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'q1-2',
    exerciseId: 'ex-1',
    type: 'multiple_choice',
    questionText: 'Find the noun: "Sarah quickly ran to school."',
    points: 10,
    orderIndex: 1,
    questionData: {
      options: ['quickly', 'ran', 'Sarah', 'to'],
      correctAnswer: 'Sarah',
      shuffleOptions: true
    },
    correctAnswer: 'Sarah',
    explanation: 'Sarah is a proper noun (person\'s name) and school is also a noun (place).',
    hints: [
      'Look for words that name people or places.',
      'Proper nouns are always capitalized.'
    ],
    timeLimit: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'q1-3',
    exerciseId: 'ex-1',
    type: 'sentence_builder',
    questionText: 'Arrange these words to make a sentence with two nouns:',
    points: 15,
    orderIndex: 2,
    questionData: {
      words: ['The', 'cat', 'chased', 'the', 'mouse'],
      correctOrder: ['The', 'cat', 'chased', 'the', 'mouse'],
      flexibleMatching: false
    },
    correctAnswer: JSON.stringify(['The', 'cat', 'chased', 'the', 'mouse']),
    explanation: 'In this sentence, "cat" and "mouse" are both nouns - they name animals.',
    hints: [
      'Start with "The"...',
      'The subject (a noun) usually comes before the verb.'
    ],
    timeLimit: 45,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Exercise 2: Common vs Proper Nouns
  {
    id: 'q2-1',
    exerciseId: 'ex-2',
    type: 'drag_and_drop',
    questionText: 'Sort these nouns into Common or Proper categories:',
    points: 20,
    orderIndex: 0,
    questionData: {
      items: ['teacher', 'Chicago', 'dog', 'Mississippi River', 'book', 'Harry Potter'],
      targets: ['Common Nouns', 'Proper Nouns'],
      correctMapping: {
        'teacher': 'Common Nouns',
        'Chicago': 'Proper Nouns',
        'dog': 'Common Nouns',
        'Mississippi River': 'Proper Nouns',
        'book': 'Common Nouns',
        'Harry Potter': 'Proper Nouns'
      }
    },
    correctAnswer: JSON.stringify({
      'teacher': 'Common Nouns',
      'Chicago': 'Proper Nouns',
      'dog': 'Common Nouns',
      'Mississippi River': 'Proper Nouns',
      'book': 'Common Nouns',
      'Harry Potter': 'Proper Nouns'
    }),
    explanation: 'Proper nouns name specific people, places, or things and are always capitalized.',
    hints: [
      'Look for capital letters - they usually indicate proper nouns.',
      'Common nouns are general, proper nouns are specific.'
    ],
    timeLimit: 60,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Exercise 3: Make It Plural
  {
    id: 'q3-1',
    exerciseId: 'ex-3',
    type: 'fill_in_blank',
    questionText: 'Fill in the plural forms: One cat, two ___. One child, three ___. One box, four ___.',
    points: 15,
    orderIndex: 0,
    questionData: {
      blanks: ['cats', 'children', 'boxes'],
      acceptableAnswers: [
        ['cats'],
        ['children'],
        ['boxes']
      ]
    },
    correctAnswer: JSON.stringify(['cats', 'children', 'boxes']),
    explanation: 'Regular plurals add -s, but "child" becomes "children" (irregular), and "box" adds -es.',
    hints: [
      'Most nouns just add -s for plural.',
      'Child has an irregular plural form.',
      'Words ending in x add -es.'
    ],
    timeLimit: 45,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Exercise 4: Verb Finder
  {
    id: 'q4-1',
    exerciseId: 'ex-4',
    type: 'multiple_choice',
    questionText: 'Which word is the verb in: "The students studied hard for the test."',
    points: 10,
    orderIndex: 0,
    questionData: {
      options: ['students', 'studied', 'hard', 'test'],
      correctAnswer: 'studied',
      shuffleOptions: true
    },
    correctAnswer: 'studied',
    explanation: '"Studied" is the verb - it shows the action the students performed.',
    hints: [
      'Look for the action word - what did the students do?',
      'Verbs often end in -ed for past tense.'
    ],
    timeLimit: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== ASSESSMENTS =====

export const sampleAssessments: Assessment[] = [
  {
    id: 'assess-1',
    lessonId: 'lesson-1',
    title: 'Nouns Mastery Check',
    description: 'Test your understanding of nouns',
    type: 'summative',
    questions: [], // Will be populated below
    timeLimit: 600, // 10 minutes
    maxAttempts: 2,
    passingScore: 0.8,
    masteryThreshold: 0.9,
    randomizeQuestions: true,
    showFeedback: true,
    isPublished: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== ASSESSMENT QUESTIONS =====

export const sampleAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'aq-1',
    assessmentId: 'assess-1',
    type: 'multiple_choice',
    questionText: 'How many nouns are in this sentence: "The happy children played with toys in the park."',
    points: 10,
    orderIndex: 0,
    questionData: {
      options: ['2', '3', '4', '5'],
      correctAnswer: '3',
      shuffleOptions: true
    },
    correctAnswer: '3',
    explanation: 'The three nouns are: children (person), toys (things), and park (place).',
    timeLimit: 45,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'aq-2',
    assessmentId: 'assess-1',
    type: 'multiple_choice',
    questionText: 'Which of these is an abstract noun?',
    points: 10,
    orderIndex: 1,
    questionData: {
      options: ['table', 'happiness', 'flower', 'music'],
      correctAnswer: 'happiness',
      shuffleOptions: true
    },
    correctAnswer: 'happiness',
    explanation: 'Happiness is an abstract noun - it\'s a feeling you can\'t physically touch.',
    timeLimit: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'aq-3',
    assessmentId: 'assess-1',
    type: 'fill_in_blank',
    questionText: 'Complete with the correct plural: One mouse, three ___.',
    points: 10,
    orderIndex: 2,
    questionData: {
      blanks: ['mice'],
      acceptableAnswers: [['mice']]
    },
    correctAnswer: JSON.stringify(['mice']),
    explanation: 'Mouse has an irregular plural form: mice.',
    timeLimit: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'aq-4',
    assessmentId: 'assess-1',
    type: 'drag_and_drop',
    questionText: 'Categorize these nouns:',
    points: 20,
    orderIndex: 3,
    questionData: {
      items: ['love', 'pizza', 'courage', 'bicycle'],
      targets: ['Concrete', 'Abstract'],
      correctMapping: {
        'love': 'Abstract',
        'pizza': 'Concrete',
        'courage': 'Abstract',
        'bicycle': 'Concrete'
      }
    },
    correctAnswer: JSON.stringify({
      'love': 'Abstract',
      'pizza': 'Concrete',
      'courage': 'Abstract',
      'bicycle': 'Concrete'
    }),
    explanation: 'Concrete nouns can be experienced with the senses, abstract nouns are ideas or feelings.',
    timeLimit: 60,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'aq-5',
    assessmentId: 'assess-1',
    type: 'sentence_builder',
    questionText: 'Create a sentence using these words (must include proper noun):',
    points: 15,
    orderIndex: 4,
    questionData: {
      words: ['Maria', 'reads', 'books', 'every', 'day'],
      correctOrder: ['Maria', 'reads', 'books', 'every', 'day'],
      flexibleMatching: true
    },
    correctAnswer: JSON.stringify(['Maria', 'reads', 'books', 'every', 'day']),
    explanation: 'Maria is a proper noun (person\'s name), and books is a common noun.',
    timeLimit: 45,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// ===== POPULATE RELATIONSHIPS =====

// Add exercises to lessons
sampleLessons[0].exercises = sampleExercises.filter(e => e.lessonId === 'lesson-1');
sampleLessons[1].exercises = sampleExercises.filter(e => e.lessonId === 'lesson-2');

// Add assessments to lessons
sampleLessons[0].assessments = sampleAssessments.filter(a => a.lessonId === 'lesson-1');

// Add objectives to lessons
sampleLessons[0].objectives = sampleObjectives.filter(o => o.lessonId === 'lesson-1');

// Add questions to exercises
sampleExercises[0].questions = sampleQuestions.filter(q => q.exerciseId === 'ex-1');
sampleExercises[1].questions = sampleQuestions.filter(q => q.exerciseId === 'ex-2');
sampleExercises[2].questions = sampleQuestions.filter(q => q.exerciseId === 'ex-3');
sampleExercises[3].questions = sampleQuestions.filter(q => q.exerciseId === 'ex-4');

// Add questions to assessments
sampleAssessments[0].questions = sampleAssessmentQuestions;

// ===== EXPORT ALL DATA =====

export const sampleData = {
  units: sampleUnits,
  lessons: sampleLessons,
  exercises: sampleExercises,
  questions: sampleQuestions,
  assessments: sampleAssessments,
  assessmentQuestions: sampleAssessmentQuestions,
  objectives: sampleObjectives
};

// ===== HELPER FUNCTIONS =====

/**
 * Get all lessons for a unit
 */
export function getLessonsByUnit(unitId: string): Lesson[] {
  return sampleLessons.filter(lesson => lesson.unitId === unitId);
}

/**
 * Get next lesson based on current lesson
 */
export function getNextLesson(currentLessonId: string): Lesson | null {
  const currentLesson = sampleLessons.find(l => l.id === currentLessonId);
  if (!currentLesson) return null;
  
  const nextLesson = sampleLessons.find(l => 
    l.unitId === currentLesson.unitId && 
    l.orderIndex === currentLesson.orderIndex + 1
  );
  
  return nextLesson || null;
}

/**
 * Get lesson with all related data
 */
export function getLessonWithContent(lessonId: string) {
  const lesson = sampleLessons.find(l => l.id === lessonId);
  if (!lesson) return null;
  
  return {
    ...lesson,
    exercises: sampleExercises.filter(e => e.lessonId === lessonId).map(exercise => ({
      ...exercise,
      questions: sampleQuestions.filter(q => q.exerciseId === exercise.id)
    })),
    assessments: sampleAssessments.filter(a => a.lessonId === lessonId).map(assessment => ({
      ...assessment,
      questions: sampleAssessmentQuestions.filter(q => q.assessmentId === assessment.id)
    })),
    objectives: sampleObjectives.filter(o => o.lessonId === lessonId)
  };
}