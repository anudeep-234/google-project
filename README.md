# Wanderly

Wanderly turns messy human reports into structured traffic intelligence and an actionable emergency handoff.

## What it does

- Accepts unstructured traffic reports from voice notes, field reports, or community alerts.
- Uses OpenRouter to extract incident type, severity, delay, confidence, and agreement.
- Reconciles multiple reports into one incident consensus.
- Plots an emergency response route with OSRM and Leaflet.
- Shows regional congestion estimates for Bengaluru, Mumbai, and Delhi NCR.

## Requirements

- Node.js 18 or newer
- An OpenRouter API key

## Setup

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=google/gemini-2.5-flash
PORT=3000
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Demo flow

1. Choose a sample signal or enter a messy traffic report.
2. Select **Interpret this signal**.
3. Submit another report using the same incident thread to show reconciliation.
4. Select **Plot response route** to view the emergency corridor.
5. Choose a region in **Regional traffic pulse** to compare congestion checkpoints.

## Traffic data note

OpenRouter provides AI interpretation, not live road speeds. Without a traffic provider key, the regional traffic pulse uses clearly labeled demo estimates. OSRM provides route geometry and Leaflet renders the map.

## Scripts

```bash
npm run dev    # Start the development server
npm run build  # Compile TypeScript
npm start      # Run the compiled server
```

Never commit `.env` or expose API keys in client-side code.