/**
 * Content Import/Export System
 * 
 * Tools to import content from markdown and export for editing
 * with markdown to database content parser and bulk content import functionality.
 */

import { marked } from 'marked';
import { z } from 'zod';
import type { 
  Unit, 
  Lesson, 
  Exercise, 
  Assessment,
  LearningObjective,
  ExerciseQuestion,
  AssessmentQuestion,
  QuestionData,
  DifficultyLevel,
  ExerciseType,
  AssessmentType,
  QuestionType
} from '@/types/content';

// ===== VALIDATION SCHEMAS =====

const markdownFrontmatterSchema = z.object({
  title: z.string(),
  unit: z.string(),
  lesson: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  masteryThreshold: z.number().min(0).max(1).optional()
});

const exerciseSchema = z.object({
  title: z.string(),
  type: z.enum(['practice', 'reinforcement', 'challenge', 'enrichment']),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  maxAttempts: z.number().default(3),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questions: z.array(z.any())
});

const assessmentSchema = z.object({
  title: z.string(),
  type: z.enum(['diagnostic', 'formative', 'summative', 'retention_check']),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  maxAttempts: z.number().default(2),
  masteryThreshold: z.number().min(0).max(1).default(0.8),
  questions: z.array(z.any())
});

// ===== TYPES =====

export interface MarkdownContent {
  frontmatter?: Record<string, any>;
  content: string;
  sections: ContentSection[];
}

export interface ContentSection {
  title: string;
  level: number;
  content: string;
  subsections: ContentSection[];
  type?: 'overview' | 'assessment' | 'content' | 'exercise' | 'enrichment' | 'notes';
}

export interface ParsedLessonData {
  metadata: {
    title: string;
    unitId?: string;
    description: string;
    difficulty: DifficultyLevel;
    estimatedMinutes: number;
    tags: string[];
    prerequisites: string[];
    masteryThreshold: number;
  };
  objectives: LearningObjective[];
  content: string;
  exercises: Exercise[];
  assessments: Assessment[];
}

export interface ImportResult {
  success: boolean;
  data?: ParsedLessonData;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  type: 'parsing' | 'validation' | 'structure';
  message: string;
  location?: string;
  code?: string;
}

export interface ImportWarning {
  type: 'format' | 'content' | 'structure';
  message: string;
  location?: string;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeExercises: boolean;
  includeAssessments: boolean;
  format: 'markdown' | 'json';
  templateType?: 'complete' | 'structure' | 'content-only';
}

export interface BulkImportResult {
  totalFiles: number;
  successful: number;
  failed: number;
  results: Array<{
    filename: string;
    result: ImportResult;
  }>;
}

// ===== MARKDOWN PARSER =====

export class MarkdownContentParser {
  private static readonly SECTION_PATTERNS = {
    overview: /^#{1,3}\s*(lesson\s+overview|overview)/i,
    assessment: /^#{1,3}\s*(pre-assessment|formative\s+assessment|assessment|mastery\s+check)/i,
    content: /^#{1,3}\s*(learning\s+content|concept\s+\d+)/i,
    exercise: /^#{1,3}\s*(interactive\s+exercises?|exercise\s+\d+)/i,
    enrichment: /^#{1,3}\s*(enrichment|challenge)/i,
    notes: /^#{1,3}\s*(teacher|parent|implementation)\s+notes/i
  };

  /**
   * Parse markdown content into structured data
   */
  static parseMarkdown(markdown: string): MarkdownContent {
    const tokens = marked.lexer(markdown);
    const sections: ContentSection[] = [];
    let currentSection: ContentSection | null = null;
    let content = '';

    // Extract frontmatter if present
    let frontmatter: Record<string, any> | undefined;
    if (markdown.startsWith('---')) {
      const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        try {
          frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
        } catch (error) {
          console.warn('Failed to parse frontmatter:', error);
        }
      }
    }

    // Process tokens to build section structure
    for (const token of tokens) {
      if (token.type === 'heading') {
        // Save previous section
        if (currentSection) {
          currentSection.content = content.trim();
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: token.text,
          level: token.depth,
          content: '',
          subsections: [],
          type: this.identifySectionType(token.text)
        };
        content = '';
      } else {
        // Add content to current section
        content += this.tokenToMarkdown(token) + '\n';
      }
    }

    // Save final section
    if (currentSection) {
      currentSection.content = content.trim();
      sections.push(currentSection);
    }

    return {
      frontmatter,
      content: markdown,
      sections: this.buildSectionHierarchy(sections)
    };
  }

  /**
   * Parse YAML frontmatter
   */
  private static parseFrontmatter(frontmatterText: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Simple YAML parsing for common types
      if (value === 'true' || value === 'false') {
        result[key] = value === 'true';
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value.slice(1, -1).split(',').map(s => s.trim());
        }
      } else if (!isNaN(Number(value))) {
        result[key] = Number(value);
      } else {
        result[key] = value.replace(/^["']|["']$/g, '');
      }
    }

    return result;
  }

  /**
   * Identify section type based on title
   */
  private static identifySectionType(title: string): ContentSection['type'] {
    const cleanTitle = title.trim();
    
    for (const [type, pattern] of Object.entries(this.SECTION_PATTERNS)) {
      if (pattern.test(cleanTitle)) {
        return type as ContentSection['type'];
      }
    }
    
    // Additional heuristics based on common patterns
    if (/overview|introduction|about/i.test(cleanTitle)) return 'overview';
    if (/exercise|activity|practice/i.test(cleanTitle)) return 'exercise';
    if (/assessment|test|quiz|check/i.test(cleanTitle)) return 'assessment';
    if (/concept|content|lesson|learning/i.test(cleanTitle)) return 'content';
    if (/enrichment|extension|challenge/i.test(cleanTitle)) return 'enrichment';
    if (/note|guide|instruction/i.test(cleanTitle)) return 'notes';
    
    return undefined;
  }

  /**
   * Convert marked token back to markdown
   */
  private static tokenToMarkdown(token: any): string {
    switch (token.type) {
      case 'paragraph':
        return token.text + '\n';
      case 'heading':
        return '#'.repeat(token.depth) + ' ' + token.text + '\n';
      case 'list':
        return this.listToMarkdown(token);
      case 'blockquote':
        return '> ' + token.text + '\n';
      case 'code':
        return '```' + (token.lang || '') + '\n' + token.text + '\n```\n';
      case 'hr':
        return '---\n';
      case 'table':
        return this.tableToMarkdown(token);
      default:
        return token.raw || '';
    }
  }

  /**
   * Convert list token to markdown
   */
  private static listToMarkdown(token: any): string {
    let markdown = '';
    for (let i = 0; i < token.items.length; i++) {
      const item = token.items[i];
      const prefix = token.ordered ? `${i + 1}. ` : '- ';
      markdown += prefix + item.text + '\n';
    }
    return markdown + '\n';
  }

  /**
   * Convert table token to markdown
   */
  private static tableToMarkdown(token: any): string {
    let markdown = '|';
    
    // Header
    for (const header of token.header) {
      markdown += ' ' + header.text + ' |';
    }
    markdown += '\n|';
    
    // Separator
    for (let i = 0; i < token.header.length; i++) {
      markdown += ' --- |';
    }
    markdown += '\n';
    
    // Rows
    for (const row of token.rows) {
      markdown += '|';
      for (const cell of row) {
        markdown += ' ' + cell.text + ' |';
      }
      markdown += '\n';
    }
    
    return markdown + '\n';
  }

  /**
   * Build hierarchical section structure
   */
  private static buildSectionHierarchy(flatSections: ContentSection[]): ContentSection[] {
    const hierarchy: ContentSection[] = [];
    const stack: ContentSection[] = [];

    for (const section of flatSections) {
      // Pop sections from stack until we find the appropriate parent
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      // Add as subsection or top-level section
      if (stack.length > 0) {
        stack[stack.length - 1].subsections.push(section);
      } else {
        hierarchy.push(section);
      }

      stack.push(section);
    }

    return hierarchy;
  }
}

// ===== CONTENT IMPORTER =====

export class ContentImporter {
  /**
   * Import lesson from markdown content
   */
  static async importLessonFromMarkdown(
    markdown: string, 
    filename?: string
  ): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    try {
      // Parse markdown structure
      const parsed = MarkdownContentParser.parseMarkdown(markdown);
      
      // Extract lesson metadata
      const metadata = this.extractMetadata(parsed, errors, warnings);
      
      // Extract learning objectives
      const objectives = this.extractLearningObjectives(parsed, errors, warnings);
      
      // Extract main content
      const content = this.extractMainContent(parsed, errors, warnings);
      
      // Extract exercises
      const exercises = this.extractExercises(parsed, errors, warnings);
      
      // Extract assessments
      const assessments = this.extractAssessments(parsed, errors, warnings);

      // Return result
      if (errors.length > 0) {
        return { success: false, errors, warnings };
      }

      return {
        success: true,
        data: {
          metadata,
          objectives,
          content,
          exercises,
          assessments
        },
        errors,
        warnings
      };

    } catch (error) {
      errors.push({
        type: 'parsing',
        message: `Failed to parse markdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: filename
      });

      return { success: false, errors, warnings };
    }
  }

  /**
   * Extract lesson metadata from parsed content
   */
  private static extractMetadata(
    parsed: MarkdownContent, 
    errors: ImportError[], 
    warnings: ImportWarning[]
  ) {
    const frontmatter = parsed.frontmatter || {};
    
    // Find overview section for additional metadata
    const overviewSection = parsed.sections.find(s => s.type === 'overview');
    
    // Extract title - first try frontmatter, then first heading in markdown
    let title = frontmatter.title;
    if (!title) {
      // Look for first heading in markdown
      const firstHeadingMatch = parsed.content.match(/^#\s*(.+)/m);
      if (firstHeadingMatch) {
        title = firstHeadingMatch[1].trim();
        // Remove common prefixes like "Unit X, Lesson Y:"
        title = title.replace(/^Unit\s+\d+,\s*Lesson\s+\d+:\s*/i, '');
      }
    }
    
    if (!title) {
      title = 'Untitled Lesson';
      warnings.push({
        type: 'content',
        message: 'No title found, using default title'
      });
    }

    // Extract description
    let description = frontmatter.description || '';
    if (!description && overviewSection) {
      // Look for description in overview section
      const lines = overviewSection.content.split('\n');
      description = lines.find(line => line.trim() && !line.startsWith('#'))?.trim() || '';
    }

    // Validate and set defaults
    const difficulty: DifficultyLevel = frontmatter.difficulty || 'beginner';
    const estimatedMinutes = frontmatter.estimatedMinutes || 30;
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    const prerequisites = Array.isArray(frontmatter.prerequisites) ? frontmatter.prerequisites : [];
    const masteryThreshold = frontmatter.masteryThreshold || 0.8;

    // Validate metadata
    try {
      markdownFrontmatterSchema.parse({
        title,
        unit: frontmatter.unit,
        lesson: frontmatter.lesson,
        difficulty,
        estimatedMinutes,
        tags,
        prerequisites,
        masteryThreshold
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        for (const issue of validationError.issues) {
          warnings.push({
            type: 'format',
            message: `Metadata validation: ${issue.message}`,
            location: issue.path.join('.')
          });
        }
      }
    }

    return {
      title,
      unitId: frontmatter.unitId,
      description,
      difficulty,
      estimatedMinutes,
      tags,
      prerequisites,
      masteryThreshold
    };
  }

  /**
   * Extract learning objectives from content
   */
  private static extractLearningObjectives(
    parsed: MarkdownContent, 
    errors: ImportError[], 
    warnings: ImportWarning[]
  ): LearningObjective[] {
    const objectives: LearningObjective[] = [];
    
    // Look for learning objectives in overview section
    const overviewSection = parsed.sections.find(s => s.type === 'overview');
    if (overviewSection) {
      const objectivePattern = /\*\*Learning Objectives[^:]*:\*\*([\s\S]*?)(?=\*\*|$)/i;
      const match = overviewSection.content.match(objectivePattern);
      
      if (match) {
        const objectiveText = match[1];
        const objectiveLines = objectiveText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, ''));

        for (const objectiveLine of objectiveLines) {
          if (objectiveLine.trim()) {
            objectives.push({
              id: '', // Will be generated when saved
              title: objectiveLine.trim(),
              description: objectiveLine.trim(),
              category: 'application', // Default category
              masteryThreshold: 0.8,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }

    if (objectives.length === 0) {
      warnings.push({
        type: 'content',
        message: 'No learning objectives found in lesson'
      });
    }

    return objectives;
  }

  /**
   * Extract main lesson content
   */
  private static extractMainContent(
    parsed: MarkdownContent, 
    errors: ImportError[], 
    warnings: ImportWarning[]
  ): string {
    const contentSections = parsed.sections.filter(s => s.type === 'content');
    
    if (contentSections.length === 0) {
      warnings.push({
        type: 'content',
        message: 'No learning content sections found'
      });
      return '';
    }

    // Combine all content sections
    return contentSections
      .map(section => `## ${section.title}\n\n${section.content}`)
      .join('\n\n');
  }

  /**
   * Extract exercises from content
   */
  private static extractExercises(
    parsed: MarkdownContent, 
    errors: ImportError[], 
    warnings: ImportWarning[]
  ): Exercise[] {
    const exercises: Exercise[] = [];
    const exerciseSections = parsed.sections.filter(s => s.type === 'exercise');

    for (const section of exerciseSections) {
      try {
        const exercise = this.parseExerciseSection(section);
        if (exercise) {
          exercises.push(exercise);
        }
      } catch (error) {
        errors.push({
          type: 'parsing',
          message: `Failed to parse exercise "${section.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          location: section.title
        });
      }
    }

    return exercises;
  }

  /**
   * Parse individual exercise section
   */
  private static parseExerciseSection(section: ContentSection): Exercise | null {
    // Extract exercise metadata from section content
    const typeMatch = section.content.match(/\*\*Type:\*\*\s*(.+)/);
    const descMatch = section.content.match(/\*\*Instructions:\*\*\s*"([^"]+)"/);
    
    const exercise: Exercise = {
      id: '', // Will be generated
      lessonId: '', // Will be set during import
      title: section.title.replace(/Exercise \d+:\s*/, ''),
      description: descMatch ? descMatch[1] : undefined,
      type: this.mapExerciseType(typeMatch ? typeMatch[1].trim() : ''),
      orderIndex: 0, // Will be set during import
      timeLimit: undefined,
      maxAttempts: 3,
      difficulty: 'medium',
      questions: this.parseExerciseQuestions(section),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return exercise;
  }

  /**
   * Map exercise type string to enum
   */
  private static mapExerciseType(typeStr: string): ExerciseType {
    const lowerType = typeStr.toLowerCase();
    if (lowerType.includes('challenge')) return 'challenge';
    if (lowerType.includes('enrichment')) return 'enrichment';
    if (lowerType.includes('reinforcement')) return 'reinforcement';
    return 'practice';
  }

  /**
   * Parse questions from exercise section
   */
  private static parseExerciseQuestions(section: ContentSection): ExerciseQuestion[] {
    const questions: ExerciseQuestion[] = [];
    
    // Look for numbered questions in the content
    const questionPattern = /(\d+)\.\s*\*\*([^*]+)\*\*([\s\S]*?)(?=\d+\.\s*\*\*|\*\*Feedback|$)/g;
    let match;
    let orderIndex = 0;

    while ((match = questionPattern.exec(section.content)) !== null) {
      const [, questionNum, questionText, content] = match;
      
      const question: ExerciseQuestion = {
        id: '', // Will be generated
        exerciseId: '', // Will be set during import
        questionText: questionText.trim(),
        type: this.detectQuestionType(content),
        orderIndex: orderIndex++,
        points: 1,
        questionData: this.parseQuestionData(content),
        correctAnswer: this.parseCorrectAnswer(content),
        hints: this.parseHints(content),
        correctFeedback: this.parseCorrectFeedback(content),
        incorrectFeedback: this.parseIncorrectFeedback(content),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      questions.push(question);
    }

    return questions;
  }

  /**
   * Detect question type from content
   */
  private static detectQuestionType(content: string): QuestionType {
    if (content.includes('- a)') || content.includes('- b)')) return 'multiple_choice';
    if (content.includes('**___**') || content.includes('blank')) return 'fill_in_blank';
    if (content.includes('drag') || content.includes('drop')) return 'drag_and_drop';
    if (content.includes('build') || content.includes('arrange')) return 'sentence_builder';
    return 'multiple_choice'; // Default
  }

  /**
   * Parse question data based on type
   */
  private static parseQuestionData(content: string): QuestionData {
    // For multiple choice, extract options
    const optionPattern = /- ([a-d])\)\s*(.+)/g;
    const options: string[] = [];
    let match;

    while ((match = optionPattern.exec(content)) !== null) {
      options.push(match[2].trim());
    }

    if (options.length > 0) {
      return {
        type: 'multiple_choice',
        options,
        shuffleOptions: true
      };
    }

    // Default to multiple choice with empty options
    return {
      type: 'multiple_choice',
      options: []
    };
  }

  /**
   * Parse correct answer from content
   */
  private static parseCorrectAnswer(content: string): string | string[] {
    // Look for answer indicators
    const answerPatterns = [
      /Answer:\s*(.+)/i,
      /Correct:\s*(.+)/i,
      /✓/g
    ];

    for (const pattern of answerPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1]?.trim() || '';
      }
    }

    // Look for marked correct option
    const correctOptionMatch = content.match(/- [a-d]\)\s*([^✓]*?)✓/);
    if (correctOptionMatch) {
      return correctOptionMatch[1].trim();
    }

    return '';
  }

  /**
   * Parse hints from content
   */
  private static parseHints(content: string): string[] | undefined {
    const hintPattern = /Hint:\s*"([^"]+)"/g;
    const hints: string[] = [];
    let match;

    while ((match = hintPattern.exec(content)) !== null) {
      hints.push(match[1]);
    }

    return hints.length > 0 ? hints : undefined;
  }

  /**
   * Parse correct feedback
   */
  private static parseCorrectFeedback(content: string): string | undefined {
    const match = content.match(/\*\*Feedback if correct:\*\*\s*"([^"]+)"/);
    return match ? match[1] : undefined;
  }

  /**
   * Parse incorrect feedback
   */
  private static parseIncorrectFeedback(content: string): string | undefined {
    const match = content.match(/\*\*Feedback if incorrect:\*\*\s*"([^"]+)"/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract assessments from content
   */
  private static extractAssessments(
    parsed: MarkdownContent, 
    errors: ImportError[], 
    warnings: ImportWarning[]
  ): Assessment[] {
    const assessments: Assessment[] = [];
    const assessmentSections = parsed.sections.filter(s => s.type === 'assessment');

    for (const section of assessmentSections) {
      try {
        const assessment = this.parseAssessmentSection(section);
        if (assessment) {
          assessments.push(assessment);
        }
      } catch (error) {
        errors.push({
          type: 'parsing',
          message: `Failed to parse assessment "${section.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          location: section.title
        });
      }
    }

    return assessments;
  }

  /**
   * Parse individual assessment section
   */
  private static parseAssessmentSection(section: ContentSection): Assessment | null {
    const assessment: Assessment = {
      id: '', // Will be generated
      title: section.title,
      description: undefined,
      type: this.mapAssessmentType(section.title),
      timeLimit: undefined,
      maxAttempts: 2,
      masteryThreshold: 0.8,
      questions: this.parseAssessmentQuestions(section),
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return assessment;
  }

  /**
   * Map assessment title to type
   */
  private static mapAssessmentType(title: string): AssessmentType {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('pre-assessment') || lowerTitle.includes('diagnostic')) return 'diagnostic';
    if (lowerTitle.includes('mastery') || lowerTitle.includes('formative')) return 'formative';
    if (lowerTitle.includes('summative')) return 'summative';
    if (lowerTitle.includes('retention')) return 'retention_check';
    return 'formative';
  }

  /**
   * Parse assessment questions (similar to exercise questions)
   */
  private static parseAssessmentQuestions(section: ContentSection): AssessmentQuestion[] {
    return this.parseExerciseQuestions(section).map(eq => ({
      id: '',
      assessmentId: '',
      questionText: eq.questionText,
      type: eq.type,
      orderIndex: eq.orderIndex,
      points: eq.points,
      difficulty: 'medium' as DifficultyLevel,
      questionData: eq.questionData,
      correctAnswer: eq.correctAnswer,
      feedback: eq.correctFeedback,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Bulk import multiple markdown files
   */
  static async bulkImportFromDirectory(
    directory: string,
    filePattern = '*.md'
  ): Promise<BulkImportResult> {
    // This would be implemented with filesystem operations
    // For now, return a placeholder
    return {
      totalFiles: 0,
      successful: 0,
      failed: 0,
      results: []
    };
  }
}

// ===== CONTENT EXPORTER =====

export class ContentExporter {
  /**
   * Export lesson to markdown format
   */
  static async exportLessonToMarkdown(
    lesson: Lesson,
    options: ExportOptions = {
      includeMetadata: true,
      includeExercises: true,
      includeAssessments: true,
      format: 'markdown',
      templateType: 'complete'
    }
  ): Promise<string> {
    let markdown = '';

    // Add frontmatter if requested
    if (options.includeMetadata) {
      markdown += this.generateFrontmatter(lesson);
    }

    // Add lesson title
    markdown += `# ${lesson.title}\n\n`;

    // Add lesson overview
    markdown += this.generateLessonOverview(lesson);

    // Add main content
    if (lesson.content) {
      markdown += `## Learning Content\n\n${lesson.content}\n\n`;
    }

    // Add exercises if requested
    if (options.includeExercises && lesson.exercises) {
      markdown += this.generateExercisesMarkdown(lesson.exercises);
    }

    // Add assessments if requested
    if (options.includeAssessments && lesson.assessments) {
      markdown += this.generateAssessmentsMarkdown(lesson.assessments);
    }

    return markdown;
  }

  /**
   * Generate YAML frontmatter
   */
  private static generateFrontmatter(lesson: Lesson): string {
    const frontmatter = {
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      estimatedMinutes: lesson.estimatedMinutes,
      masteryThreshold: lesson.masteryThreshold,
      tags: lesson.tags || [],
      orderIndex: lesson.orderIndex,
      isPublished: lesson.isPublished
    };

    let yaml = '---\n';
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
      } else if (typeof value === 'string') {
        yaml += `${key}: "${value}"\n`;
      } else if (typeof value === 'boolean') {
        yaml += `${key}: ${value}\n`;
      } else {
        yaml += `${key}: ${value}\n`;
      }
    }
    yaml += '---\n\n';

    return yaml;
  }

  /**
   * Generate lesson overview section
   */
  private static generateLessonOverview(lesson: Lesson): string {
    let overview = '## Lesson Overview\n\n';

    if (lesson.objectives && lesson.objectives.length > 0) {
      overview += '**Learning Objectives:**\n\n';
      for (const objective of lesson.objectives) {
        overview += `- ${objective.title}\n`;
      }
      overview += '\n';
    }

    overview += `**Estimated Time:** ${lesson.estimatedMinutes} minutes\n\n`;
    overview += `**Difficulty:** ${lesson.difficulty}\n\n`;
    overview += `**Mastery Threshold:** ${Math.round(lesson.masteryThreshold * 100)}%\n\n`;

    if (lesson.description) {
      overview += `**Description:** ${lesson.description}\n\n`;
    }

    return overview;
  }

  /**
   * Generate exercises markdown
   */
  private static generateExercisesMarkdown(exercises: Exercise[]): string {
    let markdown = '## Interactive Exercises\n\n';

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      markdown += `### Exercise ${i + 1}: ${exercise.title}\n\n`;
      
      if (exercise.description) {
        markdown += `**Instructions:** ${exercise.description}\n\n`;
      }

      markdown += `**Type:** ${exercise.type}\n\n`;

      if (exercise.questions) {
        for (let j = 0; j < exercise.questions.length; j++) {
          const question = exercise.questions[j];
          markdown += `${j + 1}. **${question.questionText}**\n\n`;

          // Add question-specific content based on type
          if (question.type === 'multiple_choice' && 'options' in question.questionData) {
            const data = question.questionData as any;
            if (data.options) {
              for (let k = 0; k < data.options.length; k++) {
                const option = data.options[k];
                const letter = String.fromCharCode(97 + k); // 'a', 'b', 'c', etc.
                const isCorrect = option === question.correctAnswer ? ' ✓' : '';
                markdown += `   - ${letter}) ${option}${isCorrect}\n`;
              }
            }
          }

          if (question.correctFeedback) {
            markdown += `   **Feedback if correct:** "${question.correctFeedback}"\n`;
          }

          if (question.incorrectFeedback) {
            markdown += `   **Feedback if incorrect:** "${question.incorrectFeedback}"\n`;
          }

          if (question.hints && question.hints.length > 0) {
            markdown += `   **Hint:** "${question.hints[0]}"\n`;
          }

          markdown += '\n';
        }
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Generate assessments markdown
   */
  private static generateAssessmentsMarkdown(assessments: Assessment[]): string {
    let markdown = '## Assessments\n\n';

    for (const assessment of assessments) {
      markdown += `### ${assessment.title}\n\n`;
      
      if (assessment.description) {
        markdown += `**Description:** ${assessment.description}\n\n`;
      }

      markdown += `**Type:** ${assessment.type}\n\n`;
      markdown += `**Mastery Threshold:** ${Math.round(assessment.masteryThreshold * 100)}%\n\n`;

      if (assessment.questions) {
        for (let i = 0; i < assessment.questions.length; i++) {
          const question = assessment.questions[i];
          markdown += `${i + 1}. **${question.questionText}**\n\n`;

          // Similar question formatting as exercises
          if (question.type === 'multiple_choice' && 'options' in question.questionData) {
            const data = question.questionData as any;
            if (data.options) {
              for (let j = 0; j < data.options.length; j++) {
                const option = data.options[j];
                const letter = String.fromCharCode(97 + j);
                const isCorrect = option === question.correctAnswer ? ' ✓' : '';
                markdown += `   - ${letter}) ${option}${isCorrect}\n`;
              }
            }
          }

          if (question.feedback) {
            markdown += `   **Feedback:** "${question.feedback}"\n`;
          }

          markdown += '\n';
        }
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Export lesson to JSON format
   */
  static async exportLessonToJson(lesson: Lesson): Promise<string> {
    return JSON.stringify(lesson, null, 2);
  }

  /**
   * Export multiple lessons in bulk
   */
  static async bulkExportToDirectory(
    lessons: Lesson[],
    outputDirectory: string,
    options: ExportOptions
  ): Promise<void> {
    // This would be implemented with filesystem operations
    // For now, this is a placeholder
  }
}

// ===== CONTENT VALIDATOR =====

export class ContentValidator {
  /**
   * Validate imported lesson data
   */
  static validateLessonData(data: ParsedLessonData): ImportResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Validate metadata
    if (!data.metadata.title) {
      errors.push({
        type: 'validation',
        message: 'Lesson title is required',
        code: 'MISSING_TITLE'
      });
    }

    if (data.metadata.masteryThreshold < 0 || data.metadata.masteryThreshold > 1) {
      errors.push({
        type: 'validation',
        message: 'Mastery threshold must be between 0 and 1',
        code: 'INVALID_THRESHOLD'
      });
    }

    // Validate objectives
    if (data.objectives.length === 0) {
      warnings.push({
        type: 'content',
        message: 'No learning objectives defined'
      });
    }

    // Validate exercises
    for (const exercise of data.exercises) {
      if (exercise.questions.length === 0) {
        warnings.push({
          type: 'content',
          message: `Exercise "${exercise.title}" has no questions`,
          location: exercise.title
        });
      }
    }

    // Validate assessments
    for (const assessment of data.assessments) {
      if (assessment.questions.length === 0) {
        warnings.push({
          type: 'content',
          message: `Assessment "${assessment.title}" has no questions`,
          location: assessment.title
        });
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    };
  }
}