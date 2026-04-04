import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AuthPageLayout, { glassPrimaryButtonClass, authLogoClassName } from "@/components/AuthPageLayout";

const Login = () => {
  useDocumentTitle("Login");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Where to go after login — if we were redirected here from a protected route, go back there
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from || "/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Invalid email or password.";
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
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900 drop-shadow-sm md:mt-6">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-sky-700 underline decoration-sky-300/60 underline-offset-2 hover:text-sky-800"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="rounded-3xl border border-white/50 bg-white/40 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 flex items-center px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[0.9rem] font-semibold text-slate-600 mb-1.5 ml-1">
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
              <label htmlFor="password" className="block text-[0.9rem] font-semibold text-slate-600 mb-1.5 ml-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className={glassPrimaryButtonClass}>
              {loading ? "Signing in…" : "Log In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-[#227ecf] hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default Login;

