/**
 * Challenge Generator System
 * 
 * Creates advanced, engaging challenges for quick masters who need enrichment
 * activities beyond standard lessons. Uses sophisticated algorithms to generate
 * varied, appropriately difficult content that maintains motivation and learning.
 */

import { 
  Exercise, 
  ExerciseQuestion, 
  QuestionData,
  MultipleChoiceData,
  FillInBlankData,
  DragAndDropData,
  SentenceBuilderData,
  DifficultyLevel,
  LearningObjective
} from '../../types/content';

// ===== CHALLENGE CONFIGURATION =====

export interface ChallengeConfig {
  difficulty: DifficultyLevel;
  topic: string;
  learningObjectives: string[];
  timeLimit?: number;
  maxQuestions: number;
  challengeTypes: ChallengeType[];
  creativityLevel: CreativityLevel;
  userMasteryLevel: number; // 0-1, used for adaptive difficulty
}

export type ChallengeType = 
  | 'grammar_detective'     // Find and fix errors
  | 'sentence_transformation'  // Transform sentence structures
  | 'creative_writing'      // Open-ended creative challenges
  | 'etymology_explorer'    // Word origins and history
  | 'style_analyzer'        // Analyze writing styles
  | 'linguistic_puzzle'     // Logic puzzles with language
  | 'pattern_master'        // Identify and complete patterns
  | 'cross_curricular'      // Connect grammar to other subjects
  | 'real_world_application'  // Practical language use
  | 'collaborative_challenge'; // Multi-step project challenges

export type CreativityLevel = 'structured' | 'semi_open' | 'fully_creative';

// ===== CHALLENGE TEMPLATES =====

export interface ChallengeTemplate {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  generator: (config: ChallengeConfig, context?: any) => Promise<Exercise>;
  requiredMastery: string[]; // Prerequisites for this challenge type
  tags: string[];
}

export interface ChallengeContext {
  recentMistakes: string[]; // Common error types from recent attempts
  strengths: string[];      // Areas of demonstrated mastery
  interests: string[];      // User-indicated interests
  completedChallenges: string[]; // Previous challenge IDs
  sessionTime: number;      // Time available in current session
}

// ===== CORE CHALLENGE GENERATOR =====

export class ChallengeGenerator {
  private templates: Map<ChallengeType, ChallengeTemplate[]> = new Map();
  private usedCombinations: Set<string> = new Set();
  
  constructor() {
    this.initializeTemplates();
    // Note: External templates loaded asynchronously
    // For testing, built-in templates are sufficient
  }

  /**
   * Generate a personalized challenge based on config and context
   */
  async generateChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    // Select appropriate challenge type based on mastery level and context
    const challengeType = this.selectChallengeType(config, context);
    
    // Get available templates for this challenge type
    const availableTemplates = this.getAvailableTemplates(challengeType, config, context);
    
    if (availableTemplates.length === 0) {
      throw new Error(`No available templates for challenge type: ${challengeType}`);
    }
    
    // Select template with variety consideration
    const template = this.selectTemplateWithVariety(availableTemplates, context?.completedChallenges || []);
    
    // Generate the challenge using the selected template
    const challenge = await template.generator(config, context);
    
    // Add variety and creativity enhancements
    const enhancedChallenge = await this.enhanceWithCreativity(challenge, config.creativityLevel, context);
    
    // Track used combination to avoid repetition
    this.trackUsedCombination(template.id, config, context);
    
    return enhancedChallenge;
  }

  /**
   * Generate multiple challenges for extended enrichment
   */
  async generateChallengeSeries(
    config: ChallengeConfig, 
    count: number, 
    context?: ChallengeContext
  ): Promise<Exercise[]> {
    const challenges: Exercise[] = [];
    const seriesContext = { ...context };
    
    for (let i = 0; i < count; i++) {
      // Gradually increase difficulty for series
      const challengeConfig = {
        ...config,
        difficulty: this.scaleDifficulty(config.difficulty, i, count),
        userMasteryLevel: Math.min(config.userMasteryLevel + (i * 0.1), 1.0)
      };
      
      try {
        const challenge = await this.generateChallenge(challengeConfig, seriesContext);
        challenges.push(challenge);
        
        // Update context for next challenge
        seriesContext.completedChallenges = [
          ...(seriesContext.completedChallenges || []),
          challenge.id
        ];
      } catch (error) {
        // If challenge generation fails, try with fallback config
        const fallbackConfig = {
          ...config,
          challengeTypes: ['grammar_detective'], // Use reliable fallback
          difficulty: config.difficulty
        };
        
        const fallbackChallenge = await this.generateChallenge(fallbackConfig, seriesContext);
        challenges.push(fallbackChallenge);
        
        seriesContext.completedChallenges = [
          ...(seriesContext.completedChallenges || []),
          fallbackChallenge.id
        ];
      }
    }
    
    return challenges;
  }

  // ===== CHALLENGE TYPE SELECTION =====

  private selectChallengeType(config: ChallengeConfig, context?: ChallengeContext): ChallengeType {
    let availableTypes = [...config.challengeTypes];
    
    // Filter based on user mastery level
    if (config.userMasteryLevel < 0.7) {
      // Lower mastery: prefer structured challenges
      availableTypes = availableTypes.filter(type => 
        ['grammar_detective', 'sentence_transformation', 'pattern_master'].includes(type)
      );
    } else if (config.userMasteryLevel > 0.9) {
      // High mastery: prefer creative and complex challenges
      availableTypes = availableTypes.filter(type => 
        ['creative_writing', 'linguistic_puzzle', 'cross_curricular', 'collaborative_challenge'].includes(type)
      );
    }
    
    // Avoid recently completed types for variety
    if (context?.completedChallenges) {
      const recentTypes = this.extractRecentChallengeTypes(context.completedChallenges);
      availableTypes = availableTypes.filter(type => !recentTypes.includes(type));
    }
    
    // Select based on time available
    if (context?.sessionTime && context.sessionTime < 15) {
      availableTypes = availableTypes.filter(type => 
        ['grammar_detective', 'sentence_transformation', 'pattern_master'].includes(type)
      );
    }
    
    // Fallback to random selection
    return availableTypes.length > 0 
      ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
      : 'grammar_detective';
  }

  private extractRecentChallengeTypes(completedIds: string[]): ChallengeType[] {
    // This would query the database to get recent challenge types
    // For now, return empty array
    return [];
  }

  // ===== TEMPLATE MANAGEMENT =====

  private getAvailableTemplates(
    challengeType: ChallengeType, 
    config: ChallengeConfig, 
    context?: ChallengeContext
  ): ChallengeTemplate[] {
    const templates = this.templates.get(challengeType) || [];
    
    return templates.filter(template => {
      // Filter by difficulty appropriateness
      if (!this.isDifficultyAppropriate(template.difficulty, config.difficulty)) {
        return false;
      }
      
      // Filter by required mastery
      if (config.userMasteryLevel < 0.8 && template.difficulty === 'advanced') {
        return false;
      }
      
      // Filter by time constraints (only if very restrictive)
      if (context?.sessionTime && template.estimatedMinutes > (context.sessionTime * 1.5)) {
      return false;
      }
      
      return true;
    });
  }

  private selectTemplateWithVariety(
    templates: ChallengeTemplate[], 
    completedChallenges: string[]
  ): ChallengeTemplate {
    // Prioritize templates not recently used
    const unusedTemplates = templates.filter(template => 
      !completedChallenges.some(id => id.includes(template.id))
    );
    
    const selectionPool = unusedTemplates.length > 0 ? unusedTemplates : templates;
    return selectionPool[Math.floor(Math.random() * selectionPool.length)];
  }

  private isDifficultyAppropriate(templateDifficulty: DifficultyLevel, configDifficulty: DifficultyLevel): boolean {
    const difficultyLevels = { beginner: 0, intermediate: 1, advanced: 2 };
    const templateLevel = difficultyLevels[templateDifficulty];
    const configLevel = difficultyLevels[configDifficulty];
    
    // Allow templates within one level of requested difficulty
    return Math.abs(templateLevel - configLevel) <= 1;
  }

  // ===== CREATIVITY ENHANCEMENT =====

  private async enhanceWithCreativity(
    challenge: Exercise, 
    creativityLevel: CreativityLevel,
    context?: ChallengeContext
  ): Promise<Exercise> {
    switch (creativityLevel) {
      case 'structured':
        return challenge; // Return as-is for structured challenges
        
      case 'semi_open':
        return this.addSemiOpenElements(challenge, context);
        
      case 'fully_creative':
        return this.addFullyCreativeElements(challenge, context);
        
      default:
        return challenge;
    }
  }

  private async addSemiOpenElements(challenge: Exercise, context?: ChallengeContext): Promise<Exercise> {
    // Add optional creative components
    const enhancedQuestions = challenge.questions.map(question => ({
      ...question,
      hints: [
        ...(question.hints || []),
        "Try thinking about this in a creative way!",
        "What would happen if you changed the context?"
      ]
    }));
    
    return {
      ...challenge,
      questions: enhancedQuestions,
      description: `${challenge.description} Feel free to be creative with your answers!`
    };
  }

  private async addFullyCreativeElements(challenge: Exercise, context?: ChallengeContext): Promise<Exercise> {
    // Add open-ended creative questions
    const creativeQuestion: ExerciseQuestion = {
      id: `${challenge.id}-creative`,
      exerciseId: challenge.id,
      questionText: "Now create your own variation of this challenge! What would you change or add?",
      type: 'essay',
      orderIndex: challenge.questions.length,
      points: 10,
      questionData: {
        type: 'essay',
        prompt: "Design your own version of this challenge. Explain your changes and why they would be interesting or educational.",
        minWords: 100,
        maxWords: 300,
        rubric: [
          { criteria: "Creativity and originality", points: 4 },
          { criteria: "Clear explanation", points: 3 },
          { criteria: "Educational value", points: 3 }
        ]
      },
      correctAnswer: {
        text: "Open-ended creative response",
        keyPoints: ["Shows creativity", "Demonstrates understanding", "Provides clear explanation"]
      },
      correctFeedback: "Great creativity! Your ideas show deep understanding.",
      incorrectFeedback: "Try to be more specific about your creative ideas.",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      ...challenge,
      questions: [...challenge.questions, creativeQuestion],
      description: `${challenge.description} This challenge includes a creative component where you can design your own variations!`
    };
  }

  // ===== DIFFICULTY SCALING =====

  private scaleDifficulty(baseDifficulty: DifficultyLevel, index: number, total: number): DifficultyLevel {
    const progressRatio = index / Math.max(total - 1, 1);
    
    if (baseDifficulty === 'beginner') {
      if (progressRatio > 0.7) return 'intermediate';
      return 'beginner';
    }
    
    if (baseDifficulty === 'intermediate') {
      if (progressRatio > 0.6) return 'advanced';
      if (progressRatio < 0.3) return 'beginner';
      return 'intermediate';
    }
    
    // Advanced stays advanced but can vary in complexity
    return 'advanced';
  }

  // ===== TRACKING AND ANALYTICS =====

  private trackUsedCombination(templateId: string, config: ChallengeConfig, context?: ChallengeContext): void {
    const combinationKey = `${templateId}-${config.difficulty}-${config.topic}-${config.creativityLevel}`;
    this.usedCombinations.add(combinationKey);
    
    // In a real implementation, this would persist to database
    // for cross-session variety tracking
  }

  /**
   * Reset variety tracking (useful for testing or new users)
   */
  resetVarietyTracking(): void {
    this.usedCombinations.clear();
  }

  // ===== TEMPLATE INITIALIZATION =====

  private loadExternalTemplates(): void {
    // Import and load external templates
    import('./challenge-templates').then(({ allChallengeTemplates }) => {
      // Load grammar detective templates
      this.templates.set('grammar_detective', [
        ...this.templates.get('grammar_detective') || [],
        ...allChallengeTemplates.grammarDetective
      ]);
      
      // Load other template types
      this.templates.set('linguistic_puzzle', allChallengeTemplates.linguisticPuzzle);
      this.templates.set('creative_writing', allChallengeTemplates.creativeWriting);
      this.templates.set('cross_curricular', allChallengeTemplates.crossCurricular);
      this.templates.set('real_world_application', allChallengeTemplates.realWorld);
    }).catch(() => {
      // Fallback if external templates can't be loaded
      console.warn('Could not load external challenge templates, using built-in templates only');
    });
  }

  private initializeTemplates(): void {
    // Grammar Detective Templates
    this.templates.set('grammar_detective', [
      {
        id: 'detective-basic-errors',
        type: 'grammar_detective',
        title: 'Grammar Detective: Error Hunt',
        description: 'Find and correct grammar errors in increasingly complex texts',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        generator: this.generateGrammarDetectiveChallenge.bind(this),
        requiredMastery: ['basic-grammar', 'sentence-structure'],
        tags: ['error-correction', 'analysis', 'critical-thinking']
      },
      {
        id: 'detective-style-analysis',
        type: 'grammar_detective', 
        title: 'Grammar Detective: Style Sleuth',
        description: 'Analyze different writing styles and identify grammar patterns',
        difficulty: 'advanced',
        estimatedMinutes: 20,
        generator: this.generateStyleAnalysisChallenge.bind(this),
        requiredMastery: ['advanced-grammar', 'writing-analysis'],
        tags: ['style-analysis', 'patterns', 'advanced']
      }
    ]);

    // Sentence Transformation Templates
    this.templates.set('sentence_transformation', [
      {
        id: 'transform-structures',
        type: 'sentence_transformation',
        title: 'Sentence Shapeshifter',
        description: 'Transform sentences while maintaining meaning',
        difficulty: 'intermediate',
        estimatedMinutes: 12,
        generator: this.generateTransformationChallenge.bind(this),
        requiredMastery: ['sentence-structure', 'parts-of-speech'],
        tags: ['transformation', 'structure', 'meaning']
      }
    ]);

    // Pattern Master Templates (for adaptive challenges)
    this.templates.set('pattern_master', [
      {
        id: 'pattern-recognition',
        type: 'pattern_master',
        title: 'Grammar Pattern Master',
        description: 'Recognize and complete grammar patterns',
        difficulty: 'intermediate',
        estimatedMinutes: 10,
        generator: generatePatternMasterChallenge,
        requiredMastery: ['pattern-recognition', 'grammar-rules'],
        tags: ['patterns', 'rules', 'recognition']
      }
    ]);

    // Creative Writing Templates
    this.templates.set('creative_writing', [
      {
        id: 'constrained-writing',
        type: 'creative_writing',
        title: 'Creative Constraints Challenge',
        description: 'Write creatively within specific grammar constraints',
        difficulty: 'advanced',
        estimatedMinutes: 25,
        generator: this.generateConstrainedWritingChallenge.bind(this),
        requiredMastery: ['advanced-writing', 'creativity'],
        tags: ['creative-writing', 'constraints', 'advanced']
      }
    ]);

    // Etymology Explorer Templates
    this.templates.set('etymology_explorer', [
      {
        id: 'word-origins',
        type: 'etymology_explorer',
        title: 'Word Origin Detective',
        description: 'Explore the fascinating history behind words',
        difficulty: 'intermediate',
        estimatedMinutes: 18,
        generator: this.generateEtymologyChallenge.bind(this),
        requiredMastery: ['vocabulary', 'word-analysis'],
        tags: ['etymology', 'history', 'vocabulary']
      }
    ]);

    // Add more template categories...
  }

  // ===== CHALLENGE GENERATORS =====

  private async generateGrammarDetectiveChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `grammar-detective-${Date.now()}`;
    
    // Sample text with intentional errors based on user's recent mistakes
    const errorTexts = this.generateErrorTexts(config.difficulty, context?.recentMistakes || []);
    
    const questions: ExerciseQuestion[] = errorTexts.map((errorText, index) => ({
      id: `${challengeId}-q${index + 1}`,
      exerciseId: challengeId,
      questionText: `Find and correct all grammar errors in this text: "${errorText.text}"`,
      type: 'fill_in_blank',
      orderIndex: index,
      points: 10,
      questionData: {
        type: 'fill_in_blank',
        template: errorText.template,
        blanks: errorText.blanks
      } as FillInBlankData,
      correctAnswer: errorText.corrections,
      hints: [
        "Look for subject-verb agreement issues",
        "Check pronoun usage",
        "Examine punctuation carefully"
      ],
      correctFeedback: "Excellent detective work! You found all the errors.",
      incorrectFeedback: "Keep looking! There might be more errors to find.",
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Grammar Detective Challenge',
      description: 'Put on your detective hat and hunt down grammar errors!',
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

  private async generateStyleAnalysisChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `style-analysis-${Date.now()}`;
    
    const styleTexts = [
      {
        text: "The magnificent, towering oak tree stood majestically in the center of the verdant meadow.",
        style: "descriptive",
        features: ["multiple adjectives", "formal vocabulary", "complex sentence structure"]
      },
      {
        text: "Tree in field. Big. Green.",
        style: "minimalist", 
        features: ["sentence fragments", "simple vocabulary", "telegraphic style"]
      },
      {
        text: "OMG! That tree is SO huge and it's like, right in the middle of this super green field!",
        style: "informal",
        features: ["interjections", "intensifiers", "casual vocabulary"]
      }
    ];

    const questions: ExerciseQuestion[] = styleTexts.map((styleText, index) => ({
      id: `${challengeId}-style-q${index + 1}`,
      exerciseId: challengeId,
      questionText: `Analyze this text: "${styleText.text}" What writing style is this and what are its key features?`,
      type: 'multiple_choice',
      orderIndex: index,
      points: 15,
      questionData: {
        type: 'multiple_choice',
        options: [
          `${styleText.style} style: ${styleText.features.join(', ')}`,
          "formal academic style: complex syntax, technical vocabulary",
          "narrative style: past tense, character focus",
          "instructional style: imperative mood, clear steps"
        ],
        shuffleOptions: true
      } as MultipleChoiceData,
      correctAnswer: styleText.style,
      correctFeedback: `Correct! This is ${styleText.style} style with features like ${styleText.features.join(', ')}.`,
      incorrectFeedback: `Not quite. Look more carefully at the vocabulary and sentence structure.`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Style Analysis Challenge',
      description: 'Become a style sleuth and analyze different writing approaches!',
      type: 'challenge',
      orderIndex: 1,
      timeLimit: 1200, // 20 minutes
      maxAttempts: 2,
      difficulty: config.difficulty,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async generateTransformationChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `transformation-${Date.now()}`;
    
    const transformationTasks = [
      {
        original: "The cat sat on the mat.",
        task: "Change to past perfect tense",
        answer: "The cat had sat on the mat."
      },
      {
        original: "She is a talented musician.",
        task: "Change to negative form",
        answer: "She is not a talented musician."
      },
      {
        original: "The students worked hard.",
        task: "Change to passive voice",
        answer: "Hard work was done by the students."
      }
    ];

    const questions: ExerciseQuestion[] = transformationTasks.map((task, index) => ({
      id: `${challengeId}-transform-q${index + 1}`,
      exerciseId: challengeId,
      questionText: `Transform this sentence: "${task.original}"\nTask: ${task.task}`,
      type: 'fill_in_blank',
      orderIndex: index,
      points: 12,
      questionData: {
        type: 'fill_in_blank',
        template: "Transformed sentence: {answer}",
        blanks: [{
          id: 'answer',
          position: 0,
          acceptableAnswers: [task.answer],
          caseSensitive: false
        }]
      } as FillInBlankData,
      correctAnswer: task.answer,
      hints: [
        "Think about the grammar rule for this transformation",
        "Consider how the meaning should be preserved",
        "Check your verb forms carefully"
      ],
      correctFeedback: "Perfect transformation! You maintained the meaning while changing the structure.",
      incorrectFeedback: "Good try! Think about the specific grammar rule for this transformation.",
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Sentence Transformation Challenge',
      description: 'Shape-shift sentences while keeping their meaning intact!',
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

  private async generateConstrainedWritingChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `constrained-writing-${Date.now()}`;
    
    const constraints = [
      "Write a story using only words that start with the same letter",
      "Write a paragraph where every sentence has exactly 7 words",
      "Write a description using no adjectives, only strong nouns and verbs",
      "Write a dialogue using only questions and exclamations"
    ];

    const selectedConstraint = constraints[Math.floor(Math.random() * constraints.length)];

    const question: ExerciseQuestion = {
      id: `${challengeId}-writing`,
      exerciseId: challengeId,
      questionText: `Creative Writing Challenge: ${selectedConstraint}`,
      type: 'essay',
      orderIndex: 0,
      points: 25,
      questionData: {
        type: 'essay',
        prompt: selectedConstraint,
        minWords: 150,
        maxWords: 400,
        rubric: [
          { criteria: "Follows constraint creatively", points: 8 },
          { criteria: "Clear and engaging writing", points: 7 },
          { criteria: "Correct grammar within constraint", points: 5 },
          { criteria: "Originality and creativity", points: 5 }
        ]
      },
      correctAnswer: {
        text: "Creative response following the given constraint",
        keyPoints: ["Follows constraint", "Shows creativity", "Uses correct grammar", "Engages reader"],
        rubricScore: 20
      },
      correctFeedback: "Fantastic creative work! You showed great skill working within constraints.",
      incorrectFeedback: "Good effort! Try to follow the constraint more closely while maintaining creativity.",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Constrained Creativity Challenge',
      description: 'Unleash your creativity within specific writing constraints!',
      type: 'challenge',
      orderIndex: 1,
      timeLimit: 1500, // 25 minutes
      maxAttempts: 1, // Creative writing gets one attempt
      difficulty: config.difficulty,
      questions: [question],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async generateEtymologyChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `etymology-${Date.now()}`;
    
    const etymologyWords = [
      {
        word: "sandwich",
        origin: "Named after the Earl of Sandwich who wanted to eat while playing cards",
        language: "English",
        year: "1762"
      },
      {
        word: "helicopter",
        origin: "From Greek 'helikos' (spiral) + 'pteron' (wing)",
        language: "Greek",
        year: "1861"
      },
      {
        word: "robot",
        origin: "From Czech 'robota' meaning forced labor or work",
        language: "Czech",
        year: "1920"
      }
    ];

    const questions: ExerciseQuestion[] = etymologyWords.map((wordInfo, index) => ({
      id: `${challengeId}-etymology-q${index + 1}`,
      exerciseId: challengeId,
      questionText: `The word "${wordInfo.word}" has an interesting history. What is its origin?`,
      type: 'multiple_choice',
      orderIndex: index,
      points: 10,
      questionData: {
        type: 'multiple_choice',
        options: [
          wordInfo.origin,
          "From Latin meaning 'to move quickly'",
          "From French meaning 'small device'", 
          "From German meaning 'machine-like'"
        ],
        shuffleOptions: true
      } as MultipleChoiceData,
      correctAnswer: wordInfo.origin,
      correctFeedback: `Correct! "${wordInfo.word}" ${wordInfo.origin}. It entered English around ${wordInfo.year}.`,
      incorrectFeedback: `Not quite! The word "${wordInfo.word}" has a more specific historical origin.`,
      hints: [
        `Think about the ${wordInfo.language} connection`,
        "Consider the historical context of when this word was needed",
        "The origin relates to the word's practical use"
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Etymology Explorer Challenge',
      description: 'Discover the fascinating stories behind everyday words!',
      type: 'challenge',
      orderIndex: 1,
      timeLimit: 1080, // 18 minutes
      maxAttempts: 2,
      difficulty: config.difficulty,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // ===== HELPER METHODS =====

  private generateErrorTexts(difficulty: DifficultyLevel, recentMistakes: string[]) {
    const errorTexts = {
      beginner: [
        {
          text: "Me and my friend goes to school together every day.",
          template: "{subject} and my friend {verb} to school together every day.",
          blanks: [
            { id: 'subject', position: 0, acceptableAnswers: ['My friend', 'I'], caseSensitive: false },
            { id: 'verb', position: 1, acceptableAnswers: ['go'], caseSensitive: false }
          ],
          corrections: ["My friend", "go"]
        }
      ],
      intermediate: [
        {
          text: "The group of students were arguing about their homework, but they couldn't agree on nothing.",
          template: "The group of students {verb1} arguing about their homework, but they couldn't agree on {anything}.",
          blanks: [
            { id: 'verb1', position: 0, acceptableAnswers: ['was'], caseSensitive: false },
            { id: 'anything', position: 1, acceptableAnswers: ['anything'], caseSensitive: false }
          ],
          corrections: ["was", "anything"]
        }
      ],
      advanced: [
        {
          text: "Having finished the presentation, the audience was impressed by the student's performance.",
          template: "Having finished the presentation, {subject} impressed the audience with {possessive} performance.", 
          blanks: [
            { id: 'subject', position: 0, acceptableAnswers: ['the student'], caseSensitive: false },
            { id: 'possessive', position: 1, acceptableAnswers: ['their', 'his', 'her'], caseSensitive: false }
          ],
          corrections: ["the student", "their"]
        }
      ]
    };
    
    return errorTexts[difficulty];
  }

  /**
   * Get challenge statistics for analytics
   */
  getChallengeStats(): {
    templatesLoaded: number;
    challengeTypesAvailable: number;
    usedCombinations: number;
  } {
    return {
      templatesLoaded: Array.from(this.templates.values()).reduce((total, templates) => total + templates.length, 0),
      challengeTypesAvailable: this.templates.size,
      usedCombinations: this.usedCombinations.size
    };
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create a challenge generator instance
 */
export function createChallengeGenerator(): ChallengeGenerator {
  return new ChallengeGenerator();
}

/**
 * Generate a quick challenge for immediate use
 */
export async function generateQuickChallenge(
  difficulty: DifficultyLevel,
  topic: string,
  timeLimit: number = 15
): Promise<Exercise> {
  const generator = createChallengeGenerator();
  
  const config: ChallengeConfig = {
    difficulty,
    topic,
    learningObjectives: [topic],
    maxQuestions: 3,
    challengeTypes: ['grammar_detective', 'sentence_transformation'],
    creativityLevel: 'structured',
    userMasteryLevel: 0.8
  };
  
  const context: ChallengeContext = {
    recentMistakes: [],
    strengths: [],
    interests: [],
    completedChallenges: [],
    sessionTime: timeLimit * 2 // Give more time for context filtering
  };
  
  return generator.generateChallenge(config, context);
}

/**
 * Generate adaptive challenges based on user performance
 */
export async function generateAdaptiveChallenge(
  userMasteryLevel: number,
  weakAreas: string[],
  interests: string[],
  sessionTime: number
): Promise<Exercise> {
  const generator = createChallengeGenerator();
  
  const difficulty: DifficultyLevel = 
    userMasteryLevel < 0.6 ? 'beginner' :
    userMasteryLevel < 0.85 ? 'intermediate' : 'advanced';
  
  const config: ChallengeConfig = {
    difficulty,
    topic: weakAreas[0] || 'grammar',
    learningObjectives: weakAreas,
    maxQuestions: Math.floor(sessionTime / 5), // ~5 minutes per question
    challengeTypes: ['grammar_detective', 'sentence_transformation', 'pattern_master'],
    creativityLevel: userMasteryLevel > 0.8 ? 'semi_open' : 'structured',
    userMasteryLevel
  };
  
  const context: ChallengeContext = {
    recentMistakes: weakAreas,
    strengths: interests,
    interests,
    completedChallenges: [],
    sessionTime
  };
  
  return generator.generateChallenge(config, context);
}

// Additional challenge generator methods
async function generatePatternMasterChallenge(config: ChallengeConfig, context?: ChallengeContext): Promise<Exercise> {
    const challengeId = `pattern-master-${Date.now()}`;
    
    const patterns = [
      {
        rule: "Past tense formation",
        examples: ["walk → walked", "play → played"],
        question: "dance → ?",
        answer: "danced"
      },
      {
        rule: "Plural formation",
        examples: ["cat → cats", "dog → dogs"],  
        question: "book → ?",
        answer: "books"
      }
    ];
    
    const questions: ExerciseQuestion[] = patterns.map((pattern, index) => ({
      id: `${challengeId}-pattern-${index}`,
      exerciseId: challengeId,
      questionText: `Complete the pattern:\nRule: ${pattern.rule}\nExamples: ${pattern.examples.join(", ")}\n${pattern.question}`,
      type: 'fill_in_blank',
      orderIndex: index,
      points: 10,
      questionData: {
        type: 'fill_in_blank',
        template: `Answer: {answer}`,
        blanks: [{
          id: 'answer',
          position: 0,
          acceptableAnswers: [pattern.answer],
          caseSensitive: false
        }]
      },
      correctAnswer: pattern.answer,
      hints: [
        `Think about the ${pattern.rule.toLowerCase()}`,
        "Look at the pattern in the examples",
        "Apply the same rule to complete the pattern"
      ],
      correctFeedback: `Correct! "${pattern.answer}" follows the ${pattern.rule.toLowerCase()} pattern.`,
      incorrectFeedback: `Think about how the ${pattern.rule.toLowerCase()} works.`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      id: challengeId,
      lessonId: 'enrichment',
      title: 'Grammar Pattern Master',
      description: 'Master grammar patterns by recognizing rules and applying them correctly!',
      type: 'challenge',
      orderIndex: 1,
      timeLimit: 600, // 10 minutes
      maxAttempts: 3,
      difficulty: config.difficulty,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
}
