export type Language = 'zh' | 'en';

export enum QuestionType {
  RATING = 'rating',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text'
}

export interface QuestionLogic {
  triggerQuestionId: string;
  operator: '<=' | '>=' | '==';
  value: number | string;
}

export interface Question {
  id: string;
  section: string; // 'A', 'B', 'C', 'D', 'E'
  type: QuestionType;
  titleZh: string;
  titleEn: string;
  optionsZh?: string[];
  optionsEn?: string[];
  // If undefined, always visible.
  // If single object, must satisfy condition.
  // If array, satisfying ANY condition makes it visible (OR logic).
  visibleIf?: QuestionLogic | QuestionLogic[]; 
  required?: boolean;
}

export interface SurveyResponse {
  id: string;
  timestamp: number;
  answers: Record<string, any>; // questionId -> value
  language: Language;
}

export interface AppSettings {
  restaurantName: string;
  adminPassword: string;
  logoUrl: string;
  backgroundUrl: string;
}

export interface TagCloudItem {
  text: string;
  value: number; // frequency/weight
}