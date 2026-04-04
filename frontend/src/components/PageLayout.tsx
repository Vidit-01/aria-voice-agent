import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  /** Shown as h1 when set */
  heading?: string;
}

const PageLayout = ({ children, title, heading }: PageLayoutProps) => {
  useDocumentTitle(title ?? heading);

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-28 md:pt-32">
        {heading && (
          <h1 className="mb-10 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            {heading}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
