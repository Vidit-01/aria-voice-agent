import AbstractBackdrop from "./AbstractBackdrop";

const InfoSections = () => {
  return (
    <div className="relative bg-white">
      <AbstractBackdrop className="opacity-50" />
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">About</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">A focused team, a clear path.</h3>
        <p className="mt-4 text-base text-slate-600 md:text-lg">
          We help students craft the right overseas plan through transparent advice, university shortlists, and visa guidance.
        </p>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Services</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Everything you need, end to end.</h3>
        <div className="mt-6 grid gap-4 text-slate-600 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            Shortlisting, SOP reviews, and document readiness.
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            Application submissions and scholarship guidance.
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            Visa filing, pre-departure, and onboarding support.
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Countries</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Destinations students love.</h3>
        <p className="mt-4 text-base text-slate-600 md:text-lg">
          UK, Ireland, UAE, and more - with tailored program matching based on your goals.
        </p>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Contact</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Let's plan your next step.</h3>
        <p className="mt-4 text-base text-slate-600 md:text-lg">
          Talk to our counselors to get a timeline, budget estimate, and university plan.
        </p>
      </section>
    </div>
  );
};

export default InfoSections;
