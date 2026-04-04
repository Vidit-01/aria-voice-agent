import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About.tsx";
import Services from "./pages/Services.tsx";
import Countries from "./pages/Countries.tsx";
import Projects from "./pages/Projects.tsx";
import Contact from "./pages/Contact.tsx";

// Auth pages (unauthenticated)
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";

// Student pages (requires login)
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Session from "./pages/Session.tsx";

// Admin pages (requires admin role)
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
            {/* ---- Public ---- */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />

            {/* ---- Auth (only for guests; logged-in users are redirected by useNavigate in the page) ---- */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ---- Student protected ---- */}
            <Route
              path="/register"
              element={
                <ProtectedRoute>
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session/:sessionId"
              element={
                <ProtectedRoute>
                  <Session />
                </ProtectedRoute>
              }
            />

            {/* ---- Admin protected ---- */}
            <Route
              path="/admin"
              element={
                  <AdminDashboard />
              }
            />
            <Route
              path="/admin/leads/:userId"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLeadDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions/:sessionId/report"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSessionReport />
                </ProtectedRoute>
              }
            />

            {/* ---- Fallback ---- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
