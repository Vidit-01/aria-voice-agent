import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const BLUE = "#014fa3";
const YELLOW = "#ffe131";

// ─── counter hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round((1 - Math.pow(1 - pct, 3)) * target).toLocaleString();
      if (pct < 1) requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { requestAnimationFrame(step); io.disconnect(); } },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return ref;
}

const Stat = ({ value, suffix = "", label, accent }: { value: number; suffix?: string; label: string; accent: string }) => {
  const ref = useCountUp(value);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: accent }}>
        <span ref={ref}>0</span>{suffix}
      </p>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(1,79,163,0.45)" }}>{label}</p>
    </div>
  );
};

// ─── FatehEducationInfo ──────────────────────────────────────────────────────
const FatehEducationInfo = () => (
  <div className="scroll-smooth">

    {/* ══════════════════════════════════════════════════════════════
        1. WHO WE ARE — blue bg + geometric background elements
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-about" className="scroll-mt-20 relative flex min-h-screen items-center overflow-hidden" style={{ background: BLUE }}>

      {/* ── geometric decorations ── */}
      {/* large hollow circle, top-right */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full border-[2px] opacity-[0.08]" style={{ borderColor: YELLOW }} />
      {/* smaller solid circle, bottom-left */}
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-[0.12]" style={{ background: YELLOW }} />
      {/* diagonal stripe top-right */}
      <div className="pointer-events-none absolute right-0 top-0 h-[3px] w-2/3 origin-top-right rotate-[35deg] opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${YELLOW})` }} />
      {/* tilted rectangle */}
      <div className="pointer-events-none absolute right-[8%] bottom-[12%] h-40 w-40 rotate-[22deg] rounded-2xl opacity-[0.07]" style={{ border: `2px solid ${YELLOW}` }} />
      {/* dot matrix */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle, #fff 1.2px, transparent 1.2px)`, backgroundSize: "36px 36px" }} />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-8 py-20 md:grid-cols-2 md:items-center md:gap-20">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: YELLOW }}>About Fateh Education</p>
          <h2 className="text-4xl font-black leading-[1.1] text-white md:text-6xl">
            Who<br /><em className="not-italic" style={{ color: YELLOW }}>We Are</em>
          </h2>
          <div className="my-8 h-1 w-16 rounded-full" style={{ background: YELLOW }} />
          <p className="text-lg leading-relaxed text-white/80">
            Fateh Education is a leading overseas education consultancy helping students conquer
            their study-abroad goals. Since <span className="font-semibold text-white">2004</span>,
            we have guided tens of thousands of students with honest counselling, structured
            applications, and visa support—led by a team that includes an{" "}
            <span className="font-semibold text-white">IIM Calcutta alumnus</span>.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Our focus is on transparent advice—not pressure—so every student walks away with a
            clear, actionable plan tailored to their profile and budget.
          </p>
        </div>

        <div className="relative rounded-3xl p-10 md:p-14" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="absolute -top-5 left-10 text-7xl font-black leading-none" style={{ color: YELLOW, opacity: 0.6 }}>"</div>
          <blockquote className="mt-4 text-xl font-semibold italic leading-relaxed text-white md:text-2xl">
            Professional guidance to Conquer Your Dreams.
          </blockquote>
          <p className="mt-6 text-sm text-white/50">— Fateh Education motto</p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            {[
              { n: "2004", label: "Founded" },
              { n: "IIM-C", label: "Led by Alumni of" },
              { n: "35,000+", label: "Dreams Conquered" },
              { n: "Pan-India", label: "Presence" },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-2xl font-black" style={{ color: YELLOW }}>{n}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        2. STATS + BIG BEN — white bg, blue grid, bigger Ben
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-stats" className="scroll-mt-20 relative flex min-h-screen items-center overflow-hidden" style={{ background: "#fff" }}>

      {/* Blue grid overlay */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(1,79,163,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(1,79,163,0.06) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }} />
      {/* Yellow glow behind stats */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full opacity-20 blur-3xl" style={{ background: YELLOW }} />

      {/* Big Ben — larger, shifted up */}
      <div className="pointer-events-none absolute -bottom-10 right-0 hidden w-[52%] md:block" style={{ top: "-8%" }}>
        <img
          src="/bigben.png"
          alt="Big Ben"
          className="h-full w-full object-contain object-bottom"
          style={{ opacity: 0.18 }}
        />
        {/* fade left */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #fff 0%, transparent 35%)" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 py-20">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BLUE }}>
          Results of almost two decades of hard work, commitment and empathy
        </p>
        <h2 className="mb-16 text-4xl font-black md:text-6xl" style={{ color: BLUE }}>
          The Numbers<br />
          <em className="not-italic" style={{ color: YELLOW }}>Speak</em>
        </h2>

        <div className="grid max-w-4xl grid-cols-2 gap-x-16 gap-y-14 md:grid-cols-4 md:gap-x-20 md:gap-y-0">
          <Stat value={21}    suffix="+" label="Years Flew By"          accent={BLUE}   />
          <Stat value={45000} suffix="+" label="Dreams Conquered"       accent={BLUE}   />
          <Stat value={120}   suffix="+" label="University Partnerships" accent={YELLOW} />
          <Stat value={10000} suffix="+" label="Courses"                 accent={YELLOW} />
        </div>

        {/* Divider */}
        <div className="my-14 h-px w-full max-w-4xl" style={{ background: `linear-gradient(90deg, ${BLUE}40, transparent)` }} />

        <div className="grid max-w-lg gap-4 md:grid-cols-2">
          {[
            { label: "UCAS Accredited", sub: "UK applications" },
            { label: "British Council", sub: "Member" },
            { label: "EI Authorized Partner", sub: "Education in Ireland" },
            { label: "Best Agent of the Year", sub: "Enterprise Ireland — 4× in a row" },
          ].map(({ label, sub }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-2xl px-5 py-4"
              style={{ background: "#f0f5ff", border: `1px solid rgba(1,79,163,0.12)` }}
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: YELLOW }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: BLUE }}>{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        3. MISSION — white bg + subtle geometric bg elements
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-mission" className="scroll-mt-20 relative flex min-h-screen items-center overflow-hidden" style={{ background: "#fff" }}>

      {/* ── geometric decorations (light, non-distracting) ── */}
      <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full opacity-[0.06]" style={{ background: BLUE }} />
      <div className="pointer-events-none absolute right-[10%] top-[8%] h-28 w-28 rotate-[20deg] rounded-2xl opacity-[0.05]" style={{ background: YELLOW }} />
      <div className="pointer-events-none absolute left-[5%] bottom-[10%] h-48 w-48 rounded-full border-[2px] opacity-[0.06]" style={{ borderColor: BLUE }} />
      <div className="pointer-events-none absolute left-[30%] top-[5%] h-[2px] w-48 opacity-[0.08]" style={{ background: `linear-gradient(90deg, transparent, ${YELLOW}, transparent)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(circle, ${BLUE} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <div className="relative flex min-h-[400px] items-end rounded-3xl p-10 md:min-h-[560px]" style={{ background: BLUE }}>
            {/* yellow left bar */}
            <div className="absolute left-0 top-0 h-full w-2 rounded-l-3xl" style={{ background: YELLOW }} />
            {/* small decorative circle inside card */}
            <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full opacity-10" style={{ background: YELLOW }} />
            <div className="pointer-events-none absolute right-6 top-6 h-32 w-32 rounded-full border opacity-10" style={{ borderColor: YELLOW }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Our Mission</p>
              <h3 className="mt-4 text-3xl font-black text-white md:text-4xl">
                Transparent advice.<br />
                <span style={{ color: YELLOW }}>Not pressure.</span>
              </h3>
              <p className="mt-6 text-base leading-relaxed text-white/70">
                We combine human expertise with modern tools—including AI-assisted sessions—so you
                get clear next steps for shortlisting, funding, timelines, and documentation.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BLUE }}>How we do it</p>
            <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
              Professional guidance<br />
              <span style={{ color: BLUE }}>you can trust</span>
            </h2>
            {[
              { icon: "01", title: "Profile-first approach", body: "Every recommendation starts from your actual scores, budget, and aspirations—not a generic template." },
              { icon: "02", title: "Data + human expertise", body: "AI tools surface insights; experienced counselors make the judgement calls. You get the best of both." },
              { icon: "03", title: "Accountability at every step", body: "Dedicated milestone checkpoints from shortlist to visa—so nothing slips through." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ background: YELLOW, color: "#111" }}>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        4. SERVICES — yellow numbers, yellow accents
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-services" className="scroll-mt-20 flex min-h-screen items-center" style={{ background: "#f5f8ff" }}>
      <div className="mx-auto w-full max-w-7xl px-8 py-20">
        <div className="mb-14 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BLUE }}>What we offer</p>
            <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
              End-to-end<br />
              <span style={{ color: BLUE }}>counselling & support</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500">
            One team. The entire journey—from first profile review to arrival.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              num: "01",
              title: "Planning & Shortlisting",
              body: "Profile review, test planning, and destination-aware university lists aligned with your budget and career goals.",
              dark: false,
            },
            {
              num: "02",
              title: "Applications & Scholarships",
              body: "Support for UCAS and institutional applications, references, essays/SOP feedback, and scholarship awareness.",
              dark: true,
            },
            {
              num: "03",
              title: "Visa & Pre-Departure",
              body: "Documentation, filing guidance, and checklists so you arrive prepared—especially for UK and Ireland pathways.",
              dark: false,
            },
          ].map(({ num, title, body, dark }) => (
            <div
              key={title}
              className="relative flex flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-10"
              style={{
                background: dark ? BLUE : "#fff",
                border: dark ? "none" : "1px solid rgba(1,79,163,0.1)",
                boxShadow: "0 16px 48px rgba(1,79,163,0.07)",
              }}
            >
              {/* Big yellow number — fully visible, full opacity */}
              <span className="text-6xl font-black" style={{ color: YELLOW }}>
                {num}
              </span>
              <div className="mt-4">
                <h3 className="text-xl font-bold" style={{ color: dark ? "#fff" : "#111" }}>
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: dark ? "rgba(255,255,255,0.65)" : "#64748b" }}>
                  {body}
                </p>
              </div>
              <div className="mt-8 h-1 w-12 rounded-full" style={{ background: YELLOW }} />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {["IELTS / TOEFL Prep Guidance", "SOP Review", "Interview Coaching", "Scholarship Research", "Pre-Visa Documentation", "Post-Arrival Support"].map((tag) => (
            <span key={tag} className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: "#e8eeff", color: BLUE }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        5. INDIA MAP — bigger map, tighter layout
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-india" className="scroll-mt-20 flex min-h-screen items-center" style={{ background: BLUE }}>
      {/* dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12 md:px-8 md:py-16">
        {/* Map — larger */}
        <div className="flex items-center justify-center">
          <img
            src="/india.png"
            alt="Fateh offices across India"
            className="w-full max-w-none object-contain drop-shadow-2xl"
            style={{ maxHeight: "80vh" }}
          />
        </div>

        {/* Cities */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: YELLOW }}>Pan-India presence</p>
          <h2 className="mb-6 text-4xl font-black text-white md:text-5xl">
            9 Cities.<br /><span style={{ color: YELLOW }}>One Standard.</span>
          </h2>
          <p className="mb-8 text-base leading-relaxed text-white/70">
            Every Fateh office runs on the same counseling playbook—so whether you walk in to our
            Pune branch or join online from Kolkata, you receive equal quality guidance.
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {["Delhi", "Ahmedabad", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Mumbai", "Pune", "Chandigarh"].map((city) => (
              <div
                key={city}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: YELLOW }} />
                <span className="text-sm font-medium text-white">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        6. PARTNERSHIPS — blue bg, geometric shapes, dynamic
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-partners" className="scroll-mt-20 relative flex min-h-screen items-center overflow-hidden" style={{ background: "#fff" }}>

      {/* geometric bg — now using blue tones on white */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full opacity-[0.04]" style={{ background: BLUE }} />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full opacity-[0.05]" style={{ background: BLUE }} />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-px w-64 -rotate-[30deg] opacity-15" style={{ background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)` }} />
      <div className="pointer-events-none absolute right-[15%] bottom-[20%] h-36 w-36 rotate-[15deg] rounded-2xl border opacity-[0.07]" style={{ borderColor: BLUE }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(circle, rgba(1,79,163,0.6) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 py-20">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BLUE }}>Reach & Partnerships</p>
          <h2 className="text-4xl font-black md:text-5xl" style={{ color: BLUE }}>
            Where students<br />
            <span style={{ color: YELLOW }}>go with us</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              title: "United Kingdom",
              body: "120+ university partnerships across the UK, including ties with some of the top-10 ranked institutions. UCAS-accredited process from shortlist to offer.",
              tags: ["UCAS Accredited", "Top-10 Ties", "120+ Partners"],
              highlight: true,
            },
            {
              title: "Ireland",
              body: "Partnerships with all seven Irish universities. Authorized Education in Ireland partner. Award-winning track record recognized by Enterprise Ireland four years running.",
              tags: ["All 7 Irish Unis", "EI Authorized", "Best Agent 4×"],
              highlight: false,
            },
            {
              title: "UAE & Beyond",
              body: "Expanding corridors for students targeting UAE campuses and other global destinations—matching programs with your specific academic and career goals.",
              tags: ["UAE Campuses", "Global Shortlisting"],
              highlight: false,
            },
            {
              title: "Accreditations",
              body: "UCAS accredited. Member of the British Council. Education in Ireland authorized partner. Awarded Best Agent of the Year four consecutive years by Enterprise Ireland.",
              tags: ["British Council", "UCAS", "Enterprise Ireland"],
              highlight: true,
            },
          ].map(({ title, body, tags, highlight }) => (
            <div
              key={title}
              className="rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 md:p-10"
              style={{
                background: highlight
                  ? `rgba(255,225,49,0.50)`
                  : `rgba(1,79,163,0.08)`,
                border: highlight
                  ? `1px solid rgba(255,225,49,0.6)`
                  : `1px solid rgba(1,79,163,0.12)`,
                backdropFilter: "blur(8px)",
              }}
            >
              <h3 className="text-xl font-black" style={{ color: BLUE }}>
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(1,40,100,0.75)" }}>
                {body}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={
                      highlight
                        ? { background: "rgba(1,79,163,0.12)", color: BLUE }
                        : { background: "rgba(1,79,163,0.08)", color: BLUE }
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ══════════════════════════════════════════════════════════════
        7. CTA — dark bg, geometric, dynamic
    ══════════════════════════════════════════════════════════════ */}
    <section id="fateh-contact" className="scroll-mt-20 relative flex min-h-[80vh] items-center overflow-hidden" style={{ background: "#05102b" }}>

      {/* geometric elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.08]" style={{ background: BLUE }} />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full opacity-[0.12]" style={{ background: YELLOW }} />
      <div className="pointer-events-none absolute right-[20%] top-[15%] h-px w-64 rotate-[25deg] opacity-25" style={{ background: `linear-gradient(90deg, transparent, ${YELLOW}, transparent)` }} />
      <div className="pointer-events-none absolute left-[15%] bottom-[20%] h-24 w-24 rotate-[10deg] rounded-2xl border opacity-15" style={{ borderColor: YELLOW }} />
      {/* blue grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(1,79,163,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(1,79,163,0.5) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-8 py-20 text-center">
        <div className="mb-6 inline-block rounded-full px-5 py-2" style={{ background: "rgba(255,225,49,0.15)", border: `1px solid rgba(255,225,49,0.3)` }}>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: YELLOW }}>Next step</p>
        </div>
        <h2 className="text-4xl font-black leading-tight text-white md:text-6xl">
          Talk to<br />
          <span style={{ color: YELLOW }}>Fateh Education</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/55">
          Create an account or sign in to begin your journey—or reach out through your preferred
          Fateh office. We will align a realistic timeline, budget, and university plan for you.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="inline-block rounded-full px-9 py-4 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98]"
            style={{ background: YELLOW, color: "#111", boxShadow: `0 8px 32px rgba(255,225,49,0.35)` }}
          >
            Start Your Application
          </Link>
          <a
            href="#fateh-about"
            className="inline-block rounded-full border px-9 py-4 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            Learn more ↑
          </a>
        </div>
      </div>
    </section>
  </div>
);

export default FatehEducationInfo;
