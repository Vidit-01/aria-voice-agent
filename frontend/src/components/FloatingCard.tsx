import { motion } from "framer-motion";

interface FloatingCardProps {
  city: string;
  image: string;
  rotation: number;
  delay: number;
  floatClass: string;
  className?: string;
}

const FloatingCard = ({ city, image, rotation, delay, floatClass, className = "" }: FloatingCardProps) => {
  const edgeBlurMask = "radial-gradient(circle at center, transparent 38%, rgba(0, 0, 0, 0.88) 68%, rgba(0, 0, 0, 1) 100%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      whileHover={{
        scale: 1.2,
        y: -20,
        rotate: 0,
        boxShadow: "0 25px 50px rgba(0,0,0,0.3), 0 0 35px rgba(147, 197, 253, 0.45), 0 0 60px rgba(56, 189, 248, 0.35)",
      }}
      className={`${floatClass} ${className}`}
      style={{ transformOrigin: "center center" }}
    >
      <div
        className="relative w-[185px] md:w-[255px] overflow-hidden rounded-[28px] border border-white/20 bg-white/8 p-4 pt-3 shadow-[0_18px_45px_rgba(15,23,42,0.22)] cursor-pointer flex flex-col items-center"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px] backdrop-blur-[18px]"
          style={{
            maskImage: edgeBlurMask,
            WebkitMaskImage: edgeBlurMask,
          }}
        />
        <div className="pointer-events-none absolute inset-[1px] rounded-[27px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.07))]" />
        <div className="relative flex w-full aspect-square items-center justify-center rounded-[22px] px-1">
          <img
            src={image}
            alt={city}
            className="h-[60%] w-[150%] drop-shadow-[0_24px_34px_rgba(15,23,42,0.24)]"
            loading="lazy"
          />
        </div>
        <span className="relative font-montserrat font-bold text-xl md:text-[1.9rem] tracking-[0.18em] uppercase mt-3 text-yellow-300">
          {city}
        </span>
      </div>
    </motion.div>
  );
};

export default FloatingCard;
