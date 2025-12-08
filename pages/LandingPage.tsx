import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { AppSettings } from '../types';
import { Utensils, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleStart = (lang: 'zh' | 'en') => {
    navigate(`/survey?lang=${lang}`);
  };

  if (!settings) return null;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${settings.backgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-fade-in-up">
        <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
           {/* Fallback to icon if logo fails to load or is placeholder */}
           <img 
            src={settings.logoUrl} 
            alt="Logo" 
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('flex');
            }}
           />
           <Utensils className="w-10 h-10 text-indigo-600 hidden" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{settings.restaurantName}</h1>
        <p className="text-gray-500 mb-8">Please select your language / 请选择语言</p>

        <div className="space-y-4">
          <button
            onClick={() => handleStart('zh')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/30"
          >
            <span>简体中文</span>
          </button>
          
          <button
            onClick={() => handleStart('en')}
            className="w-full py-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl font-medium text-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <span>English</span>
          </button>
        </div>

        <div className="mt-8 text-xs text-gray-400">
           Customer Satisfaction Survey
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20">
        <button 
            onClick={() => navigate('/admin')} 
            className="text-white/30 hover:text-white/80 transition-colors text-xs"
        >
            Admin
        </button>
      </div>
    </div>
  );
};

export default LandingPage;