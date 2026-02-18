import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, Plus, Users, TestTube, Pill } from "lucide-react";
import PatientSearchModal from "@/components/PatientSearchModal";
import ResultsModal, { type PatientResult } from "@/components/ResultsModal";
import OpenPatientInModal from "@/components/OpenPatientInModal";
import { usePatientStore } from "@/store/patientStore";

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
    setPatientSearchOpen(true);
  };

  const handlePatientTracker = () => {
    navigate("/patient-tracker");
  };

  const handleQuickstartGuide = () => {
    navigate("/quick-overview");
  };

  const handleSearchResults = (results: PatientResult[]) => {
    setSearchResults(results);
    setResultsModalOpen(true);
  };

  const handleNoneOfTheAbove = () => {
    setResultsModalOpen(false);
    // Trigger New Encounter flow (placeholder for now)
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

    // Unknown patient flow: create temporary patient + encounter in store
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

    // Known patient flow
    if (patientData) {
      // If patient has an existing encounter and we're continuing it
      if (!isNew && patientData.encounterId) {
        // Open existing encounter
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

      // Create new encounter for existing patient
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

    // Fallback (shouldn't reach here, but just in case)
    navigate("/new-encounter", {
      state: {
        encounterType: type,
        patientData: patientData,
        isNewEncounter: isNew,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-end p-4">
        <Info className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 pt-8">
        {/* Search bar */}
        <div className="w-full max-w-xl mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full py-3 pl-12 pr-4 bg-secondary/50 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Icon grid */}
        <div className="flex flex-col items-center gap-8">
          {/* Row 1 - 3 icons */}
          <div className="flex flex-wrap items-start justify-center gap-x-12 gap-y-8">
            {/* New encounter - clickable */}
            <button onClick={handleNewEncounter} className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-clickable">
                <Plus className="w-12 h-12 text-foreground" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-foreground">New encounter</span>
            </button>

            {/* Patient tracker - clickable */}
            <button onClick={handlePatientTracker} className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-clickable">
                <svg className="w-12 h-12 text-foreground" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="14" r="6" />
                  <path d="M8 38v-4a8 8 0 0 1 8-8h4" />
                  <line x1="30" y1="18" x2="42" y2="18" />
                  <line x1="30" y1="26" x2="42" y2="26" />
                  <line x1="30" y1="34" x2="38" y2="34" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Patient tracker</span>
            </button>

            {/* Discharged patients - not clickable */}
            <div className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-disabled">
                <svg className="w-12 h-12 text-foreground" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="8" width="24" height="32" rx="2" />
                  <circle cx="20" cy="18" r="4" />
                  <path d="M12 32c0-4 4-6 8-6s8 2 8 6" />
                  <path d="M32 24l8 0" />
                  <path d="M36 20l4 4-4 4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Discharged patients</span>
            </div>
          </div>

          {/* Row 2 - 4 icons */}
          <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
            {/* Data seeding - not clickable */}
            <div className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-disabled">
                <Users className="w-10 h-10 text-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-foreground">Data seeding</span>
            </div>

            {/* Lab task list - not clickable */}
            <div className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-disabled">
                <TestTube className="w-10 h-10 text-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-foreground">Lab task list</span>
            </div>

            {/* Rad task list - not clickable */}
            <div className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-disabled">
                <svg className="w-10 h-10 text-foreground" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Human body scan icon */}
                  <circle cx="24" cy="10" r="4" />
                  <line x1="24" y1="14" x2="24" y2="28" />
                  <line x1="18" y1="20" x2="30" y2="20" />
                  <line x1="24" y1="28" x2="18" y2="40" />
                  <line x1="24" y1="28" x2="30" y2="40" />
                  {/* Scan dots */}
                  <circle cx="24" cy="18" r="1.5" fill="currentColor" />
                  <circle cx="20" cy="24" r="1.5" fill="currentColor" />
                  <circle cx="28" cy="24" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Rad task list</span>
            </div>

            {/* Pharmacy task list - not clickable */}
            <div className="flex flex-col items-center gap-3">
              <div className="cdp-icon-circle-disabled">
                <svg className="w-10 h-10 text-foreground" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <text x="24" y="32" textAnchor="middle" fontSize="24" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">℞</text>
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground text-center">Pharmacy<br />task list</span>
            </div>
          </div>
        </div>

        {/* Quickstart guide section */}
        <div className="mt-auto mb-8 flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm font-semibold">Not sure where to start?</p>
          <button
            onClick={handleQuickstartGuide}
            className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-full text-sm font-bold hover:bg-primary/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            Launch Quickstart Guide
          </button>
        </div>
      </div>

      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
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
