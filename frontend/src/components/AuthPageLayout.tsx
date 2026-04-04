import { type ReactNode } from "react";

/** Shared glassmorphism primary button (login / signup submit). */
export const glassPrimaryButtonClass =
  "relative w-full overflow-hidden rounded-xl border border-white/55 bg-gradient-to-b from-white/45 to-sky-100/35 px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-[0_8px_32px_rgba(14,116,144,0.12),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl transition hover:from-white/55 hover:to-sky-100/45 hover:border-white/75 hover:shadow-[0_12px_40px_rgba(14,116,144,0.16)] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";

/** Logo sizing for login, signup, and profile registration — prominent but balanced. */
export const authLogoClassName =
  "mx-auto h-[4.75rem] w-auto max-h-[140px] max-w-[min(100%,300px)] object-contain object-center drop-shadow-sm md:h-[6rem] md:max-h-[160px] md:max-w-[340px]";

interface AuthPageLayoutProps {
  children: ReactNode;
  /** Long forms (e.g. register): scroll with padding above bottom landscape */
  scrollable?: boolean;
}

/**
 * Full-page shell: blue-white sky, faint clouds, landscape strip at bottom.
 */
const AuthPageLayout = ({ children, scrollable = false }: AuthPageLayoutProps) => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% -10%, rgba(255, 255, 255, 0.85) 0%, transparent 55%),
            radial-gradient(ellipse 90% 50% at 15% 25%, rgba(255, 255, 255, 0.45) 0%, transparent 50%),
            radial-gradient(ellipse 70% 45% at 85% 18%, rgba(255, 255, 255, 0.38) 0%, transparent 48%),
            radial-gradient(ellipse 100% 60% at 40% 45%, rgba(230, 242, 255, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 80% 50% at 70% 55%, rgba(255, 255, 255, 0.28) 0%, transparent 50%),
            linear-gradient(180deg, #eef5ff 0%, #f4f9ff 35%, #f0f6fc 70%, #e8f2fa 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 28% at 22% 12%, rgba(255,255,255,0.9) 0%, transparent 70%),
            radial-gradient(ellipse 45% 22% at 78% 8%, rgba(255,255,255,0.75) 0%, transparent 68%),
            radial-gradient(ellipse 50% 24% at 50% 22%, rgba(248,252,255,0.65) 0%, transparent 72%)
          `,
        }}
      />

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col items-center px-4 py-10 sm:py-12 ${
          scrollable
            ? "justify-start overflow-y-auto pb-[min(38vh,280px)] pt-6"
            : "justify-center"
        }`}
      >
        {children}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-screen max-w-none -translate-x-1/2">
        <img
          src="/landscape.png"
          alt=""
          className="block h-[min(42vh,380px)] w-full max-w-none object-cover object-bottom opacity-95 [mask-image:linear-gradient(to_top,black_65%,transparent)]"
          aria-hidden
        />
      </div>
    </div>
  );
};

export default AuthPageLayout;
