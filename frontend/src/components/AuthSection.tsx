import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AbstractBackdrop from "./AbstractBackdrop";
import { useAuth } from "@/lib/auth";

const AuthSection = () => {
  const { user } = useAuth();

  return (
    <section id="auth" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f7fbff] px-6 py-20">
      <AbstractBackdrop className="opacity-70" />

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Start Your Journey</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-5xl">
            {user ? `Welcome back, ${user.full_name.split(" ")[0]}.` : "Create your plan or sign back in."}
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
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
            className="flex justify-center gap-4"
          >
            <Link
              to={user.role === "admin" ? "/admin" : "/dashboard"}
              className="rounded-2xl bg-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
            >
              Go to {user.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Log In card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur"
            >
              <h3 className="text-2xl font-semibold text-slate-900">Log In</h3>
              <p className="mt-2 text-sm text-slate-600">Welcome back. Pick up where you left off.</p>
              <p className="mt-6 text-sm text-slate-500">
                Access your profile, sessions, and application progress.
              </p>
              <Link
                to="/login"
                className="mt-6 block w-full rounded-xl bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
              >
                Log In
              </Link>
            </motion.div>

            {/* Sign Up card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur"
            >
              <h3 className="text-2xl font-semibold text-slate-900">Sign Up</h3>
              <p className="mt-2 text-sm text-slate-600">Get matched with the right universities fast.</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  AI-powered counseling session
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  Profile analysis & university shortlisting
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  Expert follow-up from Fateh counselors
                </li>
              </ul>
              <Link
                to="/signup"
                className="mt-6 block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
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
