/**
 * Advanced Challenge Templates
 * 
 * Comprehensive collection of challenge templates for enrichment activities.
 * Each template provides unique, engaging challenges that go beyond basic exercises.
 */

import { ChallengeTemplate, ChallengeType, ChallengeConfig, ChallengeContext } from './challenge-generator';
import { Exercise, ExerciseQuestion, QuestionData } from '../../types/content';

// ===== GRAMMAR DETECTIVE TEMPLATES =====

export const grammarDetectiveTemplates: ChallengeTemplate[] = [
  {
    id: 'detective-news-article',
    type: 'grammar_detective',
    title: 'News Article Error Hunt',
    description: 'Find grammar errors in realistic news articles',
    difficulty: 'intermediate',
    estimatedMinutes: 18,
    generator: generateNewsArticleDetective,
    requiredMastery: ['sentence-structure', 'punctuation'],
    tags: ['news', 'real-world', 'errors']
  },
  
  {
    id: 'detective-social-media',
    type: 'grammar_detective', 
    title: 'Social Media Grammar Police',
    description: 'Clean up grammar in social media posts',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    generator: generateSocialMediaDetective,
    requiredMastery: ['basic-grammar'],
    tags: ['social-media', 'modern', 'casual']
  },

  {
    id: 'detective-academic-paper',
    type: 'grammar_detective',
    title: 'Academic Paper Reviewer',
    description: 'Review and correct formal academic writing',
    difficulty: 'advanced',
    estimatedMinutes: 25,
    generator: generateAcademicPaperDetective,
    requiredMastery: ['advanced-grammar', 'formal-writing'],
    tags: ['academic', 'formal', 'complex']
  }
];

// ===== LINGUISTIC PUZZLE TEMPLATES =====

export const linguisticPuzzleTemplates: ChallengeTemplate[] = [
  {
    id: 'puzzle-word-patterns',
    type: 'linguistic_puzzle',
    title: 'Word Pattern Decoder',
    description: 'Decode hidden patterns in word relationships',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    generator: generateWordPatternPuzzle,
    requiredMastery: ['vocabulary', 'word-analysis'],
    tags: ['patterns', 'logic', 'vocabulary']
  },

  {
    id: 'puzzle-grammar-maze',
    type: 'linguistic_puzzle',
    title: 'Grammar Maze Navigator', 
    description: 'Navigate through a maze using grammar rules',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    generator: generateGrammarMazePuzzle,
    requiredMastery: ['advanced-grammar', 'logical-thinking'],
    tags: ['maze', 'navigation', 'logic']
  },

  {
    id: 'puzzle-sentence-sudoku',
    type: 'linguistic_puzzle',
    title: 'Sentence Structure Sudoku',
    description: 'Complete sentence grids using grammar rules',
    difficulty: 'advanced',
    estimatedMinutes: 22,
    generator: generateSentenceSudokuPuzzle,
    requiredMastery: ['sentence-structure', 'parts-of-speech'],
    tags: ['sudoku', 'grid', 'structure']
  }
];

// ===== CREATIVE WRITING TEMPLATES =====

export const creativeWritingTemplates: ChallengeTemplate[] = [
  {
    id: 'writing-genre-mashup',
    type: 'creative_writing',
    title: 'Genre Mashup Challenge',
    description: 'Combine unexpected genres in creative writing',
    difficulty: 'advanced',
    estimatedMinutes: 30,
    generator: generateGenreMashupChallenge,
    requiredMastery: ['creative-writing', 'genre-awareness'],
    tags: ['genre', 'mashup', 'creativity']
  },

  {
    id: 'writing-perspective-shift',
    type: 'creative_writing',
    title: 'Perspective Shifter',
    description: 'Tell the same story from different viewpoints',
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    generator: generatePerspectiveShiftChallenge,
    requiredMastery: ['narrative-writing', 'point-of-view'],
    tags: ['perspective', 'narrative', 'viewpoint']
  },

  {
    id: 'writing-constraint-poetry',
    type: 'creative_writing',
    title: 'Constraint Poetry Lab',
    description: 'Write poetry with specific structural constraints',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    generator: generateConstraintPoetryChallenge,
    requiredMastery: ['creative-writing', 'poetry'],
    tags: ['poetry', 'constraints', 'structure']
  }
];

// ===== CROSS-CURRICULAR TEMPLATES =====

export const crossCurricularTemplates: ChallengeTemplate[] = [
  {
    id: 'cross-science-writing',
    type: 'cross_curricular',
    title: 'Science Communication Challenge',
    description: 'Explain complex science concepts using clear grammar',
    difficulty: 'advanced',
    estimatedMinutes: 28,
    generator: generateScienceWritingChallenge,
    requiredMastery: ['expository-writing', 'clarity'],
    tags: ['science', 'explanation', 'clarity']
  },

  {
    id: 'cross-history-narrative',
    type: 'cross_curricular',
    title: 'Historical Narrative Builder',
    description: 'Write historically accurate narratives with proper grammar',
    difficulty: 'intermediate',
    estimatedMinutes: 22,
    generator: generateHistoryNarrativeChallenge,
    requiredMastery: ['narrative-writing', 'historical-context'],
    tags: ['history', 'narrative', 'context']
  },

  {
    id: 'cross-math-word-problems',
    type: 'cross_curricular',
    title: 'Math Word Problem Writer',
    description: 'Create clear, grammatically correct math word problems',
    difficulty: 'intermediate',
    estimatedMinutes: 18,
    generator: generateMathWordProblemChallenge,
    requiredMastery: ['technical-writing', 'clarity'],
    tags: ['math', 'problems', 'technical']
  }
];

// ===== REAL-WORLD APPLICATION TEMPLATES =====

export const realWorldTemplates: ChallengeTemplate[] = [
  {
    id: 'real-email-professional',
    type: 'real_world_application',
    title: 'Professional Email Master',
    description: 'Write grammatically perfect professional emails',
    difficulty: 'intermediate',
    estimatedMinutes: 16,
    generator: generateProfessionalEmailChallenge,
    requiredMastery: ['formal-writing', 'communication'],
    tags: ['email', 'professional', 'communication']
  },

  {
    id: 'real-presentation-script',
    type: 'real_world_application',
    title: 'Presentation Script Creator',
    description: 'Write engaging, grammatically correct presentation scripts',
    difficulty: 'advanced',
    estimatedMinutes: 24,
    generator: generatePresentationScriptChallenge,
    requiredMastery: ['public-speaking', 'persuasive-writing'],
    tags: ['presentation', 'public-speaking', 'script']
  },

  {
    id: 'real-social-media-campaign',
    type: 'real_world_application', 
    title: 'Social Media Campaign Strategist',
    description: 'Create grammatically sound social media campaigns',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    generator: generateSocialMediaCampaignChallenge,
    requiredMastery: ['concise-writing', 'audience-awareness'],
    tags: ['social-media', 'marketing', 'audience']
  }
];

// ===== TEMPLATE IMPLEMENTATION FUNCTIONS =====

async function generateNewsArticleDetective(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `news-detective-${Date.now()}`;
  
  const newsArticles = [
    {
      headline: "Local School District Announces New Education Initiative",
      text: "The Riverside School District have announced a new program that will effects over 3,000 students. Principal Johnson said 'This program will benefit students who's test scores need improvement.' The program begins next month and will cost approximatley $50,000.",
      errors: [
        { type: "subject-verb", original: "have announced", correct: "has announced" },
        { type: "word-choice", original: "effects", correct: "affects" },
        { type: "apostrophe", original: "who's", correct: "whose" },
        { type: "spelling", original: "approximatley", correct: "approximately" }
      ]
    }
  ];
  
  const selectedArticle = newsArticles[0]; // For now, use first article
  
  const questions: ExerciseQuestion[] = selectedArticle.errors.map((error, index) => ({
    id: `${challengeId}-error-${index}`,
    exerciseId: challengeId,
    questionText: `Find and correct this error in the news article: "${error.original}"`,
    type: 'fill_in_blank',
    orderIndex: index,
    points: 8,
    questionData: {
      type: 'fill_in_blank',
      template: `Correction: {answer}`,
      blanks: [{
        id: 'answer',
        position: 0,
        acceptableAnswers: [error.correct],
        caseSensitive: false
      }]
    },
    correctAnswer: error.correct,
    hints: [
      `This is a ${error.type} error`,
      "Think about the grammar rule that applies here",
      "Check if this sounds right when read aloud"
    ],
    correctFeedback: `Excellent! You corrected the ${error.type} error.`,
    incorrectFeedback: `This is a ${error.type} error. Think about the specific rule.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'News Article Grammar Detective',
    description: `Review this news article and find all the grammar errors:\n\n"${selectedArticle.text}"\n\nCorrect each error you find.`,
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 1080, // 18 minutes
    maxAttempts: 3,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateSocialMediaDetective(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `social-detective-${Date.now()}`;
  
  const socialPosts = [
    {
      platform: "Twitter",
      post: "cant believe its raining again 😭 me and my friends was going to the beach today but now we gotta stay inside",
      corrections: {
        "cant": "can't",
        "its": "it's", 
        "me and my friends": "my friends and I",
        "was going": "were going",
        "gotta": "have to"
      }
    },
    {
      platform: "Facebook",
      post: "Happy birthday to my bestfriend Sarah! Hope you're day is amazing and you get alot of presents 🎉",
      corrections: {
        "bestfriend": "best friend",
        "you're day": "your day",
        "alot": "a lot"
      }
    }
  ];
  
  const selectedPost = socialPosts[Math.floor(Math.random() * socialPosts.length)];
  
  const questions: ExerciseQuestion[] = Object.entries(selectedPost.corrections).map(([wrong, right], index) => ({
    id: `${challengeId}-social-${index}`,
    exerciseId: challengeId,
    questionText: `In this social media post, "${wrong}" should be corrected to what?`,
    type: 'fill_in_blank',
    orderIndex: index,
    points: 6,
    questionData: {
      type: 'fill_in_blank',
      template: `Correct form: {answer}`,
      blanks: [{
        id: 'answer',
        position: 0,
        acceptableAnswers: [right],
        caseSensitive: false
      }]
    },
    correctAnswer: right,
    hints: [
      "Think about formal grammar rules",
      "Consider if this is a contraction, spelling, or word choice issue",
      "What would this look like in a school essay?"
    ],
    correctFeedback: `Perfect! "${wrong}" should indeed be "${right}" in formal writing.`,
    incorrectFeedback: `Not quite. "${wrong}" needs to be corrected for proper grammar.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'Social Media Grammar Police',
    description: `Help clean up this ${selectedPost.platform} post:\n\n"${selectedPost.post}"\n\nCorrect the grammar errors to make it more formal.`,
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 720, // 12 minutes
    maxAttempts: 3,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateAcademicPaperDetective(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `academic-detective-${Date.now()}`;
  
  const academicText = {
    title: "The Impact of Technology on Modern Education",
    excerpt: "This study examines the effects of digital technology on student's learning outcomes. The data shows that technology have improved engagement, however, it's impact on test scores are mixed. Further research is needed to understand this phenomena and it's implications for curriculum design.",
    errors: [
      { original: "student's learning", correct: "students' learning", type: "apostrophe placement" },
      { original: "technology have improved", correct: "technology has improved", type: "subject-verb agreement" },
      { original: "it's impact", correct: "its impact", type: "possessive vs. contraction" },
      { original: "test scores are", correct: "test scores is", type: "subject-verb with collective noun" },
      { original: "this phenomena", correct: "these phenomena", type: "plural form" },
      { original: "it's implications", correct: "its implications", type: "possessive vs. contraction" }
    ]
  };
  
  const questions: ExerciseQuestion[] = academicText.errors.map((error, index) => ({
    id: `${challengeId}-academic-${index}`,
    exerciseId: challengeId,
    questionText: `In this academic text, identify and correct the error in: "${error.original}"`,
    type: 'fill_in_blank',
    orderIndex: index,
    points: 12,
    questionData: {
      type: 'fill_in_blank',
      template: `Correction: {answer}\nError type: {type}`,
      blanks: [
        {
          id: 'answer',
          position: 0,
          acceptableAnswers: [error.correct],
          caseSensitive: false
        },
        {
          id: 'type',
          position: 1,
          acceptableAnswers: [error.type, error.type.replace('-', ' ')],
          caseSensitive: false
        }
      ]
    },
    correctAnswer: [error.correct, error.type],
    hints: [
      "Consider formal academic writing conventions",
      "Think about precise grammar rules",
      "Academic writing requires extra precision"
    ],
    correctFeedback: `Excellent! You correctly identified the ${error.type} error and fixed it.`,
    incorrectFeedback: `This is a ${error.type} error common in academic writing. Review the specific rule.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'Academic Paper Grammar Review',
    description: `Review this excerpt from an academic paper and correct the grammar errors:\n\n"${academicText.excerpt}"\n\nFind and fix each error, then identify the error type.`,
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 1500, // 25 minutes
    maxAttempts: 2,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateWordPatternPuzzle(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `word-pattern-${Date.now()}`;
  
  const patterns = [
    {
      sequence: ["cat", "bat", "rat", "?"],
      answer: "hat",
      pattern: "Three-letter words ending in 'at'",
      hint: "All words rhyme and follow the same pattern"
    },
    {
      sequence: ["run", "ran", "?", "will run"],
      answer: "running",
      pattern: "Verb tenses: present, past, present participle, future",
      hint: "This shows different forms of the same verb"
    },
    {
      sequence: ["happy", "happier", "?"],
      answer: "happiest",
      pattern: "Adjective comparison forms",
      hint: "Positive, comparative, superlative"
    }
  ];
  
  const questions: ExerciseQuestion[] = patterns.map((pattern, index) => ({
    id: `${challengeId}-pattern-${index}`,
    exerciseId: challengeId,
    questionText: `What word completes this pattern: ${pattern.sequence.join(", ")}?\nPattern: ${pattern.pattern}`,
    type: 'fill_in_blank',
    orderIndex: index,
    points: 15,
    questionData: {
      type: 'fill_in_blank',
      template: `Missing word: {answer}`,
      blanks: [{
        id: 'answer',
        position: 0,
        acceptableAnswers: [pattern.answer],
        caseSensitive: false
      }]
    },
    correctAnswer: pattern.answer,
    hints: [
      pattern.hint,
      "Look for the grammatical relationship between the words",
      "Consider what rule or pattern connects them"
    ],
    correctFeedback: `Perfect! "${pattern.answer}" completes the ${pattern.pattern.toLowerCase()} pattern.`,
    incorrectFeedback: `Think about the ${pattern.pattern.toLowerCase()} relationship.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'Word Pattern Decoder Challenge',
    description: 'Solve these linguistic puzzles by finding the hidden patterns in word relationships!',
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 900, // 15 minutes
    maxAttempts: 3,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateGrammarMazePuzzle(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `grammar-maze-${Date.now()}`;
  
  // Simplified maze concept - in reality this would be more visual
  const mazeSteps = [
    {
      situation: "You reach a fork in the path. A sign says 'Choose the correct sentence to proceed.'",
      options: [
        "She don't like pizza",
        "She doesn't like pizza",
        "She not like pizza"
      ],
      correct: 1,
      explanation: "Negative contractions require 'doesn't' with third person singular."
    },
    {
      situation: "The path splits again. Which sentence opens the correct door?",
      options: [
        "Between you and I, this is confusing",
        "Between you and me, this is confusing", 
        "Between you and myself, this is confusing"
      ],
      correct: 1,
      explanation: "After prepositions like 'between', use object pronouns (me)."
    },
    {
      situation: "Final challenge! Pick the sentence that leads to the exit.",
      options: [
        "The data shows interesting results",
        "The data show interesting results",
        "The data is showing interesting results"
      ],
      correct: 1,
      explanation: "'Data' is plural, so it takes the plural verb 'show'."
    }
  ];
  
  const questions: ExerciseQuestion[] = mazeSteps.map((step, index) => ({
    id: `${challengeId}-step-${index}`,
    exerciseId: challengeId,
    questionText: `${step.situation}\n\nWhich sentence is grammatically correct?`,
    type: 'multiple_choice',
    orderIndex: index,
    points: 18,
    questionData: {
      type: 'multiple_choice',
      options: step.options,
      shuffleOptions: false // Keep order for maze narrative
    },
    correctAnswer: step.options[step.correct],
    hints: [
      "Think about the specific grammar rule",
      "Consider formal vs. informal usage",
      "Which option follows standard English rules?"
    ],
    correctFeedback: `Correct! You chose the right path. ${step.explanation}`,
    incorrectFeedback: `Wrong path! ${step.explanation} Try again.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'Grammar Maze Navigator',
    description: 'Navigate through a mysterious grammar maze! Make correct choices to find your way to the exit.',
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 1200, // 20 minutes
    maxAttempts: 3,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateSentenceSudokuPuzzle(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `sentence-sudoku-${Date.now()}`;
  
  // Simplified sentence sudoku - complete sentence grids
  const sudokuGrid = {
    description: "Complete this 3x3 sentence structure grid. Each row and column must contain one NOUN, one VERB, and one ADJECTIVE.",
    grid: [
      ["dog", "?", "happy"],      // Row 1: noun, ?, adjective
      ["?", "runs", "?"],         // Row 2: ?, verb, ?
      ["tall", "?", "tree"]       // Row 3: adjective, ?, noun
    ],
    solution: [
      ["dog", "jumps", "happy"],   // noun, verb, adjective
      ["quick", "runs", "fast"],   // adjective, verb, adjective  
      ["tall", "grows", "tree"]    // adjective, verb, noun
    ],
    missing: [
      { row: 0, col: 1, answer: "jumps", type: "verb" },
      { row: 1, col: 0, answer: "quick", type: "adjective" },
      { row: 1, col: 2, answer: "fast", type: "adjective" },
      { row: 2, col: 1, answer: "grows", type: "verb" }
    ]
  };
  
  const questions: ExerciseQuestion[] = sudokuGrid.missing.map((missing, index) => ({
    id: `${challengeId}-cell-${index}`,
    exerciseId: challengeId,
    questionText: `What ${missing.type} goes in row ${missing.row + 1}, column ${missing.col + 1} to complete the sentence structure grid?`,
    type: 'fill_in_blank',
    orderIndex: index,
    points: 20,
    questionData: {
      type: 'fill_in_blank',
      template: `${missing.type.charAt(0).toUpperCase() + missing.type.slice(1)}: {answer}`,
      blanks: [{
        id: 'answer',
        position: 0,
        acceptableAnswers: [missing.answer],
        caseSensitive: false
      }]
    },
    correctAnswer: missing.answer,
    hints: [
      `You need a ${missing.type} here`,
      "Make sure each row and column has one noun, verb, and adjective",
      "Think about words that would make sense in context"
    ],
    correctFeedback: `Perfect! "${missing.answer}" is the correct ${missing.type} for that position.`,
    incorrectFeedback: `Think about what ${missing.type} would complete the pattern correctly.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return {
    id: challengeId,
    lessonId: 'enrichment', 
    title: 'Sentence Structure Sudoku',
    description: `${sudokuGrid.description}\n\nCurrent grid:\n${sudokuGrid.grid.map((row, i) => `Row ${i + 1}: ${row.join(" | ")}`).join("\n")}\n\nFill in the missing parts of speech.`,
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 1320, // 22 minutes
    maxAttempts: 3,
    difficulty: config.difficulty,
    questions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Additional template generators would continue here...

async function generateGenreMashupChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
  const challengeId = `genre-mashup-${Date.now()}`;
  
  const genreCombinations = [
    {
      genres: ["mystery", "cookbook"],
      prompt: "Write a recipe that's also a mystery story. Each ingredient and step should advance both the cooking process and the mystery plot."
    },
    {
      genres: ["science fiction", "user manual"],
      prompt: "Create a user manual for a futuristic device, written as if you're from the year 3024 explaining technology to primitive 21st-century humans."
    },
    {
      genres: ["fairy tale", "news report"],
      prompt: "Write a news report covering the events of a classic fairy tale as if you were a journalist reporting live from the scene."
    }
  ];
  
  const selectedGenres = genreCombinations[Math.floor(Math.random() * genreCombinations.length)];
  
  const question: ExerciseQuestion = {
    id: `${challengeId}-mashup`,
    exerciseId: challengeId,
    questionText: `Genre Mashup Challenge: ${selectedGenres.genres.join(" + ")}\n\n${selectedGenres.prompt}`,
    type: 'essay',
    orderIndex: 0,
    points: 30,
    questionData: {
      type: 'essay',
      prompt: selectedGenres.prompt,
      minWords: 200,
      maxWords: 500,
      rubric: [
        { criteria: "Successfully blends both genres", points: 10 },
        { criteria: "Creative and original approach", points: 8 },
        { criteria: "Clear, correct grammar throughout", points: 7 },
        { criteria: "Engaging and entertaining", points: 5 }
      ]
    },
    correctAnswer: {
      text: "Creative genre mashup response",
      keyPoints: ["Blends genres", "Shows creativity", "Uses correct grammar", "Engages reader"],
      rubricScore: 25
    },
    correctFeedback: "Fantastic genre blending! You've created something truly unique and creative.",
    incorrectFeedback: "Good effort! Try to blend the genres more clearly while maintaining strong grammar.",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return {
    id: challengeId,
    lessonId: 'enrichment',
    title: 'Genre Mashup Creative Challenge',
    description: 'Combine unexpected genres to create something completely new!',
    type: 'challenge',
    orderIndex: 1,
    timeLimit: 1800, // 30 minutes
    maxAttempts: 1,
    difficulty: config.difficulty,
    questions: [question],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Export all template collections
export const allChallengeTemplates = {
  grammarDetective: grammarDetectiveTemplates,
  linguisticPuzzle: linguisticPuzzleTemplates,
  creativeWriting: creativeWritingTemplates,
  crossCurricular: crossCurricularTemplates,
  realWorld: realWorldTemplates
};

export function getAllTemplates(): ChallengeTemplate[] {
  return Object.values(allChallengeTemplates).flat();
}

export function getTemplatesByType(type: ChallengeType): ChallengeTemplate[] {
  return getAllTemplates().filter(template => template.type === type);
}

export function getTemplateById(id: string): ChallengeTemplate | undefined {
  return getAllTemplates().find(template => template.id === id);
}
