/**
 * Exercise Generator Logic
 * 
 * Dynamic exercise generation based on content with template-based creation
 * and difficulty scaling algorithms.
 */

import type { 
  ExerciseQuestion, 
  QuestionType, 
  DifficultyLevel,
  LearningObjective,
  Unit,
  Lesson
} from '../../types/content';

// ===== GENERATOR INTERFACES =====

export interface ExerciseTemplate {
  id: string;
  name: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  patterns: TemplatePattern[];
  requiredElements: string[];
  optionalElements: string[];
  metadata: {
    category: string;
    concepts: string[];
    estimatedTime: number;
    maxVariations: number;
  };
}

export interface TemplatePattern {
  id: string;
  pattern: string; // Template string with placeholders
  variables: TemplateVariable[];
  constraints: PatternConstraint[];
  examples: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'word' | 'phrase' | 'sentence' | 'concept' | 'number' | 'list';
  required: boolean;
  source: 'content' | 'wordbank' | 'generated' | 'user';
  constraints?: {
    minLength?: number;
    maxLength?: number;
    allowedValues?: string[];
    format?: RegExp;
  };
}

export interface PatternConstraint {
  type: 'grammar' | 'semantic' | 'difficulty' | 'length' | 'coherence';
  rule: string;
  weight: number; // 0-1 priority weight
}

export interface GenerationContext {
  sourceContent: string;
  objectives: LearningObjective[];
  targetDifficulty: DifficultyLevel;
  conceptsFocus: string[];
  existingExercises: ExerciseQuestion[];
  userLevel: number; // 0-100 proficiency
  preferences: {
    preferredTypes: QuestionType[];
    avoidRepetition: boolean;
    contextualRelevance: number; // 0-1
    creativityLevel: number; // 0-1
  };
}

export interface GeneratedExercise {
  question: ExerciseQuestion;
  template: ExerciseTemplate;
  variations: ExerciseQuestion[];
  metadata: {
    confidence: number; // 0-1 how confident we are in quality
    complexity: number; // 0-1 exercise complexity
    uniqueness: number; // 0-1 how unique vs existing
    pedagogicalValue: number; // 0-1 educational effectiveness
  };
}

export interface DifficultyScaleConfig {
  vocabulary: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  concepts: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  structure: {
    beginner: { maxWords: number; maxClauses: number; complexity: number };
    intermediate: { maxWords: number; maxClauses: number; complexity: number };
    advanced: { maxWords: number; maxClauses: number; complexity: number };
  };
}

// ===== EXERCISE GENERATOR CLASS =====

export class ExerciseGenerator {
  private templates: Map<string, ExerciseTemplate> = new Map();
  private wordBank: Map<string, string[]> = new Map();
  private difficultyConfig: DifficultyScaleConfig;

  constructor() {
    this.initializeTemplates();
    this.initializeWordBank();
    this.difficultyConfig = this.createDifficultyConfig();
  }

  /**
   * Generate exercises from content
   */
  async generateExercises(
    context: GenerationContext,
    count: number = 5
  ): Promise<GeneratedExercise[]> {
    const suitableTemplates = this.findSuitableTemplates(context);
    const exercises: GeneratedExercise[] = [];

    for (let i = 0; i < count; i++) {
      const template = this.selectTemplate(suitableTemplates, context, exercises);
      if (!template) break;

      const generatedExercise = await this.generateFromTemplate(template, context);
      if (generatedExercise) {
        exercises.push(generatedExercise);
      }
    }

    return this.optimizeExerciseSet(exercises, context);
  }

  /**
   * Generate variations of an existing exercise
   */
  async generateVariations(
    baseExercise: ExerciseQuestion,
    count: number = 3
  ): Promise<ExerciseQuestion[]> {
    const variations: ExerciseQuestion[] = [];
    const template = this.findTemplateForExercise(baseExercise);
    
    if (!template) return variations;

    for (let i = 0; i < count; i++) {
      const variation = await this.createVariation(baseExercise, template);
      if (variation && !this.isDuplicate(variation, [...variations, baseExercise])) {
        variations.push(variation);
      }
    }

    return variations;
  }

  /**
   * Scale exercise difficulty
   */
  scaleExerciseDifficulty(
    exercise: ExerciseQuestion,
    targetDifficulty: DifficultyLevel
  ): ExerciseQuestion {
    const currentDifficulty = this.analyzeDifficulty(exercise);
    
    if (currentDifficulty === targetDifficulty) {
      return exercise;
    }

    return this.adjustDifficulty(exercise, currentDifficulty, targetDifficulty);
  }

  /**
   * Map content to potential exercises
   */
  mapContentToExercises(content: string, objectives: LearningObjective[]): ContentMapping[] {
    const mappings: ContentMapping[] = [];
    
    // Extract key concepts from content
    const concepts = this.extractConcepts(content);
    
    // Find relevant templates for each concept
    for (const concept of concepts) {
      const relevantTemplates = this.findTemplatesForConcept(concept);
      
      mappings.push({
        concept,
        content: this.extractRelevantContent(content, concept),
        templates: relevantTemplates,
        objectives: objectives.filter(obj => this.isObjectiveRelevant(obj, concept)),
        difficulty: this.estimateContentDifficulty(content, concept),
        relevanceScore: this.calculateRelevanceScore(concept, content),
      });
    }

    return mappings.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // ===== TEMPLATE MANAGEMENT =====

  private initializeTemplates(): void {
    // Multiple Choice Templates
    this.templates.set('mc-basic-grammar', {
      id: 'mc-basic-grammar',
      name: 'Basic Grammar Multiple Choice',
      type: 'multiple_choice',
      difficulty: 'beginner',
      patterns: [
        {
          id: 'subject-verb-agreement',
          pattern: 'Choose the correct verb form: "The {subject} {verb_options} {complement}."',
          variables: [
            { name: 'subject', type: 'word', required: true, source: 'content' },
            { name: 'verb_options', type: 'list', required: true, source: 'generated' },
            { name: 'complement', type: 'phrase', required: false, source: 'content' },
          ],
          constraints: [
            { type: 'grammar', rule: 'subject_verb_agreement', weight: 1.0 },
            { type: 'difficulty', rule: 'beginner_vocabulary', weight: 0.8 },
          ],
          examples: [
            'Choose the correct verb form: "The cat {sits/sit} on the mat."',
            'Choose the correct verb form: "Dogs {runs/run} in the park."',
          ],
        },
      ],
      requiredElements: ['subject', 'verb'],
      optionalElements: ['complement', 'adjective'],
      metadata: {
        category: 'grammar',
        concepts: ['subject-verb agreement', 'present tense'],
        estimatedTime: 30,
        maxVariations: 10,
      },
    });

    // Fill in the Blank Templates
    this.templates.set('fill-articles', {
      id: 'fill-articles',
      name: 'Article Usage Fill-in-Blank',
      type: 'fill_in_blank',
      difficulty: 'intermediate',
      patterns: [
        {
          id: 'article-selection',
          pattern: '_{article}_ {noun} {verb} {complement}.',
          variables: [
            { name: 'article', type: 'word', required: true, source: 'generated' },
            { name: 'noun', type: 'word', required: true, source: 'content' },
            { name: 'verb', type: 'word', required: true, source: 'content' },
            { name: 'complement', type: 'phrase', required: false, source: 'content' },
          ],
          constraints: [
            { type: 'grammar', rule: 'article_noun_agreement', weight: 1.0 },
            { type: 'semantic', rule: 'contextual_relevance', weight: 0.7 },
          ],
          examples: [
            '_{article}_ cat sat on the mat.',
            '_{article}_ apple fell from the tree.',
          ],
        },
      ],
      requiredElements: ['noun', 'context'],
      optionalElements: ['adjective', 'prepositional_phrase'],
      metadata: {
        category: 'grammar',
        concepts: ['articles', 'definite article', 'indefinite article'],
        estimatedTime: 45,
        maxVariations: 8,
      },
    });

    // Sentence Builder Templates
    this.templates.set('sentence-construction', {
      id: 'sentence-construction',
      name: 'Sentence Construction',
      type: 'sentence_builder',
      difficulty: 'advanced',
      patterns: [
        {
          id: 'complex-sentence',
          pattern: 'Arrange these words to form a grammatically correct sentence: {word_list}',
          variables: [
            { name: 'word_list', type: 'list', required: true, source: 'generated' },
          ],
          constraints: [
            { type: 'grammar', rule: 'sentence_structure', weight: 1.0 },
            { type: 'coherence', rule: 'logical_flow', weight: 0.9 },
            { type: 'difficulty', rule: 'advanced_structure', weight: 0.8 },
          ],
          examples: [
            'Arrange: [although, was, raining, it, went, we, outside]',
            'Arrange: [because, studied, hard, she, passed, the, exam]',
          ],
        },
      ],
      requiredElements: ['words', 'target_structure'],
      optionalElements: ['connectors', 'modifiers'],
      metadata: {
        category: 'syntax',
        concepts: ['sentence structure', 'word order', 'complex sentences'],
        estimatedTime: 60,
        maxVariations: 5,
      },
    });

    // Drag and Drop Templates
    this.templates.set('word-categorization', {
      id: 'word-categorization',
      name: 'Word Categorization',
      type: 'drag_and_drop',
      difficulty: 'intermediate',
      patterns: [
        {
          id: 'parts-of-speech',
          pattern: 'Drag each word to its correct category: {word_categories}',
          variables: [
            { name: 'word_categories', type: 'list', required: true, source: 'generated' },
          ],
          constraints: [
            { type: 'grammar', rule: 'parts_of_speech', weight: 1.0 },
            { type: 'difficulty', rule: 'intermediate_vocabulary', weight: 0.7 },
          ],
          examples: [
            'Categories: [Nouns, Verbs, Adjectives] Words: [cat, run, beautiful, dog, jump, tall]',
          ],
        },
      ],
      requiredElements: ['categories', 'items'],
      optionalElements: ['context', 'examples'],
      metadata: {
        category: 'vocabulary',
        concepts: ['parts of speech', 'categorization', 'word types'],
        estimatedTime: 40,
        maxVariations: 12,
      },
    });
  }

  private initializeWordBank(): void {
    this.wordBank.set('nouns_beginner', [
      'cat', 'dog', 'house', 'car', 'book', 'table', 'chair', 'apple', 'tree', 'water',
    ]);

    this.wordBank.set('nouns_intermediate', [
      'environment', 'technology', 'information', 'community', 'opportunity', 'relationship',
    ]);

    this.wordBank.set('verbs_beginner', [
      'run', 'walk', 'eat', 'sleep', 'read', 'write', 'play', 'work', 'study', 'think',
    ]);

    this.wordBank.set('verbs_intermediate', [
      'analyze', 'synthesize', 'demonstrate', 'implement', 'collaborate', 'investigate',
    ]);

    this.wordBank.set('adjectives_beginner', [
      'big', 'small', 'happy', 'sad', 'fast', 'slow', 'hot', 'cold', 'good', 'bad',
    ]);

    this.wordBank.set('adjectives_intermediate', [
      'magnificent', 'extraordinary', 'sophisticated', 'comprehensive', 'innovative', 'substantial',
    ]);

    this.wordBank.set('articles', ['a', 'an', 'the']);
    this.wordBank.set('prepositions', ['in', 'on', 'at', 'by', 'for', 'with', 'from', 'to']);
    this.wordBank.set('conjunctions', ['and', 'but', 'or', 'because', 'although', 'while', 'since']);
  }

  private createDifficultyConfig(): DifficultyScaleConfig {
    return {
      vocabulary: {
        beginner: this.wordBank.get('nouns_beginner') || [],
        intermediate: this.wordBank.get('nouns_intermediate') || [],
        advanced: ['phenomena', 'infrastructure', 'sustainability', 'consciousness'],
      },
      concepts: {
        beginner: ['basic sentence structure', 'simple present tense', 'articles'],
        intermediate: ['perfect tenses', 'conditionals', 'passive voice'],
        advanced: ['subjunctive mood', 'complex syntax', 'advanced discourse markers'],
      },
      structure: {
        beginner: { maxWords: 10, maxClauses: 1, complexity: 0.3 },
        intermediate: { maxWords: 20, maxClauses: 2, complexity: 0.6 },
        advanced: { maxWords: 35, maxClauses: 4, complexity: 1.0 },
      },
    };
  }

  // ===== GENERATION METHODS =====

  private findSuitableTemplates(context: GenerationContext): ExerciseTemplate[] {
    return Array.from(this.templates.values()).filter(template => {
      // Filter by difficulty
      if (!this.isDifficultyMatch(template.difficulty, context.targetDifficulty)) {
        return false;
      }

      // Filter by concepts
      const hasRelevantConcepts = template.metadata.concepts.some(concept =>
        context.conceptsFocus.includes(concept)
      );

      // Filter by type preferences
      const isPreferredType = context.preferences.preferredTypes.length === 0 ||
        context.preferences.preferredTypes.includes(template.type);

      return hasRelevantConcepts && isPreferredType;
    });
  }

  private selectTemplate(
    templates: ExerciseTemplate[],
    context: GenerationContext,
    existingExercises: GeneratedExercise[]
  ): ExerciseTemplate | null {
    if (templates.length === 0) return null;

    // Calculate scores for each template
    const scoredTemplates = templates.map(template => ({
      template,
      score: this.calculateTemplateScore(template, context, existingExercises),
    }));

    // Sort by score and add some randomness
    scoredTemplates.sort((a, b) => b.score - a.score);
    
    // Select from top 3 with weighted randomness
    const topTemplates = scoredTemplates.slice(0, Math.min(3, scoredTemplates.length));
    const weights = topTemplates.map((_, index) => Math.pow(0.7, index));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < topTemplates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return topTemplates[i].template;
      }
    }

    return topTemplates[0].template;
  }

  private async generateFromTemplate(
    template: ExerciseTemplate,
    context: GenerationContext
  ): Promise<GeneratedExercise | null> {
    try {
      // Select a pattern from the template
      const pattern = this.selectPattern(template.patterns, context);
      if (!pattern) return null;

      // Generate variable values
      const variables = await this.generateVariables(pattern.variables, context);
      
      // Create the question
      const questionText = this.substitutePattern(pattern.pattern, variables);
      const questionData = this.createQuestionData(template.type, variables, pattern);
      const correctAnswer = this.generateCorrectAnswer(template.type, variables, pattern);

      const question: ExerciseQuestion = {
        id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: '', // Will be set by caller
        questionText,
        type: template.type,
        orderIndex: 0,
        points: this.calculatePoints(template.difficulty),
        questionData,
        correctAnswer,
        hints: this.generateHints(template, variables, pattern),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate variations
      const variations = await this.generateVariations(question, 3);

      // Calculate metadata
      const metadata = {
        confidence: this.calculateConfidence(template, variables, context),
        complexity: this.calculateComplexity(question),
        uniqueness: this.calculateUniqueness(question, context.existingExercises),
        pedagogicalValue: this.calculatePedagogicalValue(question, context.objectives),
      };

      return {
        question,
        template,
        variations,
        metadata,
      };
    } catch (error) {
      console.error('Error generating exercise from template:', error);
      return null;
    }
  }

  private selectPattern(patterns: TemplatePattern[], context: GenerationContext): TemplatePattern | null {
    if (patterns.length === 0) return null;
    
    // For now, select randomly - could be made smarter
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private async generateVariables(
    variables: TemplateVariable[],
    context: GenerationContext
  ): Promise<Map<string, any>> {
    const values = new Map<string, any>();

    for (const variable of variables) {
      const value = await this.generateVariableValue(variable, context, values);
      if (value !== null) {
        values.set(variable.name, value);
      }
    }

    return values;
  }

  private async generateVariableValue(
    variable: TemplateVariable,
    context: GenerationContext,
    existingValues: Map<string, any>
  ): Promise<any> {
    switch (variable.source) {
      case 'content':
        return this.extractFromContent(variable, context.sourceContent);
      
      case 'wordbank':
        return this.selectFromWordBank(variable, context.targetDifficulty);
      
      case 'generated':
        return this.generateValue(variable, context, existingValues);
      
      default:
        return null;
    }
  }

  private extractFromContent(variable: TemplateVariable, content: string): any {
    // Simple extraction - could be enhanced with NLP
    const words = content.split(/\s+/).filter(word => word.length > 0);
    
    switch (variable.type) {
      case 'word':
        return words[Math.floor(Math.random() * words.length)];
      
      case 'phrase':
        const startIndex = Math.floor(Math.random() * Math.max(1, words.length - 3));
        return words.slice(startIndex, startIndex + 3).join(' ');
      
      case 'sentence':
        // Simple sentence extraction
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences[Math.floor(Math.random() * sentences.length)]?.trim();
      
      default:
        return words[Math.floor(Math.random() * words.length)];
    }
  }

  private selectFromWordBank(variable: TemplateVariable, difficulty: DifficultyLevel): any {
    const key = `${variable.name}_${difficulty}`;
    let wordList = this.wordBank.get(key);
    
    if (!wordList) {
      // Fallback to general categories
      const generalKey = variable.type === 'word' ? `nouns_${difficulty}` : variable.name;
      wordList = this.wordBank.get(generalKey);
    }
    
    if (!wordList || wordList.length === 0) {
      return null;
    }

    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  private generateValue(
    variable: TemplateVariable,
    context: GenerationContext,
    existingValues: Map<string, any>
  ): any {
    switch (variable.name) {
      case 'verb_options':
        return this.generateVerbOptions(existingValues.get('subject'), context.targetDifficulty);
      
      case 'article':
        const noun = existingValues.get('noun');
        return this.selectCorrectArticle(noun);
      
      case 'word_list':
        return this.generateWordList(context);
      
      case 'word_categories':
        return this.generateWordCategories(context.targetDifficulty);
      
      default:
        return this.selectFromWordBank(variable, context.targetDifficulty);
    }
  }

  private generateVerbOptions(subject: string, difficulty: DifficultyLevel): string[] {
    const isPlural = this.isPlural(subject);
    const baseVerb = this.selectFromWordBank({ name: 'verbs', type: 'word', required: true, source: 'wordbank' }, difficulty);
    
    if (isPlural) {
      return [baseVerb, `${baseVerb}s`]; // Correct: plural subject takes base form
    } else {
      return [`${baseVerb}s`, baseVerb]; // Correct: singular subject takes -s form
    }
  }

  private selectCorrectArticle(noun: string): string {
    if (!noun) return 'a';
    
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstLetter = noun.toLowerCase().charAt(0);
    
    return vowels.includes(firstLetter) ? 'an' : 'a';
  }

  private generateWordList(context: GenerationContext): string[] {
    const words: string[] = [];
    const difficulty = context.targetDifficulty;
    
    // Generate a sentence and scramble it
    words.push(this.selectFromWordBank({ name: 'nouns', type: 'word', required: true, source: 'wordbank' }, difficulty));
    words.push(this.selectFromWordBank({ name: 'verbs', type: 'word', required: true, source: 'wordbank' }, difficulty));
    words.push(this.selectFromWordBank({ name: 'adjectives', type: 'word', required: true, source: 'wordbank' }, difficulty));
    
    // Add function words
    if (Math.random() > 0.5) {
      words.push(...this.wordBank.get('articles')?.slice(0, 1) || []);
    }
    if (Math.random() > 0.6) {
      words.push(...this.wordBank.get('prepositions')?.slice(0, 1) || []);
    }

    // Shuffle the words
    return this.shuffleArray(words);
  }

  private generateWordCategories(difficulty: DifficultyLevel): any {
    return {
      categories: ['Nouns', 'Verbs', 'Adjectives'],
      items: [
        ...this.wordBank.get(`nouns_${difficulty === 'beginner' ? 'beginner' : 'intermediate'}`)?.slice(0, 2) || [],
        ...this.wordBank.get(`verbs_${difficulty === 'beginner' ? 'beginner' : 'intermediate'}`)?.slice(0, 2) || [],
        ...this.wordBank.get(`adjectives_${difficulty === 'beginner' ? 'beginner' : 'intermediate'}`)?.slice(0, 2) || [],
      ],
    };
  }

  // ===== UTILITY METHODS =====

  private isPlural(word: string): boolean {
    // Simple plural detection - could be enhanced
    return word.endsWith('s') || ['they', 'we', 'you'].includes(word.toLowerCase());
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private substitutePattern(pattern: string, variables: Map<string, any>): string {
    let result = pattern;
    
    for (const [key, value] of variables) {
      const placeholder = `{${key}}`;
      if (Array.isArray(value)) {
        result = result.replace(placeholder, value.join(' or '));
      } else if (typeof value === 'object') {
        result = result.replace(placeholder, JSON.stringify(value));
      } else {
        result = result.replace(placeholder, String(value));
      }
    }
    
    return result;
  }

  private createQuestionData(type: QuestionType, variables: Map<string, any>, pattern: TemplatePattern): any {
    switch (type) {
      case 'multiple_choice':
        return {
          options: variables.get('verb_options') || ['option1', 'option2', 'option3', 'option4'],
          correctIndex: 0, // First option is correct by our generation logic
        };
      
      case 'fill_in_blank':
        return {
          blanks: [variables.get('article') || 'a'],
          acceptableAnswers: [[variables.get('article') || 'a']],
        };
      
      case 'sentence_builder':
        return {
          words: variables.get('word_list') || ['word1', 'word2', 'word3'],
          correctOrder: variables.get('word_list') || ['word1', 'word2', 'word3'],
        };
      
      case 'drag_and_drop':
        const categories = variables.get('word_categories');
        return {
          categories: categories?.categories || ['Category1', 'Category2'],
          items: categories?.items || ['item1', 'item2'],
          correctMappings: this.generateCorrectMappings(categories),
        };
      
      default:
        return {};
    }
  }

  private generateCorrectAnswer(type: QuestionType, variables: Map<string, any>, pattern: TemplatePattern): any {
    switch (type) {
      case 'multiple_choice':
        const options = variables.get('verb_options');
        return Array.isArray(options) ? options[0] : 'correct_answer';
      
      case 'fill_in_blank':
        return variables.get('article') || 'a';
      
      case 'sentence_builder':
        return variables.get('word_list')?.join(' ') || 'correct sentence';
      
      case 'drag_and_drop':
        return variables.get('word_categories') || {};
      
      default:
        return 'correct_answer';
    }
  }

  private generateCorrectMappings(categories: any): any {
    if (!categories) return {};
    
    const mappings: any = {};
    const { categories: cats, items } = categories;
    
    // Simple mapping logic - first items go to first category, etc.
    const itemsPerCategory = Math.ceil(items.length / cats.length);
    
    cats.forEach((category: string, index: number) => {
      const start = index * itemsPerCategory;
      const end = Math.min(start + itemsPerCategory, items.length);
      mappings[category] = items.slice(start, end);
    });
    
    return mappings;
  }

  private generateHints(template: ExerciseTemplate, variables: Map<string, any>, pattern: TemplatePattern): string[] {
    const hints: string[] = [];
    
    // Generate generic hints based on template type
    switch (template.type) {
      case 'multiple_choice':
        hints.push('Consider the subject-verb agreement rule.');
        hints.push('Look at whether the subject is singular or plural.');
        break;
      
      case 'fill_in_blank':
        hints.push('Think about when to use "a" vs "an".');
        hints.push('Articles depend on the first sound of the following word.');
        break;
      
      case 'sentence_builder':
        hints.push('Start with the subject of the sentence.');
        hints.push('Remember basic word order: Subject-Verb-Object.');
        break;
      
      case 'drag_and_drop':
        hints.push('Consider what type of word each item is.');
        hints.push('Think about the function of each word in a sentence.');
        break;
    }
    
    return hints;
  }

  // ===== DIFFICULTY AND SCORING =====

  private isDifficultyMatch(templateDifficulty: DifficultyLevel, targetDifficulty: DifficultyLevel): boolean {
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    const templateIndex = difficultyLevels.indexOf(templateDifficulty);
    const targetIndex = difficultyLevels.indexOf(targetDifficulty);
    
    // Allow template to be at target level or one level adjacent
    return Math.abs(templateIndex - targetIndex) <= 1;
  }

  private calculateTemplateScore(
    template: ExerciseTemplate,
    context: GenerationContext,
    existingExercises: GeneratedExercise[]
  ): number {
    let score = 0;
    
    // Concept relevance
    const conceptMatch = template.metadata.concepts.filter(concept =>
      context.conceptsFocus.includes(concept)
    ).length / template.metadata.concepts.length;
    score += conceptMatch * 0.4;
    
    // Difficulty match
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    const templateIndex = difficultyLevels.indexOf(template.difficulty);
    const targetIndex = difficultyLevels.indexOf(context.targetDifficulty);
    const difficultyMatch = 1 - Math.abs(templateIndex - targetIndex) / 2;
    score += difficultyMatch * 0.3;
    
    // Avoid repetition
    if (context.preferences.avoidRepetition) {
      const usageCount = existingExercises.filter(ex => ex.template.id === template.id).length;
      const repetitionPenalty = Math.min(usageCount * 0.2, 0.6);
      score += (1 - repetitionPenalty) * 0.3;
    } else {
      score += 0.3;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculatePoints(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'beginner': return 5;
      case 'intermediate': return 10;
      case 'advanced': return 15;
      default: return 10;
    }
  }

  private calculateConfidence(
    template: ExerciseTemplate,
    variables: Map<string, any>,
    context: GenerationContext
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for well-tested templates
    confidence += 0.1;
    
    // Lower confidence if variables are missing
    const missingVariables = template.patterns[0]?.variables.filter(v =>
      v.required && !variables.has(v.name)
    ).length || 0;
    confidence -= missingVariables * 0.15;
    
    return Math.max(0.1, Math.min(1, confidence));
  }

  private calculateComplexity(question: ExerciseQuestion): number {
    // Simple complexity calculation based on text length and type
    const textLength = question.questionText.length;
    const baseComplexity = Math.min(textLength / 200, 1);
    
    const typeMultiplier: Record<string, number> = {
      'multiple_choice': 0.6,
      'fill_in_blank': 0.7,
      'drag_and_drop': 0.8,
      'sentence_builder': 1.0,
      'essay': 0.9,
    };
    
    return baseComplexity * (typeMultiplier[question.type] || 0.7);
  }

  private calculateUniqueness(question: ExerciseQuestion, existingExercises: ExerciseQuestion[]): number {
    // Check similarity with existing exercises
    const similarities = existingExercises.map(existing =>
      this.calculateSimilarity(question.questionText, existing.questionText)
    );
    
    const maxSimilarity = Math.max(0, ...similarities);
    return 1 - maxSimilarity;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity based on common words
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculatePedagogicalValue(question: ExerciseQuestion, objectives: LearningObjective[]): number {
    // Simple calculation based on question type and objectives alignment
    let value = 0.5; // Base value
    
    // Higher value for more educational question types
    const typeValues = {
      'multiple_choice': 0.6,
      'fill_in_blank': 0.8,
      'drag_and_drop': 0.7,
      'sentence_builder': 0.9,
    };
    
    value = typeValues[question.type] || 0.5;
    
    // Boost if aligns with objectives
    // This would need more sophisticated analysis in a real implementation
    if (objectives.length > 0) {
      value += 0.2;
    }
    
    return Math.min(1, value);
  }

  // ===== HELPER METHODS FOR ADDITIONAL FEATURES =====

  private optimizeExerciseSet(exercises: GeneratedExercise[], context: GenerationContext): GeneratedExercise[] {
    // Sort by overall quality score
    return exercises.sort((a, b) => {
      const scoreA = (a.metadata.confidence + a.metadata.pedagogicalValue + a.metadata.uniqueness) / 3;
      const scoreB = (b.metadata.confidence + b.metadata.pedagogicalValue + b.metadata.uniqueness) / 3;
      return scoreB - scoreA;
    });
  }

  private findTemplateForExercise(exercise: ExerciseQuestion): ExerciseTemplate | null {
    // Simple template matching - could be enhanced
    for (const template of this.templates.values()) {
      if (template.type === exercise.type) {
        return template;
      }
    }
    return null;
  }

  private async createVariation(
    baseExercise: ExerciseQuestion,
    template: ExerciseTemplate
  ): Promise<ExerciseQuestion | null> {
    // Create a variation by changing variables
    const context: GenerationContext = {
      sourceContent: baseExercise.questionText,
      objectives: [],
      targetDifficulty: 'intermediate',
      conceptsFocus: template.metadata.concepts,
      existingExercises: [baseExercise],
      userLevel: 50,
      preferences: {
        preferredTypes: [template.type],
        avoidRepetition: false,
        contextualRelevance: 0.8,
        creativityLevel: 0.7,
      },
    };

    const generated = await this.generateFromTemplate(template, context);
    return generated?.question || null;
  }

  private isDuplicate(exercise: ExerciseQuestion, existingExercises: ExerciseQuestion[]): boolean {
    return existingExercises.some(existing =>
      this.calculateSimilarity(exercise.questionText, existing.questionText) > 0.8
    );
  }

  private analyzeDifficulty(exercise: ExerciseQuestion): DifficultyLevel {
    // Simple difficulty analysis - could be enhanced with NLP
    const complexity = this.calculateComplexity(exercise);
    
    if (complexity < 0.4) return 'beginner';
    if (complexity < 0.7) return 'intermediate';
    return 'advanced';
  }

  private adjustDifficulty(
    exercise: ExerciseQuestion,
    currentDifficulty: DifficultyLevel,
    targetDifficulty: DifficultyLevel
  ): ExerciseQuestion {
    // This would involve more sophisticated text transformation
    // For now, return the exercise as-is
    return exercise;
  }

  private extractConcepts(content: string): string[] {
    // Simple concept extraction - would use NLP in production
    const concepts: string[] = [];
    
    if (content.includes('verb') || content.includes('action')) {
      concepts.push('verbs');
    }
    if (content.includes('noun') || content.includes('thing')) {
      concepts.push('nouns');
    }
    if (content.includes('adjective') || content.includes('describe')) {
      concepts.push('adjectives');
    }
    if (content.includes('sentence') || content.includes('complete thought')) {
      concepts.push('sentence structure');
    }
    
    return concepts;
  }

  private findTemplatesForConcept(concept: string): ExerciseTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.metadata.concepts.includes(concept)
    );
  }

  private extractRelevantContent(content: string, concept: string): string {
    // Extract sentences related to the concept
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(sentence =>
      sentence.toLowerCase().includes(concept.toLowerCase())
    ).join('. ');
  }

  private isObjectiveRelevant(objective: LearningObjective, concept: string): boolean {
    return objective.title.toLowerCase().includes(concept.toLowerCase()) ||
           objective.description.toLowerCase().includes(concept.toLowerCase());
  }

  private estimateContentDifficulty(content: string, concept: string): DifficultyLevel {
    // Simple heuristic based on word length and complexity
    const words = content.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgWordLength < 5) return 'beginner';
    if (avgWordLength < 7) return 'intermediate';
    return 'advanced';
  }

  private calculateRelevanceScore(concept: string, content: string): number {
    // Calculate how relevant this concept is to the content
    const conceptLower = concept.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Count occurrences of the concept in content
    const occurrences = (contentLower.match(new RegExp(conceptLower, 'g')) || []).length;
    
    // Normalize score between 0 and 1
    const maxExpectedOccurrences = 10;
    return Math.min(occurrences / maxExpectedOccurrences, 1);
  }
}

// ===== SUPPORTING INTERFACES =====

interface ContentMapping {
  concept: string;
  content: string;
  templates: ExerciseTemplate[];
  objectives: LearningObjective[];
  difficulty: DifficultyLevel;
  relevanceScore: number;
}

// ===== EXPORT =====

export default ExerciseGenerator;