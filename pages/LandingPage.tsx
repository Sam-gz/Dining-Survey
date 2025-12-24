
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { AppSettings } from '../types';
import { Utensils } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const s = await DataService.getSettings();
      setSettings(s);
    };
    loadData();
  }, []);

  const handleStart = (lang: 'zh' | 'en') => {
    navigate(`/survey?lang=${lang}`);
  };

  if (!settings) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${settings.backgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-lg bg-white/95 rounded-3xl shadow-2xl overflow-hidden p-8 text-center animate-fade-in-up border border-white/20">
        
        {/* Adjusted Logo Container to exactly 400x200px (responsive max-width) */}
        <div className="mx-auto w-full max-w-[400px] h-[200px] bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-8 shadow-inner overflow-hidden relative group">
           {settings.logoUrl ? (
             <img 
              src={settings.logoUrl} 
              alt="Restaurant Logo" 
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
             />
           ) : (
             <div className="flex flex-col items-center gap-2 text-gray-300">
               <Utensils size={48} />
               <span className="text-xs font-bold uppercase tracking-widest">Logo Placeholder</span>
             </div>
           )}
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{settings.restaurantName}</h1>
          <p className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-4 py-1 rounded-full uppercase tracking-widest">
            Satisfaction Survey
          </p>
        </div>

        <div className="space-y-4 max-w-xs mx-auto">
          <button
            onClick={() => handleStart('zh')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30"
          >
            <span>开始评价 (中文)</span>
          </button>
          
          <button
            onClick={() => handleStart('en')}
            className="w-full py-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl font-black text-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span>Start Survey (EN)</span>
          </button>
        </div>

        <div className="mt-10 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
           © {new Date().getFullYear()} {settings.restaurantName}
        </div>
      </div>
      
      <div className="absolute bottom-6 right-6 z-20">
        <button 
            onClick={() => navigate('/admin')} 
            className="text-white/20 hover:text-white/80 transition-all text-xs font-bold uppercase tracking-widest"
        >
            Admin Access
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
