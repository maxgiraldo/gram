/*
  Warnings:

  - You are about to drop the `content_revisions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "content_revisions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentData" TEXT NOT NULL,
    "changelog" TEXT,
    "createdBy" TEXT NOT NULL,
    "modifiedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "publishedAt" DATETIME,
    "language" TEXT NOT NULL DEFAULT 'en',
    "parentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_versions_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "content_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "category" TEXT,
    "parentTagId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_tags_parentTagId_fkey" FOREIGN KEY ("parentTagId") REFERENCES "content_tags" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "parentCategoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "content_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "translatorId" TEXT,
    "reviewerId" TEXT,
    "translatedData" TEXT NOT NULL,
    "translationNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quality" TEXT,
    "confidence" REAL,
    "sourceVersionId" TEXT NOT NULL,
    "approvedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_translations_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "content_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_dependencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL,
    "strength" TEXT NOT NULL DEFAULT 'required',
    "description" TEXT,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_quality_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" REAL NOT NULL DEFAULT 0.0,
    "averageRating" REAL NOT NULL DEFAULT 0.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" REAL NOT NULL DEFAULT 0.0,
    "passRate" REAL NOT NULL DEFAULT 0.0,
    "retryRate" REAL NOT NULL DEFAULT 0.0,
    "timeToComplete" INTEGER NOT NULL DEFAULT 0,
    "errorReports" INTEGER NOT NULL DEFAULT 0,
    "accessibility" REAL NOT NULL DEFAULT 0.0,
    "readability" REAL NOT NULL DEFAULT 0.0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "complexity" TEXT,
    "topics" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_quality_metrics_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "content_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AssessmentToContentTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AssessmentToContentTag_A_fkey" FOREIGN KEY ("A") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AssessmentToContentTag_B_fkey" FOREIGN KEY ("B") REFERENCES "content_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AssessmentToContentCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AssessmentToContentCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AssessmentToContentCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "content_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentTagToContentVersion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentTagToContentVersion_A_fkey" FOREIGN KEY ("A") REFERENCES "content_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentTagToContentVersion_B_fkey" FOREIGN KEY ("B") REFERENCES "content_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentTagToLesson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentTagToLesson_A_fkey" FOREIGN KEY ("A") REFERENCES "content_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentTagToLesson_B_fkey" FOREIGN KEY ("B") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentTagToExercise" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentTagToExercise_A_fkey" FOREIGN KEY ("A") REFERENCES "content_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentTagToExercise_B_fkey" FOREIGN KEY ("B") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentTagToUnit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentTagToUnit_A_fkey" FOREIGN KEY ("A") REFERENCES "content_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentTagToUnit_B_fkey" FOREIGN KEY ("B") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentCategoryToContentVersion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentCategoryToContentVersion_A_fkey" FOREIGN KEY ("A") REFERENCES "content_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentCategoryToContentVersion_B_fkey" FOREIGN KEY ("B") REFERENCES "content_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentCategoryToLesson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentCategoryToLesson_A_fkey" FOREIGN KEY ("A") REFERENCES "content_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentCategoryToLesson_B_fkey" FOREIGN KEY ("B") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentCategoryToExercise" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentCategoryToExercise_A_fkey" FOREIGN KEY ("A") REFERENCES "content_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentCategoryToExercise_B_fkey" FOREIGN KEY ("B") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentCategoryToUnit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentCategoryToUnit_A_fkey" FOREIGN KEY ("A") REFERENCES "content_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentCategoryToUnit_B_fkey" FOREIGN KEY ("B") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_entityType_entityId_version_key" ON "content_versions"("entityType", "entityId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_entityType_entityId_language_version_key" ON "content_versions"("entityType", "entityId", "language", "version");

-- CreateIndex
CREATE UNIQUE INDEX "content_tags_name_key" ON "content_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "content_categories_name_key" ON "content_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "content_categories_slug_key" ON "content_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_entityType_entityId_targetLanguage_key" ON "content_translations"("entityType", "entityId", "targetLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "content_dependencies_sourceType_sourceId_targetType_targetId_dependencyType_key" ON "content_dependencies"("sourceType", "sourceId", "targetType", "targetId", "dependencyType");

-- CreateIndex
CREATE UNIQUE INDEX "content_quality_metrics_entityType_entityId_versionId_key" ON "content_quality_metrics"("entityType", "entityId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "_AssessmentToContentTag_AB_unique" ON "_AssessmentToContentTag"("A", "B");

-- CreateIndex
CREATE INDEX "_AssessmentToContentTag_B_index" ON "_AssessmentToContentTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AssessmentToContentCategory_AB_unique" ON "_AssessmentToContentCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_AssessmentToContentCategory_B_index" ON "_AssessmentToContentCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentTagToContentVersion_AB_unique" ON "_ContentTagToContentVersion"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentTagToContentVersion_B_index" ON "_ContentTagToContentVersion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentTagToLesson_AB_unique" ON "_ContentTagToLesson"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentTagToLesson_B_index" ON "_ContentTagToLesson"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentTagToExercise_AB_unique" ON "_ContentTagToExercise"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentTagToExercise_B_index" ON "_ContentTagToExercise"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentTagToUnit_AB_unique" ON "_ContentTagToUnit"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentTagToUnit_B_index" ON "_ContentTagToUnit"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentCategoryToContentVersion_AB_unique" ON "_ContentCategoryToContentVersion"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentCategoryToContentVersion_B_index" ON "_ContentCategoryToContentVersion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentCategoryToLesson_AB_unique" ON "_ContentCategoryToLesson"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentCategoryToLesson_B_index" ON "_ContentCategoryToLesson"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentCategoryToExercise_AB_unique" ON "_ContentCategoryToExercise"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentCategoryToExercise_B_index" ON "_ContentCategoryToExercise"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentCategoryToUnit_AB_unique" ON "_ContentCategoryToUnit"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentCategoryToUnit_B_index" ON "_ContentCategoryToUnit"("B");
