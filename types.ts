
export type Language = 'zh' | 'en';

export enum QuestionType {
  RATING = 'rating',
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
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
