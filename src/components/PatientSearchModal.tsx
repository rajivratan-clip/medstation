import { useEffect, useMemo, useState } from "react";
import { Search, Camera, UserX } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";
import type { PatientResult } from "./ResultsModal";

type PatientSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSearchResults: (results: PatientResult[]) => void;
  onUnknownPatient?: () => void;
};

const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-x-10">
      <div className="text-sm text-white/80">{label}</div>
      <div>{children}</div>
    </div>
  );
};

// Mock patient data
const MOCK_PATIENTS: PatientResult[] = [
  {
    dodId: "0000000001",
    firstName: "firstname",
    lastName: "lastname",
    age: 28,
    sex: "F",
    presentingProblem: "Chest pain",
    encounterStatus: "Open",
    dateTime: "04-JAN-26 23:32:54",
  },
  {
    dodId: "0000000002",
    firstName: "john",
    lastName: "doe",
    age: 35,
    sex: "M",
    presentingProblem: "Medical screening",
    encounterStatus: "Closed",
    dateTime: "03-JAN-26 11:10:22",
  },
];

export default function PatientSearchModal({
  open,
  onClose,
  onSearchResults,
  onUnknownPatient,
}: PatientSearchModalProps) {
  const { setCurrentModal } = usePageContext();
  const [sexVisual, setSexVisual] = useState<"male" | "female" | null>(null);
  const [dodId, setDodId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const inputClassName = useMemo(
    () =>
      [
        "w-full h-11 rounded-md",
        "bg-white/25 text-white placeholder:text-white/45",
        "outline-none ring-0",
        "px-4",
      ].join(" "),
    [],
  );

  useEffect(() => {
    if (open) {
      setCurrentModal("Patient Search Modal");
    } else {
      setCurrentModal(null);
      // Reset form when modal closes
      setDodId("");
      setFirstName("");
      setLastName("");
      setSexVisual(null);
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

  const handleSearch = () => {
    // Case-insensitive matching on DODID, First name, or Last name
    const searchDodId = dodId.trim().toLowerCase();
    const searchFirstName = firstName.trim().toLowerCase();
    const searchLastName = lastName.trim().toLowerCase();

    const matches = MOCK_PATIENTS.filter((patient) => {
      const matchDodId = searchDodId && patient.dodId.toLowerCase().includes(searchDodId);
      const matchFirstName =
        searchFirstName && patient.firstName.toLowerCase().includes(searchFirstName);
      const matchLastName =
        searchLastName && patient.lastName.toLowerCase().includes(searchLastName);

      // Match if ANY ONE field matches
      return matchDodId || matchFirstName || matchLastName;
    });

    // Close this modal and pass results to parent
    onClose();
    onSearchResults(matches);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Patient search"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close patient search"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div className="relative w-[920px] max-w-full rounded-xl bg-[#2E3442] shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        {/* Header */}
        <div className="relative px-8 pt-6 pb-4">
          <div className="text-center text-lg font-bold text-white">Patient search</div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full border border-white/40 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
          >
            × Close
          </button>
        </div>

        {/* Body */}
        <div className="px-10 pb-9 pt-2">
          <div className="space-y-4">
            <FieldRow label="DODID">
              <input
                type="text"
                value={dodId}
                onChange={(e) => setDodId(e.target.value)}
                className={inputClassName}
              />
            </FieldRow>

            <FieldRow label="First">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClassName}
              />
            </FieldRow>

            <FieldRow label="Middle">
              <input type="text" className={inputClassName} />
            </FieldRow>

            <FieldRow label="Last">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClassName}
              />
            </FieldRow>

            <FieldRow label="Sex">
              <div className="flex gap-5">
                <button
                  type="button"
                  onClick={() => setSexVisual("male")}
                  className={[
                    "h-11 flex-1 rounded-full border text-sm font-medium",
                    sexVisual === "male"
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-white/35 bg-transparent text-white/80",
                  ].join(" ")}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setSexVisual("female")}
                  className={[
                    "h-11 flex-1 rounded-full border text-sm font-medium",
                    sexVisual === "female"
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-white/35 bg-transparent text-white/80",
                  ].join(" ")}
                >
                  Female
                </button>
              </div>
            </FieldRow>

            <FieldRow label="Date of birth">
              <input type="text" className={inputClassName} />
            </FieldRow>

            <FieldRow label="Age">
              <input type="text" className={inputClassName} />
            </FieldRow>
          </div>

          {/* Search button */}
          <div className="mt-6 grid grid-cols-[140px_1fr] items-center gap-x-10">
            <div />
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary/70 text-sm font-medium text-white/90 hover:bg-primary/80"
            >
              <Search className="h-4 w-4 opacity-80" />
              Search
            </button>
          </div>

          {/* Unknown Patient and Camera Scan buttons - Center aligned with right offset */}
          <div className="mt-4 flex justify-center gap-4 pl-8">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUnknownPatient?.();
              }}
              className="flex h-10 items-center justify-center gap-2 rounded-full border-2 border-red-500/80 bg-transparent px-6 text-sm font-bold text-white/90 hover:bg-red-500/10 transition-colors"
            >
              <UserX className="h-4 w-4" />
              Unknown patient
            </button>
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-white/40 bg-transparent px-6 text-sm font-bold text-white/90 hover:bg-white/10 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Camera scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

