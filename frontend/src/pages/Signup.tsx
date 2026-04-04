import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AuthPageLayout, { authLogoClassName, glassPrimaryButtonClass } from "@/components/AuthPageLayout";

const Signup = () => {
  useDocumentTitle("Sign Up");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup({ email, password, full_name: fullName, role: "student" });
      // After signup, send to profile registration
      navigate("/register", { replace: true });
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Could not create account. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="block">
            <img
              src="/landing/fateh_logo.png"
              alt="Fateh Education"
              className={authLogoClassName}
            />
          </Link>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900 drop-shadow-sm md:mt-6">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-700 underline decoration-sky-300/60 underline-offset-2 hover:text-sky-800"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="rounded-3xl border border-white/50 bg-white/40 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                placeholder="Riya Sharma"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className={glassPrimaryButtonClass}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default Signup;
