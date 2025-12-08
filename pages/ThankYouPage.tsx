import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
        <CheckCircle size={48} strokeWidth={3} />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Thank You! / 感谢您的参与
      </h1>
      
      <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
        Your feedback helps us improve. We look forward to serving you again soon.
        <br/><br/>
        您的反馈对我们非常重要，期待再次为您服务。
      </p>

      <button 
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium transition-colors"
      >
        Return to Home / 返回首页
      </button>
    </div>
  );
};

export default ThankYouPage;