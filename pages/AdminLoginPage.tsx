import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Lock } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = StorageService.getSettings();
    if (password === settings.adminPassword) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3">
                <Lock size={32} />
            </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Access</h2>
        <p className="text-center text-gray-500 mb-8">Enter your master password</p>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              placeholder="Password"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
          >
            Login
          </button>
        </form>
        
        <button 
            onClick={() => navigate('/')} 
            className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600"
        >
            ← Back to Survey
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;