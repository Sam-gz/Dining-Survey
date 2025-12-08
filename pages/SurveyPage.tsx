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

  // Helper to handle the "Other" text input
  const handleOtherText = (questionId: string, text: string) => {
      setAnswers(prev => ({ ...prev, [`${questionId}_other`]: text }));
  };

  const sections = useMemo(() => {
      const s = new Set(questions.map(q => q.section));
      return Array.from(s);
  }, [questions]);

  const currentSection = sections[currentSectionIndex];

  const checkCondition = (logic: QuestionLogic): boolean => {
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
        return question.visibleIf.some(cond => checkCondition(cond));
    } else {
        return checkCondition(question.visibleIf);
    }
  };

  const currentSectionQuestions = useMemo(() => {
      return questions.filter(q => q.section === currentSection);
  }, [questions, currentSection]);

  const validateAndNext = () => {
      const missingQuestions: string[] = [];
      
      currentSectionQuestions.forEach(q => {
          if (isVisible(q) && q.required) {
              const val = answers[q.id];
              // Check if empty
              if (val === undefined || val === null || val === '') {
                  missingQuestions.push(lang === 'zh' ? q.titleZh : q.titleEn);
              } 
              else if (Array.isArray(val) && val.length === 0) {
                  missingQuestions.push(lang === 'zh' ? q.titleZh : q.titleEn);
              }
          }
      });

      if (missingQuestions.length > 0) {
          alert(lang === 'zh' 
              ? `请完成以下必填项:\n${missingQuestions.join('\n')}` 
              : `Please complete the following:\n${missingQuestions.join('\n')}`
          );
          return;
      }

      handleNext();
  };

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

  const progress = useMemo(() => {
    if (!sections.length) return 0;
    return ((currentSectionIndex + 1) / sections.length) * 100;
  }, [currentSectionIndex, sections.length]);

  if (!questions.length || !settings) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header - Optimized for mobile visibility */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm border-b border-gray-100 transition-all">
         <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
                <button 
                    onClick={handleBack} 
                    className="p-1 -ml-1 text-gray-500 hover:text-indigo-600 rounded-full transition-colors"
                >
                    <ChevronLeft size={28} />
                </button>
                <div className="flex flex-col items-center">
                    {/* Enlarged Title */}
                    <div className="text-xl font-extrabold text-indigo-700 tracking-wide">
                        {lang === 'zh' ? '满意度调查' : 'Satisfaction Survey'}
                    </div>
                </div>
                <div className="w-7"></div>
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

      {/* Main Content Area - Reduced Padding for Mobile */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 pb-28 relative">
         
         <div className={`flex-1 flex flex-col space-y-4 ${animating ? 'animate-fade-in-up' : ''}`}>
             
             {/* Section Header */}
             <div className="flex items-center justify-between px-1">
                 <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide border border-indigo-100 shadow-sm">
                     {lang === 'zh' ? '第' : 'Part'} {currentSection} {lang === 'zh' ? '部分' : ''}
                 </span>
                 {currentSection === 'E' && (
                     <span className="text-xs font-medium text-amber-600 animate-pulse bg-amber-50 px-2 py-0.5 rounded-md">
                         {lang === 'zh' ? '已经到尾声啦！' : 'Almost done!'}
                     </span>
                 )}
             </div>

             {/* Render Questions */}
             {currentSectionQuestions.map((q) => {
                 if (!isVisible(q)) return null;
                 
                 const title = lang === 'zh' ? q.titleZh : q.titleEn;
                 const options = lang === 'zh' ? q.optionsZh : q.optionsEn;

                 return (
                     <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                         {/* Question Title - More Compact */}
                         <h2 className="text-lg font-bold text-gray-800 mb-3 leading-tight">
                             {title}
                             {!q.required && <span className="text-gray-400 text-xs font-normal ml-1">({lang === 'zh' ? '选填' : 'Optional'})</span>}
                         </h2>

                         {/* Input Area */}
                         <div>
                             {/* RATING */}
                             {q.type === QuestionType.RATING && (
                                 <div className="py-1">
                                     {/* Score Display - Compact */}
                                     <div className="flex items-end justify-center mb-4">
                                         <span className="text-4xl font-black text-indigo-600 leading-none">
                                             {answers[q.id] ?? 9}
                                         </span>
                                         <span className="text-gray-400 text-sm font-medium mb-1 ml-1">/ 10</span>
                                     </div>
                                     
                                     <div className="relative h-8 flex items-center mx-1">
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
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden relative z-10 box-border border border-gray-200">
                                            <div 
                                                className={`h-full transition-all duration-150 ${
                                                    (answers[q.id] ?? 9) <= 7 ? 'bg-amber-400' : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${(answers[q.id] ?? 9) * 10}%` }}
                                            />
                                        </div>
                                        {/* Custom Thumb Visual */}
                                        <div 
                                            className={`absolute h-6 w-6 bg-white border-4 rounded-full shadow-md z-10 pointer-events-none transition-all duration-150 transform -translate-x-1/2 ${
                                                (answers[q.id] ?? 9) <= 7 ? 'border-amber-400' : 'border-indigo-600'
                                            }`}
                                            style={{ left: `${(answers[q.id] ?? 9) * 10}%` }}
                                        />
                                     </div>

                                     <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-400 px-0.5">
                                         <span>0</span>
                                         <span>10</span>
                                     </div>
                                 </div>
                             )}

                             {/* MULTIPLE CHOICE */}
                             {q.type === QuestionType.MULTIPLE_CHOICE && options && (
                                 <div className="grid grid-cols-2 gap-2">
                                     {options.map((opt) => {
                                         const currentSelected = answers[q.id] || [];
                                         const isSelected = currentSelected.includes(opt);
                                         const isOther = opt.includes('其他') || opt.includes('Other');
                                         
                                         return (
                                            <React.Fragment key={opt}>
                                                <button
                                                    onClick={() => {
                                                        const newSelection = isSelected 
                                                            ? currentSelected.filter((i: string) => i !== opt)
                                                            : [...currentSelected, opt];
                                                        handleAnswer(q.id, newSelection);
                                                    }}
                                                    className={`p-2.5 rounded-lg border text-left transition-all duration-200 flex items-center justify-between group ${
                                                        isOther ? 'col-span-2' : 'col-span-1'
                                                    } ${
                                                        isSelected 
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-600' 
                                                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium">{opt}</span>
                                                    {isSelected && <div className="bg-indigo-600 text-white rounded-full p-0.5"><Check size={12} strokeWidth={3}/></div>}
                                                </button>
                                                
                                                {/* Text input for "Other" when selected */}
                                                {isOther && isSelected && (
                                                    <div className="col-span-2 mt-0 animate-fade-in">
                                                        <input
                                                            type="text"
                                                            value={answers[`${q.id}_other`] || ''}
                                                            onChange={(e) => handleOtherText(q.id, e.target.value)}
                                                            placeholder={lang === 'zh' ? '请具体说明...' : 'Please specify...'}
                                                            className="w-full p-2.5 text-sm border-b-2 border-indigo-200 bg-indigo-50/30 focus:border-indigo-600 outline-none rounded-none transition-colors"
                                                            autoFocus
                                                        />
                                                    </div>
                                                )}
                                            </React.Fragment>
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
                                    className="w-full h-24 p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm resize-none transition-all bg-white"
                                 />
                             )}
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
            <button
                onClick={validateAndNext}
                className="w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30"
            >
                <span>{currentSectionIndex === sections.length - 1 ? (lang === 'zh' ? '提交问卷' : 'Submit') : (lang === 'zh' ? '下一页' : 'Next')}</span>
                {currentSectionIndex !== sections.length - 1 && <ChevronRight size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;