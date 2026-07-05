/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from "@upstash/redis";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal key/value store used by the sync layer and API routes.
 * Values are always JSON-serializable objects/arrays.
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.redis.set(key, value);
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.redis.mget<T[]>(...keys);
    return keys.map((_, i) => values[i] ?? null);
  }
}

/** Filesystem-backed store for local dev (no Redis credentials needed). */
class FileStore implements Store {
  private dir = join(process.cwd(), ".cache");

  constructor() {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
  }

  private path(key: string): string {
    return join(this.dir, `${key.replace(/[:/]/g, "_")}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const p = this.path(key);
    if (!existsSync(p)) return null;
    try {
      return JSON.parse(readFileSync(p, "utf8")) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    writeFileSync(this.path(key), JSON.stringify(value));
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((k) => this.get<T>(k)));
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  const hasRedis =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasRedis) {
    store = new RedisStore(Redis.fromEnv());
  } else {
    store = new FileStore();
  }
  return store;
}

/** True when running against real Redis (production / preview). */
export function isRedisConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}
