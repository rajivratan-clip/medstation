import { Search, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientStore } from "@/store/patientStore";
import { useUser } from "@/contexts/UserContext";
import { eventTracker } from "@/analytics/eventTracker";
import { useState, useMemo } from "react";

const PatientTracker = () => {
  const navigate = useNavigate();
  const { patients, encounters, updateEncounter, toggleFollow } = usePatientStore();
  const { currentUser } = useUser();
  const [showFollowOnly, setShowFollowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeEncounters = useMemo(
    () => encounters.filter((e) => e.status !== "discharged"),
    [encounters]
  );

  const filteredEncounters = useMemo(() => {
    let filtered = activeEncounters;

    // Apply follow filter - show only encounters where current user is in careTeam
    if (showFollowOnly) {
      filtered = filtered.filter((e) => e.careTeam.includes(currentUser.id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((encounter) => {
        const patient = patients.find((p) => p.id === encounter.patientId);
        if (!patient) return false;

        return (
          patient.firstName.toLowerCase().includes(query) ||
          patient.lastName.toLowerCase().includes(query) ||
          patient.dodId.toLowerCase().includes(query) ||
          encounter.presentingProblem.toLowerCase().includes(query) ||
          encounter.location.toLowerCase().includes(query)
        );
      });
    }

    // Sort by NEWS-2 score (highest first), then by arrival time (oldest first)
    return filtered.sort((a, b) => {
      if (b.news2 !== a.news2) return b.news2 - a.news2;
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    });
  }, [activeEncounters, showFollowOnly, searchQuery, patients]);

  // Group encounters by location
  const groupedEncounters = useMemo(() => {
    const groups: Record<string, typeof filteredEncounters> = {};
    filteredEncounters.forEach((encounter) => {
      const location = encounter.location || "Location not specified";
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(encounter);
    });
    return groups;
  }, [filteredEncounters]);

  const totalPts = activeEncounters.length;

  const formatMinutesSince = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const getNewsColorClass = (score: number) => {
    if (score >= 5) return "text-red-400";
    if (score >= 3) return "text-orange-300";
    return "text-emerald-300";
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-10 pt-8 pb-10 flex flex-col">
      {/* Top header row */}
      <div className="flex items-start justify-between gap-8">
        {/* Left: icon + title + back */}
        <div>
          <div className="flex items-center gap-4">
            {/* Home Logo - Clickable */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-transparent hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src="/homelogo.png" alt="Home" className="w-full h-full object-contain p-2" />
            </button>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">Census</span>
              <span className="mt-1 text-sm uppercase tracking-[0.25em] text-white/60">
                TOTAL PTS = {totalPts}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="mt-4 inline-flex items-center rounded-full border border-white/25 px-5 py-2 text-sm font-bold text-white/80 hover:bg-white/10"
          >
            Back to Patient
          </button>
        </div>

        {/* Right: search + actions */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="relative w-[520px] max-w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search by name, DOD ID, problem, or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-white/10 py-3 pl-12 pr-4 text-base text-white placeholder:text-white/50 outline-none ring-0"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setShowFollowOnly(false);
            }}
            className="h-11 rounded-full border border-white/30 px-5 text-sm font-bold text-white/85 hover:bg-white/10"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowFollowOnly((prev) => !prev)}
            className={`h-11 rounded-full border px-5 text-sm font-bold ${
              showFollowOnly
                ? "border-[#1f6fff] text-white bg-[#1f6fff33]"
                : "border-[#1f6fff] text-[#5ea2ff] hover:bg-[#1f6fff1a]"
            }`}
          >
            {showFollowOnly ? "Showing My Patients" : "Show My Patients"}
          </button>
          <button
            type="button"
            onClick={() => setShowFollowOnly(false)}
            className="h-11 rounded-full border border-white/30 px-5 text-sm font-bold text-white/85 hover:bg-white/10"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Table area */}
      <div className="mt-7 flex-1 rounded-md bg-black/5 overflow-hidden flex flex-col">
        {/* Header row */}
        <div className="grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center rounded-t-md bg-[#272b3a] px-6 py-4 text-sm font-bold text-white/70">
          {[
            "Location",
            "Name",
            "Age",
            "Time",
            "Presenting problem",
            "NEWS-2",
            "Indicators",
            "Follow",
            "Disposition",
          ].map((label) => (
            <div key={label} className="flex items-center gap-1">
              <span>{label}</span>
              <span className="text-[#4ea2ff]">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 4h8L6 9 2 4Z" fill="currentColor" />
                </svg>
              </span>
            </div>
          ))}
        </div>

        {Object.keys(groupedEncounters).length === 0 ? (
          <div className="flex-1 overflow-y-auto bg-[#2f3443]">
            <div className="px-6 py-6 text-sm font-semibold text-white/60">
              {searchQuery.trim() || showFollowOnly
                ? "No encounters match your filters."
                : "No active encounters."}
            </div>
          </div>
        ) : (
          Object.entries(groupedEncounters).map(([location, locationEncounters], locationIndex) => (
            <div key={location} className={locationIndex > 0 ? "mt-px" : ""}>
              {/* Location header */}
              <div className="bg-[#3a3f4f] px-6 py-3 text-sm font-bold text-white/80 whitespace-nowrap">
                {location}
              </div>

              {/* Patient rows for this location */}
              <div className="divide-y divide-white/10 bg-[#2f3443]">
                {locationEncounters.map((encounter) => {
                  const patient = patients.find((p) => p.id === encounter.patientId);
                  if (!patient) return null;

                  const minutesWaiting =
                    Math.floor((Date.now() - new Date(encounter.arrivalTime).getTime()) / 60000) || 0;

                  const indicatorItems: Array<{ icon?: string; text: string }> = [];

                  if (encounter.news2 >= 5) {
                    indicatorItems.push({ icon: "🔴", text: "CRITICAL" });
                  } else if (encounter.news2 >= 3) {
                    indicatorItems.push({ text: "MEDIUM RISK" });
                  }

                  if (minutesWaiting > 30) {
                    indicatorItems.push({ icon: "⏳", text: "LONG WAIT" });
                  }

                  if (!encounter.vitals || encounter.vitals.length === 0) {
                    indicatorItems.push({ icon: "⚠", text: "NO VITALS" });
                  }

                  const newsColor = getNewsColorClass(encounter.news2);

                  const isFollowing = encounter.careTeam.includes(currentUser.id);
                  const isCritical = encounter.news2 >= 5;
                  
                  // Critical patients get red tint
                  const rowBg = isCritical
                    ? "bg-red-900/20"
                    : encounter.news2 >= 3
                    ? "bg-orange-900/20"
                    : "bg-transparent";

                  // Add subtle highlight and left border when following
                  // If critical, use red border; otherwise use blue for following
                  const followingStyles = isFollowing
                    ? isCritical
                      ? "border-l-4 border-red-500 bg-[#ff000008]"
                      : "border-l-4 border-[#5ea2ff] bg-[#1f6fff08]"
                    : "";

                  const handleRowClick = () => {
                    eventTracker.track(
                      "encounter_opened_from_tracker",
                      {
                        pathname: "/new-encounter",
                        source: "tracker",
                        encounter_type: encounter.encounterType,
                      },
                      { encounterId: encounter.id, patientId: encounter.patientId }
                    );
                    // Convert encounter type from store format to route state format
                    const encounterTypeMap: Record<string, string> = {
                      AMBULATORY: "ambulatory",
                      INPATIENT: "inpatient",
                      TRAUMA: "trauma",
                      SURGERY: "surgery",
                      MASCAL: "mascal",
                    };
                    
                    navigate("/new-encounter", {
                      state: {
                        encounterId: encounter.id,
                        encounterType: encounterTypeMap[encounter.encounterType] || "ambulatory",
                        patientData: null,
                        isNewEncounter: false,
                      },
                    });
                  };

                  return (
                    <div
                      key={encounter.id}
                      onClick={handleRowClick}
                      className={`grid grid-cols-[200px_1fr_100px_140px_1fr_100px_140px_100px_120px] items-center px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors ${rowBg} ${followingStyles}`}
                    >
                      <div className="text-sm font-semibold text-white/70 whitespace-nowrap">
                        {encounter.location || "Location not specified"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide text-white">
                          {patient.lastName.toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-white/70 lowercase first-letter:uppercase">
                          {patient.firstName}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white/80">
                        {patient.age} {patient.sex}
                      </div>
                      <div className="text-sm font-semibold text-white/80">
                        {formatMinutesSince(encounter.arrivalTime)}
                      </div>
                      <div className="text-sm font-semibold text-white/85">
                        {encounter.presentingProblem || "—"}
                      </div>
                      <div className={`text-sm font-bold ${newsColor}`}>{encounter.news2}</div>
                      <div className="text-sm font-semibold text-white/60 flex flex-col gap-0.5">
                        {indicatorItems.length > 0 ? (
                          indicatorItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              {item.icon && <span>{item.icon}</span>}
                              <span>• {item.text}</span>
                            </div>
                          ))
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            toggleFollow(encounter.id, currentUser.id);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base hover:bg-white/15 transition-colors ${
                            isFollowing
                              ? "border-[#5ea2ff] text-[#5ea2ff] bg-[#1f6fff1a]"
                              : "border-white/45 text-white/85"
                          }`}
                          title={isFollowing ? "Unfollow patient" : "Follow patient"}
                        >
                          {isFollowing ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <span>+</span>
                          )}
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-white/85">
                        <select
                          className="bg-transparent border border-white/25 rounded px-2 py-1 text-xs text-white/80"
                          value={encounter.disposition ?? "Pending"}
                          onChange={(e) => {
                            e.stopPropagation(); // Prevent row click
                            const value = e.target.value as "Pending" | "Admit" | "Discharge" | "Transfer";
                            updateEncounter(encounter.id, {
                              disposition: value === "Pending" ? null : value,
                              status: value === "Discharge" ? "discharged" : encounter.status,
                            });
                          }}
                          onClick={(e) => e.stopPropagation()} // Prevent row click when opening dropdown
                        >
                          <option className="bg-[#272b3a]" value="Pending">
                            Pending
                          </option>
                          <option className="bg-[#272b3a]" value="Admit">
                            Admit
                          </option>
                          <option className="bg-[#272b3a]" value="Discharge">
                            Discharge
                          </option>
                          <option className="bg-[#272b3a]" value="Transfer">
                            Transfer
                          </option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientTracker;
