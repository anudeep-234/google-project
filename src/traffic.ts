import axios from "axios";

export const trafficRegions = {
  bengaluru: {
    label: "Bengaluru",
    checkpoints: [
      { name: "Silk Board", lat: 12.9177, lon: 77.6233 },
      { name: "Koramangala", lat: 12.9352, lon: 77.6245 },
      { name: "Hebbal", lat: 13.0358, lon: 77.5970 },
      { name: "Whitefield", lat: 12.9698, lon: 77.7500 }
    ]
  },
  mumbai: {
    label: "Mumbai",
    checkpoints: [
      { name: "Andheri", lat: 19.1197, lon: 72.8468 },
      { name: "Bandra", lat: 19.0607, lon: 72.8362 },
      { name: "Sion", lat: 19.0433, lon: 72.8627 }
    ]
  },
  delhi: {
    label: "Delhi NCR",
    checkpoints: [
      { name: "ITO", lat: 28.6280, lon: 77.2410 },
      { name: "Dhaula Kuan", lat: 28.5912, lon: 77.1590 },
      { name: "Noida Sector 18", lat: 28.5708, lon: 77.3260 }
    ]
  }
} as const;

export type TrafficRegion = keyof typeof trafficRegions;

export async function getRegionalTraffic(region: TrafficRegion) {
  const demoLevels = [68, 42, 31, 54];
  const checkpoints = trafficRegions[region].checkpoints.map((checkpoint, index) => ({
    ...checkpoint,
    currentSpeedKmph: 18 + index * 7,
    freeFlowSpeedKmph: 55,
    congestionPercent: demoLevels[index % demoLevels.length],
    status: demoLevels[index % demoLevels.length] > 60 ? "heavy" : demoLevels[index % demoLevels.length] > 35 ? "slow" : "moving"
  }));
  return { region, label: trafficRegions[region].label, live: false, source: "OpenRouter-only demo estimate", updatedAt: new Date().toISOString(), checkpoints: checkpoints.sort((a, b) => b.congestionPercent - a.congestionPercent) };
}

export async function getRoute(startLat: number, startLon: number, endLat: number, endLon: number) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
  const res = await axios.get(url);
  return res.data;
}

export function isRouteCongested(distanceMeters: number, durationSeconds: number) {
  const expectedSeconds = distanceMeters / 8.3;
  const congestionRatio = durationSeconds / expectedSeconds;
  return congestionRatio > 1.5;
}
