
import { Question, QuestionType, AppSettings, SurveyResponse } from '../types';

// In production, this would be your actual server URL
const API_BASE = '/api'; 

export const DataService = {
  getSettings: async (): Promise<AppSettings> => {
    try {
      const response = await fetch(`${API_BASE}/settings?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    } catch (error) {
      console.error('DataService.getSettings error:', error);
      // Return hardcoded defaults if server is unreachable
      return {
        restaurantName: '无界餐饮',
        adminPassword: '568568',
        logoUrl: '',
        backgroundUrl: ''
      };
    }
  },

  saveSettings: async (settings: AppSettings): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return response.ok;
    } catch (error) {
      console.error('DataService.saveSettings error:', error);
      return false;
    }
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.url; // Returns the /uploads/filename.jpg path
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  getResponses: async (): Promise<SurveyResponse[]> => {
    try {
      const response = await fetch(`${API_BASE}/responses`);
      return await response.json();
    } catch (error) {
      console.error('Fetch responses error:', error);
      return [];
    }
  },

  addResponse: async (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const payload = {
      ...response,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    
    try {
      await fetch(`${API_BASE}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Save response error:', error);
    }
  },

  getQuestions: (): Question[] => {
    const stored = localStorage.getItem('nb_questions');
    if (!stored) return []; 
    return JSON.parse(stored);
  },

  saveQuestions: (questions: Question[]) => {
    localStorage.setItem('nb_questions', JSON.stringify(questions));
  },

  exportToCSV: async (startDate?: string, endDate?: string) => {
    let responses = await DataService.getResponses();
    const questions = DataService.getQuestions();
    
    if (startDate) {
      const start = new Date(startDate).getTime();
      responses = responses.filter(r => r.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000;
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

      return [
        r.id,
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        r.language,
        ...questionAnswers
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
