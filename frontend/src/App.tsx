import { Component, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ChatBot from "@/components/ChatBot.jsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

// ── Error boundary — shows error instead of blank white screen ────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#fff1f0", minHeight: "100vh" }}>
          <h2 style={{ color: "#c0392b" }}>⚠ Runtime Error</h2>
          <pre style={{ color: "#333", whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: "8px 20px", background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages where the global navbar must NOT appear (they have their own full-screen layouts)
const NO_NAVBAR = ["/login", "/signup", "/voice-agent"];

function GlobalNavbar() {
  const { pathname } = useLocation();
  if (NO_NAVBAR.some((p) => pathname.startsWith(p))) return null;
  return <Navbar />;
}

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";

import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import Session from "./pages/Session.tsx";

import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminLeadDetail from "./pages/AdminLeadDetail.tsx";
import AdminSessionReport from "./pages/AdminSessionReport.tsx";
import VoiceAgent from "./pages/VoiceAgent.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalNavbar />
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Index />} />

            {/* Legacy marketing URLs → home page anchors */}
            <Route path="/about"    element={<Navigate to={{ pathname: "/", hash: "fateh-about" }}    replace />} />
            <Route path="/services" element={<Navigate to={{ pathname: "/", hash: "fateh-services" }} replace />} />
            <Route path="/countries" element={<Navigate to={{ pathname: "/", hash: "fateh-partners" }} replace />} />
            <Route path="/projects"  element={<Navigate to={{ pathname: "/", hash: "fateh-mission" }}  replace />} />
            <Route path="/contact"   element={<Navigate to={{ pathname: "/", hash: "fateh-contact" }}  replace />} />

            {/* ── Auth ── */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ── Student (protected) ── */}
            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            {/* TODO: re-add ProtectedRoute once auth is wired to backend */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/session/:sessionId" element={<ProtectedRoute><Session /></ProtectedRoute>} />
            <Route path="/voice-agent" element={<ProtectedRoute><VoiceAgent /></ProtectedRoute>} />

            {/* ── Admin (protected) ── */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leads/:userId" element={<ProtectedRoute requireAdmin><AdminLeadDetail /></ProtectedRoute>} />
            <Route path="/admin/sessions/:sessionId/report" element={<ProtectedRoute requireAdmin><AdminSessionReport /></ProtectedRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
