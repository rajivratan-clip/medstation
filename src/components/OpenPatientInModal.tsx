import { useEffect, useState } from "react";
import { Activity, Stethoscope, User, Scissors, Bed, QrCode } from "lucide-react";
import ShareEncounterCdpModal from "@/components/ShareEncounterCdpModal";
import { usePageContext } from "@/contexts/PageContext";
import type { PatientResult } from "./ResultsModal";

type OpenPatientInModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectEncounterType: (type: string, patientData: PatientResult | null, isNewEncounter: boolean) => void;
  patientData: PatientResult | null;
  isNewEncounter: boolean;
};

type EncounterOption = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isHighlighted?: boolean;
};

const ENCOUNTER_OPTIONS: EncounterOption[] = [
  { id: "mascal", label: "MASCAL", icon: Activity },
  { id: "ambulatory", label: "AMBULATORY", icon: Stethoscope },
  { id: "trauma", label: "TRAUMA", icon: User },
  { id: "surgery", label: "SURGERY", icon: Scissors, isHighlighted: true },
  { id: "inpatient", label: "INPATIENT", icon: Bed },
];

export default function OpenPatientInModal({
  open,
  onClose,
  onSelectEncounterType,
  patientData,
  isNewEncounter,
}: OpenPatientInModalProps) {
  const { setCurrentModal } = usePageContext();
  const [cdpShareOpen, setCdpShareOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentModal("Open Patient In Modal");
    } else {
      setCurrentModal(null);
    }
  }, [open, setCurrentModal]);

  useEffect(() => {
    if (!open) return;

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

  const handleOptionClick = (optionId: string) => {
    onSelectEncounterType(optionId, patientData, isNewEncounter);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Open patient in"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/45 backdrop-blur-md"
      />

      <div className="relative w-full max-w-xl max-h-[85vh] rounded-lg border border-border bg-card modal-surface shadow-[0_24px_56px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">Open patient in</h2>
          <p className="text-xs modal-muted mt-1">Select an encounter pathway</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ENCOUNTER_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option.id)}
                  className={[
                    "flex flex-col items-stretch gap-2 rounded-md border px-3 py-3 text-left transition-colors",
                    option.isHighlighted
                      ? "border-primary/35 bg-primary/10 hover:bg-primary/15"
                      : "border-border bg-secondary/20 hover:bg-secondary/40",
                  ].join(" ")}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 border border-primary/20">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-xs font-medium text-white">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-border pt-4 space-y-2">
            <button
              type="button"
              onClick={() => setCdpShareOpen(true)}
              className="w-full flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-xs text-white/90 hover:bg-secondary/30 hover:text-white transition-colors"
            >
              <QrCode className="h-4 w-4 shrink-0" />
              Share encounter to CDP
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-xs text-white/90 hover:bg-secondary/30 hover:text-white transition-colors"
            >
              <QrCode className="h-4 w-4 shrink-0" />
              Share encounter to external system
            </button>
          </div>
        </div>
      </div>

      <ShareEncounterCdpModal
        open={cdpShareOpen}
        onClose={() => setCdpShareOpen(false)}
        encounterRef={patientData?.encounterId ?? patientData?.idNumber ?? null}
      />
    </div>
  );
}
