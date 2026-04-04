import PageLayout from "@/components/PageLayout";

const destinations = [
  {
    name: "United Kingdom",
    tag: "UCAS · Russell Group pathways",
    highlights: [
      "Applications through UCAS with structured deadline management and firm/insurance choice guidance.",
      "Partnerships spanning some of the UK’s top 10 universities and 120+ institutions overall.",
      "Support for undergraduate, postgraduate, and pathway programs with scholarship awareness built in.",
    ],
  },
  {
    name: "Ireland",
    tag: "All 7 Irish universities · High visa success",
    highlights: [
      "Authorized Education in Ireland partner with relationships across UCD, TCD, UCC, UL, DCU, and more.",
      "99% Ireland student visa success rate with document-led counseling and filing support.",
      "Post-study work options and EU-facing career pathways explained in plain language.",
    ],
  },
  {
    name: "United Arab Emirates",
    tag: "Global campuses · Fast-growing hub",
    highlights: [
      "Options for students seeking international degrees in a regional business and innovation hub.",
      "Help comparing branch campuses, intakes, and total cost of attendance.",
      "Visa and residency basics coordinated with your study plan.",
    ],
  },
  {
    name: "Europe & beyond",
    tag: "Tailored shortlists",
    highlights: [
      "Where your profile fits best—not a generic country list.",
      "Language requirements, credit systems, and timeline differences explained upfront.",
      "We expand or narrow destinations as your goals evolve.",
    ],
  },
];

const Countries = () => {
  return (
    <PageLayout title="Countries" heading="Study destinations">
      <p className="max-w-3xl text-lg text-slate-700 md:text-xl">
        We place students where they will thrive academically and culturally. Below is how we approach our strongest corridors—always customized to your profile.
      </p>

      <div className="mt-12 space-y-8">
        {destinations.map((d) => (
          <section
            key={d.name}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]"
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 md:px-8">
              <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{d.name}</h2>
              <p className="mt-1 text-sm font-medium uppercase tracking-wider text-sky-600">{d.tag}</p>
            </div>
            <ul className="space-y-3 px-6 py-6 md:px-8">
              {d.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageLayout>
  );
};

export default Countries;
