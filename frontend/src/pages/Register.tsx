import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
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

const STEPS = ["Personal & Education", "Goals", "Budget & Timeline", "Tests & Finish"];

const Register = () => {
  useDocumentTitle("Complete Your Profile");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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
    setResumeFile(f ?? null);
  };

  const nextStep = () => {
    setError("");
    // Basic validation per step
    if (step === 0) {
      if (!phone || !age || !eduField || !eduInstitution) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (step === 1) {
      if (!targetCountries || !targetCourse) {
        setError("Target countries and course are required.");
        return;
      }
    }
    if (step === 2) {
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

      if (resumeFile) {
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
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-[#f7fbff] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <img src="/landing/fateh_logo.png" alt="Fateh" className="mx-auto h-10 w-auto" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Complete your profile</h1>
          <p className="mt-1 text-sm text-slate-600">
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

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* ---- Step 0: Personal & Education ---- */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Personal & Education</h2>
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

          {/* ---- Step 1: Goals ---- */}
          {step === 1 && (
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

          {/* ---- Step 2: Budget & Timeline ---- */}
          {step === 2 && (
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

          {/* ---- Step 3: Tests & Finish ---- */}
          {step === 3 && (
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
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
              >
                Continue
              </button>
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
    </div>
  );
};

export default Register;
