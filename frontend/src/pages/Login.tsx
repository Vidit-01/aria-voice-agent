import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Mail, Lock } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center bg-white px-4 overflow-hidden">
      {/* Background Footer Graphic */}
      <div className="absolute top-auto bottom-0 left-0 right-0 z-0">
        <Footer />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[2.5rem] bg-[#fcfbfa]/95 backdrop-blur-sm p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60">
          <div className="mb-8 text-center">
            <Link to="/">
              <img src="/landing/fateh_logo.png" alt="Fateh" className="mx-auto h-12 w-auto" />
            </Link>
            <h1 className="mt-6 text-[1.7rem] font-bold text-slate-900 leading-tight">Welcome Back</h1>
            <p className="mt-1.5 text-[0.95rem] text-slate-500">
              Access your study abroad journey
            </p>
          </div>

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
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-[1.125rem] w-[1.125rem] text-slate-400 stroke-[1.5]" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/80 bg-white py-3.5 pl-[2.75rem] pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:border-[#2f88d4] focus:outline-none focus:ring-4 focus:ring-[#2f88d4]/15 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[0.9rem] font-semibold text-slate-600 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-[1.125rem] w-[1.125rem] text-slate-400 stroke-[1.5]" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/80 bg-white py-3.5 pl-[2.75rem] pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:border-[#2f88d4] focus:outline-none focus:ring-4 focus:ring-[#2f88d4]/15 transition-all"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.25rem] bg-[#227ecf] mt-8 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-[#227ecf]/30 transition-all hover:bg-[#1c6bb0] hover:shadow-[#227ecf]/40 disabled:opacity-70"
            >
              {loading ? "Logging in…" : "Log In"}
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
    </div>
  );
};

export default Login;

