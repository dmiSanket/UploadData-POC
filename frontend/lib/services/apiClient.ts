const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Statuses (besides 2xx) whose JSON body should be returned instead of thrown. */
  acceptStatuses?: number[];
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const { error, details } = body as { error: unknown; details?: unknown };
    if (Array.isArray(details) && details.length > 0) {
      const lines = details.map((d) => {
        const { path, message } = d as { path?: string; message?: string };
        return path ? `${path}: ${message}` : String(message);
      });
      return `${String(error)} (${lines.join("; ")})`;
    }
    return String(error);
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, acceptStatuses = [] } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_URL}. Is the backend running?`);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (response.ok || acceptStatuses.includes(response.status)) return payload as T;

  throw new ApiError(
    response.status,
    extractMessage(payload, `Request failed (${response.status})`),
    payload,
  );
}

