import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

// Simple in-process write queue per file path to prevent concurrent corruption
const writeQueues = new Map<string, Promise<void>>();

export async function withWriteLock<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(path) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>(r => { resolve = r; });
  writeQueues.set(path, next);

  await prev;
  try {
    return await fn();
  } finally {
    resolve!();
  }
}
