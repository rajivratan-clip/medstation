import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Plus,
  Heart,
  Activity,
  Stethoscope,
  User,
  Scissors,
  Bed,
  QrCode,
  ChevronDown,
  Home as HomeIcon,
  Check,
  Save,
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

  const navSections = [
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

  const categories = ["INTAKE", "PHYSICAL EXAM", "DIAGNOSTICS"];
  let currentCategory = "";

  const displayName = activePatient || fallbackDisplayPatient;

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
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-[#2E3442] bg-black/20 border-r border-white/10 flex flex-col">
        {/* Encounter Type Header at Top */}
        <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            {/* Clickable Circular Icon */}
            <button
              type="button"
              onClick={() => setShowEncounterTypeModal(true)}
              className="flex-shrink-0"
            >
              <div
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 cursor-pointer hover:opacity-80 transition-opacity",
                  config.borderColor,
                ].join(" ")}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-[#373B49]">
                  <IconComponent className={[config.color, "w-4 h-4"].join(" ")} />
                </div>
              </div>
            </button>
            {/* Encounter Type Label */}
            <div className="flex flex-col">
                  <span className={["text-base font-bold uppercase", config.color].join(" ")}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <div className="px-4 py-2 text-xs font-bold text-white/60 uppercase tracking-wider">
                {category}
              </div>
              {navSections
                .filter((section) => section.category === category)
                .map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={[
                        "w-full relative flex items-center px-4 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/20 text-white border-l-2 border-teal-400"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      ].join(" ")}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-400" />
                      )}
                      <span className="pl-2">{section.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Patient Summary Bar */}
        <div className="bg-[#2E3442] border-b border-white/10 px-6 py-3">
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
                          <option value="-" className="bg-[#2E3442]">
                            -
                          </option>
                          <option value="M" className="bg-[#2E3442]">
                            M
                          </option>
                          <option value="F" className="bg-[#2E3442]">
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
                  {navSections.find((s) => s.id === activeSection)?.label || "Section"}
                </h2>
                <p>Content for {activeSection} section</p>
              </div>
            )}
          </div>

          {/* Right Vitals Panel */}
          <div className="w-48 bg-[#2E3442] border-l border-white/10 p-4 space-y-3 overflow-y-auto">
            <div className="border border-red-500/50 rounded p-3">
              <div className="text-xs text-white/70 mb-1">HR</div>
              <input
                type="number"
                className="w-full rounded bg-black/40 border border-white/20 px-2 py-1 text-sm text-white"
                value={hrInput}
                onChange={(e) => setHrInput(e.target.value)}
                placeholder="-"
              />
            </div>
            <div className="border border-red-500/50 rounded p-3">
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
            <div className="border border-red-500/50 rounded p-3">
              <div className="text-xs text-white/70 mb-1">RR</div>
              <div className="text-lg font-bold text-white">-</div>
            </div>
            <div className="border border-red-500/50 rounded p-3">
              <div className="text-xs text-white/70 mb-1">SpO2</div>
              <div className="text-lg font-bold text-white">
                {activeEncounter && activeEncounter.vitals.length > 0
                  ? activeEncounter.vitals[activeEncounter.vitals.length - 1].spo2 ?? "-"
                  : "-"}
              </div>
            </div>
            <div className="border border-red-500/50 rounded p-3">
              <div className="text-xs text-white/70 mb-1">EtCO2</div>
              <div className="text-lg font-bold text-white">-</div>
            </div>
            <div className="border border-red-500/50 rounded p-3">
              <div className="text-xs text-white/70 mb-1">T°</div>
              <div className="text-lg font-bold text-white">
                {activeEncounter && activeEncounter.vitals.length > 0
                  ? activeEncounter.vitals[activeEncounter.vitals.length - 1].temperature ?? "-"
                  : "-"}
              </div>
            </div>
            <div className="border border-red-500/50 rounded p-3">
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
              className="mt-2 w-full inline-flex items-center justify-center gasp-2 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-900/30 disabled:text-white/40 px-3 py-2 text-xs font-bold text-white"
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
          className="fixed inset-0 z-50 flex items-start justify-start"
          role="dialog"
          aria-modal="true"
          aria-label="Switch encounter type"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowEncounterTypeModal(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Modal - Positioned from top-left */}
          <div className="relative w-[700px] max-w-full max-h-[85vh] rounded-xl bg-[#2E3442] shadow-[0_18px_60px_rgba(0,0,0,0.55)] flex flex-col mt-20 ml-4">
            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
              {/* Navigation Options at Top */}
              <div className="space-y-2 mb-6">
                {/* Home Option */}
                <button
                  type="button"
                  onClick={() => {
                    navigate("/home");
                    setShowEncounterTypeModal(false);
                  }}
                  className="w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors hover:bg-white/5"
                >
                  {/* Home Logo */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 overflow-hidden">
                    <img src="/homelogo.png" alt="Home" className="w-full h-full object-contain" />
                  </div>
                  {/* Label */}
                  <span className="text-base font-bold text-white text-left">Home</span>
                </button>

                {/* Patient Tracker Option */}
                <button
                  type="button"
                  onClick={() => {
                    navigate("/patient-tracker");
                    setShowEncounterTypeModal(false);
                  }}
                  className="w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors hover:bg-white/5"
                >
                  {/* Circular Icon */}
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                    <svg className="w-8 h-8 text-white/70" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="14" r="6" />
                      <path d="M8 38v-4a8 8 0 0 1 8-8h4" />
                      <line x1="30" y1="18" x2="42" y2="18" />
                      <line x1="30" y1="26" x2="42" y2="26" />
                      <line x1="30" y1="34" x2="38" y2="34" />
                    </svg>
                  </div>
                  {/* Label */}
                  <span className="text-base font-bold text-white text-left">Patient tracker</span>
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-white/10" />

              {/* Primary Options (excluding current) */}
              <div className="space-y-2">
                {availableOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSwitchEncounterType(option.id as EncounterTypeKey)}
                      className="w-full flex items-center gap-6 px-6 py-4 rounded-md transition-colors hover:bg-white/5"
                    >
                      {/* Circular Icon */}
                      <div
                        className={[
                          "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0",
                          option.bgColor,
                        ].join(" ")}
                      >
                        <OptionIcon className={[option.color, "w-8 h-8"].join(" ")} />
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
      )}
    </div>
  );
};

export default NewEncounter;
