import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AuthSection from "@/components/AuthSection";
import InfoSections from "@/components/InfoSections";

const Index = () => {
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
