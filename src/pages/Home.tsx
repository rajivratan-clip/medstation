import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Plus,
  Users,
  TestTube,
  Pill,
  PlayCircle,
  ChevronRight,
  Archive,
  Scan,
} from "lucide-react";
import PatientSearchModal from "@/components/PatientSearchModal";
import ResultsModal, { type PatientResult } from "@/components/ResultsModal";
import OpenPatientInModal from "@/components/OpenPatientInModal";
import { usePatientStore } from "@/store/patientStore";
import { eventTracker } from "@/analytics/eventTracker";

const Home = () => {
  const navigate = useNavigate();
  const { createUnknownEncounter, createEncounterForPatient } = usePatientStore();
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
  const [openPatientInModalOpen, setOpenPatientInModalOpen] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<PatientResult | null>(null);
  const [isNewEncounter, setIsNewEncounter] = useState(false);

  const handleNewEncounter = () => {
    eventTracker.track("modal_opened", { modal: "patient_search" });
    eventTracker.track("encounter_opened", { source: "new" });
    setPatientSearchOpen(true);
  };

  const handlePatientTracker = () => {
    navigate("/patient-tracker");
  };

  const handleQuickstartGuide = () => {
    navigate("/quick-overview");
  };

  const handleSearchResults = (results: PatientResult[]) => {
    eventTracker.track("modal_closed", { modal: "patient_search" });
    eventTracker.track("patient_search_performed", { resultCount: results.length });
    setPatientSearchOpen(false);
    setSearchResults(results);
    setResultsModalOpen(true);
  };

  const handleNoneOfTheAbove = () => {
    setResultsModalOpen(false);
    console.log("None of the above - trigger new encounter");
  };

  const handleContinueEncounter = (patient: PatientResult) => {
    setResultsModalOpen(false);
    setSelectedPatientData(patient);
    setIsNewEncounter(false);
    setOpenPatientInModalOpen(true);
  };

  const handleNewEncounterFromResults = () => {
    setResultsModalOpen(false);
    setSelectedPatientData(null);
    setIsNewEncounter(true);
    setOpenPatientInModalOpen(true);
  };

  const handleUnknownPatient = () => {
    setPatientSearchOpen(false);
    setSelectedPatientData(null);
    setIsNewEncounter(true);
    setOpenPatientInModalOpen(true);
  };

  const handleSelectEncounterType = (type: string, patientData: PatientResult | null, isNew: boolean) => {
    setOpenPatientInModalOpen(false);

    const encounterType = type.toUpperCase() as
      | "MASCAL"
      | "AMBULATORY"
      | "TRAUMA"
      | "SURGERY"
      | "INPATIENT";

    if (!patientData && isNew) {
      const { encounterId } = createUnknownEncounter(encounterType);

      navigate("/new-encounter", {
        state: {
          encounterId,
          encounterType: type,
          patientData: null,
          isNewEncounter: true,
        },
      });
      return;
    }

    if (patientData) {
      if (!isNew && patientData.encounterId) {
        navigate("/new-encounter", {
          state: {
            encounterId: patientData.encounterId,
            encounterType: type,
            patientData: patientData,
            isNewEncounter: false,
          },
        });
        return;
      }

      if (isNew && patientData.patientId) {
        const encounterId = createEncounterForPatient(patientData.patientId, encounterType);

        navigate("/new-encounter", {
          state: {
            encounterId,
            encounterType: type,
            patientData: patientData,
            isNewEncounter: true,
          },
        });
        return;
      }
    }

    navigate("/new-encounter", {
      state: {
        encounterType: type,
        patientData: patientData,
        isNewEncounter: isNew,
      },
    });
  };

  const primaryActions = [
    {
      title: "New visit",
      description: "Search or register a patient and open a chart.",
      icon: Plus,
      onClick: handleNewEncounter,
      enabled: true,
    },
    {
      title: "Unit census",
      description: "Browse active encounters by location.",
      icon: LayoutGrid,
      onClick: handlePatientTracker,
      enabled: true,
    },
    {
      title: "Discharged archive",
      description: "Coming soon — read-only historical list.",
      icon: Archive,
      onClick: undefined,
      enabled: false,
    },
  ];

  const secondaryItems = [
    { label: "Sample data", icon: Users },
    { label: "Lab queue", icon: TestTube },
    { label: "Imaging queue", icon: Scan },
    { label: "Pharmacy queue", icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Side rail — not a centered circle grid */}
      <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/25 px-6 py-8 flex flex-col gap-8">
        <div className="flex items-center gap-2 text-foreground">
          <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">MedStation</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Hub</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Shortcuts</span>
          <button
            type="button"
            onClick={handleNewEncounter}
            className="text-left py-2 px-2 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
          >
            New visit
          </button>
          <button
            type="button"
            onClick={handlePatientTracker}
            className="text-left py-2 px-2 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
          >
            Census
          </button>
          <button
            type="button"
            onClick={handleQuickstartGuide}
            className="text-left py-2 px-2 rounded-md hover:bg-secondary/80 text-muted-foreground transition-colors"
          >
            Onboarding
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 pt-6 pb-2 flex justify-end">
        </header>

        <main className="flex-1 px-6 pb-10 max-w-4xl w-full mx-auto">
          <h1 className="text-lg font-semibold text-foreground tracking-tight mb-1">Clinical hub</h1>
          <p className="text-sm text-muted-foreground mb-8">Choose a workflow below.</p>

          <div className="relative mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick search (demo)"
              className="w-full py-2.5 pl-10 pr-4 rounded-md bg-secondary/40 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {primaryActions.map((item) => {
              const Icon = item.icon;
              const inner = (
                <>
                  <div className="shrink-0 h-11 w-11 rounded-md bg-primary/15 flex items-center justify-center border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.description}</p>
                  </div>
                  {item.enabled && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </>
              );
              if (item.enabled && item.onClick) {
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={item.onClick}
                    className="group flex gap-4 rounded-lg border border-border bg-card/50 p-4 text-left hover:bg-card transition-colors items-start"
                  >
                    {inner}
                  </button>
                );
              }
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 items-start opacity-60"
                >
                  {inner}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-muted/15 overflow-hidden">
            <div className="px-4 py-2 border-b border-border/80 text-[10px] uppercase tracking-widest text-muted-foreground">
              Other modules (preview)
            </div>
            <ul className="divide-y divide-border/60">
              {secondaryItems.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 rounded-md bg-secondary/50 items-center justify-center border border-border/50">
                      <Icon className="h-4 w-4 opacity-70" strokeWidth={1.5} />
                    </span>
                    {label}
                  </span>
                  <span className="text-[10px] uppercase">Locked</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-muted-foreground">New to the workspace?</p>
            <button
              type="button"
              onClick={handleQuickstartGuide}
              className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Open onboarding tour
            </button>
          </div>
        </main>
      </div>

      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => {
          eventTracker.track("modal_closed", { modal: "patient_search" });
          setPatientSearchOpen(false);
        }}
        onSearchResults={handleSearchResults}
        onUnknownPatient={handleUnknownPatient}
      />
      <ResultsModal
        open={resultsModalOpen}
        onClose={() => setResultsModalOpen(false)}
        results={searchResults}
        onNoneOfTheAbove={handleNoneOfTheAbove}
        onContinueEncounter={handleContinueEncounter}
        onNewEncounter={handleNewEncounterFromResults}
      />
      <OpenPatientInModal
        open={openPatientInModalOpen}
        onClose={() => setOpenPatientInModalOpen(false)}
        onSelectEncounterType={handleSelectEncounterType}
        patientData={selectedPatientData}
        isNewEncounter={isNewEncounter}
      />
    </div>
  );
};

export default Home;
