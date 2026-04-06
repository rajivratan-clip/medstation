export const MASCAL_BODY_REGIONS = [
  { id: "head", label: "Head / neck" },
  { id: "chest", label: "Chest" },
  { id: "abdomen", label: "Abdomen" },
  { id: "pelvis", label: "Pelvis" },
  { id: "left_arm", label: "Left arm" },
  { id: "right_arm", label: "Right arm" },
  { id: "left_leg", label: "Left leg" },
  { id: "right_leg", label: "Right leg" },
] as const;

export type MascalBodyRegionId = (typeof MASCAL_BODY_REGIONS)[number]["id"];

export const MASCAL_INJURY_TYPES = [
  "Abrasion",
  "Contusion",
  "Laceration",
  "Burn",
  "Penetrating",
] as const;

export type MascalInjuryType = (typeof MASCAL_INJURY_TYPES)[number];

export type MascalFinding = {
  id: string;
  regionId: MascalBodyRegionId;
  injury: MascalInjuryType;
};
