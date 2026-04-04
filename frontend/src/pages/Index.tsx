import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AuthSection from "@/components/AuthSection";
import InfoSections from "@/components/InfoSections";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { User, LayoutDashboard } from "lucide-react";

const Index = () => {
  useDocumentTitle();

  return (
    <div className="relative">
      <Navbar />
      <HeroSection />
      <AuthSection />
      <InfoSections />
      <Footer />

      {/* Direct Demo Links */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3 items-end">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-sm font-bold shadow-2xl text-white hover:bg-slate-800 transition-all hover:scale-105 group border-2 border-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          View Dashboard Page
        </Link>
        <Link 
          to="/profile" 
          className="flex items-center gap-2 rounded-full bg-[#1c6bb0] px-6 py-4 text-sm font-bold shadow-2xl text-white hover:bg-[#15548c] transition-all hover:scale-105 group border-2 border-white"
        >
          <User className="h-4 w-4" />
          View Profile Page
        </Link>
      </div>
    </div>
  );
};

export default Index;
