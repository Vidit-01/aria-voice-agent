interface AbstractBackdropProps {
  className?: string;
}

const AbstractBackdrop = ({ className = "" }: AbstractBackdropProps) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
      <div className="absolute top-10 right-[-5%] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[20%] h-96 w-96 rounded-full bg-cyan-300/20 blur-[110px]" />
      <div className="absolute bottom-[-8%] right-[15%] h-72 w-72 rounded-full bg-amber-300/15 blur-[90px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),transparent_55%)] opacity-60" />
    </div>
  );
};

export default AbstractBackdrop;
