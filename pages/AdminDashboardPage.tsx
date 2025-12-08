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
    MessageSquare, 
    BarChart3, 
    Edit,
    Save,
    Sparkles
} from 'lucide-react';

type Tab = 'overview' | 'responses' | 'settings' | 'editor';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
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

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider">NB ADMIN</h1>
          <p className="text-xs text-slate-400 mt-1">Satisfaction Survey</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('responses')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'responses' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <BarChart3 size={20} />
            <span>Responses</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('editor')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Edit size={20} />
            <span>Question Editor</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
             <LogOut size={18} />
             <span>Logout</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
            {activeTab === 'responses' && (
                <button 
                    onClick={downloadCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            )}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-sm font-medium uppercase mb-2">Total Responses</div>
                        <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-sm font-medium uppercase mb-2">Today</div>
                        <div className="text-4xl font-bold text-indigo-600">{stats.today}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-sm font-medium uppercase mb-2">This Week</div>
                        <div className="text-4xl font-bold text-indigo-600">{stats.week}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-sm font-medium uppercase mb-2">This Month</div>
                        <div className="text-4xl font-bold text-indigo-600">{stats.month}</div>
                    </div>
                </div>

                {/* AI Analysis Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="text-amber-500" />
                            AI Feedback Analysis
                        </h3>
                        <button 
                            onClick={runAnalysis}
                            disabled={analyzing}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                        >
                            {analyzing ? 'Analyzing...' : 'Generate New Report'}
                        </button>
                    </div>

                    {!analysis && !analyzing && (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            Click 'Generate' to analyze open-ended feedback and sentiment using Gemini.
                        </div>
                    )}
                    
                    {analysis && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-800 uppercase mb-2">Executive Summary</h4>
                                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Sentiment Score</h4>
                                    <div className={`text-2xl font-bold capitalize ${
                                        analysis.sentiment === 'positive' ? 'text-green-600' : 
                                        analysis.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                        {analysis.sentiment}
                                    </div>
                                </div>
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Bad Experience Factors (Word Cloud)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.tags.map((tag, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                                style={{ fontSize: `${Math.max(0.8, tag.value / 3)}rem`, opacity: 0.7 + (tag.value/20) }}
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
                    <table className="w-full text-left text-sm text-gray-600">
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
            <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
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
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
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
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm">
                    Warning: Editing the JSON structure directly can break the survey. Ensure IDs are unique and logic references exist.
                </div>
                <textarea 
                    className="flex-1 w-full p-4 font-mono text-sm bg-slate-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    value={questionsJson}
                    onChange={(e) => setQuestionsJson(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                     <button 
                        onClick={handleSaveQuestions}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
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