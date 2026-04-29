import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroImage from "../assets/hero.png";
import logo from "../assets/logo.jpeg";

const colors = {
  DEFAULT: "#4169E1",
  dark: "#314fb3",
  light: "#6687eb",
  darker: "#243a8a",
  gold: "#f5c842",
};

const features = [
  {
    title: "Academic Life",
    desc: "Access course schedules, grades, and essential academic resources seamlessly.",
  },
  {
    title: "Campus Facilities",
    desc: "Book study rooms, advanced sports arenas, and dedicated event spaces.",
  },
  {
    title: "Student Community",
    desc: "Connect with peers, join diverse campus clubs, and attend local events.",
  },
  {
    title: "Digital Library",
    desc: "Explore millions of global research papers, curated journals, and books.",
  },
];

export default function CampusPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const styleRef = useRef(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.6); }
      }
    `;
    document.head.appendChild(styleEl);
    styleRef.current = styleEl;
    return () => document.head.removeChild(styleEl);
  }, []);

  return (
    <div className="font-['DM_Sans',sans-serif] h-screen w-full overflow-hidden flex flex-col bg-slate-50">
      {/* Admin Setup Notice Bar */}
      <div className="bg-amber-500 py-1.5 px-4 text-center">
        <p className="text-[10px] font-bold text-amber-950 uppercase tracking-widest">
          Initial Setup: First admin must be assigned manually in DB to enable dashboard management
        </p>
      </div>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md border border-slate-100">
            <img src={logo} alt="Facility Flow" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-black tracking-tight leading-tight font-['Playfair_Display',serif] uppercase">
            <span style={{ color: '#243a8a' }}>Facility </span>
            <span style={{ color: '#6687eb' }}>Flow</span>
          </h2>
        </div>
        <button
          onClick={() => navigate(user ? "/dashboard" : "/login")}
          className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          {user ? "Go to Dashboard" : "Sign In"}
        </button>
      </header>

      {/* Hero */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden flex items-center"
        style={{
          background: `linear-gradient(135deg, ${colors.darker} 0%, ${colors.DEFAULT} 55%, ${colors.light} 100%)`,
        }}
      >
        {/* Radial overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 90% at 60% 40%, rgba(255,255,255,0.07) 0%, transparent 70%)`,
          }}
        />

        {/* Pulsing accent dots */}
        <div className="absolute top-12 right-[38%] w-2 h-2 rounded-full bg-yellow-400/70 animate-[pulse_2.2s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-[20%] w-2 h-2 rounded-full bg-yellow-400/50 animate-[pulse_2.8s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-16 right-[42%] w-1.5 h-1.5 rounded-full bg-white/50 animate-[pulse_3s_ease-in-out_infinite_1s]" />

        {/* Layout*/}
        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center px-8 md:px-14 gap-8 lg:gap-0">

          {/* Left text */}
          <div className="flex-shrink-0 w-full lg:w-[380px] text-center lg:text-left">
            <div className="font-['Playfair_Display',serif] text-5xl md:text-6xl font-black text-white leading-none mb-2 tracking-[-2px]">
              FACILITY <span style={{ color: colors.gold }}>FLOW</span>
            </div>
            <div className="text-[11px] font-semibold text-white/55 tracking-[0.14em] uppercase mb-5">
              Smart Campus Hub
            </div>
            <p className="text-[15px] text-white/85 leading-relaxed mb-8 max-w-[360px] mx-auto lg:mx-0">
              Book facilities, report incidents, and manage campus resources — all in one{" "}
              <strong className="text-white font-semibold">intelligent platform</strong>{" "}
              built for a connected university experience.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2.5 bg-white/12 backdrop-blur-sm border border-white/35 text-white font-medium text-sm py-3 px-6 rounded-full transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 group mx-auto lg:mx-0"
            >
              Login to Portal
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center lg:justify-center min-w-0">
            <div
              className="relative animate-[float_4s_ease-in-out_infinite]"
              style={{ width: "min(580px, 90%)" }}
            >
              {/* Glow blob behind image */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 80% 70% at 50% 55%, rgba(100,130,255,0.35) 0%, transparent 70%)",
                  transform: "scale(1.15)",
                }}
              />
              <img
                src={heroImage}
                alt="University Campus"
                className="relative w-full h-auto object-contain drop-shadow-2xl"
                style={{ maxHeight: "620px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature strip  */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 flex-shrink-0"
        style={{ background: colors.darker }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="px-8 py-7 border-r border-white/10 last:border-r-0 hover:bg-white/5 transition-colors duration-200 cursor-default"
          >
            <div className="text-lg mb-3" style={{ color: colors.gold }}>★</div>
            <h4 className="text-[15px] font-bold text-white mb-2">{f.title}</h4>
            <p className="text-[13px] text-white/60 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}