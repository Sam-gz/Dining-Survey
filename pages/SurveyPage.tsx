
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Question, QuestionType, Language, AppSettings, QuestionLogic } from '../types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const lang = (searchParams.get('lang') as Language) || 'zh';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const s = await DataService.getSettings();
      const q = DataService.getQuestions();
      setSettings(s);
      setQuestions(q);
      
      const initial: Record<string, any> = {};
      q.forEach(qu => { if (qu.type === QuestionType.RATING) initial[qu.id] = 9; });
      setAnswers(initial);
    };
    loadData();
  }, []);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const sections = useMemo(() => Array.from(new Set(questions.map(q => q.section))).sort(), [questions]);
  const currentSection = sections[currentSectionIndex];
  const currentSectionQuestions = questions.filter(q => q.section === currentSection);

  const submitSurvey = async () => {
    await DataService.addResponse({ answers, language: lang });
    navigate('/thank-you');
  };

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
        setCurrentSectionIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else submitSurvey();
  };

  const isVisible = (q: Question) => {
    if (!q.visibleIf) return true;
    const check = (l: QuestionLogic) => {
       const val = answers[l.triggerQuestionId] || 9;
       if (l.operator === '<=') return Number(val) <= Number(l.value);
       if (l.operator === '==') return val == l.value;
       return false;
    };
    return Array.isArray(q.visibleIf) ? q.visibleIf.some(check) : check(q.visibleIf);
  };

  if (!settings || !questions.length) return <div className="p-10 text-center">Loading Server Data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="sticky top-0 bg-white/95 border-b p-4 flex items-center justify-between z-30">
        <button onClick={() => currentSectionIndex > 0 ? setCurrentSectionIndex(i => i-1) : navigate('/')} className="p-1 text-gray-500"><ChevronLeft size={28} /></button>
        <div className="text-xl font-black text-indigo-700 uppercase tracking-tighter">Evaluation</div>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 pb-32">
        <div className={`space-y-4 ${animating ? 'animate-pulse' : ''}`}>
          {currentSectionQuestions.map(q => isVisible(q) && (
            <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-4">{lang === 'zh' ? q.titleZh : q.titleEn}</h3>
               {q.type === QuestionType.RATING && (
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-indigo-600 mb-2">{answers[q.id] || 9}</span>
                    <input type="range" min="0" max="10" value={answers[q.id] || 9} onChange={e => handleAnswer(q.id, e.target.value)} className="w-full" />
                 </div>
               )}
               {q.type === QuestionType.SINGLE_CHOICE && q.optionsZh && (
                 <div className="space-y-2">
                   {q.optionsZh.map((o, idx) => (
                     <button key={idx} onClick={() => handleAnswer(q.id, o)} className={`w-full p-4 rounded-2xl border text-left font-bold transition-all ${answers[q.id] === o ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-gray-100'}`}>
                        {lang === 'zh' ? o : (q.optionsEn?.[idx] || o)}
                     </button>
                   ))}
                 </div>
               )}
               {q.type === QuestionType.TEXT && (
                 <textarea onChange={e => handleAnswer(q.id, e.target.value)} value={answers[q.id] || ''} className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 outline-none" />
               )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t">
         <button onClick={handleNext} className="w-full max-w-md mx-auto py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
            {currentSectionIndex === sections.length - 1 ? '提交问卷 Submit' : '下一页 Next'} <ChevronRight size={20} />
         </button>
      </div>
    </div>
  );
};

export default SurveyPage;
