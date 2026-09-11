export interface Report {
  id: string;
  rawText: string;
  extracted: {
    location: string;
    incidentType: string;
    severity: "low" | "medium" | "high";
    estimatedDelayMinutes: number;
  };
  source: string;
}

export interface Incident {
  id: string;
  reports: Report[];
  consensus: {
    incidentType: string;
    severity: string;
    estimatedDelayMinutes: number;
    confidence: number;
    agreementLevel: "single-source" | "corroborated" | "conflicting";
    reasoning?: string;
  };
  verifiedByRoute: boolean;
  route?: { distanceMeters: number; etaSeconds: number; geometry?: { type: "LineString"; coordinates: number[][] } };
  alertSent?: boolean;
  createdAt: Date;
}

export const incidents: Incident[] = [];
export function saveIncident(i: Incident) { incidents.push(i); return i; }
export function findIncident(id: string) { return incidents.find(i => i.id === id); }
export function getAll() { return incidents; }