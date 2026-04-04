import PageLayout from "@/components/PageLayout";

const pillars = [
  {
    title: "Profile & pathway planning",
    body: "We map your academic background, test scores, and career goals to a realistic timeline—from intake choice to backup options—so every application has a clear story.",
  },
  {
    title: "University shortlisting & applications",
    body: "Data-led shortlists across the UK, Ireland, and other destinations, plus end-to-end support on forms, references, and deadlines aligned with UCAS and institutional portals.",
  },
  {
    title: "SOP, essays & portfolio reviews",
    body: "Structured feedback on statements of purpose, supplemental essays, and course-specific writing—edited for clarity, authenticity, and what admissions teams actually look for.",
  },
  {
    title: "Scholarships & funding guidance",
    body: "Identify merit and need-based opportunities, prepare documentation, and coordinate timelines so you do not miss critical scholarship windows.",
  },
  {
    title: "Visa counseling & documentation",
    body: "Step-by-step visa preparation with document checklists, mock interviews where relevant, and filing support—with a strong track record on Ireland study visas.",
  },
  {
    title: "Pre-departure & arrival support",
    body: "Housing pointers, travel checklists, banking and insurance basics, and what to expect in your first weeks abroad so you land prepared.",
  },
];

const Services = () => {
  return (
    <PageLayout title="Services" heading="Our services">
      <p className="max-w-3xl text-lg text-slate-700 md:text-xl">
        Fateh offers full-stack overseas education support—from the first conversation to your first day on campus. Every engagement is tailored; nothing is one-size-fits-all.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {pillars.map((p) => (
          <article
            key={p.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:border-sky-200 hover:shadow-[0_16px_48px_rgba(14,165,233,0.12)]"
          >
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">{p.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{p.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-14 rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-8 py-10 md:px-12">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">How we work with you</h2>
        <ol className="mt-6 list-decimal space-y-4 pl-5 text-slate-700 marker:font-semibold marker:text-sky-600">
          <li>Discovery call to understand goals, budget, and timeline.</li>
          <li>Custom roadmap with university list, test plan, and milestone dates.</li>
          <li>Dedicated counselor checkpoints through applications and outcomes.</li>
          <li>Visa and pre-departure handoffs once admits are in place.</li>
        </ol>
      </section>
    </PageLayout>
  );
};

export default Services;
