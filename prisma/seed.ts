import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await prisma.learnerProgress.deleteMany();
  await prisma.objectiveProgress.deleteMany();
  await prisma.exerciseResponse.deleteMany();
  await prisma.exerciseAttempt.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.exerciseQuestion.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.learningObjective.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.userAnalytics.deleteMany();
  await prisma.learningInsight.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log("👥 Creating sample users...");

  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      profile: {
        create: {
          age: 16,
          gradeLevel: "10th Grade",
          learningGoals: "Improve grammar for college prep",
          timezone: "America/New_York",
          preferredDifficulty: "intermediate",
          learningStyle: "visual",
        },
      },
      preferences: {
        create: {
          theme: "light",
          language: "en",
          dailyGoalMinutes: 45,
          enableNotifications: true,
          enableSounds: true,
          showHints: true,
          fontSize: "medium",
          highContrast: false,
          reducedMotion: false,
        },
      },
    },
  });

  const advancedUser = await prisma.user.create({
    data: {
      email: "advanced@example.com",
      name: "Advanced Learner",
      profile: {
        create: {
          age: 22,
          gradeLevel: "College",
          learningGoals: "Master advanced grammar for professional writing",
          timezone: "America/Los_Angeles",
          preferredDifficulty: "advanced",
          learningStyle: "mixed",
        },
      },
    },
  });

  // Create Unit 1: Foundation Skills
  console.log("📚 Creating Unit 1: Foundation Skills...");

  const unit1 = await prisma.unit.create({
    data: {
      title: "Foundation Skills",
      description:
        "Essential grammar building blocks including parts of speech and basic sentence structure",
      orderIndex: 1,
      isPublished: true,
      masteryThreshold: 0.9,
      prerequisiteUnits: null, // No prerequisites for first unit
    },
  });

  // Create Lesson 1.1: Nouns
  console.log("📖 Creating Lesson 1.1: Nouns...");

  const lesson1_1 = await prisma.lesson.create({
    data: {
      unitId: unit1.id,
      title: "Nouns - The Building Blocks",
      description:
        "Learn to identify and use different types of nouns in your writing",
      content: `# Nouns - The Building Blocks

## What is a Noun?

A **noun** is a word that names a person, place, thing, or idea. Nouns are the foundation of sentences and help us communicate clearly about the world around us.

## Types of Nouns

### 1. Common Nouns
Common nouns name general people, places, or things.
- Examples: *dog, city, book, happiness*

### 2. Proper Nouns
Proper nouns name specific people, places, or things and are always capitalized.
- Examples: *Sarah, New York, iPhone, Christmas*

### 3. Abstract Nouns
Abstract nouns name ideas, feelings, or concepts that cannot be touched.
- Examples: *love, courage, freedom, intelligence*

### 4. Concrete Nouns
Concrete nouns name things you can see, touch, hear, smell, or taste.
- Examples: *apple, music, perfume, sandpaper*

## Practice Exercise

Identify the nouns in this sentence:
"The brave firefighter rescued the frightened cat from the tall tree."

*Answer: firefighter, cat, tree*`,
      orderIndex: 1,
      isPublished: true,
      masteryThreshold: 0.8,
      estimatedMinutes: 25,
      difficulty: "beginner",
      tags: JSON.stringify(["parts-of-speech", "nouns", "grammar-basics"]),
    },
  });

  // Create Learning Objectives for Nouns lesson
  console.log("🎯 Creating learning objectives...");

  const nounObjective1 = await prisma.learningObjective.create({
    data: {
      lessonId: lesson1_1.id,
      title: "Identify Different Types of Nouns",
      description:
        "Students will be able to distinguish between common, proper, abstract, and concrete nouns",
      category: "knowledge",
      masteryThreshold: 0.8,
    },
  });

  const nounObjective2 = await prisma.learningObjective.create({
    data: {
      lessonId: lesson1_1.id,
      title: "Use Nouns Correctly in Sentences",
      description:
        "Students will be able to use appropriate nouns in context within sentences",
      category: "application",
      masteryThreshold: 0.8,
    },
  });

  // Create Exercise for Nouns lesson
  console.log("✏️ Creating exercises...");

  const nounExercise = await prisma.exercise.create({
    data: {
      lessonId: lesson1_1.id,
      title: "Noun Identification Practice",
      description: "Practice identifying different types of nouns in sentences",
      type: "practice",
      orderIndex: 1,
      timeLimit: 300, // 5 minutes
      maxAttempts: 3,
      difficulty: "medium",
    },
  });

  // Create Exercise Questions
  await prisma.exerciseQuestion.create({
    data: {
      exerciseId: nounExercise.id,
      objectiveId: nounObjective1.id,
      questionText:
        'Identify the proper noun in this sentence: "Sarah visited the museum in Paris last summer."',
      type: "multiple_choice",
      orderIndex: 1,
      points: 1,
      questionData: JSON.stringify({
        options: ["Sarah", "museum", "summer", "visited"],
        correctIndex: 0,
      }),
      correctAnswer: JSON.stringify(["Sarah", "Paris"]),
      hints: JSON.stringify([
        "Proper nouns name specific people, places, or things",
        "Proper nouns are always capitalized",
        "Look for names of specific people or places",
      ]),
      correctFeedback:
        "Excellent! Sarah and Paris are proper nouns because they name specific people and places.",
      incorrectFeedback:
        "Remember: proper nouns are always capitalized and name specific things.",
    },
  });

  await prisma.exerciseQuestion.create({
    data: {
      exerciseId: nounExercise.id,
      objectiveId: nounObjective1.id,
      questionText: "Which word is an abstract noun?",
      type: "multiple_choice",
      orderIndex: 2,
      points: 1,
      questionData: JSON.stringify({
        options: ["happiness", "table", "dog", "mountain"],
        correctIndex: 0,
      }),
      correctAnswer: JSON.stringify(["happiness"]),
      hints: JSON.stringify([
        "Abstract nouns name things you cannot touch or see",
        "Abstract nouns are often feelings, ideas, or concepts",
        "Think about which option represents an emotion or concept",
      ]),
      correctFeedback:
        "Perfect! Happiness is an abstract noun because it names an emotion that cannot be touched.",
      incorrectFeedback:
        "Abstract nouns name ideas, feelings, or concepts that cannot be physically touched.",
    },
  });

  // Create Assessment for Nouns lesson
  console.log("📝 Creating assessments...");

  const nounAssessment = await prisma.assessment.create({
    data: {
      lessonId: lesson1_1.id,
      title: "Nouns Mastery Assessment",
      description: "Demonstrate your understanding of different types of nouns",
      type: "summative",
      timeLimit: 600, // 10 minutes
      maxAttempts: 2,
      masteryThreshold: 0.8,
      isPublished: true,
    },
  });

  // Create Assessment Questions
  await prisma.assessmentQuestion.create({
    data: {
      assessmentId: nounAssessment.id,
      objectiveId: nounObjective1.id,
      questionText:
        'Identify ALL the nouns in this sentence: "The talented musician played beautiful music at the concert in Chicago."',
      type: "multiple_choice",
      orderIndex: 1,
      points: 2,
      difficulty: "medium",
      questionData: JSON.stringify({
        options: [
          "musician, music, concert, Chicago",
          "talented, beautiful, played",
          "the, at, in",
          "musician, played, Chicago",
        ],
        correctIndex: 0,
      }),
      correctAnswer: JSON.stringify([
        "musician",
        "music",
        "concert",
        "Chicago",
      ]),
      distractors: JSON.stringify(["talented", "beautiful", "played"]),
      feedback:
        'Nouns name people (musician), things (music, concert), and places (Chicago). Adjectives like "talented" and "beautiful" describe nouns but are not nouns themselves.',
    },
  });

  await prisma.assessmentQuestion.create({
    data: {
      assessmentId: nounAssessment.id,
      objectiveId: nounObjective2.id,
      questionText:
        'Choose the best noun to complete this sentence: "The _____ was very helpful during the emergency."',
      type: "multiple_choice",
      orderIndex: 2,
      points: 1,
      difficulty: "easy",
      questionData: JSON.stringify({
        options: ["firefighter", "quickly", "dangerous", "helped"],
        correctIndex: 0,
      }),
      correctAnswer: JSON.stringify(["firefighter"]),
      feedback:
        "A firefighter is a person (noun) who would be helpful during an emergency. The other options are adverbs or adjectives.",
    },
  });

  // Create additional lessons for Unit 1
  console.log("📖 Creating additional lessons...");

  const lesson1_2 = await prisma.lesson.create({
    data: {
      unitId: unit1.id,
      title: "Verbs - Action and Being",
      description: "Master action verbs, linking verbs, and basic verb tenses",
      content:
        "# Verbs - Action and Being\n\n## What is a Verb?\n\nA **verb** is a word that shows action or state of being...",
      orderIndex: 2,
      isPublished: true,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: "beginner",
      tags: JSON.stringify(["parts-of-speech", "verbs", "action-words"]),
    },
  });

  const lesson1_3 = await prisma.lesson.create({
    data: {
      unitId: unit1.id,
      title: "Adjectives and Adverbs",
      description: "Learn descriptive words that modify nouns and verbs",
      content:
        "# Adjectives and Adverbs\n\n## Descriptive Words\n\n**Adjectives** describe nouns...",
      orderIndex: 3,
      isPublished: true,
      masteryThreshold: 0.8,
      estimatedMinutes: 28,
      difficulty: "beginner",
      tags: JSON.stringify([
        "parts-of-speech",
        "adjectives",
        "adverbs",
        "descriptive-words",
      ]),
    },
  });

  // Create sample progress for test user
  console.log("📊 Creating sample progress...");

  await prisma.learnerProgress.create({
    data: {
      userId: testUser.id,
      lessonId: lesson1_1.id,
      status: "completed",
      currentScore: 0.85,
      bestScore: 0.85,
      masteryAchieved: true,
      masteryDate: new Date(),
      totalTimeSpent: 1800, // 30 minutes
      sessionsCount: 2,
      needsRemediation: false,
      eligibleForEnrichment: true,
    },
  });

  await prisma.objectiveProgress.create({
    data: {
      userId: testUser.id,
      objectiveId: nounObjective1.id,
      currentScore: 0.9,
      bestScore: 0.9,
      masteryAchieved: true,
      masteryDate: new Date(),
      totalAttempts: 5,
      correctAttempts: 4,
    },
  });

  // Create sample analytics
  console.log("📈 Creating sample analytics...");

  await prisma.userAnalytics.create({
    data: {
      userId: testUser.id,
      date: new Date(),
      timeSpent: 1800,
      lessonsStarted: 1,
      lessonsCompleted: 1,
      exercisesCompleted: 1,
      assessmentsTaken: 1,
      averageScore: 0.85,
      masteryRate: 1.0,
      retentionRate: 0.9,
      preferredTimeOfDay: "afternoon",
      avgSessionLength: 900,
      streakDays: 3,
    },
  });

  // Create learning insights
  await prisma.learningInsight.create({
    data: {
      userId: testUser.id,
      type: "achievement",
      category: "grammar_topic",
      title: "Nouns Mastery Achieved!",
      description:
        "Congratulations! You have mastered noun identification and usage.",
      confidence: 0.95,
      recommendations: JSON.stringify([
        "Continue to Unit 2: Intermediate Grammar",
        "Try some enrichment activities with creative writing",
        "Review nouns again in 1 week for retention",
      ]),
      priority: "high",
      isViewed: false,
      isDismissed: false,
    },
  });

  // Create system configuration
  console.log("⚙️ Creating system configuration...");

  await prisma.systemConfig.createMany({
    data: [
      {
        key: "mastery_threshold_lesson",
        value: "0.8",
        description: "Default mastery threshold for lesson progression",
      },
      {
        key: "mastery_threshold_unit",
        value: "0.9",
        description: "Default mastery threshold for unit completion",
      },
      {
        key: "retention_check_delay_days",
        value: "7",
        description: "Days to wait before scheduling retention checks",
      },
      {
        key: "max_daily_lessons",
        value: "5",
        description: "Maximum lessons a user can complete per day",
      },
    ],
  });

  console.log("✅ Database seeding completed successfully!");
  console.log(`
📊 Summary:
• 2 Users created
• 1 Unit created (Foundation Skills)
• 3 Lessons created 
• 2 Learning Objectives created
• 1 Exercise with 2 questions created
• 1 Assessment with 2 questions created
• Sample progress and analytics created
• System configuration added
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
