import { jsonResponse } from "@/lib/api-error";

// Static liveness — intentionally does NOT query the database so that an
// unauthenticated probe cannot fingerprint the backend or trigger DB load.
export async function GET() {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}
