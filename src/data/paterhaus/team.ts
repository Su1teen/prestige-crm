export interface PaterhausTeamMember {
  name: string;
  role: string;
  focus: string;
  initials: string;
}

export const RUSLAN_TSZI: PaterhausTeamMember = {
  name: "Ruslan Tszi",
  role: "Operations Director",
  focus: "Portfolio escalation, owner reporting and operational oversight",
  initials: "RT",
};

export const SULTAN_SOVETOV: PaterhausTeamMember = {
  name: "Sultan Sovetov",
  role: "Property Management Lead",
  focus: "Property readiness, guest stays, compliance and vendor coordination",
  initials: "SS",
};

export const PATERHAUS_TEAM = [RUSLAN_TSZI, SULTAN_SOVETOV] as const;
export const PATERHAUS_AI_NAME = "Paterhaus AI";
export const CURRENT_PATERHAUS_USER = RUSLAN_TSZI;
