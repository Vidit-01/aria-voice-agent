import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  getProfile,
  getPreAnalysis,
  createSession,
  getSession,
  getResumeUrl,
  uploadResume,
  waitForValidPreAnalysis,
  type ProfileResponse,
  type PreAnalysis,
  type SessionData,
} from "@/lib/api";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  LayoutDashboard,
  User,
  FileText,
  File,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Upload,
  Edit2,
  AlertCircle,
  Award,
  BookOpen,
  Headphones,
} from "lucide-react";

// Donut Chart Component
const DonutChart = ({ percentage }: { percentage: number }) => {
  const radius = 64; // Increased radius for hero card 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-[190px] w-[190px] items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
        <circle className="text-slate-100" strokeWidth="16" stroke="currentColor" fill="transparent" r={radius} cx="80" cy="80" />
        <circle 
          className="text-[#104886] transition-all duration-1000 ease-out" 
          strokeWidth="16" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
          stroke="currentColor" 
          fill="transparent" 
          r={radius} 
          cx="80" 
          cy="80" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Overall</span>
        <span className="text-4xl font-bold text-slate-900 leading-none">{percentage}%</span>
      </div>
    </div>
  );
};

// University Card Component (Stacked variant for narrow sidebar)
const UniCardStacked = ({ name, country, course, percent, logoColor }: any) => (
  <div className="flex flex-col gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all w-full">
    <div className="flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${logoColor} text-white font-bold text-lg shadow-sm`}>
        {name.substring(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[0.95rem] font-bold text-slate-900 leading-tight mb-1 truncate">{name}</h4>
        <div className="flex items-center gap-1.5 text-[0.8rem] text-slate-500 font-medium truncate">
          <span className="truncate">{country}</span>
          <span>•</span>
          <span className="truncate">{course}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="flex h-9 px-3 items-center justify-center rounded-lg border border-green-200 text-xs font-bold text-green-700 bg-green-50 shrink-0">
        {percent}% Match
      </div>
      <button className="flex-1 rounded-lg border border-[#104886] h-9 text-xs font-bold text-[#104886] hover:bg-[#104886] hover:text-white transition-colors">
        View Details
      </button>
    </div>
  </div>
);

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: User, label: "Profile", href: "/profile", active: false },
  { icon: FileText, label: "Applications", href: "#", active: false },
  { icon: Award, label: "Test Prep", href: "#", active: false },
  { icon: File, label: "Documents", href: "#", active: false },
  { icon: BookOpen, label: "Resources", href: "#", active: false },
];

// ---- Local session store helpers ----
// Since the API has no "list my sessions" endpoint for students, we keep track locally.

interface StoredSession {
  session_id: string;
  created_at: string;
  status: string;
  duration_seconds?: number | null;
  language_detected?: string;
}

interface UniversitySuggestion {
  name: string;
  country: string;
}

const EUROPE_UNIVERSITIES: UniversitySuggestion[] = [
  { name: "University of Amsterdam", country: "Netherlands" },
  { name: "TU Delft", country: "Netherlands" },
  { name: "KU Leuven", country: "Belgium" },
  { name: "University of Copenhagen", country: "Denmark" },
  { name: "LMU Munich", country: "Germany" },
  { name: "Heidelberg University", country: "Germany" },
  { name: "ETH Zurich", country: "Switzerland" },
  { name: "EPFL", country: "Switzerland" },
  { name: "Trinity College Dublin", country: "Ireland" },
  { name: "University College Dublin", country: "Ireland" },
  { name: "University of Edinburgh", country: "United Kingdom" },
  { name: "University of Manchester", country: "United Kingdom" },
  { name: "Sorbonne University", country: "France" },
  { name: "Sciences Po", country: "France" },
  { name: "University of Bologna", country: "Italy" },
  { name: "Sapienza University of Rome", country: "Italy" },
  { name: "University of Barcelona", country: "Spain" },
  { name: "Autonomous University of Madrid", country: "Spain" },
];

function pickRandomUniversities(targetCountries: string[] | undefined, count = 3): UniversitySuggestion[] {
  const normalizedTargets = (targetCountries ?? []).map((c) => c.trim().toLowerCase());
  const pool = normalizedTargets.length
    ? EUROPE_UNIVERSITIES.filter((u) => normalizedTargets.includes(u.country.toLowerCase()))
    : EUROPE_UNIVERSITIES;
  const base = pool.length > 0 ? pool : EUROPE_UNIVERSITIES;
  const selected: UniversitySuggestion[] = [];
  const used = new Set<number>();
  const max = Math.min(count, base.length);
  while (selected.length < max) {
    const idx = Math.floor(Math.random() * base.length);
    if (used.has(idx)) continue;
    used.add(idx);
    selected.push(base[idx]);
  }
  return selected;
}

function getStoredSessions(userId: string): StoredSession[] {
  try {
    return JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]") as StoredSession[];
  } catch {
    return [];
  }
}

function saveStoredSessions(userId: string, sessions: StoredSession[]): void {
  localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
}

function pushSession(userId: string, s: StoredSession): void {
  const existing = getStoredSessions(userId).filter((x) => x.session_id !== s.session_id);
  saveStoredSessions(userId, [s, ...existing]);
}

// ---- Classification badge ----

const classBadge = (c?: string) => {
  if (c === "hot") return "bg-red-100 text-red-700";
  if (c === "warm") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

// ---- Dashboard ----

const Dashboard = () => {
  useDocumentTitle("Student Dashboard");
  useDocumentTitle("Dashboard");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [analysis, setAnalysis] = useState<{ pre_analysis: PreAnalysis; generated_at: string } | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [suggestedUniversities, setSuggestedUniversities] = useState<UniversitySuggestion[]>([]);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    setSuggestedUniversities(pickRandomUniversities(undefined));
    try {
      const [p, a] = await Promise.allSettled([
        getProfile(user.user_id),
        getPreAnalysis(user.user_id),
      ]);
      if (p.status === "fulfilled") setProfile(p.value);
      if (a.status === "fulfilled") setAnalysis(a.value);
      if (p.status === "fulfilled") {
        setSuggestedUniversities(pickRandomUniversities(p.value.target_countries));
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const pollForAnalysis = useCallback(async () => {
    if (!user) return;
    setAnalysisLoading(true);
    try {
      const latest = await waitForValidPreAnalysis(user.user_id, {
        attempts: 25,
        intervalMs: 1500,
        requireFresh: true,
      });
      setAnalysis(latest);
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "AI analysis failed. Please retry.";
      setError(msg);
    } finally {
      setAnalysisLoading(false);
    }
  }, [user]);

  // Refresh stored sessions against the backend to pick up status changes
  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const stored = getStoredSessions(user.user_id);
    if (stored.length === 0) return;
    const updated = await Promise.all(
      stored.map(async (s) => {
        try {
          const live = await getSession(s.session_id);
          return {
            ...s,
            status: live.status,
            duration_seconds: live.duration_seconds,
            language_detected: live.language_detected,
          };
        } catch {
          return s;
        }
      })
    );
    saveStoredSessions(user.user_id, updated);
    setSessions(updated);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const stored = getStoredSessions(user.user_id);
    setSessions(stored);
    refreshSessions();
  }, [user, refreshSessions]);

  useEffect(() => {
    if (!profileLoading && profile && !analysis && !analysisLoading) {
      pollForAnalysis();
    }
  }, [profileLoading, profile, analysis, analysisLoading, pollForAnalysis]);

  const startSession = async () => {
    if (!user) return;
    setSessionStarting(true);
    setError("");
    try {
      const res = await createSession(user.user_id, profile?.preferred_language ?? "auto");
      // Persist so the session appears in the list
      pushSession(user.user_id, {
        session_id: res.session_id,
        created_at: res.created_at,
        status: "created",
      });
      navigate(`/session/${res.session_id}`, {
        state: { webrtc_config: res.webrtc_config },
      });
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Could not start session.";
      setError(msg);
    } finally {
      setSessionStarting(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    setResumeUploading(true);
    setError("");
    try {
      await uploadResume(user.user_id, file);
      await pollForAnalysis();
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Upload failed.";
      setError(msg);
    } finally {
      setResumeUploading(false);
    }
  };

  const viewResume = async () => {
    if (!user) return;
    try {
      const { signed_url } = await getResumeUrl(user.user_id);
      setResumeUrl(signed_url);
      window.open(signed_url, "_blank");
    } catch {
      setError("Could not fetch resume URL.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const hintColor = (hint?: string) => {
    if (hint === "hot") return "text-red-600";
    if (hint === "warm") return "text-amber-600";
    return "text-slate-500";
  };

  const completeness = analysis?.pre_analysis.profile_completeness_score ?? null;

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
      {/* Sidebar Content */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-[#F0F5FD] md:flex z-20">
        <div className="flex items-center gap-3 px-8 py-8">
          <Link to="/">
            <img src="/landing/fateh_logo.png" alt="Fateh" className="h-9 w-auto" />
          </Link>
        </div>
        
        <nav className="mt-4 flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  item.active 
                    ? "bg-[#DDEBFC] text-[#2B77D2] shadow-sm" 
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-[1.15rem] w-[1.15rem] ${item.active ? "text-[#2B77D2]" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 pb-8">
          <Link
            to="#"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/50 hover:text-slate-900"
          >
            <Headphones className="h-[1.15rem] w-[1.15rem] text-slate-500" />
            Support
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-0 flex-1 md:ml-64 relative min-w-0">
        
        {/* Top Header / Navigation Strip */}
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-[#FDFBF7]/90 backdrop-blur-md px-8 sticky top-0 z-30 w-full">
          <div className="flex items-center gap-8 h-full">
            <Link to="/dashboard" className="text-[0.9rem] font-bold text-[#104886] border-b-2 border-[#104886] h-full flex items-center pt-0.5">Dashboard</Link>
            <Link to="#" className="text-[0.9rem] font-bold text-slate-500 hover:text-slate-900 transition-colors h-full flex items-center">Applications</Link>
            <Link to="#" className="text-[0.9rem] font-bold text-slate-500 hover:text-slate-900 transition-colors h-full flex items-center">AI Counsellor</Link>
            <Link to="#" className="text-[0.9rem] font-bold text-slate-500 hover:text-slate-900 transition-colors h-full flex items-center">Documents</Link>
          </div>
          
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-[#104886] transition-colors">
               <FileText className="h-[1.15rem] w-[1.15rem]" />
            </button>
            <div className="relative">
              <button className="text-slate-400 hover:text-[#104886] transition-colors">
                <Bell className="h-[1.15rem] w-[1.15rem]" />
              </button>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold border-2 border-[#FDFBF7]">3</span>
            </div>
            
            <div className="flex h-9 w-9 overflow-hidden rounded-full shadow-sm ring-2 ring-white cursor-pointer ml-2 hover:opacity-90 transition-opacity">
              <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=Aditya" alt="Profile" className="h-full w-full object-cover bg-amber-50" />
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="max-w-[1440px] mx-auto p-8 pt-10">
          
          {/* ======================================================== */}
          {/* 🎯 TOP HERO SECTION (Refactored) */}
          {/* ======================================================== */}
          <div className="flex flex-col gap-6 mb-10">
            {/* Left Header */}
            <div>
              <p className="text-sm font-bold text-[#104886] mb-2 uppercase tracking-wider">Dashboard Overview</p>
              <h1 className="text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">Welcome back, Aditya Sharma</h1>
            </div>
            
            {/* KPI Stat Cards (Full Width Distribution) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
               <div className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[1rem] px-6 py-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                 <span className="text-[0.7rem] font-bold text-slate-400 mb-2 uppercase tracking-wider">Profile Completed</span>
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-3xl font-black text-[#104886] leading-none mt-1">78<span className="text-xl">%</span></span>
                 </div>
               </div>

               <div className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[1rem] px-6 py-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                 <span className="text-[0.7rem] font-bold text-slate-400 mb-2 uppercase tracking-wider">Profile Score</span>
                 <div className="flex items-baseline gap-1.5 mt-1">
                   <span className="text-3xl font-black text-green-600 leading-none">85</span><span className="text-sm font-bold text-slate-300">/100</span>
                 </div>
               </div>

               <div className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[1rem] px-6 py-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                 <span className="text-[0.7rem] font-bold text-slate-400 mb-2 uppercase tracking-wider">IELTS Score</span>
                 <span className="text-3xl font-black text-slate-900 leading-none mt-1">7.5</span>
               </div>

               <div className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[1rem] px-6 py-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                 <span className="text-[0.7rem] font-bold text-slate-400 mb-2 uppercase tracking-wider">GPA</span>
                 <span className="text-3xl font-black text-slate-900 leading-none mt-1">3.8</span>
               </div>
               
               <div className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[1rem] px-6 py-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                 <span className="text-[0.7rem] font-bold text-slate-400 mb-2 uppercase tracking-wider">Applications</span>
                 <span className="text-3xl font-black text-slate-900 leading-none mt-1">4</span>
               </div>
            </div>
          </div>


          {/* ======================================================== */}
          {/* 🎯 STRUCTURED 12-COLUMN GRID SYSTEM (Distribute 7/5 Split) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* ======= LEFT SIDE (Col Span 7) ======= */}
            <div className="xl:col-span-7 flex flex-col gap-8">
              
              {/* 🎯 ADMISSION CHANCES (HERO CARD) */}
              <div className="rounded-2xl bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-extrabold text-slate-900 mb-8 tracking-tight">Your Admission Chances</h3>
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
                  
                  {/* Left: Large Circular Graph */}
                  <div className="flex-shrink-0">
                     <DonutChart percentage={72} />
                  </div>
                  
                  {/* Right: Country-wise Progress Bars */}
                  <div className="flex-1 w-full space-y-7 px-4">
                     <div>
                       <div className="flex justify-between items-end mb-2">
                         <div className="flex items-center gap-2">
                           <span className="text-[1.05rem] font-bold text-slate-800">UK</span>
                         </div>
                         <span className="text-[1.1rem] font-extrabold text-slate-900">75%</span>
                       </div>
                       <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                         <div className="h-full bg-[#104886] rounded-full transition-all duration-1000 ease-out" style={{width: '75%'}}></div>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between items-end mb-2">
                         <div className="flex items-center gap-2">
                           <span className="text-[1.05rem] font-bold text-slate-800">Ireland</span>
                         </div>
                         <span className="text-[1.1rem] font-extrabold text-slate-900">68%</span>
                       </div>
                       <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                         <div className="h-full bg-[#E5882B] rounded-full transition-all duration-1000 ease-out delay-100" style={{width: '68%'}}></div>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between items-end mb-2">
                         <div className="flex items-center gap-2">
                           <span className="text-[1.05rem] font-bold text-slate-800">UAE</span>
                         </div>
                         <span className="text-[1.1rem] font-extrabold text-slate-900">60%</span>
                       </div>
                       <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                         <div className="h-full bg-slate-400 rounded-full transition-all duration-1000 ease-out delay-200" style={{width: '60%'}}></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* 🎯 PROFILE PROGRESS + TIMELINE (SAME ROW) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Profile Progress */}
                <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                   <h3 className="text-[1.15rem] font-extrabold text-slate-900 mb-6 tracking-tight">Profile Progress Tracker</h3>
                   <div className="space-y-5 flex-1">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 text-[0.85rem] font-bold text-slate-700">
                             <CheckCircle2 className="h-4 w-4 text-[#104886]" /> Personal Info
                          </span> 
                          <span className="text-[0.8rem] font-extrabold text-slate-900">95%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#104886] rounded-full delay-100 transition-all duration-1000" style={{width: '95%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 text-[0.85rem] font-bold text-slate-700">
                             <CheckCircle2 className="h-4 w-4 text-[#104886]" /> Academics
                          </span> 
                          <span className="text-[0.8rem] font-extrabold text-slate-900">90%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#104886] rounded-full delay-200 transition-all duration-1000" style={{width: '90%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 text-[0.85rem] font-bold text-slate-700">
                             <CheckCircle2 className="h-4 w-4 text-[#104886]" /> Documents
                          </span> 
                          <span className="text-[0.8rem] font-extrabold text-slate-900">60%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#104886] rounded-full delay-300 transition-all duration-1000" style={{width: '60%'}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 text-[0.85rem] font-bold text-slate-700">
                             <CheckCircle2 className="h-4 w-4 text-[#104886]" /> Test Scores
                          </span> 
                          <span className="text-[0.8rem] font-extrabold text-slate-900">85%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#104886] rounded-full delay-500 transition-all duration-1000" style={{width: '85%'}}></div></div>
                      </div>
                   </div>
                </div>

                {/* Your Timeline */}
                <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-[1.15rem] font-extrabold text-slate-900 mb-6 tracking-tight">Your Timeline</h3>
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <p className="text-[0.75rem] font-bold text-slate-400 mb-1 uppercase tracking-wider">Intact Target</p>
                          <p className="text-xl font-extrabold text-slate-900">Fall 2024</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-[#104886]">6 Months</p>
                          <p className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mt-1">Remaining Time</p>
                       </div>
                    </div>
                  </div>

                  <div className="relative mb-4">
                     <div className="flex justify-between text-xs font-bold text-slate-400 mb-3 px-1">
                        <span>Today</span>
                        <span>Deadline</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-visible relative flex items-center shadow-inner">
                        <div className="h-3 bg-gradient-to-r from-sky-400 to-[#104886] rounded-full transition-all duration-1000 ease-in-out" style={{width: '50%'}}></div>
                        
                        {/* Time Marker Pin */}
                        <div className="absolute h-[24px] w-[6px] bg-slate-800 rounded-full left-[50%] -translate-x-1/2 shadow-sm border border-white"></div>
                     </div>
                  </div>
                </div>

              </div>

              {/* 🎯 RECENT ACTIVITY (CLEAN TIMELINE STYLE) */}
              <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300">
                 <h3 className="text-[1.15rem] font-extrabold text-slate-900 mb-8 tracking-tight">Recent Activity</h3>
                 
                 <div className="relative pl-6 space-y-8 border-l-2 border-slate-100 ml-4 before:content-[''] before:absolute before:inset-y-0 before:-left-[2px] before:w-[2px] before:bg-gradient-to-b before:from-[#104886] before:to-transparent before:h-1/2">
                    
                    {/* Item 1 */}
                    <div className="relative">
                       <div className="absolute -left-[33px] top-0 h-[18px] w-[18px] rounded-full border-[4px] border-white bg-[#104886] shadow-sm"></div>
                       <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-bold text-slate-900">Profile Updated</p>
                       </div>
                       <p className="text-xs font-semibold text-slate-500">7 months ago • System</p>
                    </div>

                    {/* Item 2 */}
                    <div className="relative">
                       <div className="absolute -left-[33px] top-0 h-[18px] w-[18px] rounded-full border-[4px] border-white bg-slate-300 shadow-sm"></div>
                       <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-bold text-slate-900">Document Uploaded: LOR from Professor</p>
                       </div>
                       <p className="text-xs font-semibold text-slate-500">3 months ago • You</p>
                    </div>

                    {/* Item 3 */}
                    <div className="relative">
                       <div className="absolute -left-[33px] top-0 h-[18px] w-[18px] rounded-full border-[4px] border-white bg-slate-300 shadow-sm"></div>
                       <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-bold text-slate-900">Application Submitted to UCD</p>
                       </div>
                       <p className="text-xs font-semibold text-slate-500">2 months ago • You</p>
                    </div>

                 </div>
              </div>

              {/* 🎯 NEXT INTERVIEW + QUICK ACTIONS (Moved to Left Side to balance height) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Interview Status */}
                 <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-[1.15rem] font-extrabold text-slate-900 tracking-tight">Next Interview</h3>
                       <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-sky-700 border border-sky-100">Scheduled</span>
                    </div>
                    <div className="mt-4 mb-5 border-l-2 border-[#104886] pl-4">
                       <p className="text-[0.9rem] font-extrabold text-slate-900">February 15, 2024</p>
                       <p className="text-sm font-semibold text-slate-500">10:00 AM IST</p>
              {profileLoading ? (
                <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-100" />
              ) : analysisLoading ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-sky-700">Loading AI analysis...</p>
                  <p className="mt-1 text-xs text-slate-500">
                    We are waiting for Gemini to return the updated analysis.
                  </p>
                </div>
              ) : analysis ? (
                <div className="mt-4 space-y-4">
                  {/* Profile completeness bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Profile completeness</span>
                      <span>{completeness}%</span>
                    </div>
                    <button className="w-full rounded-xl bg-[#104886] px-4 py-3 text-sm font-bold text-white hover:bg-[#0c3666] transition-colors shadow-sm">
                       Start Interview
                    </button>
                 </div>

                 {/* Quick Actions */}
                 <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
                    <h3 className="text-[1.05rem] font-extrabold text-slate-900 mb-4 tracking-tight">Quick Actions</h3>
                    <div className="flex flex-col gap-2.5 flex-1 justify-center">
                       <button className="flex justify-between items-center w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-[0.8rem] font-bold text-slate-700 hover:border-[#104886] hover:text-[#104886] transition-all group">
                         Complete Profile
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                       </button>
                       <button className="flex justify-between items-center w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-[0.8rem] font-bold text-slate-700 hover:border-[#104886] hover:text-[#104886] transition-all group">
                         Upload Documents
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                       </button>
                       <button className="flex justify-between items-center w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-[0.8rem] font-bold text-slate-700 hover:border-[#104886] hover:text-[#104886] transition-all group">
                         Start AI Counsellor
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                       </button>
                    </div>
                 </div>
              </div>

            </div>


            {/* ======= RIGHT SIDE (Col Span 5) ======= */}
            <div className="xl:col-span-5 flex flex-col gap-8">
               
               {/* 🎯 RECOMMENDED UNIVERSITIES (FIXED CARD DESIGN) */}
               <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-[1.15rem] font-extrabold text-slate-900 mb-6 tracking-tight">Recommended Universities</h3>
                  <div className="flex flex-col gap-4">
                     <UniCardStacked name="University of Manchester" country="UK" course="MSc Science" percent="85" logoColor="bg-[#59267c]" />
                     <UniCardStacked name="Dublin City University" country="Ireland" course="BSc Computing" percent="81" logoColor="bg-[#00407a]" />
                     <UniCardStacked name="Unversity UAS" country="UK" course="MSc Engineering" percent="82" logoColor="bg-slate-700" />
                     <UniCardStacked name="Vlaile University" country="Ireland" course="Data Sci." percent="82" logoColor="bg-sky-700" />
                  </div>
               </div>

               {/* 🎯 AI INSIGHTS (CLEAN ALERT-STYLE CARDS) */}
               <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-[1.15rem] font-extrabold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                     <AlertCircle className="h-5 w-5 text-[#104886]" /> 
                     AI Insights
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    
                    {/* Positive Insight */}
                    <div className="flex items-start gap-4 rounded-xl bg-emerald-50/80 p-4 border border-emerald-100">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-emerald-500 flex justify-center items-center shrink-0 shadow-sm">
                         <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[0.85rem] font-extrabold text-emerald-900 mb-1 leading-tight">High Chances of Admission</h4>
                        <p className="text-[0.75rem] font-medium text-emerald-700/90 leading-snug">Your strong academic background and relevant internship dynamically improve match score.</p>
                      </div>
                    </div>

                    {/* Suggestion Insight */}
                    <div className="flex items-start gap-4 rounded-xl bg-amber-50/80 p-4 border border-amber-100">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-500 flex justify-center items-center shrink-0 shadow-sm">
                         <AlertTriangle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[0.85rem] font-extrabold text-amber-900 mb-1 leading-tight">SOP Optimization</h4>
                        <p className="text-[0.75rem] font-medium text-amber-700/90 leading-snug">Include a compelling Statement of Purpose highlighting specific research interests.</p>
                      </div>
                    </div>

                    {/* Warning Insight */}
                    <div className="flex items-start gap-4 rounded-xl bg-orange-50/80 p-4 border border-orange-100">
                       <div className="mt-0.5 h-6 w-6 rounded-full bg-orange-500 flex justify-center items-center shrink-0 shadow-sm">
                         <AlertTriangle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[0.85rem] font-extrabold text-orange-900 mb-1 leading-tight">Improve IELTS Scope</h4>
                        <p className="text-[0.75rem] font-medium text-orange-700/90 leading-snug">Improve IELTS Writing score by 0.5 to target top 10 UK universities comfortably.</p>
                      </div>
                    </div>

                    {/* Danger Insight */}
                    <div className="flex items-start gap-4 rounded-xl bg-rose-50/80 p-4 border border-rose-100">
                       <div className="mt-0.5 h-6 w-6 rounded-full bg-rose-600 flex justify-center items-center shrink-0 shadow-sm">
                         <AlertCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[0.85rem] font-extrabold text-rose-900 mb-1 leading-tight">Action Required</h4>
                        <p className="text-[0.75rem] font-medium text-rose-700/90 leading-snug">Upload transcript for final year to instantly unlock more accurate matches.</p>
                  </div>
                </div>
              ) : profile ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">No analysis yet.</p>
                  <button
                    onClick={pollForAnalysis}
                    className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    {analysisLoading ? "Loading AI analysis..." : "Run Analysis"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Complete your profile first.</p>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Europe Suggestions (Random 3)
                </p>
                <ul className="mt-2 space-y-1">
                  {suggestedUniversities.map((u) => (
                    <li key={`${u.name}-${u.country}`} className="text-sm text-slate-700">
                      {u.name} ({u.country})
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Sessions list */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">My Sessions</h2>
              {sessions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No sessions yet. Click <strong>Start AI Session</strong> above to begin.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <li key={s.session_id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(s.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {s.duration_seconds
                              ? `${Math.round(s.duration_seconds / 60)} min`
                              : "–"}
                            {s.language_detected ? ` · ${s.language_detected.toUpperCase()}` : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classBadge(undefined)} ${
                            s.status === "active"
                              ? "bg-green-100 text-green-700"
                              : s.status === "ended"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-sky-100 text-sky-600"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>

                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
