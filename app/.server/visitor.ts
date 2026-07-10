const COOKIE_NAME = "cw_visitor";

type VisitorIdentity = Readonly<{
  visitorHash: string;
  setCookie?: string;
}>;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}

export function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function hmacHex(secret: string, value: string): Promise<string> {
  return Array.from(await hmac(secret, value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function parseCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === COOKIE_NAME)?.[1];
}

async function isValidSignedId(
  signedId: string,
  secret: string,
): Promise<string | null> {
  const separator = signedId.lastIndexOf(".");
  if (separator < 1) return null;
  const id = signedId.slice(0, separator);
  const supplied = signedId.slice(separator + 1);
  const expected = base64Url(await hmac(secret, `cookie:${id}`));
  return constantTimeEqual(supplied, expected) ? id : null;
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return base64Url(bytes);
}

export async function getVisitorIdentity(
  request: Request,
  secret: string,
): Promise<VisitorIdentity> {
  const existing = parseCookie(request);
  const validId = existing ? await isValidSignedId(existing, secret) : null;
  const id = validId ?? randomId();
  const signature = base64Url(await hmac(secret, `cookie:${id}`));
  const visitorHash = await hmacHex(secret, `visitor:${id}`);

  return {
    visitorHash,
    ...(!validId
      ? {
          setCookie: `${COOKIE_NAME}=${id}.${signature}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
        }
      : {}),
  };
}
