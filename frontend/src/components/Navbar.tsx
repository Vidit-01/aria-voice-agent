import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
    >
      <div className="flex items-center gap-2">
        <img src="/landing/fateh_logo.png" alt="Fateh Logo" className="h-10 md:h-12 w-auto object-contain" />
      </div>

      <div className="hidden md:flex items-center gap-8 text-base font-medium text-foreground">
        <a href="#" className="hover:text-primary transition-colors">Home</a>
        <a href="#" className="hover:text-primary transition-colors">About</a>
        <a href="#" className="hover:text-primary transition-colors">Services</a>
        <a href="#" className="hover:text-primary transition-colors">Countries</a>
        <a href="#" className="hover:text-primary transition-colors">Contact</a>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(207 90% 54% / 0.4)" }}
        whileTap={{ scale: 0.97 }}
        className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
      >
        Get Started
      </motion.button>
    </motion.nav>
  );
};

export default Navbar;
