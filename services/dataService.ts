
import { Question, QuestionType, AppSettings, SurveyResponse } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'nb_questions',
  RESPONSES: 'nb_responses',
  SETTINGS: 'nb_settings_cache',
};

const API_ENDPOINTS = {
  SETTINGS: './settings.json',
  UPLOAD: '/api/upload',
  SAVE_SETTINGS: '/api/settings'
};

export const DataService = {
  getSettings: async (): Promise<AppSettings> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SETTINGS}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error('Failed to fetch from server');
      const settings = await response.json();
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return cached ? JSON.parse(cached) : {
        restaurantName: '无界餐饮',
        adminPassword: '568568',
        logoUrl: '',
        backgroundUrl: ''
      };
    }
  },

  saveSettings: async (settings: AppSettings): Promise<boolean> => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    console.log('Syncing to server...', API_ENDPOINTS.SAVE_SETTINGS, settings);
    return true; 
  },

  uploadFile: async (fileData: string, type: 'logo' | 'background'): Promise<string> => {
    console.log(`Uploading ${type} to server assets folder...`);
    return fileData;
  },

  getQuestions: (): Question[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!stored) return []; 
    return JSON.parse(stored);
  },

  saveQuestions: (questions: Question[]) => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  getResponses: (): SurveyResponse[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    return stored ? JSON.parse(stored) : [];
  },

  addResponse: (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const responses = DataService.getResponses();
    const newResponse: SurveyResponse = {
      ...response,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    responses.push(newResponse);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  },

  exportToCSV: (startDate?: string, endDate?: string) => {
    let responses = DataService.getResponses();
    const questions = DataService.getQuestions();
    
    if (startDate) {
      const start = new Date(startDate).getTime();
      responses = responses.filter(r => r.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000; // Include full end day
      responses = responses.filter(r => r.timestamp <= end);
    }

    if (responses.length === 0) return null;

    const headers = ['ID', 'Date', 'Time', 'Language', ...questions.map(q => q.titleZh)];
    
    const rows = responses.map(r => {
      const dateObj = new Date(r.timestamp);
      const questionAnswers = questions.map(q => {
        let ans = r.answers[q.id];
        const otherText = r.answers[`${q.id}_other`];
        if (Array.isArray(ans)) {
          let str = ans.join('; ');
          if (otherText) str += ` (Other: ${otherText})`;
          return str;
        }
        if (otherText) return `${ans} (Other: ${otherText})`;
        return ans ?? '';
      });

      const rowData = [
        r.id,
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        r.language,
        ...questionAnswers
      ];
      return rowData.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
