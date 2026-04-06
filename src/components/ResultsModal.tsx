import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";

export type PatientResult = {
  idNumber: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: "M" | "F";
  presentingProblem: string;
  encounterStatus: "Open" | "Closed";
  dateTime: string;
  patientId?: string;
  encounterId?: string;
};

type ResultsModalProps = {
  open: boolean;
  onClose: () => void;
  results: PatientResult[];
  onNoneOfTheAbove: () => void;
  onContinueEncounter: (patient: PatientResult) => void;
  onNewEncounter: () => void;
};

export default function ResultsModal({
  open,
  onClose,
  results,
  onNoneOfTheAbove,
  onContinueEncounter,
  onNewEncounter,
}: ResultsModalProps) {
  const { setCurrentModal } = usePageContext();
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentModal("Search Results Modal");
    } else {
      setCurrentModal(null);
      setSelectedPatient(null);
    }
  }, [open, setCurrentModal]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleRowClick = (patient: PatientResult) => {
    setSelectedPatient(patient === selectedPatient ? null : patient);
  };

  const handleContinueEncounter = () => {
    if (selectedPatient) {
      onContinueEncounter(selectedPatient);
    }
  };

  const handleNewEncounter = () => {
    onNewEncounter();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-results-title"
      aria-label="Results"
    >
      <button
        type="button"
        aria-label="Close results"
        onClick={onClose}
        className="absolute inset-0 bg-background/45 backdrop-blur-md"
      />

      <div className="relative w-full max-w-3xl max-h-[min(90vh,640px)] flex flex-col overflow-hidden rounded-xl border border-border bg-card modal-surface shadow-[0_24px_56px_rgba(0,0,0,0.2)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id="search-results-title" className="text-base font-semibold text-white tracking-tight">
              Matches
            </h2>
            <p className="mt-0.5 text-xs modal-muted">
              {results.length === 0
                ? "No rows — choose an action below."
                : `Select a row, then continue or start new.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border p-1.5 text-white/80 hover:bg-secondary/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 min-h-[200px]">
          {results.length === 0 ? (
            <p className="text-sm modal-muted py-8 text-center rounded-lg border border-dashed border-border bg-muted/15 px-4">
              No patients matched your search. Try different criteria or start a new visit.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_0.7fr_0.7fr_0.5fr] gap-2 sm:gap-3 border-b border-border pb-2 mb-1 text-[10px] font-semibold uppercase tracking-wider modal-muted">
                <div>ID</div>
                <div>Last</div>
                <div>First</div>
                <div>Age</div>
                <div>Sex</div>
              </div>

              <div className="space-y-1">
                {results.map((patient, idx) => {
                  const isSelected = selectedPatient === patient;
                  return (
                    <div key={idx}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(patient)}
                        className={[
                          "w-full grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_0.7fr_0.7fr_0.5fr] gap-2 sm:gap-3 py-2.5 px-2 rounded-md text-left text-sm transition-colors border border-transparent",
                          isSelected
                            ? "bg-primary/12 border-primary/30"
                            : "hover:bg-muted/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <span className="font-medium text-white truncate">{patient.idNumber}</span>
                        </div>
                        <div className="font-medium text-white truncate">{patient.lastName}</div>
                        <div className="font-medium text-white truncate">{patient.firstName}</div>
                        <div className="text-white">{patient.age}</div>
                        <div className="modal-muted">{patient.sex}</div>
                      </button>

                      {isSelected && (
                        <div className="mt-1.5 mb-2 rounded-md border border-border bg-muted/25 px-3 py-2.5 text-xs modal-muted">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>{patient.dateTime}</span>
                            <span className="text-white/80">{patient.presentingProblem}</span>
                            <span
                              className={
                                patient.encounterStatus === "Open" ? "text-primary font-medium" : ""
                              }
                            >
                              {patient.encounterStatus}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4 sm:px-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-muted/10">
          <button
            type="button"
            onClick={onNoneOfTheAbove}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-white hover:bg-secondary/50 transition-colors"
          >
            None of the above
          </button>

          {selectedPatient ? (
            <button
              type="button"
              onClick={handleContinueEncounter}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue encounter
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNewEncounter}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              New encounter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
