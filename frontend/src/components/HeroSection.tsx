import { motion } from "framer-motion";
import FloatingCard from "./FloatingCard";
import AbstractBackdrop from "./AbstractBackdrop";

const cards = [
  { city: "Cambridge", image: "/landing/cambridge.png", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", rotation: -12, floatClass: "animate-float-1" },
  { city: "London", image: "/landing/london.png", gradient: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)", rotation: -6, floatClass: "animate-float-2" },
  { city: "Oxford", image: "/landing/oxford.png", gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)", rotation: 0, floatClass: "animate-float-3" },
  { city: "Dubai", image: "/landing/dubai.png", gradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)", rotation: 6, floatClass: "animate-float-4" },
  { city: "Dublin", image: "/landing/dublin.png", gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)", rotation: 12, floatClass: "animate-float-5" },
];

const HeroSection = () => {
  return (
    <section className="relative flex h-screen max-h-screen w-full flex-col items-center justify-end overflow-hidden md:justify-center">
      {/* Sky background */}
      <video
        ref={(el) => {
          if (el) {
            el.playbackRate = 0.7;
          }
        }}
        className="absolute inset-0 h-full w-full object-cover z-0"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/landing/sky.mp4" type="video/mp4"  />
      </video>
      <AbstractBackdrop className="z-10 opacity-80" />
      {/* Slight animated overlay for life */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60 z-20" />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-30 text-center mt-32 md:mt-20 px-4 mb-auto flex flex-col items-center"
      >
        <img src="/landing/fateh_logo.png" alt="Fateh Logo" className="h-20 md:h-28 lg:h-36 w-auto object-contain mb-8 drop-shadow-xl" />
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground leading-tight drop-shadow-md">
          Best <em className="font-playfair italic text-primary not-italic font-bold" style={{ fontStyle: 'italic', fontWeight: 700 }}>Overseas</em> Education
          <br />
          Consultants in India.
        </h1>
      </motion.div>

      {/* Centered Woman Image */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="absolute inset-x-0 bottom-0 translate-y-44 md:translate-y-64 w-full z-30 pointer-events-none flex justify-center overflow-hidden"
      >
        <img 
          src="/landing/woman.png" 
          alt="Happy Student" 
          className="w-[100%] md:w-[60%] object-contain object-bottom drop-shadow-2xl"
        />
      </motion.div>

      {/* Floating Cards - curved arc layout */}
      <div className="relative z-40 mb-0 md:mb-10 mt-auto flex items-end justify-center gap-6 md:gap-10 px-4 w-full">
        {cards.map((card, i) => {
          // Arc positioning: center card lower, sides higher
          const centerIndex = 2;
          const distFromCenter = Math.abs(i - centerIndex);
          const yOffset = distFromCenter * 40; // side cards move up more
          const zIndex = 30 - distFromCenter; // center card on top
          return (
            <div key={card.city} className="relative" style={{ marginBottom: `${yOffset}px`, zIndex }}>
              <FloatingCard
                {...card}
                delay={0.6 + i * 0.15}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HeroSection;
