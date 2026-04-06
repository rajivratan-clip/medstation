import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";

export type PatientResult = {
  dodId: string;
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Results"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close results"
        onClick={onClose}
        className="absolute inset-0 bg-background/45 backdrop-blur-md"
      />

      {/* Modal */}
      <div className="relative w-[920px] max-w-full min-h-[500px] rounded-xl border border-border bg-card text-card-foreground shadow-[0_24px_56px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="relative px-8 pt-6 pb-4">
          <div className="text-center text-lg font-bold text-white">Results</div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full border border-white/40 px-3 py-1 text-xs font-bold text-white/90 hover:bg-white/10"
          >
            × Close
          </button>
        </div>

        {/* Body */}
        <div className="px-10 pb-9 pt-2 flex flex-col min-h-[400px]">
          {/* Table */}
          <div className="mb-6 flex-1">
            {/* Header Row */}
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/10 pb-2 mb-2">
              <div className="text-xs font-bold text-white/70">DOD ID#</div>
              <div className="text-xs font-bold text-white/70">Last</div>
              <div className="text-xs font-bold text-white/70">First</div>
              <div className="text-xs font-bold text-white/70">Age</div>
              <div className="text-xs font-bold text-white/70">Sex</div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {results.map((patient, idx) => {
                const isSelected = selectedPatient === patient;
                return (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => handleRowClick(patient)}
                      className={[
                        "w-full grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr] gap-4 py-2.5 px-2 rounded-md transition-colors",
                        isSelected
                          ? "bg-primary/20 border border-primary/40"
                          : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-white">{patient.dodId}</span>
                      </div>
                      <div className="text-sm font-semibold text-white text-left">{patient.lastName}</div>
                      <div className="text-sm font-semibold text-white text-left">{patient.firstName}</div>
                      <div className="text-sm font-semibold text-white">{patient.age}</div>
                      <div className="text-sm font-semibold text-white">{patient.sex}</div>
                    </button>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-2 mb-3 px-2 py-3 bg-white/5 rounded-md border border-white/10">
                        <div className="text-sm font-semibold text-white flex items-center gap-10">
                          <span>{patient.dateTime}</span>
                          <span>Chart</span>
                          <span>{patient.presentingProblem}</span>
                          <span>{patient.encounterStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onNoneOfTheAbove}
              className="px-6 py-2.5 rounded-full border border-white/40 text-sm font-bold text-white/90 hover:bg-white/10 transition-colors"
            >
              None of the above
            </button>

            {selectedPatient ? (
              <button
                type="button"
                onClick={handleContinueEncounter}
                className="px-6 py-2.5 rounded-full bg-primary/70 text-sm font-bold text-white/90 hover:bg-primary/80 transition-colors"
              >
                Continue encounter
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNewEncounter}
                className="px-6 py-2.5 rounded-full bg-primary/70 text-sm font-bold text-white/90 hover:bg-primary/80 transition-colors"
              >
                New encounter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
