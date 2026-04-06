import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  MASCAL_BODY_REGIONS,
  MASCAL_INJURY_TYPES,
  type MascalBodyRegionId,
  type MascalFinding,
  type MascalInjuryType,
} from "@/components/mascalBodyFindingsShared";

type Props = {
  open: boolean;
  onClose: () => void;
  findings: MascalFinding[];
  onFindingsChange: (next: MascalFinding[]) => void;
};

const regionFill = (selected: MascalBodyRegionId | null, id: MascalBodyRegionId) =>
  selected === id ? "rgba(250, 204, 21, 0.55)" : "rgba(148, 163, 184, 0.35)";

const regionStroke = (selected: MascalBodyRegionId | null, id: MascalBodyRegionId) =>
  selected === id ? "rgba(250, 204, 21, 0.95)" : "rgba(255, 255, 255, 0.35)";

export default function MascalBodyFindingsModal({
  open,
  onClose,
  findings,
  onFindingsChange,
}: Props) {
  const [selectedRegion, setSelectedRegion] = useState<MascalBodyRegionId | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<MascalInjuryType>("Abrasion");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSelectedRegion(null);
      setSelectedInjury("Abrasion");
    }
  }, [open]);

  if (!open) return null;

  const addFinding = () => {
    if (!selectedRegion) return;
    const next: MascalFinding = {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      regionId: selectedRegion,
      injury: selectedInjury,
    };
    onFindingsChange([...findings, next]);
  };

  const removeFinding = (id: string) => {
    onFindingsChange(findings.filter((f) => f.id !== id));
  };

  const labelFor = (id: MascalBodyRegionId) =>
    MASCAL_BODY_REGIONS.find((r) => r.id === id)?.label ?? id;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Body findings map"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/55 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl border border-yellow-500/25 bg-card modal-surface shadow-[0_24px_64px_rgba(0,0,0,0.35),0_0_40px_rgba(234,179,8,0.12)] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-yellow-500/10 to-transparent">
          <div>
            <h2 className="text-sm font-semibold text-white">MASCAL — body findings</h2>
            <p className="text-xs modal-muted mt-0.5">
              Select a region, choose injury type, then add. Example: chest + abrasion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border bg-secondary/40 p-2 text-white hover:bg-secondary/70 transition-colors"
            aria-label="Close findings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-6">
          {/* 3D-style figure */}
          <div
            className="flex items-center justify-center min-h-[320px] rounded-lg border border-white/10 bg-gradient-to-b from-secondary/40 to-background/80 p-4"
            style={{ perspective: "900px" }}
          >
            <div
              className="relative w-[200px] h-[380px] transition-transform duration-300"
              style={{ transform: "rotateY(-12deg) rotateX(4deg)" }}
            >
              <svg
                viewBox="0 0 200 400"
                className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
                aria-hidden
              >
                {/* Head */}
                <ellipse
                  cx="100"
                  cy="38"
                  rx="28"
                  ry="32"
                  fill={regionFill(selectedRegion, "head")}
                  stroke={regionStroke(selectedRegion, "head")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("head")}
                />
                {/* Chest */}
                <path
                  d="M 55 72 L 145 72 L 152 145 L 48 145 Z"
                  fill={regionFill(selectedRegion, "chest")}
                  stroke={regionStroke(selectedRegion, "chest")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("chest")}
                />
                {/* Abdomen */}
                <path
                  d="M 52 148 L 148 148 L 142 210 L 58 210 Z"
                  fill={regionFill(selectedRegion, "abdomen")}
                  stroke={regionStroke(selectedRegion, "abdomen")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("abdomen")}
                />
                {/* Pelvis */}
                <path
                  d="M 58 214 L 142 214 L 135 255 L 65 255 Z"
                  fill={regionFill(selectedRegion, "pelvis")}
                  stroke={regionStroke(selectedRegion, "pelvis")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("pelvis")}
                />
                {/* Left arm (viewer's right) */}
                <path
                  d="M 48 78 L 28 95 L 22 175 L 38 178 L 52 120 Z"
                  fill={regionFill(selectedRegion, "left_arm")}
                  stroke={regionStroke(selectedRegion, "left_arm")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("left_arm")}
                />
                {/* Right arm */}
                <path
                  d="M 152 78 L 172 95 L 178 175 L 162 178 L 148 120 Z"
                  fill={regionFill(selectedRegion, "right_arm")}
                  stroke={regionStroke(selectedRegion, "right_arm")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("right_arm")}
                />
                {/* Left leg */}
                <path
                  d="M 62 258 L 95 258 L 88 395 L 58 395 Z"
                  fill={regionFill(selectedRegion, "left_leg")}
                  stroke={regionStroke(selectedRegion, "left_leg")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("left_leg")}
                />
                {/* Right leg */}
                <path
                  d="M 105 258 L 138 258 L 142 395 L 112 395 Z"
                  fill={regionFill(selectedRegion, "right_leg")}
                  stroke={regionStroke(selectedRegion, "right_leg")}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:opacity-90"
                  onClick={() => setSelectedRegion("right_leg")}
                />
              </svg>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest modal-muted mb-2">
                Selected region
              </p>
              <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm font-medium text-white">
                {selectedRegion ? labelFor(selectedRegion) : "Tap the figure"}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest modal-muted mb-2">
                Injury type (hardcoded)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MASCAL_INJURY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedInjury(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                      selectedInjury === t
                        ? "border-yellow-500/60 bg-yellow-500/15 text-white"
                        : "border-border text-white/70 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedRegion}
              onClick={addFinding}
              className="w-full rounded-md bg-yellow-600/90 hover:bg-yellow-600 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 text-sm font-semibold text-yellow-950"
            >
              Add finding
            </button>

            <div>
              <p className="text-[10px] uppercase tracking-widest modal-muted mb-2">
                Recorded ({findings.length})
              </p>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {findings.length === 0 ? (
                  <li className="text-xs modal-muted">No findings yet.</li>
                ) : (
                  findings.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/80 bg-background/50 px-2 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-semibold text-white">{labelFor(f.regionId)}</span>
                        <span className="modal-muted"> — {f.injury}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFinding(f.id)}
                        className="shrink-0 text-white/70 hover:text-destructive text-[10px] uppercase"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end bg-secondary/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-white hover:bg-secondary/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
