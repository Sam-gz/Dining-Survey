
import { Question, QuestionType, AppSettings, SurveyResponse } from '../types';

const STORAGE_KEYS = {
  QUESTIONS: 'nb_questions',
  RESPONSES: 'nb_responses',
  SETTINGS: 'nb_settings',
};

// Default Initial Data based on the "Professional Version" prompt
const DEFAULT_QUESTIONS: Question[] = [
  // Section A: 后厨出品评价
  { 
    id: 'a1', section: 'A', type: QuestionType.RATING, 
    titleZh: '1. 菜品品质与口味满意度', titleEn: '1. Food Quality & Taste', 
    required: true 
  },
  { 
    id: 'a2', section: 'A', type: QuestionType.RATING, 
    titleZh: '2. 菜品份量合理性', titleEn: '2. Portion Size Suitability', 
    required: true 
  },
  { 
    id: 'a3', section: 'A', type: QuestionType.RATING, 
    titleZh: '3. 出餐效率满意度 (目标：15分钟内开始上餐)', titleEn: '3. Service Speed (Target: within 15 mins)', 
    required: true 
  },
  { 
    id: 'a_sub', section: 'A', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: 'A-1 主要不满意原因？', titleEn: 'A-1 Main reasons for dissatisfaction?',
    optionsZh: ['口味偏淡 / 偏重', '分量过少', '定价与份量不匹配', '上菜速度慢', '种类不足', '其他（请说明）'],
    optionsEn: ['Taste issues', 'Small portion', 'Price/Portion mismatch', 'Slow service', 'Not enough variety', 'Other'],
    visibleIf: [
      { triggerQuestionId: 'a1', operator: '<=', value: 8 },
      { triggerQuestionId: 'a2', operator: '<=', value: 8 },
      { triggerQuestionId: 'a3', operator: '<=', value: 8 }
    ],
    required: true
  },
  
  // Section B: 前厅服务评价
  { 
    id: 'b1', section: 'B', type: QuestionType.RATING, 
    titleZh: '4. 服务满意度 (态度/主动性/微笑服务)', titleEn: '4. Service Satisfaction (Attitude/Proactivity/Smile)', 
    required: true 
  },
  { 
    id: 'b_sub', section: 'B', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: 'B-1 主要原因？', titleEn: 'B-1 Main reasons?',
    optionsZh: ['主动服务不足', '微笑服务缺失', '沟通不畅', '上菜流程协调差', '其他（请说明）'],
    optionsEn: ['Not proactive', 'Lack of smile', 'Poor communication', 'Poor coordination', 'Other'],
    visibleIf: { triggerQuestionId: 'b1', operator: '<=', value: 8 },
    required: true
  },
  { 
    id: 'c1', section: 'B', type: QuestionType.RATING, 
    titleZh: '5. 餐厅环境满意度 (卫生状况/舒适度)', titleEn: '5. Environment Satisfaction (Cleanliness/Comfort)', 
    required: true 
  },
  { 
    id: 'c_sub', section: 'B', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: 'B-2 希望改善哪方面？', titleEn: 'B-2 Areas for environment improvement?',
    optionsZh: ['清洁卫生', '桌椅舒适度', '座位空间', '噪音', '灯光', '其他（请说明）'],
    optionsEn: ['Cleanliness', 'Comfort', 'Space', 'Noise', 'Lighting', 'Other'],
    visibleIf: { triggerQuestionId: 'c1', operator: '<=', value: 8 },
    required: true
  },

  // Section C: 整体用餐评价
  { 
    id: 'd1', section: 'C', type: QuestionType.RATING, 
    titleZh: '6. 本次整体体验打分', titleEn: '6. Overall Dining Experience Score', 
    required: true 
  },
  { 
    id: 'd_sub', section: 'C', type: QuestionType.MULTIPLE_CHOICE, 
    titleZh: 'C-1 何种改善最能提升整体体验？', titleEn: 'C-1 What would improve experience most?',
    optionsZh: ['增添菜品种类 (蔬菜/肉类/海鲜)', '优化汤底选择', '提升出餐效率', '优化份量或定价', '改善服务态度或主动性', '优化卫生与舒适度', '其他（请说明）'],
    optionsEn: ['More variety', 'Better soup bases', 'Improve speed', 'Price/Portion optimization', 'Better service', 'Better hygiene/comfort', 'Other'],
    visibleIf: { triggerQuestionId: 'd1', operator: '<=', value: 8 },
    required: true
  },

  // Section D: 来店渠道来源 (New Part 4)
  {
    id: 'channel_source', section: 'D', type: QuestionType.SINGLE_CHOICE,
    titleZh: '请问您是通过什么方式了解到我们门店的？', 
    titleEn: 'How did you hear about us?',
    optionsZh: ['户外广告（如门头、海报、灯箱等）', '新媒体平台（如 小红书 / Facebook / Instagram / Tiktok等）', '朋友推荐 / 口碑介绍', '商场逛街时看到', '其他方式（请说明）'],
    optionsEn: ['Outdoor Ads', 'Social Media', 'Referral/Word of mouth', 'Walk-in', 'Other'],
    required: true
  },

  // Section E: 开放反馈 (Original Part 4 shifted to Part 5)
  { 
    id: 'e1', section: 'E', type: QuestionType.TEXT, 
    titleZh: '7. 本次用餐您最喜欢的菜品是？', titleEn: '7. Your favorite dish today?', 
    required: false 
  },
  { 
    id: 'e2', section: 'E', type: QuestionType.TEXT, 
    titleZh: '8. 有什么想对我们说的？(期待您的建议)', titleEn: '8. Any other suggestions?', 
    required: false 
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  restaurantName: '无界餐饮',
  adminPassword: '568568',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046771.png', // Placeholder to be replaced by user upload
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

    const headers = ['ID', 'Date', 'Time', 'Language', ...questions.map(q => q.titleZh), 'Other Field Answers'];
    
    const rows = responses.map(r => {
        const date = new Date(r.timestamp);
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
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            r.language,
            ...questionAnswers,
            ''
        ];
        return rowData.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    return csvContent;
  }
};
