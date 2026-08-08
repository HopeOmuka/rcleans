import { beforeAll, describe, expect, it } from "vitest";

import {
  AppError,
} from "@/lib/api-error";
import {
  getBearerToken,
  issueCleanerToken,
  rateLimit,
  requireCleanerAuth,
  requireUserAuth,
  resolveAuth,
} from "@/lib/server-auth";

const TEST_SECRET = "test-cleaner-token-secret-32-characters-min";

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader) headers["Authorization"] = authHeader;
  return new Request("http://localhost/api/test", { headers });
}

function decodePayload(token: string): any {
  const parts = token.split(".");
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
}

function tamperToken(token: string, mutate: (payload: any) => any): string {
  const [prefix, , sig] = token.split(".");
  const raw = JSON.stringify(mutate(decodePayload(token)));
  const tampered = Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${prefix}.${tampered}.${sig}`;
}

const cleaner = { id: "cleaner-001", email: "peter@rcleans.demo", phone: "+254701000003" };

describe("cleaner HMAC tokens", () => {
  beforeAll(() => {
    process.env.CLEANER_TOKEN_SECRET = TEST_SECRET;
  });

  it("issues a token in v1.<payload>.<sig> format", async () => {
    const token = await issueCleanerToken(cleaner);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("v1");
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("requireCleanerAuth accepts a valid token", async () => {
    const token = await issueCleanerToken(cleaner);
    const auth = await requireCleanerAuth(makeRequest(`Bearer ${token}`));
    expect(auth.kind).toBe("cleaner");
    expect(auth.cleanerId).toBe(cleaner.id);
    expect(auth.email).toBe(cleaner.email);
    expect(auth.phone).toBe(cleaner.phone);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueCleanerToken(cleaner);
    process.env.CLEANER_TOKEN_SECRET = "a-completely-different-secret-value-000000";
    await expect(requireCleanerAuth(makeRequest(`Bearer ${token}`))).rejects.toThrow(AppError);
    await expect(
      requireCleanerAuth(makeRequest(`Bearer ${token}`)),
    ).rejects.toMatchObject({ statusCode: 401 });
    process.env.CLEANER_TOKEN_SECRET = TEST_SECRET;
  });

  it("rejects a tampered payload (sub changed)", async () => {
    const token = tamperToken(await issueCleanerToken(cleaner), (p) => ({
      ...p,
      sub: "cleaner-999",
    }));
    await expect(requireCleanerAuth(makeRequest(`Bearer ${token}`))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an expired token", async () => {
    const token = await issueCleanerToken(cleaner, -1);
    await expect(requireCleanerAuth(makeRequest(`Bearer ${token}`))).rejects.toMatchObject({
      statusCode: 401,
      code: "SESSION_EXPIRED",
    });
  });

  it("rejects malformed tokens", async () => {
    await expect(requireCleanerAuth(makeRequest("Bearer v1.abc"))).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(requireCleanerAuth(makeRequest("Bearer xyz.abc.def"))).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(requireCleanerAuth(makeRequest("Bearer "))).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(requireCleanerAuth(makeRequest("Bearer v1.!!.not-base64"))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects when no token is provided", async () => {
    await expect(requireCleanerAuth(makeRequest())).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});

describe("getBearerToken", () => {
  it("extracts the token from the Authorization header", () => {
    expect(getBearerToken(makeRequest("Bearer abc.def.ghi"))).toBe("abc.def.ghi");
    expect(getBearerToken(makeRequest("Bearer   spaced.token "))).toBe("spaced.token");
  });

  it("returns null for missing or malformed headers", () => {
    expect(getBearerToken(makeRequest())).toBeNull();
    expect(getBearerToken(makeRequest("Basic abc"))).toBeNull();
    expect(getBearerToken(makeRequest("Bearer"))).toBeNull();
    expect(getBearerToken(makeRequest("Bearer "))).toBeNull();
  });
});

describe("requireUserAuth", () => {
  it("rejects missing token before contacting Clerk", async () => {
    await expect(requireUserAuth(makeRequest())).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});

describe("resolveAuth", () => {
  beforeAll(() => {
    process.env.CLEANER_TOKEN_SECRET = TEST_SECRET;
  });

  it("resolves a cleaner token as cleaner auth", async () => {
    const token = await issueCleanerToken(cleaner);
    const auth = await resolveAuth(makeRequest(`Bearer ${token}`));
    expect(auth.kind).toBe("cleaner");
  });

  it("falls back to user auth for non-cleaner tokens", async () => {
    await expect(resolveAuth(makeRequest("Bearer not.a.cleaner.token"))).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("rateLimit", () => {
  const makeFakeQuery = (time: () => number = Date.now) => {
    const buckets = new Map<string, { count: number; resetAt: number }>();
    return async (
      bucketKey: string,
      windowSecs: number,
    ): Promise<Array<{ count: number }>> => {
      const now = time();
      const bucket = buckets.get(bucketKey);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(bucketKey, { count: 1, resetAt: now + windowSecs * 1000 });
        return [{ count: 1 }];
      }
      bucket.count += 1;
      return [{ count: bucket.count }];
    };
  };

  it("allows requests within the limit", async () => {
    const query = makeFakeQuery();
    for (let i = 0; i < 5; i++) {
      await rateLimit("test-key", 5, 60_000, query);
    }
  });

  it("rejects requests over the limit with 429", async () => {
    const query = makeFakeQuery();
    for (let i = 0; i < 5; i++) {
      await rateLimit("test-key-2", 5, 60_000, query);
    }
    await expect(rateLimit("test-key-2", 5, 60_000, query)).rejects.toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
    });
  });

  it("resets after the window elapses", async () => {
    let t = 0;
    const query = makeFakeQuery(() => t);
    await rateLimit("test-key-3", 1, 1000, query);
    t = 1500;
    await rateLimit("test-key-3", 1, 1000, query);

    const overQuery = makeFakeQuery(() => t);
    await rateLimit("test-key-3b", 1, 1000, overQuery);
    await expect(rateLimit("test-key-3b", 1, 1000, overQuery)).rejects.toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
    });
  });

  it("is a no-op for non-positive windows", async () => {
    await rateLimit("test-key-4", 1, 0, () =>
      Promise.resolve([{ count: 99 }]),
    );
  });
});
