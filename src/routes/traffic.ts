import { Router } from "express";
import { randomUUID } from "crypto";
import { extractTrafficReport, reconcileReports } from "../gemini";
import { getRegionalTraffic, getRoute, isRouteCongested, TrafficRegion, trafficRegions } from "../traffic";
import { saveIncident, findIncident, getAll } from "../store";

const router = Router();

router.post("/incident/:id/report", async (req, res) => {
  const { text, source } = req.body;
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "Report text is required." });
    return;
  }

  try {
    let incident = findIncident(req.params.id);
    if (!incident) {
      incident = {
        id: req.params.id,
        reports: [],
        consensus: {
          incidentType: "", severity: "low", estimatedDelayMinutes: 0,
          confidence: 0, agreementLevel: "single-source"
        },
        verifiedByRoute: false,
        createdAt: new Date()
      };
      saveIncident(incident);
    }

    const extracted = await extractTrafficReport(text);
    incident.reports.push({ id: randomUUID(), rawText: text, extracted, source });

    incident.consensus = await reconcileReports(
      incident.reports.map(r => ({ text: r.rawText, source: r.source }))
    );

    res.json(incident);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/incident/:id/route", async (req, res) => {
  try {
    const incident = findIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const { startLat, startLon, endLat, endLon } = req.body;

    const routeData = await getRoute(startLat, startLon, endLat, endLon);
    const route = routeData.routes[0];

    incident.route = {
      distanceMeters: route.distance,
      etaSeconds: route.duration,
      geometry: route.geometry
    };

    incident.verifiedByRoute = isRouteCongested(route.distance, route.duration);
    incident.alertSent = incident.consensus.confidence >= 0.7 && incident.verifiedByRoute;

    res.json(incident);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/", (_req, res) => res.json(getAll()));

router.get("/region/:region/live", async (req, res) => {
  const region = req.params.region as TrafficRegion;
  if (!(region in trafficRegions)) {
    res.status(400).json({ error: "Unknown region. Use bengaluru, mumbai, or delhi." });
    return;
  }

  try {
    res.json(await getRegionalTraffic(region));
  } catch (e) {
    res.status(502).json({ error: String(e instanceof Error ? e.message : "Live regional traffic is unavailable.") });
  }
});

export default router;
