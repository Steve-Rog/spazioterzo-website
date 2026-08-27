import { createRemoteJWKSet, jwtVerify } from "jose";

export type AdminRole = "admin" | "editor";
export type AdminIdentity = { email: string; role: AdminRole };

const remoteKeySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function keySetFor(teamDomain: string) {
  const existing = remoteKeySets.get(teamDomain);
  if (existing) return existing;
  const issuer = `https://${teamDomain}`;
  const keySet = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  remoteKeySets.set(teamDomain, keySet);
  return keySet;
}

export async function authenticateAdmin(request: Request, env: Env): Promise<AdminIdentity | null> {
  let email: string | undefined;

  if (env.ENVIRONMENT === "local") {
    email = request.headers.get("x-spazioterzo-dev-email")?.trim().toLowerCase();
  } else {
    if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUDIENCE) return null;
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) return null;
    try {
      const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
      const keySet = keySetFor(env.ACCESS_TEAM_DOMAIN);
      const { payload } = await jwtVerify(token, keySet, { issuer, audience: env.ACCESS_AUDIENCE });
      email = typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
    } catch {
      return null;
    }
  }

  if (!email) return null;
  const user = await env.DB.prepare("SELECT role FROM admin_users WHERE email = ? AND active = 1").bind(email).first<{ role: AdminRole }>();
  return user && (user.role === "admin" || user.role === "editor") ? { email, role: user.role } : null;
}

export function requireAdmin(identity: AdminIdentity | null, role?: AdminRole): Response | null {
  if (!identity) return Response.json({ error: "Non autorizzato" }, { status: 401 });
  if (role === "admin" && identity.role !== "admin") return Response.json({ error: "Permesso amministratore richiesto" }, { status: 403 });
  return null;
}
