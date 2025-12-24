
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { analyzeFeedback } from '../services/gemini';
import { SurveyResponse, Question, AppSettings, TagCloudItem } from '../types';
import { 
    LayoutDashboard, 
    Settings, 
    Download, 
    LogOut, 
    BarChart3, 
    Edit,
    Save,
    Sparkles,
    Menu,
    X,
    Upload,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    Info,
    Server,
    Globe,
    Calendar,
    Filter
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
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analysis, setAnalysis] = useState<{ summary: string; sentiment: string; tags: TagCloudItem[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [questionsJson, setQuestionsJson] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const s = await DataService.getSettings();
      const r = DataService.getResponses();
      const q = DataService.getQuestions();
      setSettings(s);
      setResponses(r.sort((a, b) => b.timestamp - a.timestamp));
      setQuestions(q);
      setQuestionsJson(JSON.stringify(q, null, 2));
    };
    loadData();
  }, []);

  const handleLogout = () => navigate('/admin');

  const handleSaveSettings = async () => {
    if (settings) {
      setIsSaving(true);
      const success = await DataService.saveSettings(settings);
      setIsSaving(false);
      if (success) {
        alert('配置已成功更新！');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result as string;
        const serverPath = await DataService.uploadFile(base64String, type);
        if (type === 'logo') setSettings({...settings, logoUrl: serverPath});
        else setSettings({...settings, backgroundUrl: serverPath});
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuestions = () => {
    try {
      const parsed = JSON.parse(questionsJson);
      DataService.saveQuestions(parsed);
      setQuestions(parsed);
      alert('问卷结构已更新！');
    } catch (e) {
      alert('JSON格式错误');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeFeedback(responses, questions);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const downloadCSV = () => {
    const csv = DataService.exportToCSV(startDate, endDate);
    if (!csv) return alert("所选范围内无数据可导出");
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey_export_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
    link.click();
  };

  const getStats = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    return {
      total: responses.length,
      today: responses.filter(r => r.timestamp >= todayStart).length,
      week: responses.filter(r => r.timestamp >= weekStart).length,
      month: responses.filter(r => r.timestamp >= monthStart).length,
    };
  };

  const stats = getStats();
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleAccordion = (id: string) => setOpenAccordion(openAccordion === id ? null : id);

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* MOBILE TOP NAV */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 sticky top-0 shadow-md">
          <div className="font-bold tracking-wider flex items-center gap-2">
              <Server size={18} className="text-indigo-400" />
              <span>管理后台</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block text-center">
          <div className="w-24 h-12 mx-auto bg-white/5 rounded-xl flex items-center justify-center mb-3 overflow-hidden border border-white/10">
             {settings.logoUrl ? <img src={settings.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" /> : <ImageIcon size={20} className="text-slate-600" />}
          </div>
          <h1 className="text-xs font-black tracking-widest truncate px-2 uppercase text-indigo-400">{settings.restaurantName}</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
              { id: 'overview', icon: <LayoutDashboard size={18} />, label: '系统概览 Overview' },
              { id: 'responses', icon: <BarChart3 size={18} />, label: '记录与导出 Data' },
              { id: 'settings', icon: <Settings size={18} />, label: '应用设置 Settings' },
              { id: 'editor', icon: <Edit size={18} />, label: '结构管理 Editor' }
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as Tab); closeSidebar(); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-bold ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
                {item.icon}
                <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-500 hover:text-red-400 transition-colors w-full px-4 py-2 text-xs font-bold uppercase tracking-wider">
             <LogOut size={16} />
             <span>退出系统 Logout</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{activeTab}</h2>
              </div>
           </div>
           <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time Sync Active</span>
           </div>
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">今日新增 Today</div>
                        <div className="text-4xl font-black text-indigo-600">{stats.today}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">本周新增 Week</div>
                        <div className="text-4xl font-black text-gray-900">{stats.week}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">本月统计 Month</div>
                        <div className="text-4xl font-black text-gray-900">{stats.month}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">累计总数 Total</div>
                        <div className="text-4xl font-black text-gray-900">{stats.total}</div>
                    </div>
                </div>

                {/* AI Analysis & Word Cloud Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="text-xl font-black flex items-center gap-2 text-gray-800">
                            <Sparkles className="text-amber-500" />
                            AI 评价词云分析
                        </h3>
                        <button 
                            onClick={runAnalysis}
                            disabled={analyzing}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                            {analyzing ? '分析中...' : '生成智能报告'}
                        </button>
                    </div>

                    {!analysis && !analyzing ? (
                        <div className="text-center py-20 text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                            点击按钮开始 AI 深度分析
                        </div>
                    ) : analysis ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                <h4 className="text-[10px] font-black text-indigo-800 uppercase mb-3 tracking-widest">核心洞察 Summary</h4>
                                <p className="text-gray-800 text-lg leading-relaxed font-medium">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">问题词云 Word Cloud</h4>
                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        {analysis.tags.map((tag, idx) => (
                                            <span 
                                                key={idx} 
                                                style={{ fontSize: `${Math.max(12, 12 + (tag.value / 4))}px`, opacity: 0.6 + (tag.value / 250) }}
                                                className="px-4 py-2 bg-white rounded-2xl border border-slate-200 text-slate-800 font-black shadow-sm transition-transform hover:scale-110 cursor-default"
                                            >
                                                {tag.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">总体情感 Sentiment</h4>
                                    <div className={`text-4xl font-black capitalize mb-2 ${analysis.sentiment === 'positive' ? 'text-green-500' : analysis.sentiment === 'negative' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {analysis.sentiment === 'positive' ? '满意' : analysis.sentiment === 'negative' ? '待优化' : '中立'}
                                    </div>
                                    <p className="text-xs text-gray-400">基于最新反馈的 AI 情感引擎判定</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        )}

        {activeTab === 'responses' && (
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">开始日期 Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">结束日期 End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <button onClick={downloadCSV} className="w-full md:w-auto px-6 py-3.5 bg-green-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-600/20">
                        <Download size={18} /> 导出 CSV
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">时间 Time</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">品质 Quality</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">整体 Overall</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest">渠道 Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {responses.map((r) => (
                                    <tr key={r.id} className="hover:bg-indigo-50/20">
                                        <td className="p-4 text-xs font-medium">{new Date(r.timestamp).toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded-lg font-black text-xs ${r.answers['a1'] <= 8 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{r.answers['a1'] ?? '-'}</span></td>
                                        <td className="p-4 font-black text-indigo-600">{r.answers['d1'] ?? '-'}</td>
                                        <td className="p-4 text-xs font-medium text-gray-500">{r.answers['channel_source'] || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleAccordion('basic')} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Info size={20} /></div>
                            <div>
                                <h3 className="font-black text-gray-800">基本配置</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Settings</p>
                            </div>
                        </div>
                        {openAccordion === 'basic' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openAccordion === 'basic' && (
                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">餐厅名称</label>
                                <input type="text" value={settings.restaurantName} onChange={e => setSettings({...settings, restaurantName: e.target.value})} className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">管理密码</label>
                                <input type="text" value={settings.adminPassword} onChange={e => setSettings({...settings, adminPassword: e.target.value})} className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleAccordion('assets')} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ImageIcon size={20} /></div>
                            <div>
                                <h3 className="font-black text-gray-800">媒体资源</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Assets</p>
                            </div>
                        </div>
                        {openAccordion === 'assets' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openAccordion === 'assets' && (
                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-600 uppercase">Logo (400x200)</label>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-[320px] h-[160px] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group relative cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                        {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Upload className="text-gray-200" size={32} />}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">更换</div>
                                        <input type="file" className="hidden" ref={logoInputRef} accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-8 border-t border-gray-200">
                                <label className="text-xs font-black text-gray-600 uppercase">背景 (1920x1080)</label>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-[320px] h-[180px] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner group relative cursor-pointer" onClick={() => bgInputRef.current?.click()}>
                                        {settings.backgroundUrl ? <img src={settings.backgroundUrl} className="w-full h-full object-cover" alt="BG" /> : <Upload className="text-gray-200" size={32} />}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">更换</div>
                                        <input type="file" className="hidden" ref={bgInputRef} accept="image/*" onChange={e => handleFileUpload(e, 'background')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-8 pb-12">
                    <button onClick={handleSaveSettings} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 flex items-center justify-center space-x-3 shadow-2xl transition-all active:scale-[0.98] text-xl disabled:opacity-50">
                        {isSaving ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={24} />}
                        <span>保存全域设置 Sync Server</span>
                    </button>
                </div>
            </div>
        )}
        
        {activeTab === 'editor' && (
            <div className="flex flex-col h-[calc(100vh-280px)]">
                <textarea className="flex-1 w-full p-6 font-mono text-xs bg-slate-900 text-indigo-300 border-none rounded-3xl outline-none resize-none shadow-inner" value={questionsJson} onChange={e => setQuestionsJson(e.target.value)} />
                <button onClick={handleSaveQuestions} className="mt-4 w-full py-4 bg-gray-900 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                    <Save size={18} />
                    <span>同步 JSON 到服务器</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
