import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const BLUE = "#014fa3";
const YELLOW = "#ffe131";

const AuthSection = () => {
  const { user } = useAuth();

  return (
    <section
      id="auth"
      className="relative flex min-h-screen w-full flex-col overflow-hidden px-6 py-20"
      style={{ background: "linear-gradient(160deg, #eef5ff 0%, #dceeff 40%, #f0f6fc 100%)" }}
    >
      {/* ── geometric accent shapes ─────────────────────────────────── */}
      {/* Large blue circle top-right */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.07]"
        style={{ background: BLUE }}
      />
      {/* Yellow rotated square bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rotate-12 rounded-3xl opacity-[0.12]"
        style={{ background: YELLOW }}
      />
      {/* Blue diagonal bar top-left */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-2 w-full origin-left -rotate-[0.8deg] opacity-20"
        style={{ background: `linear-gradient(90deg, ${BLUE}, transparent)` }}
      />
      {/* Small yellow circle */}
      <div
        className="pointer-events-none absolute right-[18%] top-[15%] h-14 w-14 rounded-full opacity-30"
        style={{ background: YELLOW }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle, ${BLUE} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Landscape strip */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-screen -translate-x-1/2">
        <img
          src="/landscape.png"
          alt=""
          className="block h-[min(42vh,380px)] w-full object-cover object-bottom opacity-[0.82] [mask-image:linear-gradient(to_top,black_65%,transparent)]"
          aria-hidden
        />
      </div>

      {/* ── content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center pb-[min(34vh,260px)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* Eyebrow with yellow accent */}
          <span
            className="mb-3 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em]"
            style={{ background: YELLOW, color: "#111" }}
          >
            Start Your Journey
          </span>
          <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            {user
              ? `Welcome back, ${user.full_name.split(" ")[0]}.`
              : <>Create your plan or<br /><span style={{ color: BLUE }}>sign back in.</span></>}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-500 md:text-lg">
            {user
              ? "Head to your dashboard to manage your counseling sessions and profile."
              : "Log in to manage your applications, or sign up to get a personalized roadmap."}
          </p>
        </motion.div>

        {user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <Link
              to={user.role === "admin" ? "/admin" : "/dashboard"}
              className="rounded-full px-10 py-4 text-sm font-bold shadow-xl transition hover:scale-105 hover:shadow-2xl"
              style={{ background: BLUE, color: "#fff", boxShadow: `0 8px 32px rgba(1,79,163,0.3)` }}
            >
              Go to {user.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {/* Log In card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="group relative cursor-pointer rounded-3xl border p-8 shadow-[0_16px_48px_rgba(1,79,163,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_24px_64px_rgba(1,79,163,0.22),0_0_0_1px_rgba(1,79,163,0.15)]"
              style={{
                background: "rgba(255,255,255,0.72)",
                borderColor: "rgba(1,79,163,0.14)",
              }}
            >
              {/* top yellow bar */}
              <div className="mb-6 h-1 w-12 rounded-full" style={{ background: YELLOW }} />
              <h3 className="text-2xl font-black" style={{ color: BLUE }}>Log In</h3>
              <p className="mt-2 text-sm text-slate-500">Welcome back. Pick up where you left off.</p>
              <p className="mt-4 text-sm text-slate-400">
                Access your profile, sessions, and application progress.
              </p>
              <Link
                to="/login"
                className="mt-6 block w-full rounded-xl py-3.5 text-center text-sm font-bold shadow-lg transition hover:brightness-105 hover:shadow-xl"
                style={{ background: BLUE, color: "#fff", boxShadow: `0 6px 24px rgba(1,79,163,0.3)` }}
              >
                Log In
              </Link>
            </motion.div>

            {/* Sign Up card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="group relative cursor-pointer rounded-3xl border p-8 shadow-[0_16px_48px_rgba(1,79,163,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_24px_64px_rgba(255,225,49,0.22),0_0_0_1px_rgba(255,225,49,0.4)]"
              style={{
                background: "rgba(255,255,255,0.72)",
                borderColor: "rgba(1,79,163,0.14)",
              }}
            >
              {/* top yellow bar */}
              <div className="mb-6 h-1 w-12 rounded-full" style={{ background: YELLOW }} />
              <h3 className="text-2xl font-black" style={{ color: BLUE }}>Sign Up</h3>
              <p className="mt-2 text-sm text-slate-500">Get matched with the right universities fast.</p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-500">
                {[
                  "AI-powered counseling session",
                  "Profile analysis & university shortlisting",
                  "Expert follow-up from Fateh counselors",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: YELLOW }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="mt-6 block w-full rounded-xl py-3.5 text-center text-sm font-bold shadow-lg transition hover:brightness-105 hover:shadow-xl"
                style={{ background: YELLOW, color: "#111", boxShadow: `0 6px 24px rgba(255,225,49,0.35)` }}
              >
                Create Account
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AuthSection;
