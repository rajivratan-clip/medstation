import { useEffect, useState } from "react";
import { Bluetooth, X } from "lucide-react";
import { toast } from "sonner";
import type { Vitals } from "@/store/seedData";

type VitalsDraft = {
  hr: string;
  bpSys: string;
  bpDia: string;
  rr: string;
  spo2: string;
  etcO2: string;
  temperature: string;
  painScore: string;
};

const emptyDraft = (): VitalsDraft => ({
  hr: "",
  bpSys: "",
  bpDia: "",
  rr: "",
  spo2: "",
  etcO2: "",
  temperature: "",
  painScore: "",
});

/** Demo vitals when "Health Med device" is selected (Bluetooth). */
const HEALTH_MED_DEVICE_VITALS: Omit<Vitals, "recordedAt"> = {
  hr: 88,
  bpSystolic: 122,
  bpDiastolic: 78,
  rr: 16,
  spo2: 98,
  etcO2: 35,
  temperature: 37.1,
  painScore: 2,
};

function draftFromVitals(v: Omit<Vitals, "recordedAt">): VitalsDraft {
  return {
    hr: v.hr != null ? String(v.hr) : "",
    bpSys: v.bpSystolic != null ? String(v.bpSystolic) : "",
    bpDia: v.bpDiastolic != null ? String(v.bpDiastolic) : "",
    rr: v.rr != null ? String(v.rr) : "",
    spo2: v.spo2 != null ? String(v.spo2) : "",
    etcO2: v.etcO2 != null ? String(v.etcO2) : "",
    temperature: v.temperature != null ? String(v.temperature) : "",
    painScore: v.painScore != null ? String(v.painScore) : "",
  };
}

function parseDraft(d: VitalsDraft): Omit<Vitals, "recordedAt"> {
  const n = (s: string) => {
    const x = Number(s);
    return s.trim() === "" || Number.isNaN(x) ? undefined : x;
  };
  return {
    hr: n(d.hr),
    bpSystolic: n(d.bpSys),
    bpDiastolic: n(d.bpDia),
    rr: n(d.rr),
    spo2: n(d.spo2),
    etcO2: n(d.etcO2),
    temperature: n(d.temperature),
    painScore: n(d.painScore),
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (vitals: Omit<Vitals, "recordedAt">) => void;
  /** Rehydrate form when reopening (e.g. session vitals with no encounter yet). */
  prefillVitals?: Omit<Vitals, "recordedAt"> | null;
};

export default function VitalsEntryModal({ open, onClose, onSave, prefillVitals = null }: Props) {
  const [draft, setDraft] = useState<VitalsDraft>(emptyDraft);
  const [connectOpen, setConnectOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(prefillVitals ? draftFromVitals(prefillVitals) : emptyDraft());
    setConnectOpen(false);
  }, [open, prefillVitals]);

  useEffect(() => {
    if (!open && !connectOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (connectOpen) setConnectOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, connectOpen, onClose]);

  if (!open) return null;

  const applyDevice = () => {
    setDraft(draftFromVitals(HEALTH_MED_DEVICE_VITALS));
    setConnectOpen(false);
    toast.success("Health Med device — vitals loaded (demo)");
  };

  const handleSave = () => {
    const v = parseDraft(draft);
    const hasAny =
      v.hr != null ||
      v.bpSystolic != null ||
      v.bpDiastolic != null ||
      v.rr != null ||
      v.spo2 != null ||
      v.etcO2 != null ||
      v.temperature != null ||
      v.painScore != null;
    if (!hasAny) {
      toast.error("Enter at least one vital sign");
      return;
    }
    onSave(v);
    onClose();
  };

  const field = (label: string, key: keyof VitalsDraft, placeholder: string) => (
    <div key={key}>
      <label className="text-xs modal-muted mb-1 block">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-white placeholder:text-white/35"
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vital signs entry"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/55 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl border border-border bg-card modal-surface shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-white">Vital signs</h2>
            <p className="text-xs modal-muted mt-0.5">
              Enter manually on the left, connect a device, or add a new reading.
            </p>
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

        <div className="flex-1 overflow-y-auto p-5 grid md:grid-cols-[1fr_220px] gap-6">
          <div className="space-y-3 min-w-0">
            <p className="text-[10px] uppercase tracking-widest modal-muted">Manual entry</p>
            <div className="grid grid-cols-2 gap-3">
              {field("HR", "hr", "-")}
              {field("RR", "rr", "-")}
            </div>
            <div>
              <label className="text-xs modal-muted mb-1 block">BP (sys / dia)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-white placeholder:text-white/35"
                  value={draft.bpSys}
                  onChange={(e) => setDraft((d) => ({ ...d, bpSys: e.target.value }))}
                  placeholder="sys"
                />
                <span className="modal-muted">/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-white placeholder:text-white/35"
                  value={draft.bpDia}
                  onChange={(e) => setDraft((d) => ({ ...d, bpDia: e.target.value }))}
                  placeholder="dia"
                />
              </div>
            </div>
            {field("SpO₂", "spo2", "-")}
            {field("EtCO₂", "etcO2", "-")}
            {field("T°", "temperature", "-")}
            {field("Pain score", "painScore", "-")}
          </div>

          <div className="flex flex-col gap-3 border border-border/80 rounded-lg p-4 bg-secondary/20 h-fit">
            <p className="text-[10px] uppercase tracking-widest modal-muted">Devices</p>
            <button
              type="button"
              onClick={() => setConnectOpen(true)}
              className="w-full rounded-md border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-primary/15 transition-colors text-left"
            >
              Connect device
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft());
                setConnectOpen(false);
              }}
              className="w-full rounded-md border border-border bg-background/50 px-3 py-2.5 text-sm font-medium text-white hover:bg-secondary/50 transition-colors text-left"
            >
              Add new
            </button>
            <p className="text-xs modal-muted leading-relaxed">
              Add new clears the form for a fresh manual reading. Connect device opens the Bluetooth picker.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex flex-wrap justify-end gap-2 bg-secondary/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-white hover:bg-secondary/60"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save vitals
          </button>
        </div>
      </div>

      {connectOpen && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Connect device"
        >
          <button
            type="button"
            aria-label="Close device dialog"
            onClick={() => setConnectOpen(false)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card modal-surface p-7 shadow-xl">
            <div className="flex items-start justify-between gap-2 mb-5">
              <h3 className="text-base font-semibold text-white">Connect a device</h3>
              <button
                type="button"
                onClick={() => setConnectOpen(false)}
                className="rounded-md p-1.5 text-white hover:bg-secondary/60"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm modal-muted mb-5">
              Select a paired monitor and connect to import readings into the vitals form.
            </p>
            <div className="flex items-center gap-4 rounded-xl border border-blue-500/25 bg-blue-500/5 px-5 py-5 mb-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500/15 border border-blue-400/35">
                <Bluetooth className="h-8 w-8 text-blue-400" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <span className="block text-base font-semibold text-white">Health Med device</span>
                <span className="text-sm modal-muted">Bluetooth · demo vitals</span>
              </div>
            </div>
            <button
              type="button"
              onClick={applyDevice}
              className="w-full rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-blue-500 active:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
