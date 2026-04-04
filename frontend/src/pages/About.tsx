import PageLayout from "@/components/PageLayout";

const stats = [
  "120+ Top University Partnerships",
  "Some UK Top 10 & all 7 Irish Universities work with us",
  "Pan India offices in 9 key cities & counting",
  "200+ team members & growing",
  "40,000+ dreams conquered",
  "Member of the British Council & UCAS accredited",
  "Education in Ireland authorized partner",
  "99% Ireland student visa success rate",
  'Awarded the "Best Agent of the Year" 4 years in a row by Enterprise Ireland, the government body of Ireland.',
];

const irelandUnis = [
  "University College Dublin (UCD)",
  "Trinity College Dublin (TCD)",
  "University College Cork",
  "University of Limerick",
  "Dublin City University",
];

const ukUnis = [
  "The University of Manchester",
  "University of Bath",
  "University of Bristol",
  "University of Glasgow",
  "University of Leicester",
];

const About = () => {
  return (
    <PageLayout title="About" heading="About Fateh">
      <div className="max-w-none">
        <p className="text-lg leading-relaxed text-slate-700 md:text-xl">
          We at Fateh believe in providing professional guidance to conquer your dreams. Get expert admission guidance from a team led by an alumnus of{" "}
          <span className="font-semibold text-slate-900">IIM Calcutta</span>. Since 2004, we have guided students and helped conquer over{" "}
          <span className="font-semibold text-slate-900">35,000 dreams</span>—with a growing community of success stories across the UK, Ireland, and beyond.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Why students choose us</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {stats.map((line) => (
            <li
              key={line}
              className="flex gap-3 rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm md:text-base"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Top universities in Ireland</h2>
          <p className="mt-2 text-sm text-slate-600">
            Strong partnerships across Ireland&apos;s leading institutions—including all seven Irish universities.
          </p>
          <ul className="mt-6 space-y-3">
            {irelandUnis.map((u) => (
              <li key={u} className="border-b border-slate-100 pb-3 text-slate-800 last:border-0 last:pb-0">
                {u}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Top universities in the UK</h2>
          <p className="mt-2 text-sm text-slate-600">
            Including collaborations with some of the UK&apos;s top-ranked universities.
          </p>
          <ul className="mt-6 space-y-3">
            {ukUnis.map((u) => (
              <li key={u} className="border-b border-slate-100 pb-3 text-slate-800 last:border-0 last:pb-0">
                {u}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-14 rounded-3xl bg-slate-900 px-8 py-10 text-white md:px-12">
        <h2 className="text-xl font-bold md:text-2xl">At a glance</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="text-sm leading-snug text-slate-200 md:text-base">Some of the UK&apos;s top 10 universities work with us</li>
          <li className="text-sm leading-snug text-slate-200 md:text-base">120+ top university partnerships</li>
          <li className="text-sm leading-snug text-slate-200 md:text-base">200+ expert professionals and growing</li>
          <li className="text-sm leading-snug text-slate-200 md:text-base">Over 40,000 success stories</li>
          <li className="text-sm leading-snug text-slate-200 md:text-base">Pan-India offices in 9 key cities & counting</li>
          <li className="text-sm leading-snug text-slate-200 md:text-base">UCAS accredited and member of the British Council</li>
        </ul>
      </section>
    </PageLayout>
  );
};

export default About;
