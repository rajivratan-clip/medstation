import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import QRCode from "react-qr-code";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Encoded in the QR payload (encounter id or session marker). */
  encounterRef?: string | null;
};

export default function ShareEncounterCdpModal({ open, onClose, encounterRef }: Props) {
  const [phase, setPhase] = useState<"qr" | "success">("qr");

  const payload =
    typeof encounterRef === "string" && encounterRef.length > 0
      ? `cdp://encounter/sync?id=${encodeURIComponent(encounterRef)}&t=${Date.now()}`
      : `cdp://encounter/sync?session=demo&t=${Date.now()}`;

  useEffect(() => {
    if (!open) return;
    setPhase("qr");
    const t = window.setTimeout(() => setPhase("success"), 2200);
    return () => window.clearTimeout(t);
  }, [open]);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share encounter to CDP"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card modal-surface shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-white">Share encounter to CDP</h2>
            <p className="text-xs modal-muted mt-0.5">Care Delivery Platform handoff</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border p-2 text-white hover:bg-secondary/60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-8 flex flex-col items-center justify-center min-h-[280px]">
          {phase === "qr" ? (
            <>
              <p className="text-sm modal-muted text-center mb-6 max-w-xs">
                Scan this code with the CDP receiver to transfer this encounter.
              </p>
              <div className="p-4 rounded-lg bg-white inline-block">
                <QRCode value={payload} size={200} level="M" />
              </div>
              <p className="text-[10px] modal-muted mt-4 font-mono break-all text-center max-w-full px-2">
                {payload.slice(0, 48)}…
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 animate-in fade-in duration-300">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40">
                <Check className="h-8 w-8 text-emerald-400" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-base font-semibold text-white">Data successfully transferred to CDP</p>
                <p className="text-sm modal-muted mt-2">
                  The encounter payload was accepted by the Care Delivery Platform.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end bg-secondary/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {phase === "success" ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
