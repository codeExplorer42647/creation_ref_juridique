import crypto from 'crypto';

export type ProcedureType = 'C' | 'M' | 'S' | 'I' | 'A';

export interface Inputs {
  type: ProcedureType | string;
  date?: string; // ISO string
  juridiction: string;
  canal: string;
  secret_salt: string;
  compteur_local?: number;
}

export interface NormalizedInputs {
  type: ProcedureType;
  date: string; // ISO YYYY-MM-DD
  juridiction: string;
  canal: string;
  secret_salt: string;
  compteur_local: number;
}

export interface Store {
  getCounter(key: string): number;
  setCounter(key: string, value: number): void;
  exists(id: string): boolean;
  save(id: string, ctx: NormalizedInputs): void;
}

export class MemoryStore implements Store {
  private counters = new Map<string, number>();
  private ids = new Set<string>();

  getCounter(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  setCounter(key: string, value: number): void {
    this.counters.set(key, value);
  }

  exists(id: string): boolean {
    return this.ids.has(id);
  }

  save(id: string, ctx: NormalizedInputs): void {
    this.ids.add(id);
    const key = counterKey(ctx);
    this.setCounter(key, ctx.compteur_local + 1);
  }
}

export class LocalStorageStore implements Store {
  private prefix = 'refgen:';

  getCounter(key: string): number {
    const v = window.localStorage.getItem(this.prefix + 'ctr:' + key);
    return v ? parseInt(v, 10) : 0;
  }

  setCounter(key: string, value: number): void {
    window.localStorage.setItem(this.prefix + 'ctr:' + key, String(value));
  }

  exists(id: string): boolean {
    return window.localStorage.getItem(this.prefix + 'id:' + id) !== null;
  }

  save(id: string, ctx: NormalizedInputs): void {
    window.localStorage.setItem(this.prefix + 'id:' + id, JSON.stringify(ctx));
    const key = counterKey(ctx);
    this.setCounter(key, ctx.compteur_local + 1);
  }
}

export function counterKey(i: {date: string; type: string; juridiction: string; canal: string;}): string {
  return `${i.date}|${i.type}|${i.juridiction}|${i.canal}`;
}

export function normalizeInputs(inputs: Inputs, store: Store): NormalizedInputs {
  const type = inputs.type.toUpperCase() as ProcedureType;
  if (!['C','M','S','I','A'].includes(type)) {
    throw new Error('Invalid type');
  }
  const dateObj = inputs.date ? new Date(inputs.date) : new Date();
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  const date = dateObj.toISOString().slice(0,10);
  const juridiction = inputs.juridiction.toUpperCase();
  const canal = inputs.canal.toUpperCase();
  const key = counterKey({date, type, juridiction, canal});
  const compteur_local = inputs.compteur_local ?? store.getCounter(key);
  if (!inputs.secret_salt) {
    throw new Error('Missing secret_salt');
  }
  return { type, date, juridiction, canal, secret_salt: inputs.secret_salt, compteur_local };
}

export function buildCanonicalString(v: number, i: NormalizedInputs): string {
  return `v${v}|${i.type}|${i.date}|${i.juridiction}|${i.canal}|${i.compteur_local}|${i.secret_salt}`;
}

export async function hmacSha256_hex(key: string, message: string): Promise<string> {
  if (typeof window === 'undefined') {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  } else {
    const enc = new TextEncoder();
    const cryptoKey = await window.crypto.subtle.importKey('raw', enc.encode(key), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
    const sig = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
}

export function makeHex7(hmac_hex: string): string {
  return hmac_hex.slice(0,7).toUpperCase();
}

export function composeId(hex7: string, type: string): string {
  return `${hex7}${type}`;
}

export async function generateId(inputs: Inputs, store: Store, version = 1): Promise<string> {
  const i = normalizeInputs(inputs, store);
  for (let tries = 0; tries < 5; tries++) {
    const canonical = buildCanonicalString(version, i);
    const digest = await hmacSha256_hex(i.secret_salt, canonical);
    const hex7 = makeHex7(digest);
    const id = composeId(hex7, i.type);
    if (!store.exists(id)) {
      store.save(id, i);
      return id;
    }
    i.compteur_local++;
  }
  throw new Error('CollisionError');
}
