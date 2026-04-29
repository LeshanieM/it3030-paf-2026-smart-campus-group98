import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Redirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      login(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
        <div className="absolute -inset-2 bg-primary/5 rounded-full blur-xl animate-pulse" />
      </div>
      
      <div className="space-y-2 animate-fade-in">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Authenticating...</h2>
        <p className="text-sm text-slate-400 font-medium">Validating your university identity records.</p>
      </div>

      <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { left: -40%; width: 30%; }
          50% { left: 40%; width: 60%; }
          100% { left: 110%; width: 30%; }
        }
      `}} />
    </div>
  );
};

export default Redirect;
