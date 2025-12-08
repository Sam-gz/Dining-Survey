import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
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
    const loadedQuestions = StorageService.getQuestions();
    setQuestions(loadedQuestions);
    setSettings(StorageService.getSettings());

    // Initialize default values for Ratings (9)
    const initialAnswers: Record<string, any> = {};
    loadedQuestions.forEach(q => {
        if (q.type === QuestionType.RATING) {
            initialAnswers[q.id] = 9;
        }
    });
    setAnswers(prev => ({ ...initialAnswers, ...prev }));
  }, []);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const sections = useMemo(() => {
      // Get unique sections in order
      const s = new Set(questions.map(q => q.section));
      return Array.from(s);
  }, [questions]);

  const currentSection = sections[currentSectionIndex];

  // Logic Check
  const checkCondition = (logic: QuestionLogic): boolean => {
    // Default to 9 if undefined for rating logic checks
    const rawValue = answers[logic.triggerQuestionId];
    const triggerValue = rawValue !== undefined ? rawValue : 9;

    switch (logic.operator) {
      case '<=': return Number(triggerValue) <= Number(logic.value);
      case '>=': return Number(triggerValue) >= Number(logic.value);
      case '==': return triggerValue == logic.value; // eslint-disable-line eqeqeq
      default: return false;
    }
  };

  const isVisible = (question: Question): boolean => {
    if (!question.visibleIf) return true;
    
    if (Array.isArray(question.visibleIf)) {
        // OR Logic: If any condition is true, show it
        return question.visibleIf.some(cond => checkCondition(cond));
    } else {
        // Single Condition
        return checkCondition(question.visibleIf);
    }
  };

  const currentSectionQuestions = useMemo(() => {
      return questions.filter(q => q.section === currentSection);
  }, [questions, currentSection]);

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
        setCurrentSectionIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        submitSurvey();
    }
  };

  const handleBack = () => {
      if (currentSectionIndex > 0) {
          setAnimating(true);
          setTimeout(() => setAnimating(false), 300);
          setCurrentSectionIndex(prev => prev - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          navigate('/');
      }
  };

  const submitSurvey = () => {
    StorageService.addResponse({
        answers,
        language: lang
    });
    navigate('/thank-you');
  };

  const isNextDisabled = useMemo(() => {
      // Check if any visible required question in current section is empty
      return currentSectionQuestions.some(q => {
          if (!isVisible(q)) return false;
          if (!q.required) return false;
          
          const val = answers[q.id];
          if (val === undefined || val === null || val === '') return true;
          if (Array.isArray(val) && val.length === 0) return true;
          return false;
      });
  }, [currentSectionQuestions, answers, isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = useMemo(() => {
    if (!sections.length) return 0;
    return ((currentSectionIndex + 1) / sections.length) * 100;
  }, [currentSectionIndex, sections.length]);

  if (!questions.length || !settings) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm border-b border-gray-100 transition-all">
         <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
                <button 
                    onClick={handleBack} 
                    className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                        {lang === 'zh' ? '满意度调查' : 'Satisfaction Survey'}
                    </div>
                </div>
                <div className="w-8"></div>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }} 
                />
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-6 pb-28 relative">
         
         <div className={`flex-1 flex flex-col space-y-8 ${animating ? 'animate-fade-in-up' : ''}`}>
             
             {/* Section Header */}
             <div className="flex items-center justify-between mb-2">
                 <span className="inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold tracking-wide border border-indigo-100 shadow-sm">
                     {lang === 'zh' ? '第' : 'Part'} {currentSection} {lang === 'zh' ? '部分' : ''}
                 </span>
                 {currentSection === 'E' && (
                     <span className="text-sm font-medium text-amber-500 animate-bounce-slow">
                         {lang === 'zh' ? '已经到尾声啦！' : 'Almost done!'}
                     </span>
                 )}
             </div>

             {/* Render Questions for Current Section */}
             {currentSectionQuestions.map((q) => {
                 if (!isVisible(q)) return null;
                 
                 const title = lang === 'zh' ? q.titleZh : q.titleEn;
                 const options = lang === 'zh' ? q.optionsZh : q.optionsEn;

                 return (
                     <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                         {/* Question Title */}
                         <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
                             {title}
                             {!q.required && <span className="text-gray-400 text-sm font-normal ml-2">({lang === 'zh' ? '选填' : 'Optional'})</span>}
                         </h2>

                         {/* Input Area */}
                         <div>
                             {/* RATING */}
                             {q.type === QuestionType.RATING && (
                                 <div className="py-2">
                                     <div className="flex items-end justify-center mb-8">
                                         <span className="text-5xl font-black text-indigo-600 leading-none">
                                             {answers[q.id] ?? 9}
                                         </span>
                                         <span className="text-gray-400 text-lg font-medium mb-1 ml-2">/ 10</span>
                                     </div>
                                     
                                     <div className="relative h-10 flex items-center mx-2">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="10" 
                                            step="1"
                                            value={answers[q.id] ?? 9}
                                            onChange={(e) => handleAnswer(q.id, parseInt(e.target.value))}
                                            className="w-full absolute z-20 opacity-0 h-full cursor-pointer"
                                        />
                                        {/* Custom Track */}
                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative z-10 box-border border border-gray-200">
                                            <div 
                                                className={`h-full transition-all duration-150 ${
                                                    (answers[q.id] ?? 9) <= 7 ? 'bg-amber-400' : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${(answers[q.id] ?? 9) * 10}%` }}
                                            />
                                        </div>
                                        {/* Custom Thumb Visual */}
                                        <div 
                                            className={`absolute h-7 w-7 bg-white border-4 rounded-full shadow-md z-10 pointer-events-none transition-all duration-150 transform -translate-x-1/2 ${
                                                (answers[q.id] ?? 9) <= 7 ? 'border-amber-400' : 'border-indigo-600'
                                            }`}
                                            style={{ left: `${(answers[q.id] ?? 9) * 10}%` }}
                                        />
                                     </div>

                                     <div className="flex justify-between mt-3 text-xs font-medium text-gray-400 px-1">
                                         <span>0</span>
                                         <span>10</span>
                                     </div>
                                 </div>
                             )}

                             {/* MULTIPLE CHOICE */}
                             {q.type === QuestionType.MULTIPLE_CHOICE && options && (
                                 <div className="grid grid-cols-2 gap-3">
                                     {options.map((opt) => {
                                         const currentSelected = answers[q.id] || [];
                                         const isSelected = currentSelected.includes(opt);
                                         const isOther = opt.includes('其他') || opt.includes('Other');
                                         
                                         return (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    const newSelection = isSelected 
                                                        ? currentSelected.filter((i: string) => i !== opt)
                                                        : [...currentSelected, opt];
                                                    handleAnswer(q.id, newSelection);
                                                }}
                                                className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${
                                                    isOther ? 'col-span-2' : 'col-span-1'
                                                } ${
                                                    isSelected 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-600' 
                                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="text-sm font-medium">{opt}</span>
                                                {isSelected && <div className="bg-indigo-600 text-white rounded-full p-0.5"><Check size={14} strokeWidth={3}/></div>}
                                            </button>
                                         );
                                     })}
                                 </div>
                             )}

                             {/* TEXT */}
                             {q.type === QuestionType.TEXT && (
                                 <textarea
                                    value={answers[q.id] ?? ''}
                                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    placeholder={lang === 'zh' ? '请输入...' : 'Please type here...'}
                                    className="w-full h-32 p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-base resize-none transition-all bg-white"
                                 />
                             )}
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto">
            <button
                onClick={handleNext}
                disabled={isNextDisabled}
                className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] shadow-lg ${
                    isNextDisabled 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'
                }`}
            >
                <span>{currentSectionIndex === sections.length - 1 ? (lang === 'zh' ? '提交问卷' : 'Submit') : (lang === 'zh' ? '下一页' : 'Next')}</span>
                {!isNextDisabled && currentSectionIndex !== sections.length - 1 && <ChevronRight size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;