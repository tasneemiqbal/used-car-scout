import { z } from "zod";

export const SCOUT_USAGE_LIMITS = { check: 10, message: 40 } as const;
export const scoutOperationSchema = z.enum(["check", "message"]);
export type ScoutOperation = z.infer<typeof scoutOperationSchema>;
const visitorSchema = z.object({ id: z.string().uuid(), expires: z.number().int().positive() });

async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decode(value: string) {
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function signVisitor(id: string, expires: number, secret: string) {
  const visitor = visitorSchema.parse({ id, expires });
  const payload = `${visitor.id}.${visitor.expires}`;
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifyVisitor(token: string | undefined, secret: string, now: number): Promise<string | null> {
  if (!token || token.length > 256) return null;
  try {
    const parts = token.split(".");
    const [id, expiry, signature] = parts;
    if (parts.length !== 3 || !id || !expiry || !signature) return null;
    const visitor = visitorSchema.parse({ id, expires: Number(expiry) });
    if (visitor.expires <= now) return null;
    const valid = await crypto.subtle.verify("HMAC", await signingKey(secret), decode(signature), new TextEncoder().encode(`${id}.${expiry}`));
    return valid ? visitor.id : null;
  } catch {
    return null;
  }
}