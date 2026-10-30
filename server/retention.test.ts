import { sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificateChecks, otpChallenges, rateLimitEvents, sessions } from '../db/schema.js';
import { purgeExpiredRecords } from './domain/retention.js';
import { createTestDb, insertUser, type TestDb } from './testing.js';

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.execute(sql`truncate users, otp_challenges, sessions, rate_limit_events, certificate_checks restart identity cascade`);
});

describe('plazos de conservación', () => {
  it('borra solo lo que pasó su plazo y conserva lo reciente', async () => {
    const user = await insertUser(db, 'ana@example.com');
    await db.insert(rateLimitEvents).values([
      { bucket: 'tracking', keyHash: 'a', createdAt: daysAgo(8) },
      { bucket: 'tracking', keyHash: 'b', createdAt: daysAgo(6) },
    ]);
    await db.insert(otpChallenges).values([
      { email: 'ana@example.com', codeHash: 'x', expiresAt: daysAgo(31), createdAt: daysAgo(31) },
      { email: 'ana@example.com', codeHash: 'y', expiresAt: daysAgo(1), createdAt: daysAgo(1) },
    ]);
    await db.insert(sessions).values([
      { userId: user.id, tokenHash: 'caducada', expiresAt: daysAgo(91) },
      { userId: user.id, tokenHash: 'cerrada', expiresAt: new Date(Date.now() + DAY), revokedAt: daysAgo(100) },
      { userId: user.id, tokenHash: 'reciente', expiresAt: daysAgo(10) },
      { userId: user.id, tokenHash: 'activa', expiresAt: new Date(Date.now() + 20 * DAY) },
    ]);
    await db.insert(certificateChecks).values([
      { certificateNumber: '12345678', channel: 'web', checkedAt: daysAgo(400) },
      { certificateNumber: '12345678', channel: 'web', checkedAt: daysAgo(30) },
    ]);

    expect(await purgeExpiredRecords(db)).toEqual({ rateLimitEvents: 1, loginCodes: 1, sessions: 2, certificateChecks: 1 });
    expect((await db.select().from(sessions)).map((s) => s.tokenHash).sort()).toEqual(['activa', 'reciente']);
    expect(await db.select().from(rateLimitEvents)).toHaveLength(1);
    expect(await db.select().from(otpChallenges)).toHaveLength(1);
    expect(await db.select().from(certificateChecks)).toHaveLength(1);
  });
});
