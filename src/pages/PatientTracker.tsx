import { Search, Star, ArrowLeft, Home } from "lucide-react";
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
          patient.idNumber.toLowerCase().includes(query) ||
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
    <div className="min-h-screen bg-background text-foreground flex flex-col px-4 md:px-8 pt-6 pb-10 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 hover:bg-muted/60 transition-colors"
            aria-label="Back to hub"
          >
            <Home className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Unit census</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Active patients — {totalPts} total</p>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to clinical hub
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 lg:justify-end">
          <div className="relative min-w-[200px] sm:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, ID, problem, location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary/30 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowFollowOnly(false);
              }}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowFollowOnly((prev) => !prev)}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                showFollowOnly
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              {showFollowOnly ? "My list only" : "My list"}
            </button>
            <button
              type="button"
              onClick={() => setShowFollowOnly(false)}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/40"
            >
              Reset filters
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8 flex-1 flex flex-col gap-0">
        {Object.keys(groupedEncounters).length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            {searchQuery.trim() || showFollowOnly
              ? "No encounters match your filters."
              : "No active encounters."}
          </div>
        ) : (
          Object.entries(groupedEncounters).map(([location, locationEncounters]) => (
            <section key={location} className="mb-8 last:mb-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-2">{location}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
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

                  const cardTint = isCritical
                    ? "bg-red-950/25 border-red-900/40"
                    : encounter.news2 >= 3
                    ? "bg-orange-950/20 border-orange-900/20"
                    : "bg-card/80 border-border";

                  const followBorder = isFollowing
                    ? isCritical
                      ? "border-l-red-500/80"
                      : "border-l-primary"
                    : "border-l-transparent";

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
                      role="button"
                      tabIndex={0}
                      onClick={handleRowClick}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick();
                        }
                      }}
                      className={`rounded-lg border border-l-4 ${followBorder} ${cardTint} p-4 cursor-pointer transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/25`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-foreground">
                              {patient.lastName}, {patient.firstName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {patient.age} {patient.sex} · {patient.idNumber}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 mt-1 line-clamp-2">
                            {encounter.presentingProblem || "—"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {indicatorItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                              >
                                {item.icon && <span>{item.icon}</span>}
                                {item.text}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end lg:gap-2 shrink-0">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">Wait {formatMinutesSince(encounter.arrivalTime)}</span>
                            <span className="text-muted-foreground">
                              NEWS-2{" "}
                              <span className={`font-semibold ${newsColor}`}>{encounter.news2}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFollow(encounter.id, currentUser.id);
                              }}
                              className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                                isFollowing
                                  ? "border-primary text-primary bg-primary/10"
                                  : "border-border text-muted-foreground hover:bg-secondary/50"
                              }`}
                              title={isFollowing ? "Unfollow" : "Follow"}
                            >
                              {isFollowing ? (
                                <Star className="h-4 w-4 fill-current" />
                              ) : (
                                <span className="text-xs">+</span>
                              )}
                            </button>
                            <select
                              className="rounded-md border border-border bg-background/80 px-2 py-1.5 text-xs text-foreground"
                              value={encounter.disposition ?? "Pending"}
                              onChange={(e) => {
                                e.stopPropagation();
                                const value = e.target.value as "Pending" | "Admit" | "Discharge" | "Transfer";
                                updateEncounter(encounter.id, {
                                  disposition: value === "Pending" ? null : value,
                                  status: value === "Discharge" ? "discharged" : encounter.status,
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Admit">Admit</option>
                              <option value="Discharge">Discharge</option>
                              <option value="Transfer">Transfer</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientTracker;
