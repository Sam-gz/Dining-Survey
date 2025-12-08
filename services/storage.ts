import { Question, QuestionType, AppSettings, SurveyResponse } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'nb_questions',
  RESPONSES: 'nb_responses',
  SETTINGS: 'nb_settings',
};

// Default Initial Data based on the prompt
const DEFAULT_QUESTIONS: Question[] = [
  // Section A: 菜品体验
  { 
    id: 'a1', section: 'A', type: QuestionType.RATING, 
    titleZh: '菜品整体满意度', titleEn: 'Overall Food Satisfaction', 
    required: true 
  },
  { 
    id: 'a2', section: 'A', type: QuestionType.RATING, 
    titleZh: '菜品分量与定价匹配度', titleEn: 'Portion size & Value for money', 
    required: true 
  },
  { 
    id: 'a1_sub', section: 'A', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: '主要不满意的原因是？', titleEn: 'Main reasons for dissatisfaction?',
    optionsZh: ['种类少', '口味一般', '分量偏少', '价格略高', '上菜速度慢', '其他（请说明）'],
    optionsEn: ['Few choices', 'Average taste', 'Small portion', 'Pricey', 'Slow service', 'Other'],
    // Logic: Show if A1 <= 7 OR A2 <= 7 (Updated from 6)
    visibleIf: [
      { triggerQuestionId: 'a1', operator: '<=', value: 7 },
      { triggerQuestionId: 'a2', operator: '<=', value: 7 }
    ]
  },
  
  // Section B: 服务体验
  { 
    id: 'b1', section: 'B', type: QuestionType.RATING, 
    titleZh: '服务满意度（态度 / 速度）', titleEn: 'Service Satisfaction (Attitude/Speed)', 
    required: true 
  },
  { 
    id: 'b1_sub', section: 'B', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: '主要原因是？', titleEn: 'Main reasons?',
    optionsZh: ['服务态度', '上菜速度', '缺乏主动服务', '沟通不顺畅', '其他（请说明）'],
    optionsEn: ['Attitude', 'Speed', 'Not proactive', 'Communication', 'Other'],
    visibleIf: { triggerQuestionId: 'b1', operator: '<=', value: 7 }
  },

  // Section C: 用餐环境
  { 
    id: 'c1', section: 'C', type: QuestionType.RATING, 
    titleZh: '环境满意度（空间 / 空气 / 舒适度）', titleEn: 'Environment (Space/Air/Comfort)', 
    required: true 
  },
  { 
    id: 'c1_sub', section: 'C', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: '您希望改善哪方面？', titleEn: 'Areas for improvement?',
    optionsZh: ['空气流通', '烟味较大', '座位空间不足', '桌椅舒适度', '噪音', '灯光', '清洁度', '其他（请说明）'],
    optionsEn: ['Ventilation', 'Smoke', 'Space', 'Comfort', 'Noise', 'Lighting', 'Cleanliness', 'Other'],
    visibleIf: { triggerQuestionId: 'c1', operator: '<=', value: 7 }
  },

  // Section D: 整体评价
  { 
    id: 'd1', section: 'D', type: QuestionType.RATING, 
    titleZh: '本次整体用餐体验您给多少分？', titleEn: 'Overall Dining Experience Score', 
    required: true 
  },
  { 
    id: 'd1_sub', section: 'D', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: '什么最能提升您的整体体验？', titleEn: 'What would improve your experience most?',
    optionsZh: ['增加蔬菜品类', '增加肉类选择', '增加海鲜品种', '增加汤底选择', '优化分量 / 定价', '改善服务态度', '提升出餐效率', '改善空气 / 通风', '其他（请说明）'],
    optionsEn: ['More Veg', 'More Meat', 'More Seafood', 'More Soup Bases', 'Portion/Price', 'Service', 'Speed', 'Ventilation', 'Other'],
    // Logic: Show if D1 <= 8
    visibleIf: { triggerQuestionId: 'd1', operator: '<=', value: 8 },
    required: false
  },

  // Section E: 尾声
  { 
    id: 'e1', section: 'E', type: QuestionType.TEXT, 
    titleZh: '1、本次用餐您最喜欢的菜品是：', titleEn: '1. Your favorite dish today:', 
    required: false 
  },
  { 
    id: 'e2', section: 'E', type: QuestionType.TEXT, 
    titleZh: '2、若您还有想跟我们说的，我们都很愿意听。', titleEn: '2. Any other feedback?', 
    required: false 
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  restaurantName: '无界餐饮',
  adminPassword: '568568', // Updated default password
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046771.png',
  backgroundUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
};

export const StorageService = {
  getQuestions: (): Question[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return stored ? JSON.parse(stored) : DEFAULT_QUESTIONS;
  },

  saveQuestions: (questions: Question[]) => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  getSettings: (): AppSettings => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getResponses: (): SurveyResponse[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    return stored ? JSON.parse(stored) : [];
  },

  addResponse: (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const responses = StorageService.getResponses();
    const newResponse: SurveyResponse = {
      ...response,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    responses.push(newResponse);
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  },
  
  resetData: () => {
      localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.RESPONSES);
      window.location.reload();
  },

  exportToCSV: () => {
    const responses = StorageService.getResponses();
    const questions = StorageService.getQuestions();
    
    if (responses.length === 0) return null;

    // Headers
    const headers = ['ID', 'Date', 'Time', 'Language', ...questions.map(q => q.titleZh)];
    
    // Rows
    const rows = responses.map(r => {
        const date = new Date(r.timestamp);
        const rowData = [
            r.id,
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            r.language,
            ...questions.map(q => {
                const ans = r.answers[q.id];
                if (Array.isArray(ans)) return ans.join('; ');
                return ans ?? '';
            })
        ];
        return rowData.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    return csvContent;
  }
};