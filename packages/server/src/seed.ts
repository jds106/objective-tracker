#!/usr/bin/env tsx
/**
 * Dev data seed script.
 *
 * Usage:
 *   pnpm --filter @objective-tracker/server seed
 *
 * Creates:
 *   - 3-level org: CTO → 2 Group Heads → 2 Tech Leads each
 *   - An active cycle (H1 2025)
 *   - Objectives with varied KR types and check-ins at every level
 *
 * All users share the password: password123
 *
 * Safe to re-run — wipes data/ first.
 */

import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import type { Config } from './config.js';
import {
  JsonUserRepository,
  JsonObjectiveRepository,
  JsonKeyResultRepository,
  JsonCycleRepository,
} from './repositories/index.js';
import { PasswordAuthProvider } from './auth/password-auth.provider.js';
import { generateId } from '@objective-tracker/shared';

const DATA_DIR = resolve(process.cwd(), 'data');

const config: Config = {
  PORT: 3000,
  DATA_DIR,
  JWT_SECRET: 'dev-seed-secret-that-is-at-least-32-chars-long!',
  JWT_EXPIRY: '24h',
};

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

  const passwordHash = await PasswordAuthProvider.hashPassword('password123');

  // ── Users ────────────────────────────────────────────────

  console.log('Creating users...');

  const cto = await userRepo.create({
    email: 'alex.chen@example.com',
    displayName: 'Alex Chen',
    jobTitle: 'CTO',
    managerId: null,
    level: 1,
    department: 'Engineering',
    passwordHash,
  });

  const gh1 = await userRepo.create({
    email: 'sam.patel@example.com',
    displayName: 'Sam Patel',
    jobTitle: 'Group Head — Platform',
    managerId: cto.id,
    level: 2,
    department: 'Platform',
    passwordHash,
  });

  const gh2 = await userRepo.create({
    email: 'morgan.lee@example.com',
    displayName: 'Morgan Lee',
    jobTitle: 'Group Head — Product',
    managerId: cto.id,
    level: 2,
    department: 'Product',
    passwordHash,
  });

  const tl1 = await userRepo.create({
    email: 'jordan.silva@example.com',
    displayName: 'Jordan Silva',
    jobTitle: 'Tech Lead — Infrastructure',
    managerId: gh1.id,
    level: 3,
    department: 'Platform',
    passwordHash,
  });

  const tl2 = await userRepo.create({
    email: 'riley.nguyen@example.com',
    displayName: 'Riley Nguyen',
    jobTitle: 'Tech Lead — Data',
    managerId: gh1.id,
    level: 3,
    department: 'Platform',
    passwordHash,
  });

  const tl3 = await userRepo.create({
    email: 'casey.jones@example.com',
    displayName: 'Casey Jones',
    jobTitle: 'Tech Lead — Frontend',
    managerId: gh2.id,
    level: 3,
    department: 'Product',
    passwordHash,
  });

  const tl4 = await userRepo.create({
    email: 'taylor.wright@example.com',
    displayName: 'Taylor Wright',
    jobTitle: 'Tech Lead — Backend',
    managerId: gh2.id,
    level: 3,
    department: 'Product',
    passwordHash,
  });

  console.log(`  Created 7 users (CTO + 2 Group Heads + 4 Tech Leads)`);

  // ── Cycle ────────────────────────────────────────────────

  console.log('Creating cycle...');

  const cycle = await cycleRepo.create({
    name: 'H1 2025',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    quarters: [
      { id: generateId(), name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', reviewDeadline: '2025-04-07' },
      { id: generateId(), name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30', reviewDeadline: '2025-07-07' },
    ],
    status: 'active',
  });

  console.log(`  Created cycle: ${cycle.name} (${cycle.id})`);

  // ── CTO Objectives ──────────────────────────────────────

  console.log('Creating objectives and key results...');

  const ctoObj1 = await objectiveRepo.create({
    ownerId: cto.id,
    cycleId: cycle.id,
    title: 'Achieve 99.9% platform uptime across all services',
    description: 'Our reliability is our competitive advantage. We must demonstrate to customers that our platform is dependable.',
    parentKeyResultId: null,
    parentObjectiveId: null,
  });
  await objectiveRepo.update(ctoObj1.id, { status: 'active' });

  const ctoKr1 = await keyResultRepo.create({
    objectiveId: ctoObj1.id,
    title: 'Reduce monthly downtime to under 43 minutes',
    type: 'metric',
    config: { type: 'metric', startValue: 120, currentValue: 75, targetValue: 43, unit: 'minutes', direction: 'decrease' },
  });

  const ctoKr2 = await keyResultRepo.create({
    objectiveId: ctoObj1.id,
    title: 'Deploy automated failover for all critical services',
    type: 'binary',
    config: { type: 'binary', completed: false },
  });

  // Check-in on CTO KR1
  await keyResultRepo.addCheckIn(ctoKr1.id, {
    keyResultId: ctoKr1.id,
    userId: cto.id,
    timestamp: '2025-02-15T09:00:00.000Z',
    previousProgress: 0,
    newProgress: 37,
    note: 'Reduced average downtime from 120 to 75 minutes after infra improvements.',
    source: 'web',
    configSnapshot: { type: 'metric', startValue: 120, currentValue: 75, targetValue: 43, unit: 'minutes', direction: 'decrease' },
  });

  const ctoObj2 = await objectiveRepo.create({
    ownerId: cto.id,
    cycleId: cycle.id,
    title: 'Increase engineering velocity by 30%',
    description: 'Ship features faster without sacrificing quality. Focus on developer experience and CI/CD improvements.',
    parentKeyResultId: null,
    parentObjectiveId: null,
  });
  await objectiveRepo.update(ctoObj2.id, { status: 'active' });

  const ctoKr3 = await keyResultRepo.create({
    objectiveId: ctoObj2.id,
    title: 'Reduce average PR merge time from 48h to 24h',
    type: 'metric',
    config: { type: 'metric', startValue: 48, currentValue: 36, targetValue: 24, unit: 'hours', direction: 'decrease' },
  });

  const ctoKr4 = await keyResultRepo.create({
    objectiveId: ctoObj2.id,
    title: 'CI pipeline improvements completion',
    type: 'percentage',
    config: { type: 'percentage', currentValue: 40 },
  });

  await keyResultRepo.addCheckIn(ctoKr4.id, {
    keyResultId: ctoKr4.id,
    userId: cto.id,
    timestamp: '2025-03-01T14:30:00.000Z',
    previousProgress: 0,
    newProgress: 40,
    note: 'Parallelised test suites and added build caching.',
    source: 'web',
    configSnapshot: { type: 'percentage', currentValue: 40 },
  });

  // ── Group Head 1 (Platform) ─────────────────────────────

  const gh1Obj = await objectiveRepo.create({
    ownerId: gh1.id,
    cycleId: cycle.id,
    title: 'Migrate core services to Kubernetes',
    description: 'Complete the migration of all platform services to Kubernetes to improve reliability and scalability.',
    parentKeyResultId: ctoKr1.id,
    parentObjectiveId: ctoObj1.id,
  });
  await objectiveRepo.update(gh1Obj.id, { status: 'active' });

  const gh1Kr1 = await keyResultRepo.create({
    objectiveId: gh1Obj.id,
    title: 'Migration milestones',
    type: 'milestone',
    config: {
      type: 'milestone',
      milestones: [
        { id: generateId(), title: 'Set up K8s clusters in staging', completed: true, completedAt: '2025-01-20T10:00:00.000Z' },
        { id: generateId(), title: 'Migrate auth service', completed: true, completedAt: '2025-02-05T16:00:00.000Z' },
        { id: generateId(), title: 'Migrate API gateway', completed: false },
        { id: generateId(), title: 'Migrate data pipeline', completed: false },
        { id: generateId(), title: 'Decommission legacy servers', completed: false },
      ],
    },
  });

  await keyResultRepo.addCheckIn(gh1Kr1.id, {
    keyResultId: gh1Kr1.id,
    userId: gh1.id,
    timestamp: '2025-02-05T16:30:00.000Z',
    previousProgress: 20,
    newProgress: 40,
    note: 'Auth service migrated successfully. Zero downtime during cutover.',
    source: 'web',
    configSnapshot: gh1Kr1.config,
  });

  // ── Group Head 2 (Product) ──────────────────────────────

  const gh2Obj = await objectiveRepo.create({
    ownerId: gh2.id,
    cycleId: cycle.id,
    title: 'Launch self-service onboarding flow',
    description: 'Reduce time-to-value for new customers by building a guided onboarding experience.',
    parentKeyResultId: null,
    parentObjectiveId: null,
  });
  await objectiveRepo.update(gh2Obj.id, { status: 'active' });

  const gh2Kr1 = await keyResultRepo.create({
    objectiveId: gh2Obj.id,
    title: 'Reduce median onboarding time from 5 days to 1 day',
    type: 'metric',
    config: { type: 'metric', startValue: 5, currentValue: 3, targetValue: 1, unit: 'days', direction: 'decrease' },
  });

  const gh2Kr2 = await keyResultRepo.create({
    objectiveId: gh2Obj.id,
    title: 'Onboarding NPS score',
    type: 'metric',
    config: { type: 'metric', startValue: 30, currentValue: 45, targetValue: 70, unit: 'NPS', direction: 'increase' },
  });

  await keyResultRepo.addCheckIn(gh2Kr2.id, {
    keyResultId: gh2Kr2.id,
    userId: gh2.id,
    timestamp: '2025-02-20T11:00:00.000Z',
    previousProgress: 0,
    newProgress: 37.5,
    note: 'Early feedback from beta testers is positive.',
    source: 'web',
    configSnapshot: { type: 'metric', startValue: 30, currentValue: 45, targetValue: 70, unit: 'NPS', direction: 'increase' },
  });

  // ── Tech Lead 1 (Infrastructure) ────────────────────────

  const tl1Obj = await objectiveRepo.create({
    ownerId: tl1.id,
    cycleId: cycle.id,
    title: 'Implement zero-downtime deployment pipeline',
    description: 'Build canary deployment with automated rollback to eliminate deployment-related downtime.',
    parentKeyResultId: null,
    parentObjectiveId: gh1Obj.id,
  });
  await objectiveRepo.update(tl1Obj.id, { status: 'active' });

  await keyResultRepo.create({
    objectiveId: tl1Obj.id,
    title: 'Canary deployment pipeline live',
    type: 'binary',
    config: { type: 'binary', completed: false },
  });

  await keyResultRepo.create({
    objectiveId: tl1Obj.id,
    title: 'Rollback automation coverage',
    type: 'percentage',
    config: { type: 'percentage', currentValue: 25 },
  });

  // ── Tech Lead 3 (Frontend) ──────────────────────────────

  const tl3Obj = await objectiveRepo.create({
    ownerId: tl3.id,
    cycleId: cycle.id,
    title: 'Build onboarding wizard UI',
    description: 'Design and implement the step-by-step onboarding flow for new customers.',
    parentKeyResultId: gh2Kr1.id,
    parentObjectiveId: gh2Obj.id,
  });
  await objectiveRepo.update(tl3Obj.id, { status: 'active' });

  await keyResultRepo.create({
    objectiveId: tl3Obj.id,
    title: 'Wizard implementation milestones',
    type: 'milestone',
    config: {
      type: 'milestone',
      milestones: [
        { id: generateId(), title: 'Design review complete', completed: true, completedAt: '2025-01-25T10:00:00.000Z' },
        { id: generateId(), title: 'Step 1-3 implemented', completed: true, completedAt: '2025-02-10T14:00:00.000Z' },
        { id: generateId(), title: 'Step 4-6 implemented', completed: false },
        { id: generateId(), title: 'User testing complete', completed: false },
      ],
    },
  });

  // ── Summary ──────────────────────────────────────────────

  console.log('\nSeed complete!');
  console.log('──────────────────────────────────────────');
  console.log('Accounts (all use password: password123):');
  console.log(`  CTO:        alex.chen@example.com`);
  console.log(`  Platform:   sam.patel@example.com`);
  console.log(`  Product:    morgan.lee@example.com`);
  console.log(`  Infra TL:   jordan.silva@example.com`);
  console.log(`  Data TL:    riley.nguyen@example.com`);
  console.log(`  Frontend TL: casey.jones@example.com`);
  console.log(`  Backend TL: taylor.wright@example.com`);
  console.log('──────────────────────────────────────────');
  console.log(`Cycle: ${cycle.name} (active)`);
  console.log(`Objectives: 6 across 4 users`);
  console.log(`Key Results: 11 (metric, percentage, milestone, binary)`);
  console.log(`Check-ins: 4`);
  console.log('──────────────────────────────────────────');
  console.log('\nStart the server:  pnpm --filter @objective-tracker/server dev');
  console.log('Start the web app: pnpm --filter @objective-tracker/web dev');
  console.log('Then log in at http://localhost:5173/login');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
