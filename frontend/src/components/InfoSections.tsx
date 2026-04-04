import { Link } from "react-router-dom";
import AbstractBackdrop from "./AbstractBackdrop";

const learnMore = "font-semibold text-sky-600 hover:text-sky-700 underline-offset-4 hover:underline";

const InfoSections = () => {
  return (
    <div className="relative bg-white">
      <AbstractBackdrop className="opacity-50" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">About</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Professional guidance since 2004.</h3>
        <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
          We believe in helping you conquer your dreams with transparent advice, 120+ university partnerships, and a team led by an IIM Calcutta alumnus. Explore our story, accreditations, and top UK & Ireland university ties.
        </p>
        <Link to="/about" className={`mt-6 inline-block ${learnMore}`}>
          Read the full about page
        </Link>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Services</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">End-to-end overseas education support.</h3>
        <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
          Shortlisting, SOP and essay reviews, applications, scholarships, visa filing, and pre-departure planning—built around your timeline and destination.
        </p>
        <div className="mt-8 grid gap-4 text-slate-700 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            <p className="font-semibold text-slate-900">Planning & shortlisting</p>
            <p className="mt-2 text-sm text-slate-600">Profile mapping, test planning, and university lists matched to your goals.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            <p className="font-semibold text-slate-900">Applications & scholarships</p>
            <p className="mt-2 text-sm text-slate-600">UCAS and institutional portals, references, and funding opportunities.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6">
            <p className="font-semibold text-slate-900">Visa & arrival</p>
            <p className="mt-2 text-sm text-slate-600">Documentation, filing support, and what to expect when you land.</p>
          </div>
        </div>
        <Link to="/services" className={`mt-8 inline-block ${learnMore}`}>
          View all services
        </Link>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Countries</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">UK, Ireland, UAE, and beyond.</h3>
        <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
          Deep partnerships across the UK and Ireland—including all seven Irish universities—plus guidance for the UAE and other regions when your profile fits best.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {["United Kingdom", "Ireland", "United Arab Emirates", "Europe & more"].map((c) => (
            <li key={c} className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-center text-sm font-medium text-slate-800 shadow-sm">
              {c}
            </li>
          ))}
        </ul>
        <Link to="/countries" className={`mt-8 inline-block ${learnMore}`}>
          Explore destinations in detail
        </Link>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Projects</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Programs that go beyond a single application.</h3>
        <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
          Targeted initiatives for competitive admits, Ireland visa excellence, UK Russell Group pathways, and nationwide outreach—so ambitious students get structured support.
        </p>
        <Link to="/projects" className={`mt-6 inline-block ${learnMore}`}>
          See programs & initiatives
        </Link>
      </section>

      <section id="contact" className="relative z-10 mx-auto w-full max-w-6xl border-t border-slate-100 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Contact</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">Plan your next step with us.</h3>
        <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
          Book a conversation or visit one of our Pan-India offices. We will outline timelines, budgets, and a university plan tailored to you.
        </p>
        <Link to="/contact" className={`mt-6 inline-block ${learnMore}`}>
          Go to contact page
        </Link>
      </section>
    </div>
  );
};

export default InfoSections;
