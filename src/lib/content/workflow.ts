/**
 * Content Import/Export Workflow Management
 * 
 * Manages the workflow for importing content from markdown files
 * and exporting content for editing, including bulk operations.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ContentImporter, ContentExporter, type ImportResult, type BulkImportResult, type ExportOptions } from './import-export';
import { createUnit, createLesson, createExercise, createAssessment } from '@/lib/db/queries';
import type { Lesson, Unit, Exercise, Assessment } from '@/types/content';

// ===== TYPES =====

export interface WorkflowConfig {
  contentDirectory: string;
  outputDirectory: string;
  backupDirectory: string;
  validateOnly: boolean;
  overwriteExisting: boolean;
  createUnits: boolean;
}

export interface ImportWorkflowResult {
  totalFiles: number;
  successful: number;
  failed: number;
  skipped: number;
  created: {
    units: number;
    lessons: number;
    exercises: number;
    assessments: number;
  };
  errors: Array<{
    file: string;
    error: string;
  }>;
  warnings: Array<{
    file: string;
    warning: string;
  }>;
}

export interface ExportWorkflowResult {
  totalLessons: number;
  exported: number;
  failed: number;
  outputFiles: string[];
  errors: Array<{
    lessonId: string;
    error: string;
  }>;
}

// ===== WORKFLOW MANAGER =====

export class ContentWorkflowManager {
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  /**
   * Import all markdown files from content directory
   */
  async importFromDirectory(): Promise<ImportWorkflowResult> {
    const result: ImportWorkflowResult = {
      totalFiles: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      created: {
        units: 0,
        lessons: 0,
        exercises: 0,
        assessments: 0
      },
      errors: [],
      warnings: []
    };

    try {
      // Ensure content directory exists
      await this.ensureDirectoryExists(this.config.contentDirectory);

      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles(this.config.contentDirectory);
      result.totalFiles = markdownFiles.length;

      console.log(`Found ${markdownFiles.length} markdown files to import`);

      // Process files in order (to handle unit dependencies)
      const sortedFiles = this.sortFilesByDependency(markdownFiles);

      for (const filePath of sortedFiles) {
        try {
          console.log(`Processing: ${path.basename(filePath)}`);
          
          const importResult = await this.importSingleFile(filePath);
          
          if (importResult.success) {
            result.successful++;
            
            // Track what was created
            if (importResult.created) {
              if (importResult.created.unit) result.created.units++;
              if (importResult.created.lesson) result.created.lessons++;
              result.created.exercises += importResult.created.exercises || 0;
              result.created.assessments += importResult.created.assessments || 0;
            }
          } else {
            result.failed++;
            result.errors.push({
              file: path.basename(filePath),
              error: importResult.error || 'Unknown error'
            });
          }

          // Add warnings
          if (importResult.warnings) {
            for (const warning of importResult.warnings) {
              result.warnings.push({
                file: path.basename(filePath),
                warning: warning.message
              });
            }
          }

        } catch (error) {
          result.failed++;
          result.errors.push({
            file: path.basename(filePath),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`Import completed: ${result.successful} successful, ${result.failed} failed`);
      return result;

    } catch (error) {
      throw new Error(`Failed to import from directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import a single markdown file
   */
  private async importSingleFile(filePath: string): Promise<{
    success: boolean;
    error?: string;
    warnings?: Array<{ message: string }>;
    created?: {
      unit?: boolean;
      lesson?: boolean;
      exercises?: number;
      assessments?: number;
    };
  }> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse markdown
      const importResult = await ContentImporter.importLessonFromMarkdown(
        content, 
        path.basename(filePath)
      );

      if (!importResult.success || !importResult.data) {
        return {
          success: false,
          error: importResult.errors[0]?.message || 'Failed to parse content',
          warnings: importResult.warnings.map(w => ({ message: w.message }))
        };
      }

      // Validate only mode
      if (this.config.validateOnly) {
        return {
          success: true,
          warnings: importResult.warnings.map(w => ({ message: w.message }))
        };
      }

      // Create database records
      const created = await this.createDatabaseRecords(importResult.data, filePath);

      return {
        success: true,
        warnings: importResult.warnings.map(w => ({ message: w.message })),
        created
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create database records from parsed data
   */
  private async createDatabaseRecords(
    data: any, 
    filePath: string
  ): Promise<{
    unit?: boolean;
    lesson?: boolean;
    exercises?: number;
    assessments?: number;
  }> {
    const created = {
      unit: false,
      lesson: false,
      exercises: 0,
      assessments: 0
    };

    try {
      // Extract unit information from filename or metadata
      const unitInfo = this.extractUnitInfo(filePath, data);
      let unitId = unitInfo.unitId;

      // Create unit if needed and configured
      if (this.config.createUnits && unitInfo.createUnit) {
        const unit = await createUnit({
          title: unitInfo.title,
          description: unitInfo.description || '',
          orderIndex: unitInfo.orderIndex || 0,
          isPublished: false,
          masteryThreshold: 0.9
        });
        unitId = unit.id;
        created.unit = true;
      }

      // Create lesson
      if (unitId) {
        const lesson = await createLesson({
          unitId,
          title: data.metadata.title,
          description: data.metadata.description,
          content: data.content,
          orderIndex: this.extractLessonOrder(filePath),
          isPublished: false,
          masteryThreshold: data.metadata.masteryThreshold,
          estimatedMinutes: data.metadata.estimatedMinutes,
          difficulty: data.metadata.difficulty,
          tags: JSON.stringify(data.metadata.tags)
        });

        created.lesson = true;

        // Create exercises
        for (const exerciseData of data.exercises) {
          await createExercise({
            lessonId: lesson.id,
            title: exerciseData.title,
            description: exerciseData.description,
            type: exerciseData.type,
            orderIndex: exerciseData.orderIndex,
            timeLimit: exerciseData.timeLimit,
            maxAttempts: exerciseData.maxAttempts,
            difficulty: exerciseData.difficulty
          });
          created.exercises++;
        }

        // Create assessments
        for (const assessmentData of data.assessments) {
          await createAssessment({
            lessonId: lesson.id,
            title: assessmentData.title,
            description: assessmentData.description,
            type: assessmentData.type,
            timeLimit: assessmentData.timeLimit,
            maxAttempts: assessmentData.maxAttempts,
            masteryThreshold: assessmentData.masteryThreshold,
            isPublished: false
          });
          created.assessments++;
        }
      }

      return created;

    } catch (error) {
      throw new Error(`Failed to create database records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export lessons to markdown files
   */
  async exportToDirectory(
    lessons?: Lesson[],
    options: ExportOptions = {
      includeMetadata: true,
      includeExercises: true,
      includeAssessments: true,
      format: 'markdown'
    }
  ): Promise<ExportWorkflowResult> {
    const result: ExportWorkflowResult = {
      totalLessons: 0,
      exported: 0,
      failed: 0,
      outputFiles: [],
      errors: []
    };

    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(this.config.outputDirectory);

      // Get lessons to export
      const lessonsToExport = lessons || await this.getAllLessons();
      result.totalLessons = lessonsToExport.length;

      console.log(`Exporting ${lessonsToExport.length} lessons`);

      for (const lesson of lessonsToExport) {
        try {
          console.log(`Exporting: ${lesson.title}`);
          
          const markdown = await ContentExporter.exportLessonToMarkdown(lesson, options);
          const filename = this.generateFilename(lesson);
          const outputPath = path.join(this.config.outputDirectory, filename);

          await fs.writeFile(outputPath, markdown, 'utf-8');
          
          result.exported++;
          result.outputFiles.push(filename);

        } catch (error) {
          result.failed++;
          result.errors.push({
            lessonId: lesson.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`Export completed: ${result.exported} exported, ${result.failed} failed`);
      return result;

    } catch (error) {
      throw new Error(`Failed to export to directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create backup of existing content before import
   */
  async createBackup(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.config.backupDirectory);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.config.backupDirectory, `backup-${timestamp}`);
      
      await this.ensureDirectoryExists(backupDir);

      // Export all current lessons as backup
      const lessons = await this.getAllLessons();
      
      for (const lesson of lessons) {
        const markdown = await ContentExporter.exportLessonToMarkdown(lesson);
        const filename = this.generateFilename(lesson);
        const backupPath = path.join(backupDir, filename);
        
        await fs.writeFile(backupPath, markdown, 'utf-8');
      }

      console.log(`Backup created: ${backupDir}`);

    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Find all markdown files in directory
   */
  private async findMarkdownFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await this.findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Skip template files
        if (!entry.name.includes('template') && !entry.name.startsWith('.')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  /**
   * Sort files by dependency order (units before lessons)
   */
  private sortFilesByDependency(files: string[]): string[] {
    return files.sort((a, b) => {
      const aName = path.basename(a);
      const bName = path.basename(b);
      
      // Extract unit and lesson numbers from filenames
      const aMatch = aName.match(/unit-(\d+)(?:-lesson-(\d+))?/);
      const bMatch = bName.match(/unit-(\d+)(?:-lesson-(\d+))?/);
      
      if (!aMatch || !bMatch) {
        return aName.localeCompare(bName);
      }
      
      const aUnit = parseInt(aMatch[1]);
      const bUnit = parseInt(bMatch[1]);
      const aLesson = aMatch[2] ? parseInt(aMatch[2]) : 0;
      const bLesson = bMatch[2] ? parseInt(bMatch[2]) : 0;
      
      // Sort by unit first, then by lesson
      if (aUnit !== bUnit) {
        return aUnit - bUnit;
      }
      
      return aLesson - bLesson;
    });
  }

  /**
   * Extract unit information from filename and data
   */
  private extractUnitInfo(filePath: string, data: any): {
    unitId?: string;
    createUnit: boolean;
    title: string;
    description?: string;
    orderIndex?: number;
  } {
    const filename = path.basename(filePath);
    const unitMatch = filename.match(/unit-(\d+)/);
    
    if (unitMatch) {
      const unitNumber = parseInt(unitMatch[1]);
      return {
        createUnit: true,
        title: `Unit ${unitNumber}`,
        description: `Grammar Unit ${unitNumber}`,
        orderIndex: unitNumber - 1
      };
    }
    
    // Default unit
    return {
      createUnit: false,
      title: 'Default Unit'
    };
  }

  /**
   * Extract lesson order from filename
   */
  private extractLessonOrder(filePath: string): number {
    const filename = path.basename(filePath);
    const lessonMatch = filename.match(/lesson-(\d+)/);
    
    if (lessonMatch) {
      return parseInt(lessonMatch[1]) - 1;
    }
    
    return 0;
  }

  /**
   * Generate filename for exported lesson
   */
  private generateFilename(lesson: Lesson): string {
    // Clean title for filename
    const cleanTitle = lesson.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Include unit and lesson info if available
    const unitPrefix = lesson.unit ? `unit-${lesson.unit.orderIndex + 1}-` : '';
    const lessonPrefix = `lesson-${lesson.orderIndex + 1}-`;
    
    return `${unitPrefix}${lessonPrefix}${cleanTitle}.md`;
  }

  /**
   * Get all lessons from database
   */
  private async getAllLessons(): Promise<Lesson[]> {
    // This would use the database queries
    // For now, return empty array
    return [];
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fs.access(directory);
    } catch {
      await fs.mkdir(directory, { recursive: true });
    }
  }
}

// ===== CLI UTILITIES =====

export class ContentCLI {
  /**
   * Import content from directory with progress reporting
   */
  static async importCommand(options: {
    contentDir: string;
    validateOnly?: boolean;
    createUnits?: boolean;
    backup?: boolean;
  }): Promise<void> {
    const config: WorkflowConfig = {
      contentDirectory: options.contentDir,
      outputDirectory: './output',
      backupDirectory: './backups',
      validateOnly: options.validateOnly || false,
      overwriteExisting: false,
      createUnits: options.createUnits || true
    };

    const workflow = new ContentWorkflowManager(config);

    try {
      // Create backup if requested
      if (options.backup) {
        console.log('Creating backup...');
        await workflow.createBackup();
      }

      // Run import
      console.log(`Starting import from: ${options.contentDir}`);
      const result = await workflow.importFromDirectory();

      // Report results
      console.log('\n=== Import Results ===');
      console.log(`Total files: ${result.totalFiles}`);
      console.log(`Successful: ${result.successful}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Skipped: ${result.skipped}`);
      
      console.log('\n=== Created ===');
      console.log(`Units: ${result.created.units}`);
      console.log(`Lessons: ${result.created.lessons}`);
      console.log(`Exercises: ${result.created.exercises}`);
      console.log(`Assessments: ${result.created.assessments}`);

      if (result.errors.length > 0) {
        console.log('\n=== Errors ===');
        for (const error of result.errors) {
          console.log(`${error.file}: ${error.error}`);
        }
      }

      if (result.warnings.length > 0) {
        console.log('\n=== Warnings ===');
        for (const warning of result.warnings) {
          console.log(`${warning.file}: ${warning.warning}`);
        }
      }

    } catch (error) {
      console.error('Import failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Export content to directory
   */
  static async exportCommand(options: {
    outputDir: string;
    format?: 'markdown' | 'json';
    includeExercises?: boolean;
    includeAssessments?: boolean;
  }): Promise<void> {
    const config: WorkflowConfig = {
      contentDirectory: './content',
      outputDirectory: options.outputDir,
      backupDirectory: './backups',
      validateOnly: false,
      overwriteExisting: true,
      createUnits: false
    };

    const workflow = new ContentWorkflowManager(config);

    const exportOptions: ExportOptions = {
      includeMetadata: true,
      includeExercises: options.includeExercises !== false,
      includeAssessments: options.includeAssessments !== false,
      format: options.format || 'markdown'
    };

    try {
      console.log(`Starting export to: ${options.outputDir}`);
      const result = await workflow.exportToDirectory(undefined, exportOptions);

      // Report results
      console.log('\n=== Export Results ===');
      console.log(`Total lessons: ${result.totalLessons}`);
      console.log(`Exported: ${result.exported}`);
      console.log(`Failed: ${result.failed}`);

      if (result.outputFiles.length > 0) {
        console.log('\n=== Output Files ===');
        for (const file of result.outputFiles) {
          console.log(`- ${file}`);
        }
      }

      if (result.errors.length > 0) {
        console.log('\n=== Errors ===');
        for (const error of result.errors) {
          console.log(`Lesson ${error.lessonId}: ${error.error}`);
        }
      }

    } catch (error) {
      console.error('Export failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Validate content files
   */
  static async validateCommand(options: {
    contentDir: string;
  }): Promise<void> {
    await this.importCommand({
      contentDir: options.contentDir,
      validateOnly: true,
      backup: false
    });
  }
}

// ===== BATCH OPERATIONS =====

export class BatchOperations {
  /**
   * Migrate content from old format to new format
   */
  static async migrateContent(
    sourceDir: string,
    outputDir: string,
    transformFn?: (content: string) => string
  ): Promise<void> {
    const workflow = new ContentWorkflowManager({
      contentDirectory: sourceDir,
      outputDirectory: outputDir,
      backupDirectory: './migration-backup',
      validateOnly: false,
      overwriteExisting: true,
      createUnits: false
    });

    // Create backup
    await workflow.createBackup();

    // Read all files and transform them
    const files = await workflow['findMarkdownFiles'](sourceDir);
    
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const transformedContent = transformFn ? transformFn(content) : content;
      
      const filename = path.basename(filePath);
      const outputPath = path.join(outputDir, filename);
      
      await fs.writeFile(outputPath, transformedContent, 'utf-8');
    }

    console.log(`Migrated ${files.length} files from ${sourceDir} to ${outputDir}`);
  }

  /**
   * Update all content with new template
   */
  static async updateContentTemplate(
    contentDir: string,
    templatePath: string
  ): Promise<void> {
    // This would implement template updating logic
    console.log(`Updating content in ${contentDir} with template ${templatePath}`);
  }
}