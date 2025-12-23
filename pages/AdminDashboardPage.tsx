
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
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
    Info
} from 'lucide-react';

type Tab = 'overview' | 'responses' | 'settings' | 'editor';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Accordion state for settings
  const [openAccordion, setOpenAccordion] = useState<string | null>('basic');
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analysis, setAnalysis] = useState<{ summary: string; sentiment: string; tags: TagCloudItem[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [questionsJson, setQuestionsJson] = useState('');

  useEffect(() => {
    const r = StorageService.getResponses();
    const q = StorageService.getQuestions();
    const s = StorageService.getSettings();
    setResponses(r.sort((a, b) => b.timestamp - a.timestamp));
    setQuestions(q);
    setSettings(s);
    setQuestionsJson(JSON.stringify(q, null, 2));
  }, []);

  const handleLogout = () => navigate('/admin');

  const handleSaveSettings = () => {
    if (settings) {
      StorageService.saveSettings(settings);
      alert('所有设置已保存成功！\nSettings saved successfully!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'logo') {
            setSettings({...settings, logoUrl: base64String});
        } else {
            setSettings({...settings, backgroundUrl: base64String});
        }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuestions = () => {
    try {
      const parsed = JSON.parse(questionsJson);
      StorageService.saveQuestions(parsed);
      setQuestions(parsed);
      alert('问题配置已更新！\nQuestions configuration updated!');
    } catch (e) {
      alert('JSON格式错误\nInvalid JSON format');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeFeedback(responses, questions);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const downloadCSV = () => {
    const csv = StorageService.exportToCSV();
    if (!csv) return alert("没有可导出的数据\nNo data to export");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const getStats = () => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const weekStart = new Date(new Date().setDate(now.getDate() - 7)).getTime();
    return {
      total: responses.length,
      today: responses.filter(r => r.timestamp >= todayStart).length,
      week: responses.filter(r => r.timestamp >= weekStart).length,
    };
  };

  const stats = getStats();
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleAccordion = (id: string) => {
      setOpenAccordion(openAccordion === id ? null : id);
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 sticky top-0 shadow-md">
          <div className="font-bold tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-[10px]">NB</div>
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
          <div className="w-16 h-8 mx-auto bg-white/10 rounded flex items-center justify-center mb-3 overflow-hidden">
             {settings.logoUrl ? (
                 <img src={settings.logoUrl} className="max-w-full max-h-full object-contain" alt="Admin Logo" />
             ) : (
                 <ImageIcon size={20} className="text-slate-500" />
             )}
          </div>
          <h1 className="text-lg font-bold tracking-wider truncate px-2">{settings.restaurantName}</h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Administrator</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
              { id: 'overview', icon: <LayoutDashboard size={20} />, label: '数据概览 Dashboard' },
              { id: 'responses', icon: <BarChart3 size={20} />, label: '评价记录 Responses' },
              { id: 'settings', icon: <Settings size={20} />, label: '应用设置 Settings' },
              { id: 'editor', icon: <Edit size={20} />, label: '问卷编辑器 Editor' }
          ].map((item) => (
            <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id as Tab); closeSidebar(); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
                {item.icon}
                <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors w-full px-4 py-2 text-sm">
             <LogOut size={18} />
             <span>退出登录 Logout</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 capitalize tracking-tight">{activeTab}</h2>
                <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1"></div>
            </div>
            {activeTab === 'responses' && (
                <button 
                    onClick={downloadCSV}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-green-600/20 text-sm font-bold w-full sm:w-auto justify-center"
                >
                    <Download size={18} />
                    <span>导出 CSV 数据 Export</span>
                </button>
            )}
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.01]">
                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2 tracking-widest">总计反馈 Total</div>
                        <div className="text-4xl font-black text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.01]">
                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2 tracking-widest text-indigo-500">今日新增 Today</div>
                        <div className="text-4xl font-black text-indigo-600">{stats.today}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.01]">
                        <div className="text-gray-400 text-[10px] font-bold uppercase mb-2 tracking-widest text-indigo-500">近7天 Week</div>
                        <div className="text-4xl font-black text-indigo-600">{stats.week}</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-black flex items-center gap-2 text-gray-800">
                            <Sparkles className="text-amber-500" />
                            AI 智能反馈分析
                        </h3>
                        <button 
                            onClick={runAnalysis}
                            disabled={analyzing}
                            className="px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold transition-all text-sm w-full sm:w-auto border border-indigo-100 flex items-center justify-center gap-2"
                        >
                            {analyzing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>分析中...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>生成报告 Report</span>
                                </>
                            )}
                        </button>
                    </div>

                    {!analysis && !analyzing && (
                        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-sm">
                            <p>点击上方按钮使用 Gemini AI 自动分析评价趋势</p>
                            <p className="mt-1 text-xs opacity-60">Analyze feedback trends with AI</p>
                        </div>
                    )}
                    
                    {analysis && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                <h4 className="text-[10px] font-black text-indigo-800 uppercase mb-3 tracking-widest">核心结论 Executive Summary</h4>
                                <p className="text-gray-800 text-base leading-relaxed font-medium">{analysis.summary}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">情感倾向 Sentiment</h4>
                                    <div className={`text-2xl font-black capitalize flex items-center gap-2 ${analysis.sentiment === 'positive' ? 'text-green-600' : analysis.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                                        <div className={`w-3 h-3 rounded-full ${analysis.sentiment === 'positive' ? 'bg-green-500' : analysis.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                        {analysis.sentiment}
                                    </div>
                                </div>
                                <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">待优化项 Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.tags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                                                {tag.text} <span className="text-indigo-600 ml-1">{tag.value}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'responses' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold uppercase text-[10px] tracking-widest">时间 Time</th>
                                <th className="p-4 font-bold uppercase text-[10px] tracking-widest">语言 Lang</th>
                                <th className="p-4 font-bold uppercase text-[10px] tracking-widest">出品满意度 Quality</th>
                                <th className="p-4 font-bold uppercase text-[10px] tracking-widest">整体评分 Overall</th>
                                <th className="p-4 font-bold uppercase text-[10px] tracking-widest">渠道 Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {responses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">暂无评价记录 No responses found.</td>
                                </tr>
                            ) : responses.map((r) => (
                                <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="p-4 text-xs font-medium">{new Date(r.timestamp).toLocaleString()}</td>
                                    <td className="p-4"><span className="px-2 py-0.5 bg-gray-100 rounded uppercase text-[10px] font-black">{r.language}</span></td>
                                    <td className="p-4"><span className={`px-2.5 py-1 rounded-lg font-black text-xs ${r.answers['a1'] <= 8 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{r.answers['a1'] ?? '-'}</span></td>
                                    <td className="p-4 font-black text-indigo-600">{r.answers['d1'] ?? '-'}</td>
                                    <td className="p-4 text-xs font-medium text-gray-500 truncate max-w-[120px]">{r.answers['channel_source'] || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-4">
                {/* Basic Info Accordion */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleAccordion('basic')}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Info size={20} /></div>
                            <div>
                                <h3 className="font-black text-gray-800">基本信息</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Basic Information</p>
                            </div>
                        </div>
                        {openAccordion === 'basic' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>
                    {openAccordion === 'basic' && (
                        <div className="p-5 border-t border-gray-50 bg-gray-50/30 space-y-5 animate-fade-in">
                            <div>
                                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">餐厅名称 / Restaurant Name</label>
                                <input 
                                    type="text" 
                                    value={settings.restaurantName}
                                    onChange={(e) => setSettings({...settings, restaurantName: e.target.value})}
                                    className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="输入餐厅名称"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">管理员密码 / Admin Password</label>
                                <input 
                                    type="text" 
                                    value={settings.adminPassword}
                                    onChange={(e) => setSettings({...settings, adminPassword: e.target.value})}
                                    className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-mono"
                                    placeholder="管理后台访问密码"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Visual Assets Accordion */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleAccordion('assets')}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><ImageIcon size={20} /></div>
                            <div>
                                <h3 className="font-black text-gray-800">品牌视觉</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Branding & Assets</p>
                            </div>
                        </div>
                        {openAccordion === 'assets' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>
                    {openAccordion === 'assets' && (
                        <div className="p-5 border-t border-gray-50 bg-gray-50/30 space-y-6 animate-fade-in">
                            {/* Logo Upload Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Logo 图样 (400 × 200px)</label>
                                    <span className="text-[10px] text-gray-400 italic">建议分辨率: 400×200 像素，透明背景 PNG 效果最佳。</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-full sm:w-[200px] h-[100px] bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-inner group relative">
                                        {settings.logoUrl ? (
                                            <>
                                                <img src={settings.logoUrl} className="max-w-full max-h-full object-contain" alt="Current Logo" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="text-white" size={24} />
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="text-gray-200" size={32} />
                                        )}
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            ref={logoInputRef} 
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'logo')}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => logoInputRef.current?.click()}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                        >
                                            <Upload size={14} /> 上传图片 Upload
                                        </button>
                                        <p className="text-[10px] text-gray-400">点击左侧预览框也可上传</p>
                                    </div>
                                </div>
                            </div>

                            {/* Background Upload Section */}
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">背景图片 Background (16:9)</label>
                                    <span className="text-[10px] text-gray-400 italic">建议分辨率: 1920×1080 像素，JPG 格式。</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-full sm:w-[200px] h-[112px] bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-inner group relative">
                                        {settings.backgroundUrl ? (
                                            <>
                                                <img src={settings.backgroundUrl} className="w-full h-full object-cover" alt="Current BG" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="text-white" size={24} />
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="text-gray-200" size={32} />
                                        )}
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            ref={bgInputRef} 
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'background')}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => bgInputRef.current?.click()}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                        >
                                            <Upload size={14} /> 上传图片 Upload
                                        </button>
                                        <p className="text-[10px] text-gray-400">用于首页欢迎屏背景图</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Global Save Button - Floating for mobile or fixed bottom */}
                <div className="pt-8 pb-12">
                    <button 
                        onClick={handleSaveSettings}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] text-lg"
                    >
                        <Save size={20} />
                        <span>保存设置 Save All</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4 font-bold tracking-widest uppercase">
                        注意：修改后首页将立即生效
                    </p>
                </div>
            </div>
        )}

        {activeTab === 'editor' && (
            <div className="h-[calc(100vh-200px)] flex flex-col">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4 text-xs">
                    <span className="font-bold flex items-center gap-1 mb-1"><Info size={14}/> 高级设置 Warning:</span>
                    直接编辑 JSON 可能会破坏逻辑。请确保 ID 唯一且结构完整。
                </div>
                <textarea 
                    className="flex-1 w-full p-4 font-mono text-xs bg-slate-50 border border-gray-200 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                    value={questionsJson} 
                    onChange={(e) => setQuestionsJson(e.target.value)} 
                />
                <div className="mt-4">
                     <button 
                        onClick={handleSaveQuestions} 
                        className="w-full py-3.5 bg-gray-900 text-white font-black rounded-xl hover:bg-black flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]"
                     >
                        <Save size={18} />
                        <span>更新问卷结构 Update Schema</span>
                     </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
