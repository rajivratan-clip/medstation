import { useEffect, useState } from "react";
import { Search, Camera, UserPlus, X, ArrowLeft } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";
import { usePatientStore } from "@/store/patientStore";
import type { PatientResult } from "./ResultsModal";

type PatientSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSearchResults: (results: PatientResult[]) => void;
  /** Called after user enters age + sex for an unknown patient; opens encounter-type flow next. */
  onUnknownPatient?: (demographics: { age: number; sex: "M" | "F" }) => void;
};

const inputBase =
  "w-full h-10 rounded-md border border-border bg-secondary/35 px-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25";

type Step = "search" | "unknown";

export default function PatientSearchModal({
  open,
  onClose,
  onSearchResults,
  onUnknownPatient,
}: PatientSearchModalProps) {
  const { setCurrentModal } = usePageContext();
  const { patients, encounters } = usePatientStore();
  const [step, setStep] = useState<Step>("search");
  const [sexVisual, setSexVisual] = useState<"male" | "female" | null>(null);
  const [idQuery, setIdQuery] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [unknownAge, setUnknownAge] = useState("");
  const [unknownSex, setUnknownSex] = useState<"M" | "F" | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentModal(step === "unknown" ? "Unknown patient demographics" : "Patient Search Modal");
    } else {
      setCurrentModal(null);
      setStep("search");
      setIdQuery("");
      setFirstName("");
      setLastName("");
      setSexVisual(null);
      setUnknownAge("");
      setUnknownSex(null);
    }
  }, [open, setCurrentModal, step]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "unknown") {
        setStep("search");
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, step]);

  const handleSearch = () => {
    const searchId = idQuery.trim().toLowerCase();
    const searchFirstName = firstName.trim().toLowerCase();
    const searchLastName = lastName.trim().toLowerCase();
    const searchSex = sexVisual === "male" ? "M" : sexVisual === "female" ? "F" : null;

    const patientResults: PatientResult[] = patients.map((patient) => {
      const patientEncounters = encounters
        .filter((e) => e.patientId === patient.id && e.status !== "discharged")
        .sort(
          (a, b) =>
            new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime()
        );

      const latestEncounter = patientEncounters[0];

      return {
        idNumber: patient.idNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        age: patient.age,
        sex: patient.sex === "-" ? ("M" as const) : (patient.sex as "M" | "F"),
        presentingProblem: latestEncounter?.presentingProblem || "No active encounter",
        encounterStatus: latestEncounter ? ("Open" as const) : ("Closed" as const),
        dateTime: latestEncounter
          ? new Date(latestEncounter.arrivalTime).toLocaleString("en-US", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }).toUpperCase()
          : "No encounter",
        patientId: patient.id,
        encounterId: latestEncounter?.id,
      } as PatientResult & { patientId: string; encounterId?: string };
    });

    const hasSearchCriteria = searchId || searchFirstName || searchLastName;

    if (!hasSearchCriteria) {
      onClose();
      onSearchResults([]);
      return;
    }

    const matches = patientResults.filter((patient) => {
      const patientIdStr = patient.idNumber.toLowerCase();
      const patientFirstName = patient.firstName.toLowerCase();
      const patientLastName = patient.lastName.toLowerCase();
      const patientFullName = `${patientFirstName} ${patientLastName}`;

      const allSearchTerms: string[] = [];
      if (searchId) allSearchTerms.push(searchId);
      if (searchFirstName) allSearchTerms.push(searchFirstName);
      if (searchLastName) allSearchTerms.push(searchLastName);

      const matchesAnyTerm = allSearchTerms.some(
        (term) =>
          patientIdStr.includes(term) ||
          patientFirstName.includes(term) ||
          patientLastName.includes(term) ||
          patientFullName.includes(term)
      );

      const matchSex = searchSex ? patient.sex === searchSex : true;

      return matchesAnyTerm && matchSex;
    });

    onClose();
    onSearchResults(matches);
  };

  const handleUnknownContinue = () => {
    const ageNum = Number.parseInt(unknownAge, 10);
    if (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return;
    }
    if (!unknownSex) {
      return;
    }
    onUnknownPatient?.({ age: ageNum, sex: unknownSex });
    onClose();
  };

  if (!open) return null;

  const shellGlow =
    step === "unknown"
      ? "shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_0_48px_-12px_hsl(var(--primary)/0.4),0_0_80px_-24px_hsl(var(--primary)/0.2)]"
      : "shadow-[0_24px_56px_rgba(0,0,0,0.2)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={step === "unknown" ? "unknown-patient-title" : "new-visit-search-title"}
    >
      <button
        type="button"
        aria-label="Close patient search"
        onClick={onClose}
        className="absolute inset-0 bg-background/45 backdrop-blur-md"
      />

      <div
        className={`relative w-full max-w-lg max-h-[min(90vh,720px)] flex flex-col overflow-hidden rounded-xl border border-border bg-card modal-surface transition-shadow duration-300 ${shellGlow}`}
      >
        {step === "search" ? (
          <>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2 id="new-visit-search-title" className="text-base font-semibold text-white tracking-tight">
                  New visit
                </h2>
                <p className="mt-1 text-xs modal-muted leading-relaxed">
                  Look up an existing patient by ID or name, or continue without a match.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md border border-border p-1.5 modal-muted hover:bg-secondary/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-4">
                <div>
                  <label htmlFor="patient-id" className="text-[10px] font-semibold uppercase tracking-wider modal-muted">
                    ID
                  </label>
                  <input
                    id="patient-id"
                    type="text"
                    autoComplete="off"
                    value={idQuery}
                    onChange={(e) => setIdQuery(e.target.value)}
                    className={`${inputBase} mt-1.5`}
                    placeholder="Record or temporary ID"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="patient-first" className="text-[10px] font-semibold uppercase tracking-wider modal-muted">
                      First name
                    </label>
                    <input
                      id="patient-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`${inputBase} mt-1.5`}
                      placeholder="First"
                    />
                  </div>
                  <div>
                    <label htmlFor="patient-last" className="text-[10px] font-semibold uppercase tracking-wider modal-muted">
                      Last name
                    </label>
                    <input
                      id="patient-last"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`${inputBase} mt-1.5`}
                      placeholder="Last"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider modal-muted">Sex</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSexVisual((v) => (v === "male" ? null : "male"))}
                      className={[
                        "h-10 rounded-md border text-sm font-medium transition-colors",
                        sexVisual === "male"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/20 modal-muted hover:border-border hover:bg-secondary/40",
                      ].join(" ")}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setSexVisual((v) => (v === "female" ? null : "female"))}
                      className={[
                        "h-10 rounded-md border text-sm font-medium transition-colors",
                        sexVisual === "female"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/20 modal-muted hover:border-border hover:bg-secondary/40",
                      ].join(" ")}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <Search className="h-4 w-4 opacity-90" />
                  Search directory
                </button>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUnknownAge("");
                      setUnknownSex(null);
                      setStep("unknown");
                    }}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-sm font-medium text-white hover:bg-secondary/50 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 modal-muted" />
                    Unknown patient
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 text-sm font-medium modal-muted hover:bg-secondary/30 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Camera scan
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2 id="unknown-patient-title" className="text-base font-semibold text-white tracking-tight">
                  Unknown patient
                </h2>
                <p className="mt-1 text-xs modal-muted leading-relaxed">
                  Enter age and sex to begin the chart. You’ll choose encounter type next.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md border border-border p-1.5 modal-muted hover:bg-secondary/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-4 space-y-4">
                <div>
                  <label htmlFor="unknown-age" className="text-[10px] font-semibold uppercase tracking-wider modal-muted">
                    Age (years)
                  </label>
                  <input
                    id="unknown-age"
                    type="number"
                    min={1}
                    max={150}
                    inputMode="numeric"
                    value={unknownAge}
                    onChange={(e) => setUnknownAge(e.target.value)}
                    className={`${inputBase} mt-1.5`}
                    placeholder="e.g. 42"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider modal-muted">Sex</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUnknownSex((s) => (s === "M" ? null : "M"))}
                      className={[
                        "h-10 rounded-md border text-sm font-medium transition-colors",
                        unknownSex === "M"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/30 modal-muted hover:bg-secondary/50",
                      ].join(" ")}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnknownSex((s) => (s === "F" ? null : "F"))}
                      className={[
                        "h-10 rounded-md border text-sm font-medium transition-colors",
                        unknownSex === "F"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/30 modal-muted hover:bg-secondary/50",
                      ].join(" ")}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-white hover:bg-secondary/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleUnknownContinue}
                  disabled={
                    !unknownSex ||
                    Number.isNaN(Number.parseInt(unknownAge, 10)) ||
                    Number.parseInt(unknownAge, 10) < 1 ||
                    Number.parseInt(unknownAge, 10) > 150
                  }
                  className="inline-flex h-11 flex-[1.2] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Proceed
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
