import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

// ── constants ─────────────────────────────────────────────────────────────────

const TRANSITION = "all 0.25s ease";

// Pages where the navbar shows immediately as solid (not transparent)
const SOLID_PATHS = ["/dashboard", "/profile", "/admin", "/register", "/session"];

// ── link styles ───────────────────────────────────────────────────────────────

const baseLinkStyle: React.CSSProperties = {
  color: "#1F3A5F",
  fontWeight: 500,
  fontSize: "0.9375rem",
  letterSpacing: "0.5px",
  padding: "8px 14px",
  borderRadius: "20px",
  textDecoration: "none",
  textShadow: "0 1px 2px rgba(255,255,255,0.3)",
  transition: TRANSITION,
  display: "inline-block",
  cursor: "pointer",
};

const activeLinkStyle: React.CSSProperties = {
  ...baseLinkStyle,
  color: "#0B2545",
  fontWeight: 600,
  background: "rgba(47,128,237,0.12)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <span
      style={isActive ? activeLinkStyle : baseLinkStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#2F80ED";
        el.style.transform = "scale(1.05)";
        el.style.textDecoration = "underline";
        el.style.textDecorationColor = "#2F80ED";
        el.style.textUnderlineOffset = "4px";
        if (!isActive) el.style.background = "rgba(47,128,237,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = isActive ? "#0B2545" : "#1F3A5F";
        el.style.transform = "scale(1)";
        el.style.textDecoration = "none";
        el.style.background = isActive ? "rgba(47,128,237,0.12)" : "transparent";
      }}
    >
      {children}
    </span>
  );
}

// ── nav link definitions ──────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home",         to: "/",                                     isNavLink: true,  end: true },
  { label: "About",        to: { pathname: "/", hash: "fateh-about" },    isNavLink: false },
  { label: "Services",     to: { pathname: "/", hash: "fateh-services" }, isNavLink: false },
  { label: "Offices",      to: { pathname: "/", hash: "fateh-india" },    isNavLink: false },
  { label: "Partnerships", to: { pathname: "/", hash: "fateh-partners" }, isNavLink: false },
  { label: "Contact",      to: { pathname: "/", hash: "fateh-contact" },  isNavLink: false },
];

// ── Navbar ────────────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Detect scroll only on landing page
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  // Determine if this is an "inner" page that needs solid glass immediately
  const isInnerPage = SOLID_PATHS.some((p) => pathname.startsWith(p));
  const showGlass = isInnerPage || scrolled;

  const navBarStyle: React.CSSProperties = {
    background: showGlass ? "rgba(255,255,255,0.88)" : "transparent",
    backdropFilter: showGlass ? "blur(18px)" : "none",
    WebkitBackdropFilter: showGlass ? "blur(18px)" : "none",
    borderBottom: showGlass ? "1px solid rgba(31,58,95,0.1)" : "1px solid transparent",
    boxShadow: showGlass ? "0 1px 16px rgba(0,0,0,0.07)" : "none",
    transition: "background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
  };

  return (
    <>
      {/* ── Main bar ── */}
      <motion.nav
        initial={{ y: -36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={navBarStyle}
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-6 md:px-12 py-3"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/landing/fateh_logo.png" alt="Fateh" className="h-10 md:h-11 w-auto object-contain" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, to, isNavLink, end }) =>
            isNavLink ? (
              <NavLink key={label} to={to as string} end={end}>
                {({ isActive }) => <NavItem isActive={isActive}>{label}</NavItem>}
              </NavLink>
            ) : (
              <Link key={label} to={to as { pathname: string; hash: string }}>
                <NavItem isActive={false}>{label}</NavItem>
              </Link>
            )
          )}

          {user?.role === "student" && (
            <NavLink to="/dashboard">
              {({ isActive }) => <NavItem isActive={isActive}>Dashboard</NavItem>}
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin">
              {({ isActive }) => <NavItem isActive={isActive}>Admin</NavItem>}
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Name → profile */}
              <Link
                to="/profile"
                className="hidden md:block text-sm"
                style={{ color: "#1F3A5F", fontWeight: 500, textDecoration: "none", transition: TRANSITION }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2F80ED"; (e.currentTarget as HTMLElement).style.textDecoration = "underline"; (e.currentTarget as HTMLElement).style.textUnderlineOffset = "3px"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#1F3A5F"; (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                {user.full_name}
              </Link>

              {/* Log out */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="hidden md:block"
                style={{ border: "1px solid #1F3A5F", color: "#1F3A5F", background: "transparent", borderRadius: "9999px", padding: "6px 16px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: TRANSITION }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1F3A5F"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1F3A5F"; }}
              >
                Log out
              </motion.button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden md:block"
                style={{ ...baseLinkStyle, padding: "6px 10px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2F80ED"; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#1F3A5F"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                Log in
              </Link>
              <motion.div className="hidden md:block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link to="/signup" className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold shadow-lg hover:opacity-95">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}

          {/* Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl"
            style={{ color: "#1F3A5F", background: menuOpen ? "rgba(47,128,237,0.08)" : "transparent", border: "none", cursor: "pointer", transition: TRANSITION }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Mobile slide-down menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(31,58,95,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.09)",
            }}
            className="fixed top-[64px] left-0 right-0 z-[999] flex flex-col px-6 py-4 gap-1 md:hidden"
          >
            {NAV_LINKS.map(({ label, to, isNavLink, end }) =>
              isNavLink ? (
                <NavLink key={label} to={to as string} end={end} onClick={() => setMenuOpen(false)}>
                  {({ isActive }) => <NavItem isActive={isActive} onClick={() => setMenuOpen(false)}>{label}</NavItem>}
                </NavLink>
              ) : (
                <Link key={label} to={to as { pathname: string; hash: string }} onClick={() => setMenuOpen(false)}>
                  <NavItem isActive={false}>{label}</NavItem>
                </Link>
              )
            )}

            {user?.role === "student" && (
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                {({ isActive }) => <NavItem isActive={isActive}>Dashboard</NavItem>}
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                {({ isActive }) => <NavItem isActive={isActive}>Admin</NavItem>}
              </NavLink>
            )}

            <div style={{ height: 1, background: "rgba(31,58,95,0.1)", margin: "6px 0" }} />

            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ ...baseLinkStyle, fontWeight: 600 }}>
                  👤 {user.full_name}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ ...baseLinkStyle, border: "1px solid #1F3A5F", cursor: "pointer", background: "transparent", textAlign: "left" as const }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} style={baseLinkStyle}>Log in</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ ...baseLinkStyle, background: "var(--primary)", color: "#fff", textAlign: "center" as const }}>
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
