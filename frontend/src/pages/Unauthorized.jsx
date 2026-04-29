import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-8 text-center space-y-6 font-sans">
            <div className="relative group">
                <div className="w-24 h-24 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110 duration-500">
                    <ShieldAlert size={48} strokeWidth={2.5} />
                </div>
                <div className="absolute -inset-4 bg-rose-200/20 rounded-full blur-2xl animate-pulse -z-10" />
            </div>

            <div className="space-y-3 animate-fade-in">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Access Denied</h1>
                <p className="max-w-md text-slate-500 font-medium leading-relaxed">
                    You do not have the required security clearances to access this campus module. 
                    Your attempt has been logged for security audit.
                </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="btn btn-secondary px-6 h-12 gap-3 hover:bg-slate-100"
                >
                    <ArrowLeft size={18} /> GO BACK
                </button>
                <button 
                    onClick={() => navigate('/')} 
                    className="btn btn-primary px-6 h-12 gap-3"
                >
                    DASHBOARD
                </button>
            </div>

            <div className="mt-12 text-[10px] font-black text-rose-300 uppercase tracking-[0.25em]">
                SECURITY PROTOCOL • MODULE E
            </div>
        </div>
    );
};

export default Unauthorized;
