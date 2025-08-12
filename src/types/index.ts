export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  duration: number; // in minutes
  completed: boolean;
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface UserProgress {
  userId: string;
  lessonsCompleted: string[];
  exercisesCompleted: string[];
  totalScore: number;
  streak: number;
  lastActive: Date;
}