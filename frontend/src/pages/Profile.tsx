import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  LayoutDashboard,
  User,
  FileText,
  Award,
  File,
  BookOpen,
  Headphones,
  Search,
  Bell,
  Edit2,
  GraduationCap,
  BarChart,
  Lightbulb,
  CheckCircle2,
  Users,
  Target,
  Wallet,
  Timer,
  Plane,
  Link as LinkIcon,
  MapPin,
  Linkedin,
  Github,
  Globe
} from "lucide-react";

// Helper components for the circular progress
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 64 64">
        {/* Background Circle */}
        <circle className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
        {/* Progress Circle */}
        <circle className="text-[#2B77D2]" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-slate-900 leading-none">{value}%</span>
        <span className="text-[0.70rem] font-bold text-slate-500 uppercase leading-[1.2] mt-1 tracking-widest">Complete</span>
      </div>
    </div>
  );
};

// Mock data to replicate the exact image details
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: User, label: "Profile", href: "/profile", active: true },
  { icon: FileText, label: "Applications", href: "#", active: false },
  { icon: Award, label: "Test Prep", href: "#", active: false },
  { icon: File, label: "Documents", href: "#", active: false },
  { icon: BookOpen, label: "Resources", href: "#", active: false },
];

const Profile = () => {
  useDocumentTitle("Student Profile");

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
      {/* Sidebar Content */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-[#F0F5FD] md:flex">
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
      <main className="ml-0 flex-1 px-8 pb-12 pt-8 md:ml-64">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-[1.65rem] font-bold text-slate-900">Student Profile</h1>
          
          <div className="flex items-center gap-5">
            <button className="text-slate-500 hover:text-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative w-64 hidden lg:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="block w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#2B77D2] focus:outline-none focus:ring-2 focus:ring-[#2B77D2]/20"
              />
            </div>
            {/* Avatar block */}
            <div className="flex h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm cursor-pointer ml-2 bg-amber-100">
              <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=Aryan" alt="User Profile" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="max-w-6xl mx-auto md:mx-0">
          
          {/* Main User Info Header Card */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100/50 bg-white px-8 py-6 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-amber-100 border-4 border-white shadow-md">
                 <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=Aryan" alt="Aryan Sharma" className="h-full w-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Aryan Sharma</h2>
                <p className="text-sm text-slate-600 mt-1">Aspiring International Student</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[0.8rem] leading-none">🇮🇳</span>
                  <span className="text-[0.8rem] font-medium text-slate-500">Location: India</span>
                </div>
              </div>
            </div>
            <CircularProgress value={85} />
          </div>

          {/* Flexible 2-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* ================= LEFT COLUMN ================= */}
            <div className="flex flex-col gap-6">
              
              {/* Personal Information */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm relative group overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <User className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Personal Information</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Full Name</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Aryan Sharma</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email Address</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900 break-all">aryan.s@fateh.edu</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">+91 9876543210</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Nationality</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Indian</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-[0.9rem] font-semibold text-slate-900">15 Aug 2002</p>
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">(23 Yrs)</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Preferred Language</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">English</p>
                  </div>
                </div>
              </div>

              {/* Target Preferences */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Target className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Target Preferences</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Target Countries</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-[#F0F5FD] border border-[#DDEBFC] px-2.5 py-1 font-semibold text-[#2B77D2] text-xs">
                      🇬🇧 UK
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-[#F0F5FD] border border-[#DDEBFC] px-2.5 py-1 font-semibold text-[#2B77D2] text-xs">
                      🇮🇪 Ireland
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-[#F0F5FD] border border-[#DDEBFC] px-2.5 py-1 font-semibold text-[#2B77D2] text-xs">
                      🇦🇪 UAE
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-1">Target Course</p>
                  <p className="text-[0.9rem] font-semibold text-slate-900">Masters in Data Science</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Target Universities</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 shadow-sm">
                      <span className="text-[0.75rem] font-medium text-slate-700">Imperial College London</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 shadow-sm">
                      <span className="text-[0.75rem] font-medium text-slate-700">UCL</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 shadow-sm">
                      <span className="text-[0.75rem] font-medium text-slate-700">Trinity College Dublin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Timeline Smart Card */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Timer className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Application Timeline</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Target Intake</p>
                    <p className="text-sm font-semibold text-slate-900">Autumn / Fall 2024</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Months Left</p>
                    <p className="text-sm font-bold text-[#2B77D2]">4 Months</p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                    <span>Preparation</span>
                    <span>Deadline</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-[#2B77D2]" style={{ width: "65%" }}></div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#FAF0A8]/30 px-3.5 py-3 mt-2 border border-[#FAF0A8]/50">
                   <p className="flex items-start gap-2 text-xs font-medium text-amber-800 leading-snug">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                      "Applying early increases admission chances and secures better housing options."
                   </p>
                </div>
              </div>

              {/* Profile Strength */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                  <h3 className="font-bold text-slate-900">Profile Strength</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">SOP Status</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <p className="text-sm font-semibold text-slate-900">Completed</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">LOR Count</p>
                    <p className="text-sm font-semibold text-slate-900">2 Obtained</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Work Experience</p>
                    <p className="text-sm font-semibold text-slate-900">1 Year <span className="text-xs font-normal text-slate-500 block">(SDE)</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Projects</p>
                    <p className="text-sm font-semibold text-slate-900">2 Completed</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Documents</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Resume Setup</p>
                          <p className="text-xs text-green-600 font-medium">Uploaded • Aryan_Resume_v2.pdf</p>
                        </div>
                     </div>
                     <button className="text-slate-400 hover:text-[#2B77D2]"><Edit2 className="h-4 w-4" /></button>
                  </div>
                  {/* Item 2 */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Statement of Purpose</p>
                          <p className="text-xs text-green-600 font-medium">Uploaded • SOP_Draft_Final.pdf</p>
                        </div>
                     </div>
                     <button className="text-slate-400 hover:text-[#2B77D2]"><Edit2 className="h-4 w-4" /></button>
                  </div>
                  {/* Item 3 */}
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
                     <button className="text-slate-400 hover:text-[#2B77D2]"><Edit2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>

            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="flex flex-col gap-6">

              {/* Academic Details */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Academic Details</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-y-5 gap-x-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Education Level</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Bachelor's Degree</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Field of Study</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Computer Science</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Institution Name</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Delhi Technological University</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">GPA / Percentage</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">8.5 CGPA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Graduation Year</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">2024</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Backlogs</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">None</p>
                  </div>
                </div>
              </div>

              {/* Test Scores */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Test Scores</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                     <div className="flex items-center justify-between mb-1.5">
                       <p className="text-[0.8rem] font-semibold text-slate-700">IELTS Score</p>
                       <p className="text-[0.8rem] font-bold text-slate-900">Band 7.5</p>
                     </div>
                     <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                       <div className="h-full bg-[#2B77D2]" style={{ width: "85%" }}></div>
                     </div>
                  </div>
                  
                  <div>
                     <div className="flex items-center justify-between mb-1.5">
                       <p className="text-[0.8rem] font-semibold text-slate-700">TOEFL</p>
                       <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Not taken</p>
                     </div>
                     <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                       <div className="h-full bg-slate-200" style={{ width: "0%" }}></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[0.8rem] font-semibold text-slate-700">GRE</p>
                        <p className="text-[0.8rem] font-bold text-slate-900">315</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div className="h-full bg-sky-500" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[0.8rem] font-semibold text-slate-700">GMAT</p>
                        <p className="text-[0.8rem] font-medium text-slate-500 border border-slate-200 px-1.5 rounded-sm">Opt</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div className="h-full bg-slate-200" style={{ width: "0%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget & Funding */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">Budget & Funding</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-5 gap-x-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tuition Budget</p>
                    <p className="text-sm font-bold text-slate-900">₹30L - ₹40L <span className="text-xs font-normal text-slate-500">per annum</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Scholarship Applied</p>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700">
                       <CheckCircle2 className="h-3 w-3" /> Yes
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Funding Source</p>
                    <p className="text-[0.9rem] font-semibold text-slate-900">Self + Education Loan</p>
                  </div>
                </div>
                <div className="rounded-lg bg-sky-50 px-3.5 py-3 mt-1 border border-sky-100">
                   <p className="flex items-start gap-2 text-xs font-medium text-sky-800 leading-snug">
                      <Lightbulb className="h-4 w-4 shrink-0 text-[#2B77D2]" />
                      "Securing a scholarship significantly improves your long-term budget flexibility."
                   </p>
                </div>
              </div>

              {/* Visa Status */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                  <h3 className="font-bold text-slate-900">Visa Status</h3>
                </div>
                <div>
                   <p className="text-xs text-slate-500 mb-2">Current Application Status</p>
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200">
                      Not Applied Yet
                   </span>
                </div>
              </div>

              {/* External Links */}
              <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-[1.125rem] w-[1.125rem] text-[#2B77D2]" />
                    <h3 className="font-bold text-slate-900">External Links</h3>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-[#DDEBFC] bg-[#F0F5FD] px-3 py-1.5 text-xs font-semibold text-[#2B77D2] transition hover:bg-[#DDEBFC]">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                
                <div className="space-y-3 mt-2">
                  <a href="#" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#2B77D2] transition-colors p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    linkedin.com/in/aryan-sharma
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#2B77D2] transition-colors p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Github className="h-4 w-4 text-slate-800" />
                    github.com/aryancodes
                  </a>
                  <a href="#" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#2B77D2] transition-colors p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Globe className="h-4 w-4 text-slate-500" />
                    aryansharma.dev
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
