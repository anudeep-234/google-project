import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

export interface ExtractedTrafficReport {
  location: string;
  incidentType: string;
  severity: "low" | "medium" | "high";
  estimatedDelayMinutes: number;
}

export interface ReconciledTrafficReport {
  incidentType: string;
  severity: string;
  estimatedDelayMinutes: number;
  confidence: number;
  agreementLevel: "single-source" | "corroborated" | "conflicting";
  reasoning?: string;
}

function parseModelJson<T>(rawText: string): T {
  const cleaned = rawText.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Gemini did not return JSON. Response: ${cleaned.slice(0, 160)}`);
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new Error(`Gemini returned invalid JSON. Response: ${cleaned.slice(0, 160)}`);
  }
}

async function askOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing from Vercel environment variables.");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 512
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Wanderly"
        }
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenRouter returned an empty response.");
    }
    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const providerMessage = error.response?.data?.error?.message;
      throw new Error(`OpenRouter model ${model} failed (${error.response?.status ?? "network error"}): ${providerMessage ?? error.message}`);
    }
    throw error;
  }
}

export async function extractTrafficReport(inputText: string) {
  const prompt = `Extract structured traffic incident data from this messy report.
Return ONLY valid JSON, no markdown:
{"location":"","incidentType":"accident|jam|closure|construction|other","severity":"low|medium|high","estimatedDelayMinutes":0}
Report: ${inputText}`;
  return parseModelJson<ExtractedTrafficReport>(await askOpenRouter(prompt));
}

export async function reconcileReports(reports: { text: string; source: string }[]) {
  const prompt = `You are reconciling multiple independent, possibly contradictory reports
about the same traffic incident. Reports:
${reports.map((r, i) => `${i + 1}. (${r.source}) "${r.text}"`).join("\n")}

Return ONLY JSON, no markdown:
{"incidentType":"accident|jam|closure|construction|other","severity":"low|medium|high","estimatedDelayMinutes":0,"confidence":0.0,"agreementLevel":"single-source|corroborated|conflicting","reasoning":""}
Base confidence on how many reports agree. If reports conflict on severity or type, set agreementLevel to "conflicting" and lower confidence.`;
  return parseModelJson<ReconciledTrafficReport>(await askOpenRouter(prompt));
}
