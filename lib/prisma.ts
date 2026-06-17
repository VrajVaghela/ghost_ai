import { PrismaClient } from "@/app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// pg-connection-string warns when sslmode is 'require'/'prefer'/'verify-ca' because
// the next major pg release will change their semantics. We normalize to 'verify-full'
// which is both explicit and identical to the current behavior.
function normalizeSSLMode(url: string): string {
  try {
    const parsed = new URL(url);
    const mode = parsed.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: url,
    }).$extends(withAccelerate()) as unknown as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: normalizeSSLMode(url) });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
