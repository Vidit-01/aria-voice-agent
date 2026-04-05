import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import AuthSection from "@/components/AuthSection";
import FatehEducationInfo from "@/components/FatehEducationInfo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const Index = () => {
  useDocumentTitle();
  const location = useLocation();

  // Smooth-scroll to hash anchors (used by Navbar + Navigate redirects)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="relative">
      <HeroSection />
      <AuthSection />
      <FatehEducationInfo />

      {/* ── Dev bypass buttons (remove before production) ── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold shadow-xl transition hover:scale-105 hover:shadow-2xl"
          style={{ background: "#014fa3", color: "#fff" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Profile
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold shadow-xl transition hover:scale-105 hover:shadow-2xl"
          style={{ background: "#ffe131", color: "#111" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Index;
