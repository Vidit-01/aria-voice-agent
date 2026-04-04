import { motion } from "framer-motion";
import AbstractBackdrop from "./AbstractBackdrop";

const AuthSection = () => {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f7fbff] px-6 py-20">
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
            Create your plan or sign back in.
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            Log in to manage your applications, or sign up to get a personalized roadmap.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur"
          >
            <h3 className="text-2xl font-semibold text-slate-900">Log In</h3>
            <p className="mt-2 text-sm text-slate-600">Welcome back. Pick up where you left off.</p>
            <form className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Email or phone"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
              >
                Log In
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur"
          >
            <h3 className="text-2xl font-semibold text-slate-900">Sign Up</h3>
            <p className="mt-2 text-sm text-slate-600">Get matched with the right universities fast.</p>
            <form className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <input
                type="tel"
                placeholder="Phone number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                Create Account
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;
