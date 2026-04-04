import { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import AuthPageLayout, { authLogoClassName } from "@/components/AuthPageLayout";
import { submitProfile, uploadResume, analyzeProfile } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { ProfilePayload, Education, Budget, Timeline, TestScores } from "@/lib/api";

// ---- helpers ----

function commaSplit(str: string): string[] {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function numOrNull(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function strVal(val: unknown): string {
  if (val == null) return "";
  return String(val);
}

const STEPS = ["Resume Upload", "Personal & Education", "Goals", "Budget & Timeline", "Tests & Finish"];

const MINIMAL_PROFILE: ProfilePayload = {
  full_name: "",
  phone: "",
  age: 0,
  current_education: { level: "Bachelor's", field: "", institution: "", gpa: null, graduation_year: null },
  target_countries: [],
  target_course: "",
  target_universities: [],
  budget: { annual_tuition_usd: null, living_expenses_usd: null, funding_source: "education_loan", scholarship_applied: false },
  timeline: { preferred_intake: "", application_deadline_awareness: false, months_to_start: null },
  test_scores: { ielts: null, toefl: null, gre: null, gmat: null, duolingo: null },
  previous_visa_rejection: false,
  preferred_language: "auto",
};

const Register = () => {
  useDocumentTitle("Complete Your Profile");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- Step 0: Resume Upload ----
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseSuccess, setParseSuccess] = useState("");
  const [autofillCount, setAutofillCount] = useState(0);
  const [resumeAlreadyUploaded, setResumeAlreadyUploaded] = useState(false);

  // ---- Step 1: Personal & Education ----
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [eduLevel, setEduLevel] = useState("Bachelor's");
  const [eduField, setEduField] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduGpa, setEduGpa] = useState("");
  const [eduGradYear, setEduGradYear] = useState("");

  // ---- Step 2: Goals ----
  const [targetCountries, setTargetCountries] = useState("");
  const [targetCourse, setTargetCourse] = useState("");
  const [targetUniversities, setTargetUniversities] = useState("");

  // ---- Step 3: Budget & Timeline ----
  const [tuitionUsd, setTuitionUsd] = useState("");
  const [livingUsd, setLivingUsd] = useState("");
  const [fundingSource, setFundingSource] = useState("education_loan");
  const [scholarshipApplied, setScholarshipApplied] = useState(false);
  const [preferredIntake, setPreferredIntake] = useState("");
  const [monthsToStart, setMonthsToStart] = useState("");
  const [deadlineAwareness, setDeadlineAwareness] = useState(false);

  // ---- Step 4: Tests & Finish ----
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");
  const [gre, setGre] = useState("");
  const [gmat, setGmat] = useState("");
  const [duolingo, setDuolingo] = useState("");
  const [prevVisaRejection, setPrevVisaRejection] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("auto");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type !== "application/pdf") {
      setError("Only PDF files are accepted for resume.");
      return;
    }
    if (f && f.size > 5 * 1024 * 1024) {
      setError("Resume must be under 5 MB.");
      return;
    }
    setError("");
    setParseSuccess("");
    setResumeFile(f ?? null);
  };

  const autofillFromParsed = (parsed: Record<string, unknown>) => {
    let count = 0;

    const p = parsed as Record<string, unknown>;

    if (p.phone && !phone) { setPhone(strVal(p.phone)); count++; }
    if (p.age && !age) { setAge(strVal(p.age)); count++; }

    const edu = (p.current_education ?? {}) as Record<string, unknown>;
    if (edu.level) { setEduLevel(strVal(edu.level)); count++; }
    if (edu.field && !eduField) { setEduField(strVal(edu.field)); count++; }
    if (edu.institution && !eduInstitution) { setEduInstitution(strVal(edu.institution)); count++; }
    if (edu.gpa != null && !eduGpa) { setEduGpa(strVal(edu.gpa)); count++; }
    if (edu.graduation_year != null && !eduGradYear) { setEduGradYear(strVal(edu.graduation_year)); count++; }

    const countries = p.target_countries as string[] | undefined;
    if (countries?.length && !targetCountries) { setTargetCountries(countries.join(", ")); count++; }
    if (p.target_course && !targetCourse) { setTargetCourse(strVal(p.target_course)); count++; }
    const unis = p.target_universities as string[] | undefined;
    if (unis?.length && !targetUniversities) { setTargetUniversities(unis.join(", ")); count++; }

    const b = (p.budget ?? {}) as Record<string, unknown>;
    if (b.annual_tuition_usd != null && !tuitionUsd) { setTuitionUsd(strVal(b.annual_tuition_usd)); count++; }
    if (b.living_expenses_usd != null && !livingUsd) { setLivingUsd(strVal(b.living_expenses_usd)); count++; }
    if (b.funding_source) { setFundingSource(strVal(b.funding_source)); count++; }
    if (b.scholarship_applied !== undefined) { setScholarshipApplied(!!b.scholarship_applied); count++; }

    const t = (p.timeline ?? {}) as Record<string, unknown>;
    if (t.preferred_intake && !preferredIntake) { setPreferredIntake(strVal(t.preferred_intake)); count++; }
    if (t.months_to_start != null && !monthsToStart) { setMonthsToStart(strVal(t.months_to_start)); count++; }
    if (t.application_deadline_awareness !== undefined) { setDeadlineAwareness(!!t.application_deadline_awareness); count++; }

    const ts = (p.test_scores ?? {}) as Record<string, unknown>;
    if (ts.ielts != null && !ielts) { setIelts(strVal(ts.ielts)); count++; }
    if (ts.toefl != null && !toefl) { setToefl(strVal(ts.toefl)); count++; }
    if (ts.gre != null && !gre) { setGre(strVal(ts.gre)); count++; }
    if (ts.gmat != null && !gmat) { setGmat(strVal(ts.gmat)); count++; }
    if (ts.duolingo != null && !duolingo) { setDuolingo(strVal(ts.duolingo)); count++; }

    if (p.previous_visa_rejection !== undefined) { setPrevVisaRejection(!!p.previous_visa_rejection); count++; }
    if (p.preferred_language) { setPreferredLanguage(strVal(p.preferred_language)); count++; }

    setAutofillCount(count);
  };

  const handleResumeUpload = async () => {
    if (!user || !resumeFile) return;
    setParseLoading(true);
    setError("");
    setParseSuccess("");
    try {
      // Ensure a profile row exists so the upload endpoint can find it
      await submitProfile({ ...MINIMAL_PROFILE, full_name: user.full_name });
      const result = await uploadResume(user.user_id, resumeFile);
      if (result.parsed_profile) {
        autofillFromParsed(result.parsed_profile);
        setResumeAlreadyUploaded(true);
        setParseSuccess("resume_ok");
      }
      setTimeout(() => setStep(1), 1200);
    } catch {
      setError("Resume parsing failed. You can fill in the form manually.");
      setTimeout(() => { setError(""); setStep(1); }, 2500);
    } finally {
      setParseLoading(false);
    }
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!phone || !age || !eduField || !eduInstitution) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (step === 2) {
      if (!targetCountries || !targetCourse) {
        setError("Target countries and course are required.");
        return;
      }
    }
    if (step === 3) {
      if (!preferredIntake) {
        setError("Preferred intake is required.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");
    setLoading(true);

    const education: Education = {
      level: eduLevel,
      field: eduField,
      institution: eduInstitution,
      gpa: numOrNull(eduGpa),
      graduation_year: numOrNull(eduGradYear),
    };

    const budget: Budget = {
      annual_tuition_usd: numOrNull(tuitionUsd),
      living_expenses_usd: numOrNull(livingUsd),
      funding_source: fundingSource,
      scholarship_applied: scholarshipApplied,
    };

    const timeline: Timeline = {
      preferred_intake: preferredIntake,
      application_deadline_awareness: deadlineAwareness,
      months_to_start: numOrNull(monthsToStart),
    };

    const testScores: TestScores = {
      ielts: numOrNull(ielts),
      toefl: numOrNull(toefl),
      gre: numOrNull(gre),
      gmat: numOrNull(gmat),
      duolingo: numOrNull(duolingo),
    };

    const payload: ProfilePayload = {
      full_name: user.full_name,
      phone,
      age: parseInt(age, 10),
      current_education: education,
      target_countries: commaSplit(targetCountries),
      target_course: targetCourse,
      target_universities: commaSplit(targetUniversities),
      budget,
      timeline,
      test_scores: testScores,
      previous_visa_rejection: prevVisaRejection,
      preferred_language: preferredLanguage,
    };

    try {
      await submitProfile(payload);

      // Only upload resume here if it wasn't already uploaded in step 0
      if (resumeFile && !resumeAlreadyUploaded) {
        await uploadResume(user.user_id, resumeFile);
      }

      // Trigger AI pre-analysis in the background — non-blocking so dashboard loads fast
      analyzeProfile(user.user_id).catch(() => {});

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Could not save profile. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner backdrop-blur-sm focus:border-sky-400/80 focus:outline-none focus:ring-2 focus:ring-sky-200/60";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <AuthPageLayout scrollable>
      <div className="mx-auto w-full max-w-2xl px-1">
        <div className="mb-8 text-center">
          <Link to="/" className="block">
            <img
              src="/landing/fateh_logo.png"
              alt="Fateh Education"
              className={authLogoClassName}
            />
          </Link>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900 drop-shadow-sm md:mt-6">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This helps our AI counselor understand your situation before your session.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full ${
                  i <= step ? "bg-sky-500" : "bg-slate-200"
                }`}
              />
              <span className={`text-xs ${i === step ? "font-semibold text-sky-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/50 bg-white/45 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* ---- Step 0: Resume Upload ---- */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upload your resume</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload your CV and we'll auto-fill as many fields as possible — saving you time.
                </p>
              </div>

              {parseSuccess === "resume_ok" ? (
                <div className="rounded-xl bg-green-50 px-4 py-4 text-sm text-green-800">
                  <p className="font-semibold">Resume parsed successfully!</p>
                  {autofillCount > 0 && (
                    <p className="mt-1 text-green-700">
                      {autofillCount} field{autofillCount !== 1 ? "s" : ""} auto-filled. Review them in the next steps and edit as needed.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-green-600">Redirecting you to the form…</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center">
                    <div className="mb-4 text-4xl">📄</div>
                    <p className="mb-4 text-sm text-slate-600">
                      PDF only · max 5 MB
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                    />
                    {resumeFile && (
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleResumeUpload}
                      disabled={!resumeFile || parseLoading}
                      className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:opacity-50"
                    >
                      {parseLoading ? "Parsing resume…" : "Upload & Auto-fill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---- Step 1: Personal & Education ---- */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Personal & Education</h2>
              {autofillCount > 0 && (
                <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
                  {autofillCount} fields were auto-filled from your resume. Review and edit as needed.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className={labelCls}>Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={inputCls}
                    placeholder="22"
                    min="16"
                    max="60"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Education level *</label>
                <select
                  value={eduLevel}
                  onChange={(e) => setEduLevel(e.target.value)}
                  className={inputCls}
                >
                  <option>High School</option>
                  <option>Bachelor's</option>
                  <option>Master's</option>
                  <option>PhD</option>
                  <option>Diploma</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Field of study *</label>
                  <input
                    type="text"
                    value={eduField}
                    onChange={(e) => setEduField(e.target.value)}
                    className={inputCls}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className={labelCls}>Institution *</label>
                  <input
                    type="text"
                    value={eduInstitution}
                    onChange={(e) => setEduInstitution(e.target.value)}
                    className={inputCls}
                    placeholder="SPPU"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>GPA / Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eduGpa}
                    onChange={(e) => setEduGpa(e.target.value)}
                    className={inputCls}
                    placeholder="8.4"
                  />
                </div>
                <div>
                  <label className={labelCls}>Graduation year</label>
                  <input
                    type="number"
                    value={eduGradYear}
                    onChange={(e) => setEduGradYear(e.target.value)}
                    className={inputCls}
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 2: Goals ---- */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Your Study Goals</h2>
              <div>
                <label className={labelCls}>Target countries * (comma-separated)</label>
                <input
                  type="text"
                  value={targetCountries}
                  onChange={(e) => setTargetCountries(e.target.value)}
                  className={inputCls}
                  placeholder="Germany, Canada"
                />
                <p className="mt-1 text-xs text-slate-400">e.g. UK, Ireland, Germany</p>
              </div>
              <div>
                <label className={labelCls}>Target course *</label>
                <input
                  type="text"
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  className={inputCls}
                  placeholder="MS in Data Science"
                />
              </div>
              <div>
                <label className={labelCls}>Target universities (comma-separated)</label>
                <input
                  type="text"
                  value={targetUniversities}
                  onChange={(e) => setTargetUniversities(e.target.value)}
                  className={inputCls}
                  placeholder="TU Munich, University of Toronto"
                />
              </div>
            </div>
          )}

          {/* ---- Step 3: Budget & Timeline ---- */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Budget & Timeline</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Annual tuition budget (USD)</label>
                  <input
                    type="number"
                    value={tuitionUsd}
                    onChange={(e) => setTuitionUsd(e.target.value)}
                    className={inputCls}
                    placeholder="20000"
                  />
                </div>
                <div>
                  <label className={labelCls}>Living expenses / year (USD)</label>
                  <input
                    type="number"
                    value={livingUsd}
                    onChange={(e) => setLivingUsd(e.target.value)}
                    className={inputCls}
                    placeholder="12000"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Funding source</label>
                <select
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value)}
                  className={inputCls}
                >
                  <option value="education_loan">Education loan</option>
                  <option value="self_funded">Self funded</option>
                  <option value="family_support">Family support</option>
                  <option value="scholarship">Scholarship</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={scholarshipApplied}
                  onChange={(e) => setScholarshipApplied(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                />
                <span className="text-sm text-slate-700">I have applied for a scholarship</span>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Preferred intake *</label>
                  <input
                    type="text"
                    value={preferredIntake}
                    onChange={(e) => setPreferredIntake(e.target.value)}
                    className={inputCls}
                    placeholder="Fall 2025"
                  />
                </div>
                <div>
                  <label className={labelCls}>Months until you need to start</label>
                  <input
                    type="number"
                    value={monthsToStart}
                    onChange={(e) => setMonthsToStart(e.target.value)}
                    className={inputCls}
                    placeholder="8"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={deadlineAwareness}
                  onChange={(e) => setDeadlineAwareness(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                />
                <span className="text-sm text-slate-700">
                  I am aware of application deadlines for my target universities
                </span>
              </label>
            </div>
          )}

          {/* ---- Step 4: Tests & Finish ---- */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Test Scores & Final Details</h2>
              <p className="text-sm text-slate-500">Leave blank if not applicable or not yet taken.</p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "IELTS", val: ielts, set: setIelts, ph: "7.5" },
                  { label: "TOEFL", val: toefl, set: setToefl, ph: "105" },
                  { label: "GRE", val: gre, set: setGre, ph: "318" },
                  { label: "GMAT", val: gmat, set: setGmat, ph: "680" },
                  { label: "Duolingo", val: duolingo, set: setDuolingo, ph: "120" },
                ].map(({ label, val, set, ph }) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className={inputCls}
                      placeholder={ph}
                    />
                  </div>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={prevVisaRejection}
                  onChange={(e) => setPrevVisaRejection(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                />
                <span className="text-sm text-slate-700">I have had a previous visa rejection</span>
              </label>
              <div>
                <label className={labelCls}>Preferred language for the AI session</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className={inputCls}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
              {!resumeAlreadyUploaded && (
                <div>
                  <label className={labelCls}>Resume / CV (PDF, max 5 MB)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                  />
                  {resumeFile && (
                    <p className="mt-1 text-xs text-slate-500">{resumeFile.name}</p>
                  )}
                </div>
              )}
              {resumeAlreadyUploaded && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                  ✓ Resume already uploaded and parsed
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              step === 0 ? null : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
                >
                  Continue
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Saving…" : "Save & Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default Register;
