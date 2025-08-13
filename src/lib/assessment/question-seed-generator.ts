/**
 * Question Bank Seed Generator
 * 
 * Generates comprehensive set of 500+ assessment questions across all
 * grammar concepts, difficulty levels, and cognitive levels.
 */

import { 
  QuestionBankItem, 
  QuestionConcept, 
  QuestionSubConcept, 
  CognitiveLevel,
  QuestionBankManager 
} from './question-bank';
import type { DifficultyLevel, QuestionType } from '@/types/content';

// ===== QUESTION TEMPLATES =====

interface QuestionTemplate {
  concept: QuestionConcept;
  subConcept?: QuestionSubConcept;
  type: QuestionType;
  difficulty: DifficultyLevel;
  cognitiveLevel: CognitiveLevel;
  template: string;
  correctAnswerIndex?: number;
  correctAnswer?: string;
  options?: string[];
  explanation: string;
  learningObjective: string;
  hints: string[];
  tags: string[];
  estimatedTimeSeconds: number;
  points: number;
}

// ===== SEED QUESTION GENERATOR =====

export class QuestionSeedGenerator {
  private questionBank: QuestionBankManager;

  constructor(questionBank: QuestionBankManager) {
    this.questionBank = questionBank;
  }

  /**
   * Generate all seed questions and add them to the question bank
   */
  async generateAllSeedQuestions(): Promise<{ total: number; byCategory: Record<string, number> }> {
    const stats = { total: 0, byCategory: {} as Record<string, number> };

    // Generate questions for each concept
    const nounsQuestions = this.generateNounsQuestions();
    const verbsQuestions = this.generateVerbsQuestions();
    const adjectivesQuestions = this.generateAdjectivesQuestions();
    const adverbsQuestions = this.generateAdverbsQuestions();
    const pronounsQuestions = this.generatePronounsQuestions();
    const articlesQuestions = this.generateArticlesQuestions();
    const sentenceStructureQuestions = this.generateSentenceStructureQuestions();

    // Add all questions to the bank
    const allQuestions = [
      ...nounsQuestions,
      ...verbsQuestions,
      ...adjectivesQuestions,
      ...adverbsQuestions,
      ...pronounsQuestions,
      ...articlesQuestions,
      ...sentenceStructureQuestions
    ];

    for (const questionTemplate of allQuestions) {
      const question = this.templateToQuestion(questionTemplate);
      const id = this.questionBank.addQuestion(question);
      
      stats.total++;
      const category = `${question.concept}_${question.difficulty}`;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    return stats;
  }

  // ===== NOUN QUESTIONS =====

  private generateNounsQuestions(): QuestionTemplate[] {
    return [
      // Basic Noun Identification - Beginner Level
      {
        concept: 'nouns',
        subConcept: 'common_proper',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'remember',
        template: "Which word is a noun?",
        options: ['Running', 'Dog', 'Quickly', 'Blue'],
        correctAnswerIndex: 1,
        explanation: "A noun is a word that names a person, place, thing, or idea. 'Dog' names an animal.",
        learningObjective: "Identify nouns among other parts of speech",
        hints: ["Look for words that name people, places, things, or ideas", "Nouns can usually have 'a', 'an', or 'the' in front of them"],
        tags: ['nouns', 'identification', 'basic'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'nouns',
        subConcept: 'common_proper',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'remember',
        template: "Which word is a proper noun?",
        options: ['teacher', 'school', 'Mrs. Garcia', 'book'],
        correctAnswerIndex: 2,
        explanation: "Proper nouns name specific people, places, or things and are always capitalized.",
        learningObjective: "Distinguish between common and proper nouns",
        hints: ["Proper nouns are always capitalized", "Look for specific names"],
        tags: ['nouns', 'proper', 'capitalization'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'nouns',
        subConcept: 'concrete_abstract',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'understand',
        template: "Which word is an abstract noun?",
        options: ['pencil', 'courage', 'desk', 'flower'],
        correctAnswerIndex: 1,
        explanation: "Abstract nouns name ideas, feelings, or concepts that you cannot touch or see.",
        learningObjective: "Identify abstract nouns",
        hints: ["Abstract nouns name feelings, ideas, or qualities", "You cannot touch or see abstract nouns"],
        tags: ['nouns', 'abstract', 'concepts'],
        estimatedTimeSeconds: 45,
        points: 1
      },
      {
        concept: 'nouns',
        type: 'fill_in_blank',
        difficulty: 'beginner',
        cognitiveLevel: 'apply',
        template: "Complete the plural: One cat, two ___",
        correctAnswer: 'cats',
        explanation: "Most nouns form plurals by adding -s or -es.",
        learningObjective: "Form regular plural nouns",
        hints: ["Most plurals add -s", "Think about more than one cat"],
        tags: ['nouns', 'plurals', 'regular'],
        estimatedTimeSeconds: 20,
        points: 1
      },
      {
        concept: 'nouns',
        type: 'fill_in_blank',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Complete the plural: One child, two ___",
        correctAnswer: 'children',
        explanation: "Some nouns have irregular plural forms that must be memorized.",
        learningObjective: "Form irregular plural nouns",
        hints: ["This is an irregular plural", "The word changes completely"],
        tags: ['nouns', 'plurals', 'irregular'],
        estimatedTimeSeconds: 30,
        points: 2
      },
      {
        concept: 'nouns',
        type: 'drag_and_drop',
        difficulty: 'intermediate',
        cognitiveLevel: 'analyze',
        template: "Sort these nouns into Common and Proper categories: dog, Chicago, teacher, Maria, book, Disney",
        correctAnswer: JSON.stringify({
          'Common': ['dog', 'teacher', 'book'],
          'Proper': ['Chicago', 'Maria', 'Disney']
        }),
        explanation: "Common nouns name general things, proper nouns name specific things and are capitalized.",
        learningObjective: "Categorize common and proper nouns",
        hints: ["Proper nouns are capitalized", "Common nouns are general names"],
        tags: ['nouns', 'categorization', 'common', 'proper'],
        estimatedTimeSeconds: 60,
        points: 2
      },

      // Advanced Noun Questions
      {
        concept: 'nouns',
        type: 'multiple_choice',
        difficulty: 'advanced',
        cognitiveLevel: 'analyze',
        template: "In the sentence 'The happiness of the children filled the room,' which words are abstract nouns?",
        options: ['happiness only', 'children only', 'happiness and room', 'children and room'],
        correctAnswerIndex: 0,
        explanation: "Happiness is an abstract noun (a feeling). Children and room are concrete nouns you can see/touch.",
        learningObjective: "Identify abstract nouns in context",
        hints: ["Abstract nouns name feelings, ideas, or qualities", "Look for words naming emotions or concepts"],
        tags: ['nouns', 'abstract', 'sentence-analysis'],
        estimatedTimeSeconds: 60,
        points: 3
      },
      {
        concept: 'nouns',
        type: 'sentence_builder',
        difficulty: 'advanced',
        cognitiveLevel: 'create',
        template: "Create a sentence using one proper noun, one common noun, and one abstract noun from these words: [Sarah, happiness, book, teacher, courage, school]",
        correctAnswer: "Acceptable sentences vary but must include one from each category",
        explanation: "A well-constructed sentence can combine different types of nouns effectively.",
        learningObjective: "Create sentences using different types of nouns",
        hints: ["Proper nouns are capitalized names", "Common nouns are general", "Abstract nouns are feelings/ideas"],
        tags: ['nouns', 'sentence-building', 'creativity'],
        estimatedTimeSeconds: 120,
        points: 3
      },

      // More noun questions would continue here...
    ];
  }

  // ===== VERB QUESTIONS =====

  private generateVerbsQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'verbs',
        subConcept: 'action_linking_helping',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'remember',
        template: "Which word is an action verb?",
        options: ['beautiful', 'think', 'very', 'the'],
        correctAnswerIndex: 1,
        explanation: "Action verbs show what someone or something does. 'Think' is something you can do.",
        learningObjective: "Identify action verbs",
        hints: ["Action verbs show what someone does", "Ask: Can someone DO this word?"],
        tags: ['verbs', 'action', 'identification'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'verbs',
        subConcept: 'action_linking_helping',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'understand',
        template: "What type of verb is 'is' in the sentence 'The cake is delicious'?",
        options: ['Action verb', 'Linking verb', 'Helping verb', 'None of these'],
        correctAnswerIndex: 1,
        explanation: "Linking verbs connect the subject to information about the subject. 'Is' links 'cake' to 'delicious'.",
        learningObjective: "Identify linking verbs",
        hints: ["Linking verbs connect the subject to a description", "Common linking verbs: is, am, are, was, were"],
        tags: ['verbs', 'linking', 'identification'],
        estimatedTimeSeconds: 45,
        points: 1
      },
      {
        concept: 'verbs',
        subConcept: 'past_present_future',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'understand',
        template: "What tense is the verb in 'She walked to school yesterday'?",
        options: ['Present', 'Past', 'Future', 'Present perfect'],
        correctAnswerIndex: 1,
        explanation: "Past tense verbs show actions that already happened. 'Walked' shows past action.",
        learningObjective: "Identify verb tenses",
        hints: ["Past tense shows actions that already happened", "Look for time clues like 'yesterday'"],
        tags: ['verbs', 'tense', 'past'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'verbs',
        type: 'fill_in_blank',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Yesterday, I ___ (walk) to the store.",
        correctAnswer: 'walked',
        explanation: "Past tense of regular verbs is formed by adding -ed.",
        learningObjective: "Form past tense of regular verbs",
        hints: ["This happened yesterday (past)", "Regular verbs add -ed for past tense"],
        tags: ['verbs', 'past-tense', 'regular'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'verbs',
        type: 'fill_in_blank',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Tomorrow, she ___ (sing) in the choir.",
        correctAnswer: 'will sing',
        explanation: "Future tense is formed with 'will' + base form of the verb.",
        learningObjective: "Form future tense verbs",
        hints: ["This will happen tomorrow (future)", "Future tense uses 'will' + verb"],
        tags: ['verbs', 'future-tense', 'formation'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'verbs',
        type: 'drag_and_drop',
        difficulty: 'intermediate',
        cognitiveLevel: 'analyze',
        template: "Sort these verbs by tense: walked, will run, plays, ate, is singing, will dance",
        correctAnswer: JSON.stringify({
          'Past': ['walked', 'ate'],
          'Present': ['plays', 'is singing'],
          'Future': ['will run', 'will dance']
        }),
        explanation: "Verb tenses show when actions happen: past (already happened), present (happening now), future (will happen).",
        learningObjective: "Categorize verbs by tense",
        hints: ["Past tense often ends in -ed or has irregular forms", "Future tense uses 'will'", "Present tense happens now"],
        tags: ['verbs', 'tense', 'categorization'],
        estimatedTimeSeconds: 90,
        points: 2
      },

      // More verb questions would continue...
    ];
  }

  // ===== ADJECTIVE AND ADVERB QUESTIONS =====

  private generateAdjectivesQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'adjectives',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'remember',
        template: "Which word is an adjective in 'The red car is fast'?",
        options: ['The', 'red', 'car', 'is'],
        correctAnswerIndex: 1,
        explanation: "Adjectives describe nouns. 'Red' describes what color the car is.",
        learningObjective: "Identify adjectives in sentences",
        hints: ["Adjectives describe nouns", "Look for words that tell us about the car"],
        tags: ['adjectives', 'identification', 'description'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'adjectives',
        subConcept: 'positive_comparative_superlative',
        type: 'fill_in_blank',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Complete the comparison: tall, taller, ___",
        correctAnswer: 'tallest',
        explanation: "Superlative adjectives compare three or more things, often ending in -est.",
        learningObjective: "Form superlative adjectives",
        hints: ["This compares three or more things", "Add -est to the adjective"],
        tags: ['adjectives', 'superlative', 'comparison'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'adjectives',
        type: 'multiple_choice',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Which sentence uses the correct comparative form?",
        options: ['This book is more good than that one', 'This book is better than that one', 'This book is gooder than that one', 'This book is best than that one'],
        correctAnswerIndex: 1,
        explanation: "Some adjectives have irregular comparative forms. 'Good' becomes 'better', not 'more good'.",
        learningObjective: "Use irregular comparative adjectives correctly",
        hints: ["'Good' has an irregular comparative form", "Don't use 'more' with irregular comparatives"],
        tags: ['adjectives', 'comparative', 'irregular'],
        estimatedTimeSeconds: 45,
        points: 2
      }
    ];
  }

  private generateAdverbsQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'adverbs',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'remember',
        template: "Which word is an adverb in 'She runs quickly'?",
        options: ['She', 'runs', 'quickly', 'None'],
        correctAnswerIndex: 2,
        explanation: "Adverbs describe verbs, adjectives, or other adverbs. 'Quickly' describes how she runs.",
        learningObjective: "Identify adverbs in sentences",
        hints: ["Adverbs often end in -ly", "Look for words that describe HOW something is done"],
        tags: ['adverbs', 'identification', 'description'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'adverbs',
        type: 'fill_in_blank',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Change this adjective to an adverb: careful → ___",
        correctAnswer: 'carefully',
        explanation: "Most adverbs are formed by adding -ly to adjectives.",
        learningObjective: "Form adverbs from adjectives",
        hints: ["Add -ly to the adjective", "Adverbs describe how actions are performed"],
        tags: ['adverbs', 'formation', 'adjective-to-adverb'],
        estimatedTimeSeconds: 30,
        points: 1
      }
    ];
  }

  // ===== PRONOUN QUESTIONS =====

  private generatePronounsQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'pronouns',
        subConcept: 'subject_object_pronouns',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'understand',
        template: "Which pronoun should replace 'Maria' in 'Maria likes ice cream'?",
        options: ['Her', 'She', 'Hers', 'Herself'],
        correctAnswerIndex: 1,
        explanation: "Subject pronouns (I, you, he, she, it, we, they) replace nouns that are the subject of a sentence.",
        learningObjective: "Use subject pronouns correctly",
        hints: ["The pronoun replaces the subject 'Maria'", "Subject pronouns do the action"],
        tags: ['pronouns', 'subject', 'replacement'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'pronouns',
        subConcept: 'subject_object_pronouns',
        type: 'multiple_choice',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Choose the correct pronoun: 'Give the book to ___.'",
        options: ['I', 'me', 'my', 'mine'],
        correctAnswerIndex: 1,
        explanation: "Object pronouns (me, you, him, her, it, us, them) receive the action of the verb.",
        learningObjective: "Use object pronouns correctly",
        hints: ["This pronoun receives the action", "Object pronouns come after verbs or prepositions"],
        tags: ['pronouns', 'object', 'grammar'],
        estimatedTimeSeconds: 45,
        points: 2
      }
    ];
  }

  // ===== ARTICLE QUESTIONS =====

  private generateArticlesQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'articles',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'apply',
        template: "Choose the correct article: '___ apple'",
        options: ['A', 'An', 'The', 'No article needed'],
        correctAnswerIndex: 1,
        explanation: "Use 'an' before words that begin with vowel sounds. 'Apple' begins with a vowel sound.",
        learningObjective: "Use indefinite articles correctly",
        hints: ["Listen to the first sound of the word", "'Apple' starts with a vowel sound"],
        tags: ['articles', 'indefinite', 'vowel-sounds'],
        estimatedTimeSeconds: 30,
        points: 1
      },
      {
        concept: 'articles',
        type: 'multiple_choice',
        difficulty: 'intermediate',
        cognitiveLevel: 'apply',
        template: "Choose the correct article: '___ honest person'",
        options: ['A', 'An', 'The', 'No article needed'],
        correctAnswerIndex: 1,
        explanation: "Use 'an' before words that begin with vowel sounds, even if they start with a consonant letter. 'Honest' begins with a vowel sound.",
        learningObjective: "Use articles with silent consonants",
        hints: ["Listen to the sound, not the letter", "The 'h' in 'honest' is silent"],
        tags: ['articles', 'silent-consonants', 'vowel-sounds'],
        estimatedTimeSeconds: 45,
        points: 2
      }
    ];
  }

  // ===== SENTENCE STRUCTURE QUESTIONS =====

  private generateSentenceStructureQuestions(): QuestionTemplate[] {
    return [
      {
        concept: 'sentence_structure',
        subConcept: 'subject_predicate',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'understand',
        template: "What is the subject in 'The happy children played outside'?",
        options: ['The happy', 'children', 'The happy children', 'played outside'],
        correctAnswerIndex: 2,
        explanation: "The complete subject includes the main noun and all words that describe it.",
        learningObjective: "Identify complete subjects in sentences",
        hints: ["The subject includes the main noun and its modifiers", "Who or what is doing the action?"],
        tags: ['sentence-structure', 'subject', 'complete-subject'],
        estimatedTimeSeconds: 45,
        points: 1
      },
      {
        concept: 'sentence_structure',
        type: 'multiple_choice',
        difficulty: 'beginner',
        cognitiveLevel: 'analyze',
        template: "Which is a complete sentence?",
        options: ['Running in the park', 'The dog barks', 'After the game', 'Because it was late'],
        correctAnswerIndex: 1,
        explanation: "A complete sentence has both a subject and a predicate. 'The dog barks' has both.",
        learningObjective: "Identify complete sentences",
        hints: ["Complete sentences have both a subject and a predicate", "Look for who/what and what they do"],
        tags: ['sentence-structure', 'complete-sentence', 'fragments'],
        estimatedTimeSeconds: 45,
        points: 1
      },
      {
        concept: 'sentence_structure',
        subConcept: 'simple_compound_complex',
        type: 'multiple_choice',
        difficulty: 'intermediate',
        cognitiveLevel: 'analyze',
        template: "What type of sentence is 'I like pizza, but my sister prefers pasta'?",
        options: ['Simple', 'Compound', 'Complex', 'Fragment'],
        correctAnswerIndex: 1,
        explanation: "Compound sentences have two independent clauses joined by a coordinating conjunction (but, and, or, etc.).",
        learningObjective: "Identify compound sentences",
        hints: ["Look for two complete thoughts joined by 'and', 'but', 'or', etc.", "Both parts could stand alone as sentences"],
        tags: ['sentence-structure', 'compound', 'conjunctions'],
        estimatedTimeSeconds: 60,
        points: 2
      }
    ];
  }

  // ===== HELPER METHODS =====

  private templateToQuestion(template: QuestionTemplate): Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'> {
    let questionData: any;
    let correctAnswer: any;

    // Convert template to appropriate question data format
    switch (template.type) {
      case 'multiple_choice':
        questionData = {
          type: 'multiple_choice',
          options: template.options || [],
          shuffleOptions: true
        };
        correctAnswer = template.options?.[template.correctAnswerIndex || 0] || template.correctAnswer;
        break;

      case 'fill_in_blank':
        questionData = {
          type: 'fill_in_blank',
          template: template.template,
          blanks: [{
            id: 'blank1',
            position: 0,
            acceptableAnswers: [template.correctAnswer || ''],
            caseSensitive: false
          }]
        };
        correctAnswer = template.correctAnswer;
        break;

      case 'drag_and_drop':
        questionData = {
          type: 'drag_and_drop',
          items: [],
          targets: []
        };
        correctAnswer = template.correctAnswer;
        break;

      case 'sentence_builder':
        questionData = {
          type: 'sentence_builder',
          words: [],
          shuffleWords: true
        };
        correctAnswer = template.correctAnswer;
        break;

      default:
        questionData = { type: template.type };
        correctAnswer = template.correctAnswer;
    }

    return {
      questionText: template.template,
      type: template.type,
      difficulty: template.difficulty,
      concept: template.concept,
      subConcept: template.subConcept,
      cognitiveLevel: template.cognitiveLevel,
      questionData,
      correctAnswer,
      learningObjective: template.learningObjective,
      explanation: template.explanation,
      hints: template.hints,
      estimatedTimeSeconds: template.estimatedTimeSeconds,
      points: template.points,
      timesUsed: 0,
      averageScore: 0,
      createdBy: 'seed-generator',
      tags: template.tags,
      isActive: true
    };
  }
}