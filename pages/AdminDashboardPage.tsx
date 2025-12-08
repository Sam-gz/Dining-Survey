import React, { useState, useEffect } from 'react';
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
    X
} from 'lucide-react';

type Tab = 'overview' | 'responses' | 'settings' | 'editor';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // AI Analysis State
  const [analysis, setAnalysis] = useState<{ summary: string; sentiment: string; tags: TagCloudItem[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Editor State
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
      alert('Settings saved!');
    }
  };

  const handleSaveQuestions = () => {
    try {
      const parsed = JSON.parse(questionsJson);
      StorageService.saveQuestions(parsed);
      setQuestions(parsed);
      alert('Questions configuration updated!');
    } catch (e) {
      alert('Invalid JSON format');
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
    if (!csv) return alert("No data to export");
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const getStats = () => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).getTime();
    const monthStart = new Date(now.setDate(now.getDate() - 30)).getTime();

    return {
      total: responses.length,
      today: responses.filter(r => r.timestamp >= todayStart).length,
      week: responses.filter(r => r.timestamp >= weekStart).length,
      month: responses.filter(r => r.timestamp >= monthStart).length,
    };
  };

  const stats = getStats();

  const closeSidebar = () => setIsSidebarOpen(false);

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 sticky top-0">
          <div className="font-bold tracking-wider">NB ADMIN</div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
          />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-bold tracking-wider">NB ADMIN</h1>
          <p className="text-xs text-slate-400 mt-1">Satisfaction Survey</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('overview'); closeSidebar(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('responses'); closeSidebar(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'responses' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <BarChart3 size={20} />
            <span>Responses</span>
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); closeSidebar(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('editor'); closeSidebar(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Edit size={20} />
            <span>Question Editor</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
             <LogOut size={18} />
             <span>Logout</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
        
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
            {activeTab === 'responses' && (
                <button 
                    onClick={downloadCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm w-full sm:w-auto justify-center"
                >
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            )}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-medium uppercase mb-2">Total Responses</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-medium uppercase mb-2">Today</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.today}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-medium uppercase mb-2">This Week</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.week}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-medium uppercase mb-2">This Month</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.month}</div>
                    </div>
                </div>

                {/* AI Analysis Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            <Sparkles className="text-amber-500" />
                            AI Feedback Analysis
                        </h3>
                        <button 
                            onClick={runAnalysis}
                            disabled={analyzing}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors text-sm w-full sm:w-auto"
                        >
                            {analyzing ? 'Analyzing...' : 'Generate Report'}
                        </button>
                    </div>

                    {!analysis && !analyzing && (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                            Click 'Generate' to analyze open-ended feedback and sentiment.
                        </div>
                    )}
                    
                    {analysis && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2">Executive Summary</h4>
                                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 border border-gray-200 rounded-xl">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Sentiment Score</h4>
                                    <div className={`text-2xl font-bold capitalize ${
                                        analysis.sentiment === 'positive' ? 'text-green-600' : 
                                        analysis.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                        {analysis.sentiment}
                                    </div>
                                </div>
                                <div className="p-5 border border-gray-200 rounded-xl">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Bad Experience Factors</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.tags.map((tag, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                                style={{ fontSize: `${Math.max(0.75, tag.value / 4)}rem`, opacity: 0.7 + (tag.value/20) }}
                                            >
                                                {tag.text}
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

        {/* RESPONSES TAB */}
        {activeTab === 'responses' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold">Time</th>
                                <th className="p-4 font-semibold">Language</th>
                                <th className="p-4 font-semibold">A-1 Rating</th>
                                <th className="p-4 font-semibold">D-1 Rating</th>
                                <th className="p-4 font-semibold">Feedback Snippet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {responses.slice(0, 50).map((r) => (
                                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">{new Date(r.timestamp).toLocaleString()}</td>
                                    <td className="p-4 uppercase text-xs font-bold">{r.language}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded font-bold ${r.answers['a1'] <= 6 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {r.answers['a1'] ?? '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold">{r.answers['d1'] ?? '-'}</td>
                                    <td className="p-4 max-w-xs truncate text-gray-400 italic">
                                        {r.answers['e1'] || r.answers['e2'] || 'No text'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                        <input 
                            type="text" 
                            value={settings.restaurantName}
                            onChange={(e) => setSettings({...settings, restaurantName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
                        <input 
                            type="text" 
                            value={settings.adminPassword}
                            onChange={(e) => setSettings({...settings, adminPassword: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                        <input 
                            type="text" 
                            value={settings.logoUrl}
                            onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
                        <input 
                            type="text" 
                            value={settings.backgroundUrl}
                            onChange={(e) => setSettings({...settings, backgroundUrl: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={handleSaveSettings}
                            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                        >
                            <Save size={18} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'editor' && (
            <div className="h-[calc(100vh-140px)] flex flex-col">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-xs md:text-sm">
                    Warning: Editing JSON directly is advanced. Ensure ID uniqueness.
                </div>
                <textarea 
                    className="flex-1 w-full p-4 font-mono text-xs md:text-sm bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    value={questionsJson}
                    onChange={(e) => setQuestionsJson(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                     <button 
                        onClick={handleSaveQuestions}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                    >
                        <Save size={18} />
                        <span>Update Questions</span>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;