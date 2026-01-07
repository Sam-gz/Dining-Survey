
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { analyzeFeedback } from '../services/gemini';
import { SurveyResponse, Question, AppSettings, TagCloudItem } from '../types';
import { 
    LayoutDashboard, Settings, Download, LogOut, BarChart3, Edit, Save, 
    Sparkles, Menu, X, Upload, Image as ImageIcon, ChevronDown, ChevronUp, 
    Info, Server, Globe, Download as DownloadIcon
} from 'lucide-react';

type Tab = 'overview' | 'responses' | 'settings' | 'editor';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>('basic');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analysis, setAnalysis] = useState<{ summary: string; sentiment: string; tags: TagCloudItem[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [questionsJson, setQuestionsJson] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await DataService.getSettings();
    const r = await DataService.getResponses();
    const q = DataService.getQuestions();
    setSettings(s);
    setResponses(r);
    setQuestions(q);
    setQuestionsJson(JSON.stringify(q, null, 2));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    
    try {
        setIsSaving(true);
        const serverUrl = await DataService.uploadFile(file);
        if (type === 'logo') setSettings({...settings, logoUrl: serverUrl});
        else setSettings({...settings, backgroundUrl: serverUrl});
    } catch (err) {
        alert('文件上传失败');
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (settings) {
      setIsSaving(true);
      const success = await DataService.saveSettings(settings);
      setIsSaving(false);
      if (success) alert('服务器配置已更新');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeFeedback(responses, questions);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const downloadCSV = async () => {
    const csv = await DataService.exportToCSV(startDate, endDate);
    if (!csv) return alert("范围内无数据");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${Date.now()}.csv`;
    link.click();
  };

  const stats = (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const week = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: responses.length,
      today: responses.filter(r => r.timestamp >= today).length,
      week: responses.filter(r => r.timestamp >= week).length,
    };
  })();

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar and TopNav code omitted for brevity but preserved in final XML ... */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 md:static md:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="p-6 text-center border-b border-slate-800">
          <div className="w-20 h-10 mx-auto bg-white/10 rounded mb-2 flex items-center justify-center overflow-hidden">
            {settings.logoUrl && <img src={settings.logoUrl} className="object-contain w-full h-full" />}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Admin Console</p>
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> 概览 Dashboard
          </button>
          <button onClick={() => setActiveTab('responses')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${activeTab === 'responses' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BarChart3 size={18} /> 数据 Records
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={18} /> 设置 Settings
          </button>
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-10">
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{activeTab}</h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               SQLITE SERVER CONNECTED
            </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">今日新增</p>
                  <p className="text-4xl font-black text-indigo-600">{stats.today}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">本周新增</p>
                  <p className="text-4xl font-black text-gray-900">{stats.week}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">累计总数</p>
                  <p className="text-4xl font-black text-gray-900">{stats.total}</p>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><Sparkles className="text-amber-500" /> AI 词云分析</h3>
                  <button onClick={runAnalysis} disabled={analyzing} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20">
                     {analyzing ? '分析中...' : '生成智能报告'}
                  </button>
               </div>
               {analysis && (
                 <div className="flex flex-wrap gap-3 justify-center">
                    {analysis.tags.map((t, i) => (
                      <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700" style={{ fontSize: `${12 + t.value/5}px` }}>{t.text}</span>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-4">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                   <label className="text-xs font-black text-gray-400 uppercase mb-2 block">餐厅名称</label>
                   <input value={settings.restaurantName} onChange={e => setSettings({...settings, restaurantName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-indigo-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase mb-2 block">LOGO (SQLITE STORAGE)</label>
                    <div className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                       {settings.logoUrl ? <img src={settings.logoUrl} className="object-contain w-full h-full" /> : <Upload className="text-gray-300" />}
                       <input type="file" ref={logoInputRef} onChange={e => handleFileUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase mb-2 block">背景图片</label>
                    <div className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                       {settings.backgroundUrl ? <img src={settings.backgroundUrl} className="object-cover w-full h-full" /> : <Upload className="text-gray-300" />}
                       <input type="file" ref={bgInputRef} onChange={e => handleFileUpload(e, 'background')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveSettings} disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20">
                   <Save size={20} /> 同步到 SQLite 服务器
                </button>
             </div>
          </div>
        )}

        {activeTab === 'responses' && (
           <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
                 <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">开始日期</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                 <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">结束日期</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                 <button onClick={downloadCSV} className="px-8 py-3.5 bg-green-600 text-white rounded-xl font-black flex items-center gap-2"><DownloadIcon size={18} /> 导出 CSV</button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 font-black text-gray-400 text-[10px] uppercase">
                       <tr><th className="p-4">时间</th><th className="p-4">分数</th><th className="p-4">来源</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {responses.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                             <td className="p-4 font-medium">{new Date(r.timestamp).toLocaleString()}</td>
                             <td className="p-4 font-black text-indigo-600">{r.answers['d1']}</td>
                             <td className="p-4 text-xs text-gray-500">{r.answers['channel_source']}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
