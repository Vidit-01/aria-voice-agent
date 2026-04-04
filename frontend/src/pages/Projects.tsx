import PageLayout from "@/components/PageLayout";

const initiatives = [
  {
    title: "Dreams conquered initiative",
    description:
      "A structured mentoring track for high-potential students targeting competitive programs—extra focus on narrative, leadership evidence, and differentiation in crowded applicant pools.",
    outcomes: ["Merit scholarship wins across UK and Ireland", "Strong conversion from admit to visa"],
  },
  {
    title: "Ireland excellence cohort",
    description:
      "Specialized preparation for Irish university applications and visa filings, aligned with Education in Ireland guidelines and our Enterprise Ireland–recognized counseling standards.",
    outcomes: ["Document-first visa packs", "Orientation on part-time work and post-study routes"],
  },
  {
    title: "UK Russell & red-brick pipeline",
    description:
      "Targeted support for students aiming at Russell Group and other top-tier UK offers, with UCAS strategy, interview prep where required, and firm/insurance optimization.",
    outcomes: ["Timely UCAS submission", "Realistic insurance choices to protect your year"],
  },
  {
    title: "Pan-India outreach",
    description:
      "Workshops and webinars across our nine key city offices (and growing) so families get the same quality of guidance whether you walk in or join online.",
    outcomes: ["Consistent counseling playbooks", "Local context with global standards"],
  },
];

const Projects = () => {
  return (
    <PageLayout title="Projects" heading="Programs & initiatives">
      <p className="max-w-3xl text-lg text-slate-700 md:text-xl">
        Beyond individual counseling, Fateh runs focused initiatives that bundle expertise, partnerships, and accountability—so ambitious students are not navigating complexity alone.
      </p>

      <div className="mt-12 space-y-8">
        {initiatives.map((item) => (
          <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)] md:p-10">
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{item.title}</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">{item.description}</p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Typical outcomes</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {item.outcomes.map((o) => (
                  <li key={o} className="rounded-full bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-900">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-14 rounded-3xl bg-slate-900 px-8 py-10 text-center text-white md:px-12">
        <p className="text-lg font-semibold md:text-xl">40,000+ stories—and we measure success in admits, visas, and confident arrivals.</p>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Ask your counselor how these initiatives map to your intake and destination.
        </p>
      </section>
    </PageLayout>
  );
};

export default Projects;
