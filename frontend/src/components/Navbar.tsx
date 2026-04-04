import { motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? "text-primary" : "text-foreground"} hover:text-primary transition-colors`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
    >
      <Link to="/" className="flex items-center gap-2">
        <img src="/landing/fateh_logo.png" alt="Fateh Logo" className="h-10 md:h-12 w-auto object-contain" />
      </Link>

      <div className="hidden md:flex items-center gap-8 text-base font-medium">
        {/* Always show public links */}
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/about" className={linkClass}>About</NavLink>
        <NavLink to="/services" className={linkClass}>Services</NavLink>
        <NavLink to="/countries" className={linkClass}>Countries</NavLink>
        <NavLink to="/projects" className={linkClass}>Projects</NavLink>
        <NavLink to="/contact" className={linkClass}>Contact</NavLink>

        {/* Authenticated extra links */}
        {user && user.role === "student" && (
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        )}
        {user && user.role === "admin" && (
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden text-sm text-foreground/70 md:block">{user.full_name}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5"
            >
              Log out
            </motion.button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/signup"
                className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold shadow-lg hover:opacity-95"
              >
                Get Started
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
