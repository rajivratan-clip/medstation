import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Activity,
  Stethoscope,
  User,
  Scissors,
  Bed,
  QrCode,
  ChevronDown,
  Check,
  Save,
  LayoutGrid,
  Home,
} from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";
import type { PatientResult } from "@/components/ResultsModal";
import { usePatientStore } from "@/store/patientStore";
import { toast } from "sonner";

type EncounterTypeKey = "mascal" | "ambulatory" | "trauma" | "surgery" | "inpatient";

const ENCOUNTER_TYPE_CONFIG: Record<
  EncounterTypeKey,
  { label: string; color: string; borderColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  mascal: {
    label: "MASCAL",
    color: "text-yellow-400",
    borderColor: "border-yellow-400",
    icon: Activity,
  },
  ambulatory: {
    label: "AMBULATORY",
    color: "text-teal-400",
    borderColor: "border-teal-400",
    icon: Stethoscope,
  },
  trauma: {
    label: "TRAUMA",
    color: "text-blue-400",
    borderColor: "border-blue-400",
    icon: User,
  },
  surgery: {
    label: "SURGERY",
    color: "text-green-400",
    borderColor: "border-green-400",
    icon: Scissors,
  },
  inpatient: {
    label: "INPATIENT",
    color: "text-purple-400",
    borderColor: "border-purple-400",
    icon: Bed,
  },
};

type LocationState = {
  encounterType: EncounterTypeKey;
  patientData: PatientResult | null;
  isNewEncounter: boolean;
  encounterId?: string;
};

const NAV_SECTIONS: { id: string; label: string; category: string }[] = [
  { id: "demographics", label: "Demographics", category: "INTAKE" },
  { id: "history", label: "History", category: "INTAKE" },
  { id: "chief-complaint", label: "Chief complaint / HPI", category: "INTAKE" },
  { id: "review-systems", label: "Review of systems", category: "INTAKE" },
  { id: "screenings", label: "Screenings", category: "INTAKE" },
  { id: "vital-signs", label: "Vital signs", category: "INTAKE" },
  { id: "general-appearance", label: "General appearance", category: "PHYSICAL EXAM" },
  { id: "neuro", label: "Neuro", category: "PHYSICAL EXAM" },
  { id: "head-neck", label: "Head & neck", category: "PHYSICAL EXAM" },
  { id: "dental", label: "Dental", category: "PHYSICAL EXAM" },
  { id: "chest", label: "Chest", category: "PHYSICAL EXAM" },
  { id: "abdomen-pelvis", label: "Abdomen & pelvis", category: "PHYSICAL EXAM" },
  { id: "upper-extremities", label: "Upper extremities", category: "PHYSICAL EXAM" },
  { id: "lower-extremities", label: "Lower extremities", category: "PHYSICAL EXAM" },
  { id: "spine", label: "Spine", category: "PHYSICAL EXAM" },
  { id: "skin", label: "Skin", category: "PHYSICAL EXAM" },
  { id: "labs", label: "Labs", category: "DIAGNOSTICS" },
  { id: "ekg", label: "EKG", category: "DIAGNOSTICS" },
  { id: "imaging", label: "Imaging", category: "DIAGNOSTICS" },
  { id: "endoscopy", label: "Endoscopy", category: "DIAGNOSTICS" },
  { id: "other", label: "Other", category: "DIAGNOSTICS" },
];

const CATEGORIES = ["INTAKE", "PHYSICAL EXAM", "DIAGNOSTICS"] as const;

const NewEncounter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentModal, setAdditionalContext } = usePageContext();
  const { patients, encounters, updatePatient, updateEncounter, addVitals } = usePatientStore();
  const state = location.state as LocationState | null;

  // Default to ambulatory if no state provided
  const encounterType: EncounterTypeKey = state?.encounterType || "ambulatory";
  const patientData = state?.patientData || null;
  const isNewEncounter = state?.isNewEncounter ?? true;

  const encounterIdFromState = state?.encounterId;
  const activeEncounter = encounterIdFromState
    ? encounters.find((e) => e.id === encounterIdFromState) || null
    : null;
  const activePatient = activeEncounter
    ? patients.find((p) => p.id === activeEncounter.patientId) || null
    : null;

  const [activeSection, setActiveSection] = useState<string>("demographics");
  const [navCategory, setNavCategory] = useState<string>("INTAKE");
  const [showEncounterTypeModal, setShowEncounterTypeModal] = useState(false);
  const [hrInput, setHrInput] = useState<string>("");
  const [bpSysInput, setBpSysInput] = useState<string>("");
  const [bpDiaInput, setBpDiaInput] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const config = ENCOUNTER_TYPE_CONFIG[encounterType];
  const IconComponent = config.icon;

  // Filter out current encounter type and prepare options
  const allEncounterOptions = [
    { id: "mascal", label: "MASCAL", icon: Activity, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    { id: "ambulatory", label: "AMBULATORY", icon: Stethoscope, color: "text-teal-400", bgColor: "bg-teal-500/20" },
    { id: "trauma", label: "TRAUMA", icon: User, color: "text-blue-400", bgColor: "bg-blue-500/20" },
    { id: "surgery", label: "SURGERY", icon: Scissors, color: "text-green-400", bgColor: "bg-green-500/20" },
    { id: "inpatient", label: "INPATIENT", icon: Bed, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  ];

  const availableOptions = allEncounterOptions.filter((opt) => opt.id !== encounterType);

  const handleSwitchEncounterType = (newType: EncounterTypeKey) => {
    navigate("/new-encounter", {
      state: {
        encounterType: newType,
        patientData: patientData,
        isNewEncounter: isNewEncounter,
      },
    });
    setShowEncounterTypeModal(false);
  };

  // Update context when modal opens/closes
  useEffect(() => {
    if (showEncounterTypeModal) {
      setCurrentModal("Encounter Type Switch Modal");
    } else {
      setCurrentModal(null);
    }
  }, [showEncounterTypeModal, setCurrentModal]);

  // Update additional context with encounter type and active section
  useEffect(() => {
    const config = ENCOUNTER_TYPE_CONFIG[encounterType];
    setAdditionalContext(
      `Encounter Type: ${config.label.toUpperCase()}, Active Section: ${activeSection.replace(/-/g, " ")}`
    );
  }, [encounterType, activeSection, setAdditionalContext]);

  useEffect(() => {
    if (!showEncounterTypeModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEncounterTypeModal(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showEncounterTypeModal]);

  // Mock patient data if new encounter
  const fallbackDisplayPatient: PatientResult = patientData || {
    dodId: "0000000003",
    firstName: "New",
    lastName: "PATIENT",
    age: 25,
    sex: "M",
    presentingProblem: "New encounter",
    encounterStatus: "Open",
    dateTime: new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).toUpperCase(),
  };

  const displayName = activePatient || fallbackDisplayPatient;

  useEffect(() => {
    const sec = NAV_SECTIONS.find((s) => s.id === activeSection);
    if (sec) setNavCategory(sec.category);
  }, [activeSection]);

  const handleSaveVitals = () => {
    if (!activeEncounter) return;

    const hr = hrInput ? Number(hrInput) : undefined;
    const bpSystolic = bpSysInput ? Number(bpSysInput) : undefined;
    const bpDiastolic = bpDiaInput ? Number(bpDiaInput) : undefined;

    if (Number.isNaN(hr) && Number.isNaN(bpSystolic) && Number.isNaN(bpDiastolic)) {
      toast.error("Please enter at least one vital sign");
      return;
    }

    addVitals(activeEncounter.id, {
      hr: Number.isNaN(hr) ? undefined : hr,
      bpSystolic: Number.isNaN(bpSystolic) ? undefined : bpSystolic,
      bpDiastolic: Number.isNaN(bpDiastolic) ? undefined : bpDiastolic,
    });

    setHrInput("");
    setBpSysInput("");
    setBpDiaInput("");
    setLastSaved(new Date());
    toast.success("Vitals saved successfully");
  };

  // Auto-save indicator - update timestamp when data changes
  useEffect(() => {
    if (activeEncounter || activePatient) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
      }, 500); // Small delay to show auto-save
      return () => clearTimeout(timer);
    }
  }, [activeEncounter?.location, activeEncounter?.presentingProblem, activePatient?.firstName, activePatient?.lastName, activePatient?.age, activePatient?.sex]);

  const handleSaveAndReturn = () => {
    if (activeEncounter) {
      setLastSaved(new Date());
      toast.success("Encounter saved");
      navigate("/patient-tracker");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top: encounter type — rectangular control, not sidebar circles */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowEncounterTypeModal(true)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 border border-primary/25">
            <IconComponent className="h-4 w-4 text-primary" />
          </span>
          <span className="uppercase tracking-wide text-xs">{config.label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground hidden sm:inline">Chart sections</span>
      </div>

      {/* Category tabs + section chips (replaces left rail) */}
      <div className="shrink-0 border-b border-border px-4 py-2 space-y-2 bg-background">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setNavCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                navCategory === cat
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:bg-secondary/50 border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pb-1 max-h-[5.5rem] overflow-y-auto">
          {NAV_SECTIONS.filter((s) => s.category === navCategory).map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-md px-2.5 py-1 text-left text-xs border transition-colors max-w-full ${
                  isActive
                    ? "border-primary/35 bg-primary/10 text-foreground"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Patient Summary Bar */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-stretch gap-4 h-full">
            {/* Enter patient location box */}
            <div className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 flex items-center">
              <input
                type="text"
                placeholder="Enter patient location"
                className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/50 outline-none"
                value={activeEncounter?.location ?? ""}
                onChange={(e) => {
                  if (!activeEncounter) return;
                  updateEncounter(activeEncounter.id, { location: e.target.value });
                }}
              />
            </div>
            
            {/* Save Status & Button */}
            {activeEncounter && (
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSaveAndReturn}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save & Return to Tracker
                </button>
              </div>
            )}

            {/* Patient info box */}
            <div className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 flex flex-col justify-center">
              <div className="text-base font-bold text-white uppercase">
                {displayName.lastName}, {displayName.firstName}
              </div>
              <div className="text-sm font-semibold text-white/80 mt-1">
                {displayName.age} {displayName.sex} | 01-JAN-98 | {displayName.dodId}
              </div>
              <div className="text-sm font-semibold text-white/80 mt-1">
                {activeEncounter
                  ? activeEncounter.presentingProblem || "New encounter"
                  : fallbackDisplayPatient.presentingProblem}
              </div>
            </div>

            {/* Allergies box */}
            <div className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 flex items-center">
              <div className="text-sm font-semibold text-white">
                Allergies:{" "}
                {activePatient && activePatient.allergies && activePatient.allergies.length > 0
                  ? activePatient.allergies.join(", ")
                  : activePatient
                  ? "No Known Allergies"
                  : "No Known Allergies"}
              </div>
            </div>

            {/* Alerts box */}
            <div className="flex-1 px-4 py-3 rounded-md bg-black/30 border border-white/10 flex items-center">
              <div className="text-sm font-semibold text-white/70">
                {activePatient && activePatient.conditions && activePatient.conditions.length > 0
                  ? `Conditions: ${activePatient.conditions.join(", ")}`
                  : "No alerts"}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Demographics Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "demographics" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">Demographics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-white/70">DOD ID</label>
                      <div className="mt-1 font-semibold text-white">
                        {activePatient ? activePatient.dodId : fallbackDisplayPatient.dodId}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">First name</label>
                      {activePatient ? (
                        <input
                          className="mt-1 w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                          value={activePatient.firstName}
                          onChange={(e) => updatePatient(activePatient.id, { firstName: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 font-semibold text-white">{fallbackDisplayPatient.firstName}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Middle name</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Last name</label>
                      {activePatient ? (
                        <input
                          className="mt-1 w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                          value={activePatient.lastName}
                          onChange={(e) => updatePatient(activePatient.id, { lastName: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 font-semibold text-white">{fallbackDisplayPatient.lastName}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Date of birth</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Age</label>
                      {activePatient ? (
                        <input
                          type="number"
                          className="mt-1 w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                          value={activePatient.age}
                          onChange={(e) =>
                            updatePatient(activePatient.id, {
                              age: Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value),
                            })
                          }
                        />
                      ) : (
                        <div className="mt-1 font-semibold text-white">{fallbackDisplayPatient.age}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Sex</label>
                      {activePatient ? (
                        <select
                          className="mt-1 w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                          value={activePatient.sex}
                          onChange={(e) =>
                            updatePatient(activePatient.id, {
                              sex: e.target.value as "M" | "F" | "-",
                            })
                          }
                        >
                          <option value="-" className="bg-card">
                            -
                          </option>
                          <option value="M" className="bg-card">
                            M
                          </option>
                          <option value="F" className="bg-card">
                            F
                          </option>
                        </select>
                      ) : (
                        <div className="mt-1 font-semibold text-white">{fallbackDisplayPatient.sex}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Weight</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Height</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">BMI</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Time</label>
                      <div className="mt-1 font-semibold text-white">
                        {activeEncounter
                          ? new Date(activeEncounter.arrivalTime).toLocaleString()
                          : fallbackDisplayPatient.dateTime}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Photo of patient</label>
                      <button className="mt-1 px-4 py-2 border border-white/20 rounded text-sm text-white/70 hover:bg-white/5">
                        + Add Image
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-3">Encounter</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-white/70">Chief complaint</label>
                      {activeEncounter ? (
                        <input
                          className="mt-1 w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                          value={activeEncounter.presentingProblem}
                          onChange={(e) =>
                            updateEncounter(activeEncounter.id, {
                              presentingProblem: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="mt-1 font-semibold text-white">
                          {fallbackDisplayPatient.presentingProblem}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-white/70">Chief complaint comment</label>
                      <div className="mt-1 font-semibold text-white">-</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== "demographics" && (
              <div className="text-white/70">
                <h2 className="text-lg font-bold text-white mb-4">
                  {NAV_SECTIONS.find((s) => s.id === activeSection)?.label || "Section"}
                </h2>
                <p>Content for {activeSection} section</p>
              </div>
            )}
          </div>

          {/* Right Vitals Panel */}
          <div className="w-48 bg-card border-l border-white/10 p-4 space-y-3 overflow-y-auto">
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">HR</div>
              <input
                type="number"
                className="w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                value={hrInput}
                onChange={(e) => setHrInput(e.target.value)}
                placeholder="-"
              />
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">BP (sys/dia)</div>
              <div className="flex gap-1">
                <input
                  type="number"
                  className="w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                  value={bpSysInput}
                  onChange={(e) => setBpSysInput(e.target.value)}
                  placeholder="sys"
                />
                <span className="self-center text-white/60 text-xs">/</span>
                <input
                  type="number"
                  className="w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                  value={bpDiaInput}
                  onChange={(e) => setBpDiaInput(e.target.value)}
                  placeholder="dia"
                />
              </div>
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">RR</div>
              <div className="text-lg font-bold text-white">-</div>
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">SpO2</div>
              <div className="text-lg font-bold text-white">
                {activeEncounter && activeEncounter.vitals.length > 0
                  ? activeEncounter.vitals[activeEncounter.vitals.length - 1].spo2 ?? "-"
                  : "-"}
              </div>
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">EtCO2</div>
              <div className="text-lg font-bold text-white">-</div>
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">T°</div>
              <div className="text-lg font-bold text-white">
                {activeEncounter && activeEncounter.vitals.length > 0
                  ? activeEncounter.vitals[activeEncounter.vitals.length - 1].temperature ?? "-"
                  : "-"}
              </div>
            </div>
            <div className="border border-border rounded-md p-3 bg-secondary/20">
              <div className="text-xs text-white/70 mb-1">Pain score</div>
              <div className="text-lg font-bold text-white">
                {activeEncounter && activeEncounter.vitals.length > 0
                  ? activeEncounter.vitals[activeEncounter.vitals.length - 1].painScore ?? "-"
                  : "-"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveVitals}
              disabled={!activeEncounter}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary/90 hover:bg-primary disabled:opacity-40 disabled:pointer-events-none px-3 py-2 text-xs font-medium text-primary-foreground"
            >
              Save vitals
            </button>
            {activeEncounter && (
              <div className="mt-1 text-xs font-semibold text-white/80">
                NEWS-2:{" "}
                <span
                  className={
                    activeEncounter.news2 >= 5
                      ? "text-red-400"
                      : activeEncounter.news2 >= 3
                      ? "text-orange-300"
                      : "text-emerald-300"
                  }
                >
                  {activeEncounter.news2}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Encounter Type Switch Modal */}
      {showEncounterTypeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Switch encounter type"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowEncounterTypeModal(false)}
            className="absolute inset-0 bg-background/45 backdrop-blur-md"
          />

          <div className="relative w-full max-w-lg max-h-[85vh] rounded-lg border border-border bg-card text-card-foreground shadow-[0_24px_56px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Switch context</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Navigate or change encounter type</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/home");
                    setShowEncounterTypeModal(false);
                  }}
                  className="rounded-md border border-border bg-secondary/30 px-3 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center mb-2">
                    <Home className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-foreground">Clinical hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/patient-tracker");
                    setShowEncounterTypeModal(false);
                  }}
                  className="rounded-md border border-border bg-secondary/30 px-3 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center mb-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Unit census</span>
                </button>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Encounter types</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableOptions.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSwitchEncounterType(option.id as EncounterTypeKey)}
                        className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                          <OptionIcon className="h-4 w-4 text-primary" />
                        </span>
                        <span className="text-xs font-medium text-foreground">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-secondary/30"
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  Share encounter to chart
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-secondary/30"
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  Share encounter to external system
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEncounter;
