import React, { useEffect, useRef } from 'react';
import { LogIn, ShieldCheck, Globe, Zap } from 'lucide-react';
import CONFIG from '../config';

const colors = {
  DEFAULT: "#4169E1",
  dark: "#314fb3",
  light: "#6687eb",
  darker: "#243a8a",
  gold: "#f5c842",
};

const Login = () => {
    const styleRef = useRef(null);

    useEffect(() => {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.2); }
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `;
        document.head.appendChild(styleEl);
        styleRef.current = styleEl;
        return () => document.head.removeChild(styleEl);
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = `${CONFIG.AUTH_BASE_URL}/oauth2/authorization/google`;
    };

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-['DM_Sans',sans-serif]"
            style={{
                background: `linear-gradient(135deg, ${colors.darker} 0%, ${colors.DEFAULT} 50%, ${colors.light} 100%)`,
                backgroundSize: '400% 400%',
                animation: 'gradient-shift 15s ease infinite'
            }}
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-[pulse-slow_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[150px] animate-[pulse-slow_10s_ease-in-out_infinite_1s]" />
            
            {/* Floating particles */}
            <div className="absolute top-20 right-[20%] w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-40 left-[15%] w-3 h-3 rounded-full bg-gold/40 animate-bounce" style={{ animationDuration: '4s' }} />
            <div className="absolute top-1/2 left-10 w-2 h-2 rounded-full bg-white/20 animate-pulse" />

            <div className="w-full max-w-xl p-6 relative z-10 animate-fade-in flex flex-col items-center">
                
                {/* Branding - Matching Home Page style */}
                <div className="text-center mb-10 group">
                    <div className="font-['Playfair_Display',serif] text-5xl md:text-6xl font-black text-white leading-none mb-2 tracking-[-2px] drop-shadow-lg">
                        CAM<span style={{ color: colors.gold }}>PUS</span>
                    </div>
                    <div className="text-[11px] font-bold text-white/60 tracking-[0.3em] uppercase mb-8">
                        University Operations Portal
                    </div>
                </div>

                {/* Glassmorphic Login Card */}
                <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-500 hover:shadow-[0_48px_80px_-12px_rgba(0,0,0,0.4)] hover:border-white/30">
                    <div className="p-10 md:p-14">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                            <p className="text-white/60 font-medium">Access your campus dashboard securely.</p>
                        </div>

                        <div className="space-y-6">
                            <button 
                                onClick={handleGoogleLogin} 
                                className="w-full h-16 flex items-center justify-center gap-4 bg-white text-slate-900 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl group"
                            >
                                <img 
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                    alt="Google" 
                                    className="w-7 h-7 group-hover:rotate-[360deg] transition-transform duration-700"
                                />
                                Sign in with Google
                            </button>

                            <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Institutional Access</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all cursor-default">
                                    <ShieldCheck size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-center">Secure</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all cursor-default">
                                    <Globe size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-center">Global</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all cursor-default">
                                    <Zap size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-center">Instant</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="bg-white/5 p-6 border-t border-white/10 flex items-center justify-center gap-4">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                         <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Systems Operational • Node-22</span>
                    </div>
                </div>

                {/* Admin Setup Notice */}
                <div className="mt-8 w-full max-w-md p-5 rounded-3xl bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-center animate-fade-in shadow-xl">
                    <p className="text-[11px] font-bold text-amber-200/90 leading-relaxed uppercase tracking-wider">
                        <span className="text-amber-400">Important:</span> The first admin user must have their role manually changed in the database. Once set, that admin will be able to manage the application and change roles for other users.
                    </p>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-4">
                    <span className="hover:text-white/60 transition-colors cursor-pointer">Privacy Policy</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="hover:text-white/60 transition-colors cursor-pointer">Terms of Service</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="hover:text-white/60 transition-colors cursor-pointer">Help Center</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
