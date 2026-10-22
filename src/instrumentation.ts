/**
 * Runs once when the Node server starts. Prefer IPv4 when resolving hosts: on some networks the
 * IPv6 routes to Neon's endpoints time out, which surfaced as intermittent "fetch failed" DB errors.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
