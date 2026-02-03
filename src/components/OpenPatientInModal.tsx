import { useEffect } from "react";
import { Activity, Stethoscope, User, Scissors, Bed, QrCode } from "lucide-react";
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
  color: string;
  bgColor: string;
  isHighlighted?: boolean;
};

const ENCOUNTER_OPTIONS: EncounterOption[] = [
  {
    id: "mascal",
    label: "MASCAL",
    icon: Activity,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  {
    id: "ambulatory",
    label: "AMBULATORY",
    icon: Stethoscope,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
  },
  {
    id: "trauma",
    label: "TRAUMA",
    icon: User,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    id: "surgery",
    label: "SURGERY",
    icon: Scissors,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    isHighlighted: true,
  },
  {
    id: "inpatient",
    label: "INPATIENT",
    icon: Bed,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
];

export default function OpenPatientInModal({
  open,
  onClose,
  onSelectEncounterType,
  patientData,
  isNewEncounter,
}: OpenPatientInModalProps) {
  const { setCurrentModal } = usePageContext();

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
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div className="relative w-[700px] max-w-full max-h-[85vh] rounded-xl bg-[#2E3442] shadow-[0_18px_60px_rgba(0,0,0,0.55)] flex flex-col">
        {/* Header */}
        <div className="px-10 pt-8 pb-6">
          <div className="text-center text-xl font-bold text-white">Open patient in:</div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {/* Primary Options */}
          <div className="space-y-2">
            {ENCOUNTER_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option.id)}
                  className={[
                    "w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors",
                    option.isHighlighted
                      ? "bg-primary/20 border border-primary/40"
                      : "hover:bg-white/5",
                  ].join(" ")}
                >
                  {/* Circular Icon */}
                  <div
                    className={[
                      "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0",
                      option.bgColor,
                    ].join(" ")}
                  >
                    <IconComponent className={[option.color, "w-8 h-8"].join(" ")} />
                  </div>
                  {/* Label */}
                  <span className="text-base font-bold text-white text-left">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* Secondary Actions */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors hover:bg-white/5"
            >
              {/* QR Icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                <QrCode className="w-8 h-8 text-white/70" />
              </div>
              {/* Label */}
              <span className="text-base font-bold text-white text-left">Share encounter to CDP</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors hover:bg-white/5"
            >
              {/* QR Icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                <QrCode className="w-8 h-8 text-white/70" />
              </div>
              {/* Label */}
              <span className="text-base font-bold text-white text-left">Share encounter to BATDOK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
