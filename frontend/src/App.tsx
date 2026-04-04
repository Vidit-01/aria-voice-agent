import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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

            {/* ── Admin (protected) ── */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leads/:userId" element={<ProtectedRoute requireAdmin><AdminLeadDetail /></ProtectedRoute>} />
            <Route path="/admin/sessions/:sessionId/report" element={<ProtectedRoute requireAdmin><AdminSessionReport /></ProtectedRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
