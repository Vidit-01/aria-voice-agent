import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  getProfile,
  getPreAnalysis,
  getResumeUrl,
  type ProfileResponse,
  type AnalyzeResponse,
} from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AppSidebar from "@/components/AppSidebar";
import {
  User,
  FileText,
  Edit2,
  GraduationCap,
  BarChart,
  Lightbulb,
  CheckCircle2,
  Target,
  Wallet,
  Timer,
  Plane,
  MapPin,
} from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  "UK": "🇬🇧", "United Kingdom": "🇬🇧",
  "Ireland": "🇮🇪",
  "UAE": "🇦🇪",
  "Germany": "🇩🇪",
  "France": "🇫🇷",
  "Netherlands": "🇳🇱",
  "Canada": "🇨🇦",
  "USA": "🇺🇸", "United States": "🇺🇸",
  "Australia": "🇦🇺",
  "Switzerland": "🇨🇭",
  "Sweden": "🇸🇪",
  "Denmark": "🇩🇰",
  "New Zealand": "🇳🇿",
  "Belgium": "🇧🇪",
  "Italy": "🇮🇹",
  "Spain": "🇪🇸",
  "Portugal": "🇵🇹",
  "Singapore": "🇸🇬",
  "Japan": "🇯🇵",
};

function countryFlag(name: string) {
  return COUNTRY_FLAGS[name] ?? "🌍";
}

function val(v: string | number | null | undefined, fallback = "—"): string {
  if (v === null || v === undefined || v === "") return fallback;
  return String(v);
}

function formatUsd(usd: number | null | undefined): string {
  if (!usd) return "—";
  return `$${(usd / 1000).toFixed(0)}K`;
}

function scoreBar(score: number | null | undefined, max: number): number {
  if (!score) return 0;
  return Math.min(100, Math.round((score / max) * 100));
}

// ── circular progress ────────────────────────────────────────────────────────

const CircularProgress = ({ value }: { value: number }) => {
  const SIZE   = 116;
  const SW     = 9;                        // stroke width
  const R      = (SIZE - SW) / 2;          // 53.5
  const CIRC   = 2 * Math.PI * R;
  const offset = CIRC - (value / 100) * CIRC;
  const cx     = SIZE / 2;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg
        width={SIZE} height={SIZE}
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="circGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="#E2E8F0" strokeWidth={SW} />
        {/* Arc */}
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="url(#circGrad)"
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      {/* Centre text */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", lineHeight: 1 }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
          {value}%
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>
          Complete
        </div>
      </div>
    </div>
  );
};

// ── skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
);

// ── main component ────────────────────────────────────────────────────────────

const Profile = () => {
  useDocumentTitle("Student Profile");
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      getProfile(user.user_id),
      getPreAnalysis(user.user_id),
    ]).then(([p, a]) => {
      if (p.status === "fulfilled") setProfile(p.value);
      if (a.status === "fulfilled") setAnalysis(a.value);
      setLoading(false);
    });
  }, [user]);

  // Fetch signed resume URL only once we know there is one
  useEffect(() => {
    if (!user || !profile?.resume_url) return;
    getResumeUrl(user.user_id)
      .then((r) => setResumeUrl(r.signed_url))
      .catch(() => setResumeUrl(null));
  }, [user, profile?.resume_url]);

  const completeness = analysis?.pre_analysis.profile_completeness_score ?? 0;
  const avatarSeed = encodeURIComponent(profile?.full_name ?? user?.full_name ?? "User");
  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${avatarSeed}`;

  const edu = profile?.current_education;
  const ts = profile?.test_scores;
  const budget = profile?.budget;
  const timeline = profile?.timeline;

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
      {/* Main Content — padded to sit below both fixed navbar and respect sidebar */}
      <main className="ml-0 flex-1 px-8 pb-12 pt-24 md:ml-[260px]">
        {/* Shared sidebar: fixed aside (desktop) + mobile overlay + mobile trigger */}
        <AppSidebar />
        <div className="max-w-6xl mx-auto md:mx-0">

          {/* User Info Header Card */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100/50 bg-white px-8 py-6 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-amber-100 border-4 border-white shadow-md">
                <img src={avatarUrl} alt={profile?.full_name ?? "User"} className="h-full w-full object-cover" />
              </div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{profile?.full_name ?? user?.full_name ?? "—"}</h2>
                  <p className="text-sm text-slate-600 mt-1">Aspiring International Student</p>
                  {profile?.target_countries && profile.target_countries.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[0.8rem] font-medium text-slate-500">
                        Targeting: {profile.target_countries.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {loading ? <Skeleton className="h-28 w-28 rounded-full" /> : <CircularProgress value={completeness} />}
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Personal Information */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <User className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Personal Information</h3>
                  </div>
                  <Link to="/register" className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </div>
                {loading ? (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Full Name</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(profile?.full_name)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Email Address</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900 break-all">{val(profile?.email ?? user?.email)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(profile?.phone)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Age</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{profile?.age ? `${profile.age} yrs` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Preferred Language</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900 capitalize">{val(profile?.preferred_language)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Visa Rejection</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">
                        {profile?.previous_visa_rejection === true ? "Yes" : profile?.previous_visa_rejection === false ? "No" : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Preferences */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Target className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Target Preferences</h3>
                  </div>
                  <Link to="/register" className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-4"><Skeleton className="h-8" /><Skeleton className="h-6" /><Skeleton className="h-8" /></div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Target Countries</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {profile?.target_countries?.length ? profile.target_countries.map((c) => (
                          <span key={c} className="flex items-center gap-1 rounded-md bg-[#F0F5FD] border border-[#DDEBFC] px-2.5 py-1 font-semibold text-[#2B77D2] text-xs">
                            {countryFlag(c)} {c}
                          </span>
                        )) : <span className="text-sm text-slate-400">—</span>}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Target Course</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(profile?.target_course)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Target Universities</p>
                      <div className="flex flex-wrap gap-2">
                        {profile?.target_universities?.length ? profile.target_universities.map((u) => (
                          <div key={u} className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 shadow-sm">
                            <span className="text-[0.75rem] font-medium text-slate-700">{u}</span>
                          </div>
                        )) : <span className="text-sm text-slate-400">—</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Application Timeline */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Timer className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Application Timeline</h3>
                  </div>
                </div>
                {loading ? <Skeleton className="h-24" /> : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Target Intake</p>
                        <p className="text-sm font-semibold text-slate-900">{val(timeline?.preferred_intake)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Months Left</p>
                        <p className="text-sm font-bold text-[#2B77D2]">
                          {timeline?.months_to_start != null ? `${timeline.months_to_start} Months` : "—"}
                        </p>
                      </div>
                    </div>
                    {timeline?.months_to_start != null && (
                      <div className="mb-5">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                          <span>Preparation</span><span>Deadline</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
                          <div className="h-full bg-gradient-to-r from-sky-400 to-[#2B77D2]"
                            style={{ width: `${Math.min(100, Math.max(5, 100 - (timeline.months_to_start / 18) * 100))}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="rounded-lg bg-[#FAF0A8]/30 px-3.5 py-3 mt-2 border border-[#FAF0A8]/50">
                      <p className="flex items-start gap-2 text-xs font-medium text-amber-800 leading-snug">
                        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                        "Applying early increases admission chances and secures better housing options."
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Documents */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Documents</h3>
                  </div>
                </div>
                {loading ? <Skeleton className="h-20" /> : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${profile?.resume_url ? "bg-green-50" : "border border-dashed border-slate-300 bg-slate-50"}`}>
                          <FileText className={`h-5 w-5 ${profile?.resume_url ? "text-green-500" : "text-slate-400"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Resume</p>
                          {profile?.resume_url ? (
                            resumeUrl ? (
                              <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-green-600 font-medium hover:underline">Uploaded · View Resume</a>
                            ) : (
                              <p className="text-xs text-green-600 font-medium">Uploaded</p>
                            )
                          ) : (
                            <p className="text-xs font-medium text-amber-600">Not uploaded</p>
                          )}
                        </div>
                      </div>
                      <Link to="/dashboard" className="text-slate-400 hover:text-[#2B77D2]"><Edit2 className="h-4 w-4" /></Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 border border-dashed border-slate-300 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Plane className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Transcripts</p>
                          <p className="text-xs font-medium text-amber-600">Pending Upload</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Academic Details */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Academic Details</h3>
                  </div>
                  <Link to="/register" className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </div>
                {loading ? (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Education Level</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900 capitalize">{val(edu?.level)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Field of Study</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(edu?.field)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Institution Name</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(edu?.institution)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">GPA / Percentage</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{edu?.gpa != null ? `${edu.gpa} GPA` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Graduation Year</p>
                      <p className="text-[0.9rem] font-semibold text-slate-900">{val(edu?.graduation_year)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Scores */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Test Scores</h3>
                  </div>
                  <Link to="/register" className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </div>
                {loading ? <div className="space-y-5"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div> : (
                  <div className="space-y-5">
                    {/* IELTS */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[0.8rem] font-semibold text-slate-700">IELTS</p>
                        {ts?.ielts != null
                          ? <p className="text-[0.8rem] font-bold text-slate-900">Band {ts.ielts}</p>
                          : <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Not taken</p>}
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div className="h-full bg-[#2B77D2]" style={{ width: `${scoreBar(ts?.ielts, 9)}%` }} />
                      </div>
                    </div>
                    {/* TOEFL */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[0.8rem] font-semibold text-slate-700">TOEFL</p>
                        {ts?.toefl != null
                          ? <p className="text-[0.8rem] font-bold text-slate-900">{ts.toefl}</p>
                          : <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Not taken</p>}
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div className="h-full bg-[#2B77D2]" style={{ width: `${scoreBar(ts?.toefl, 120)}%` }} />
                      </div>
                    </div>
                    {/* GRE + GMAT side by side */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[0.8rem] font-semibold text-slate-700">GRE</p>
                          {ts?.gre != null
                            ? <p className="text-[0.8rem] font-bold text-slate-900">{ts.gre}</p>
                            : <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Opt</p>}
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                          <div className="h-full bg-sky-500" style={{ width: `${scoreBar(ts?.gre, 340)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[0.8rem] font-semibold text-slate-700">GMAT</p>
                          {ts?.gmat != null
                            ? <p className="text-[0.8rem] font-bold text-slate-900">{ts.gmat}</p>
                            : <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Opt</p>}
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                          <div className="h-full bg-sky-500" style={{ width: `${scoreBar(ts?.gmat, 800)}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Duolingo (only show if present) */}
                    {ts?.duolingo != null && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[0.8rem] font-semibold text-slate-700">Duolingo</p>
                          <p className="text-[0.8rem] font-bold text-slate-900">{ts.duolingo}</p>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                          <div className="h-full bg-emerald-500" style={{ width: `${scoreBar(ts.duolingo, 160)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Budget & Funding */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Budget & Funding</h3>
                  </div>
                  <Link to="/register" className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </div>
                {loading ? <Skeleton className="h-24" /> : (
                  <>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Annual Tuition Budget</p>
                        <p className="text-sm font-bold text-slate-900">{formatUsd(budget?.annual_tuition_usd)} <span className="text-xs font-normal text-slate-500">/ year</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Scholarship Applied</p>
                        {budget?.scholarship_applied ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">No</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-1">Funding Source</p>
                        <p className="text-[0.9rem] font-semibold text-slate-900 capitalize">{val(budget?.funding_source)}</p>
                      </div>
                      {budget?.living_expenses_usd != null && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Living Expenses</p>
                          <p className="text-sm font-semibold text-slate-900">{formatUsd(budget.living_expenses_usd)} <span className="text-xs font-normal text-slate-500">/ year</span></p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-sky-50 px-3.5 py-3 mt-1 border border-sky-100">
                      <p className="flex items-start gap-2 text-xs font-medium text-sky-800 leading-snug">
                        <Lightbulb className="h-4 w-4 shrink-0 text-[#2B77D2]" />
                        "Securing a scholarship significantly improves your long-term budget flexibility."
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Visa Status */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                  <h3 className="font-bold text-slate-900">Visa Status</h3>
                </div>
                {loading ? <Skeleton className="h-8 w-40" /> : (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Previous Visa Rejection</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm border ${
                      profile?.previous_visa_rejection
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      {profile?.previous_visa_rejection === true ? "Yes — Rejection on record" : profile?.previous_visa_rejection === false ? "No — Clean history" : "Not specified"}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Analysis */}
              {(analysis || loading) && (
                <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">AI Pre-Analysis</h3>
                  </div>
                  {loading ? <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div> : (
                    analysis?.pre_analysis.initial_observations?.length ? (
                      <ul className="space-y-1.5">
                        {analysis.pre_analysis.initial_observations.map((o) => (
                          <li key={o} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#2B77D2]" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-slate-400">No analysis available yet.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
