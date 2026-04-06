import { useEffect, type ReactNode } from "react";
import { Stethoscope, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

function Branch({ children }: { children: ReactNode }) {
  return (
    <div className="relative pl-6 border-l-2 border-yellow-500/35 ml-2 space-y-2 py-1">{children}</div>
  );
}

function Outcome({ color, label, children }: { color: string; label: string; children: ReactNode }) {
  return (
    <div className={`rounded-md px-3 py-2 text-sm border ${color}`}>
      <span className="font-semibold">{label}</span>
      <span className="modal-muted"> — {children}</span>
    </div>
  );
}

export default function MascalTriageFlowModal({ open, onClose }: Props) {
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
      className="fixed inset-0 z-[70] flex items-stretch justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="START Triage flow"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative m-0 sm:my-auto w-full max-w-4xl max-h-[100vh] sm:max-h-[92vh] rounded-none sm:rounded-xl border-0 sm:border border-yellow-500/25 bg-card modal-surface shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-yellow-500/10 to-transparent">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-2xl" aria-hidden>
              🩺
            </span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">START Triage Flow</h2>
              <p className="text-sm modal-muted mt-0.5">What your chart should show — decision tree</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border p-2 text-white hover:bg-secondary/60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
          {/* Tree-style flow */}
          <section className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-500/40">
                1
              </span>
              <h3 className="text-base font-bold text-white">Initial Assessment</h3>
            </div>
            <p className="text-sm font-medium text-white mb-2 pl-10">Step 1: Can the patient walk?</p>
            <Branch>
              <Outcome color="border-emerald-500/40 bg-emerald-500/10" label="YES">
                MINOR <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Green)</span>
              </Outcome>
              <p className="text-xs modal-muted pl-1">
                <span className="font-semibold text-white">NO</span> → Go to breathing check
              </p>
            </Branch>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-500/40">
                2
              </span>
              <h3 className="text-base font-bold text-white">Breathing Check</h3>
            </div>
            <p className="text-sm font-medium text-white mb-2 pl-10">Step 2: Is the patient breathing?</p>
            <Branch>
              <div className="space-y-2 text-sm text-white">
                <p>
                  <span className="font-semibold">NO</span> → Open airway
                </p>
                <Outcome color="border-zinc-600/50 bg-zinc-800/30" label="Still not breathing">
                  EXPECTANT <span className="text-zinc-300 font-semibold">(Black)</span>
                </Outcome>
                <Outcome color="border-red-500/40 bg-red-500/10" label="Starts breathing">
                  IMMEDIATE <span className="text-red-600 dark:text-red-400 font-semibold">(Red)</span>
                </Outcome>
                <p>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">YES</span> → Check respiratory rate
                </p>
              </div>
            </Branch>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-500/40">
                3
              </span>
              <h3 className="text-base font-bold text-white">Respiratory Rate</h3>
            </div>
            <Branch>
              <Outcome color="border-red-500/40 bg-red-500/10" label={"> 30 breaths/min"}>
                IMMEDIATE <span className="text-red-600 dark:text-red-400 font-semibold">(Red)</span>
              </Outcome>
              <p className="text-sm modal-muted pl-1">≤ 30 → Go to perfusion (circulation)</p>
            </Branch>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-500/40">
                4
              </span>
              <h3 className="text-base font-bold text-white">Perfusion (Circulation)</h3>
            </div>
            <p className="text-sm font-medium text-white mb-2 pl-10">
              Step 4: Capillary refill &gt; 2 sec OR no radial pulse?
            </p>
            <Branch>
              <Outcome color="border-red-500/40 bg-red-500/10" label="YES">
                IMMEDIATE <span className="text-red-600 dark:text-red-400 font-semibold">(Red)</span>
              </Outcome>
              <p className="text-sm modal-muted pl-1">NO → Go to mental status</p>
            </Branch>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-500/40">
                5
              </span>
              <h3 className="text-base font-bold text-white">Mental Status</h3>
            </div>
            <Branch>
              <Outcome color="border-red-500/40 bg-red-500/10" label="Cannot follow commands">
                IMMEDIATE <span className="text-red-600 dark:text-red-400 font-semibold">(Red)</span>
              </Outcome>
              <Outcome color="border-amber-500/40 bg-amber-500/10" label="Can follow commands">
                DELAYED <span className="text-amber-700 dark:text-amber-300 font-semibold">(Yellow)</span>
              </Outcome>
            </Branch>
          </section>

          <section className="rounded-xl border border-yellow-500/25 bg-secondary/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl" aria-hidden>
                🎯
              </span>
              <h3 className="text-base font-bold text-white">Final Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-white">
                    <th className="py-2 pr-4 font-semibold">Category</th>
                    <th className="py-2 pr-4 font-semibold">Color</th>
                    <th className="py-2 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="modal-muted">
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-white">Minor</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" /> Green
                      </span>
                    </td>
                    <td className="py-2">Walking wounded</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-white">Delayed</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-amber-400" /> Yellow
                      </span>
                    </td>
                    <td className="py-2">Needs care but stable</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-white">Immediate</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-red-500" /> Red
                      </span>
                    </td>
                    <td className="py-2">Life-threatening</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-white">Expectant</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-600" /> Black
                      </span>
                    </td>
                    <td className="py-2">Unlikely to survive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-border flex justify-end bg-secondary/20">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Stethoscope className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
