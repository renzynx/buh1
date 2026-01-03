import { and, count, eq, gt, sql, sum } from "drizzle-orm";
import { db } from "@/database";
import * as schema from "@/database/schema";

export type AnalyticsData = {
  users: {
    total: number;
    new: number;
    active: number;
    banned: number;
  };
  files: {
    total: number;
    new: number;
  };
  storage: {
    total: number;
    growth: number;
  };
  invites: {
    total: number;
    used: number;
    active: number;
  };
};

type CachedAnalytics = {
  data: AnalyticsData;
  timestamp: number;
};

let cachedAnalytics: CachedAnalytics | null = null;

const CACHE_TTL = 15 * 60 * 1000;

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const now = Date.now();

  if (cachedAnalytics && now - cachedAnalytics.timestamp < CACHE_TTL) {
    return cachedAnalytics.data;
  }

  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const nowDate = new Date(now);

  const [totalUsersResult] = await db
    .select({ count: count() })
    .from(schema.user);
  const totalUsers = totalUsersResult?.count ?? 0;

  const [newUsersResult] = await db
    .select({ count: count() })
    .from(schema.user)
    .where(gt(schema.user.createdAt, thirtyDaysAgo));
  const newUsers = newUsersResult?.count ?? 0;

  const [activeUsersResult] = await db
    .select({ count: count(sql`DISTINCT ${schema.session.userId}`) })
    .from(schema.session)
    .where(gt(schema.session.expiresAt, nowDate));
  const activeUsers = activeUsersResult?.count ?? 0;

  const [bannedUsersResult] = await db
    .select({ count: count() })
    .from(schema.user)
    .where(eq(schema.user.banned, true));
  const bannedUsers = bannedUsersResult?.count ?? 0;

  const [totalFilesResult] = await db
    .select({ count: count() })
    .from(schema.files);
  const totalFiles = totalFilesResult?.count ?? 0;

  const [newFilesResult] = await db
    .select({ count: count() })
    .from(schema.files)
    .where(gt(schema.files.createdAt, thirtyDaysAgo));
  const newFiles = newFilesResult?.count ?? 0;

  const [storageResult] = await db
    .select({ total: sum(schema.files.size) })
    .from(schema.files);
  const totalStorage = Number(storageResult?.total ?? 0);

  const [storageGrowthResult] = await db
    .select({ total: sum(schema.files.size) })
    .from(schema.files)
    .where(gt(schema.files.createdAt, thirtyDaysAgo));
  const storageGrowth = Number(storageGrowthResult?.total ?? 0);

  const [totalInvitesResult] = await db
    .select({ count: count() })
    .from(schema.invites);
  const totalInvites = totalInvitesResult?.count ?? 0;

  const [usedInvitesResult] = await db
    .select({ count: count() })
    .from(schema.invites)
    .where(sql`${schema.invites.usedAt} IS NOT NULL`);
  const usedInvites = usedInvitesResult?.count ?? 0;

  const [activeInvitesResult] = await db
    .select({ count: count() })
    .from(schema.invites)
    .where(
      and(
        sql`${schema.invites.usedAt} IS NULL`,
        gt(schema.invites.expiresAt, nowDate)
      )
    );
  const activeInvites = activeInvitesResult?.count ?? 0;

  const data: AnalyticsData = {
    users: {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      banned: bannedUsers,
    },
    files: {
      total: totalFiles,
      new: newFiles,
    },
    storage: {
      total: totalStorage,
      growth: storageGrowth,
    },
    invites: {
      total: totalInvites,
      used: usedInvites,
      active: activeInvites,
    },
  };

  cachedAnalytics = {
    data,
    timestamp: now,
  };

  return data;
};

export const invalidateAnalyticsCache = (): void => {
  cachedAnalytics = null;
};
