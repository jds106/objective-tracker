#!/usr/bin/env tsx
/**
 * Dev data seed script.
 *
 * Usage:
 *   pnpm --filter @objective-tracker/server seed
 *
 * Creates:
 *   - An admin account (admin / password)
 *   - An active cycle (FY2026 with 4 quarters)
 *
 * Safe to re-run — wipes data/ first.
 */

import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  JsonUserRepository,
  JsonObjectiveRepository,
  JsonKeyResultRepository,
  JsonCycleRepository,
} from './repositories/index.js';
import { PasswordAuthProvider } from './auth/password-auth.provider.js';
import { generateId } from '@objective-tracker/shared';

const DATA_DIR = resolve(process.cwd(), 'data');

async function seed() {
  console.log('Wiping data directory...');
  await rm(DATA_DIR, { recursive: true, force: true });

  console.log('Initialising repositories...');
  const userRepo = new JsonUserRepository(DATA_DIR);
  const objectiveRepo = new JsonObjectiveRepository(DATA_DIR, userRepo);
  const keyResultRepo = new JsonKeyResultRepository(DATA_DIR, userRepo);
  const cycleRepo = new JsonCycleRepository(DATA_DIR);

  await userRepo.init();
  await objectiveRepo.init();
  await keyResultRepo.init();
  await cycleRepo.init();

  // ── Admin account ─────────────────────────────────────

  console.log('Creating admin account...');

  const passwordHash = await PasswordAuthProvider.hashPassword('password');

  await userRepo.create({
    email: 'admin',
    displayName: 'Admin',
    jobTitle: 'Administrator',
    managerId: null,
    level: 1,
    role: 'admin',
    passwordHash,
  });

  console.log('  Created admin account (admin / password)');

  // ── Cycle ────────────────────────────────────────────────

  console.log('Creating cycle...');

  const cycle = await cycleRepo.create({
    name: 'FY2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    quarters: [
      { id: generateId(), name: 'Q1 2026', startDate: '2026-01-01', endDate: '2026-03-31', reviewDeadline: '2026-04-07' },
      { id: generateId(), name: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30', reviewDeadline: '2026-07-07' },
      { id: generateId(), name: 'Q3 2026', startDate: '2026-07-01', endDate: '2026-09-30', reviewDeadline: '2026-10-07' },
      { id: generateId(), name: 'Q4 2026', startDate: '2026-10-01', endDate: '2026-12-31', reviewDeadline: '2027-01-07' },
    ],
    status: 'active',
  });

  console.log(`  Created cycle: ${cycle.name} (${cycle.id})`);

  // ── Summary ──────────────────────────────────────────────

  console.log('\nSeed complete!');
  console.log('──────────────────────────────────────────');
  console.log('Admin account:  admin / password');
  console.log(`Cycle: ${cycle.name} (active)`);
  console.log('──────────────────────────────────────────');
  console.log('\nStart the server:  pnpm --filter @objective-tracker/server dev');
  console.log('Start the web app: pnpm --filter @objective-tracker/web dev');
  console.log('Then log in at http://localhost:5173/login');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
