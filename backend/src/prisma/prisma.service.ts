import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dns from 'dns';
import { promisify } from 'util';

// Force Google DNS for all resolution in this process before anything else runs.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const resolve4 = promisify(dns.resolve4);

/**
 * Resolve a hostname to an IPv4 address using Google DNS (bypasses broken
 * system/libuv resolver). Returns null if resolution fails.
 */
async function resolveWithGoogleDns(hostname: string): Promise<string | null> {
  try {
    const addrs = await resolve4(hostname);
    return addrs[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Build a pg.Pool that connects to Supabase reliably even when the system DNS
 * resolver is broken (ENOTFOUND).
 *
 * Strategy:
 *   1. Pre-resolve the pooler hostname via Google DNS (Node dns module respects
 *      dns.setServers, unlike libuv/c-ares used by net.createConnection).
 *   2. Pass the resolved IP as `host` to pg so it can actually connect.
 *   3. Set `ssl.servername` to the ORIGINAL hostname so TLS SNI is correct —
 *      Supabase's pooler routes tenants via SNI, so this is critical.
 *
 * Without step 3 you get "(ENOTFOUND) tenant/user not found" because Supabase
 * can't identify the project from the IP address alone.
 */
async function buildPool(): Promise<pg.Pool> {
  const rawUrl = process.env.DATABASE_URL ?? '';
  const logger = new Logger('PrismaService');

  try {
    const parsed = new URL(rawUrl);
    const originalHost = parsed.hostname;
    const resolvedIp = await resolveWithGoogleDns(originalHost);

    if (resolvedIp) {
      logger.log(`DNS resolved: ${originalHost} → ${resolvedIp}`);
      return new pg.Pool({
        // Use resolved IP so libuv doesn't try (and fail) to resolve the hostname.
        host: resolvedIp,
        port: Number(parsed.port) || 5432,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
        // Keep original hostname in SNI so Supabase routes to the right tenant.
        ssl: {
          rejectUnauthorized: false,
          servername: originalHost,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
  } catch (err) {
    logger.warn(`Could not pre-resolve DATABASE_URL host: ${(err as Error).message}`);
  }

  // Fallback — direct connection string (may still fail if DNS is broken,
  // but at least the pool is constructed so the app can start).
  logger.warn('Falling back to raw DATABASE_URL without DNS pre-resolution');
  return new pg.Pool({ connectionString: rawUrl });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Async factory used by PrismaModule.
   * Pre-resolves the DB host via Google DNS before creating the pool.
   */
  static async create(): Promise<PrismaService> {
    const pool = await buildPool();
    const adapter = new PrismaPg(pool);
    return new PrismaService(adapter);
  }

  constructor(adapter?: PrismaPg) {
    if (adapter) {
      super({ adapter });
    } else {
      // Synchronous fallback (used if DI bypasses the factory).
      const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      super({ adapter: new PrismaPg(pool) });
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected ✓');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
