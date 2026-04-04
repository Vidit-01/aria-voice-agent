import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AuthSection from "@/components/AuthSection";
import InfoSections from "@/components/InfoSections";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const Index = () => {
  useDocumentTitle();

  return (
    <div className="relative">
      <Navbar />
      <HeroSection />
      <AuthSection />
      <InfoSections />
    </div>
  );
};

export default Index;
