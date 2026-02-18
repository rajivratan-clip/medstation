import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  seededPatients,
  seededEncounters,
  type Patient,
  type Encounter,
  type EncounterType,
  type Vitals,
} from "./seedData";

type PatientStoreState = {
  patients: Patient[];
  encounters: Encounter[];
  createUnknownEncounter: (type: EncounterType) => { patientId: string; encounterId: string };
  createEncounterForPatient: (patientId: string, type: EncounterType) => string;
  updatePatient: (id: string, updates: Partial<Pick<Patient, "firstName" | "lastName" | "age" | "sex">>) => void;
  updateEncounter: (
    id: string,
    updates: Partial<Pick<Encounter, "location" | "presentingProblem" | "news2" | "status" | "disposition" | "careTeam">>
  ) => void;
  toggleFollow: (encounterId: string, userId: string) => void;
  addVitals: (encounterId: string, vitals: Omit<Vitals, "recordedAt">) => void;
};

const PatientStoreContext = createContext<PatientStoreState | undefined>(undefined);

const createId = () => {
  return `id_${Math.random().toString(36).slice(2, 10)}`;
};

const computeNews2 = (vitals: Omit<Vitals, "recordedAt">): number => {
  let score = 0;

  if (typeof vitals.hr === "number") {
    if (vitals.hr <= 40) score += 3;
    else if (vitals.hr <= 50) score += 1;
    else if (vitals.hr >= 91 && vitals.hr <= 110) score += 1;
    else if (vitals.hr >= 111 && vitals.hr <= 130) score += 2;
    else if (vitals.hr > 130) score += 3;
  }

  if (typeof vitals.bpSystolic === "number") {
    if (vitals.bpSystolic <= 90) score += 3;
    else if (vitals.bpSystolic >= 91 && vitals.bpSystolic <= 100) score += 2;
    else if (vitals.bpSystolic >= 101 && vitals.bpSystolic <= 110) score += 1;
    else if (vitals.bpSystolic >= 111 && vitals.bpSystolic <= 219) score += 0;
    else if (vitals.bpSystolic >= 220) score += 3;
  }

  if (typeof vitals.rr === "number") {
    if (vitals.rr <= 8) score += 3;
    else if (vitals.rr >= 9 && vitals.rr <= 11) score += 1;
    else if (vitals.rr >= 12 && vitals.rr <= 20) score += 0;
    else if (vitals.rr >= 21 && vitals.rr <= 24) score += 2;
    else if (vitals.rr >= 25) score += 3;
  }

  if (typeof vitals.spo2 === "number") {
    if (vitals.spo2 <= 91) score += 3;
    else if (vitals.spo2 >= 92 && vitals.spo2 <= 93) score += 2;
    else if (vitals.spo2 >= 94 && vitals.spo2 <= 95) score += 1;
    else if (vitals.spo2 >= 96) score += 0;
  }

  if (typeof vitals.temperature === "number") {
    if (vitals.temperature <= 35) score += 3;
    else if (vitals.temperature >= 35.1 && vitals.temperature <= 36) score += 1;
    else if (vitals.temperature >= 36.1 && vitals.temperature <= 38) score += 0;
    else if (vitals.temperature >= 38.1 && vitals.temperature <= 39) score += 1;
    else if (vitals.temperature > 39) score += 2;
  }

  return score;
};

export const PatientStoreProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(seededPatients);
  const [encounters, setEncounters] = useState<Encounter[]>(seededEncounters);

  const createUnknownEncounter = (type: EncounterType) => {
    const patientId = createId();

    const newPatient: Patient = {
      id: patientId,
      dodId: `TEMP-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      firstName: "Unknown",
      lastName: "Patient",
      age: 0,
      sex: "-",
    };

    const newEncounter: Encounter = {
      id: createId(),
      patientId,
      encounterType: type,
      status: "arrived",
      location: "Waiting Room",
      presentingProblem: "",
      news2: 0,
      arrivalTime: new Date().toISOString(),
      careTeam: [],
      disposition: null,
      vitals: [],
    };

    setPatients((prev) => [...prev, newPatient]);
    setEncounters((prev) => [...prev, newEncounter]);

    return { patientId, encounterId: newEncounter.id };
  };

  const createEncounterForPatient = (patientId: string, type: EncounterType) => {
    const newEncounter: Encounter = {
      id: createId(),
      patientId,
      encounterType: type,
      status: "arrived",
      location: "Waiting Room",
      presentingProblem: "",
      news2: 0,
      arrivalTime: new Date().toISOString(),
      careTeam: [],
      disposition: null,
      vitals: [],
    };

    setEncounters((prev) => [...prev, newEncounter]);
    return newEncounter.id;
  };

  const toggleFollow: PatientStoreState["toggleFollow"] = (encounterId, userId) => {
    setEncounters((prev) =>
      prev.map((encounter) => {
        if (encounter.id !== encounterId) return encounter;

        const isFollowing = encounter.careTeam.includes(userId);
        const newCareTeam = isFollowing
          ? encounter.careTeam.filter((id) => id !== userId)
          : [...encounter.careTeam, userId];

        return { ...encounter, careTeam: newCareTeam };
      })
    );
  };

  const updatePatient: PatientStoreState["updatePatient"] = (id, updates) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const updateEncounter: PatientStoreState["updateEncounter"] = (id, updates) => {
    setEncounters((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const addVitals: PatientStoreState["addVitals"] = (encounterId, vitals) => {
    const recordedAt = new Date().toISOString();
    setEncounters((prev) =>
      prev.map((e) =>
        e.id === encounterId
          ? {
              ...e,
              vitals: [...e.vitals, { ...vitals, recordedAt }],
              news2: computeNews2(vitals),
            }
          : e
      )
    );
  };

  const value = useMemo(
    () => ({
      patients,
      encounters,
      createUnknownEncounter,
      createEncounterForPatient,
      updatePatient,
      updateEncounter,
      addVitals,
      toggleFollow,
    }),
    [patients, encounters]
  );

  return <PatientStoreContext.Provider value={value}>{children}</PatientStoreContext.Provider>;
};

export const usePatientStore = () => {
  const ctx = useContext(PatientStoreContext);
  if (!ctx) {
    throw new Error("usePatientStore must be used within PatientStoreProvider");
  }
  return ctx;
};

