import PageLayout from "@/components/PageLayout";

const Contact = () => {
  return (
    <PageLayout title="Contact" heading="Contact us">
      <p className="max-w-2xl text-lg text-slate-700">
        Reach out for a free profile evaluation or to book a session at one of our Pan-India offices. We will respond with next steps and a realistic timeline.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-bold text-slate-900">Send a message</h2>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone (optional)
              </label>
              <input
                id="phone"
                type="tel"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="+91 ..."
              />
            </div>
            <div>
              <label htmlFor="msg" className="block text-sm font-medium text-slate-700">
                How can we help?
              </label>
              <textarea
                id="msg"
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Destination, intake year, course area..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
            >
              Submit inquiry
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-bold text-slate-900">Visit us</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Pan-India offices in <span className="font-semibold text-slate-800">9 key cities</span> and counting. Exact addresses and hours are shared when you book—so we can match you with the right counselor.
            </p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-8">
            <h2 className="text-lg font-bold text-slate-900">Accreditations</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>UCAS accredited · British Council member</li>
              <li>Education in Ireland authorized partner</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Contact;
