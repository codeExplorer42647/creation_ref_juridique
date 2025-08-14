import { describe, it, expect } from 'vitest';
import { generateId, MemoryStore } from '../src/id.js';

const baseInputs = {
  type: 'M',
  date: '2025-08-14',
  juridiction: 'CH-BS',
  canal: 'WEB',
  secret_salt: 's3cr3t'
};

describe('ID generation', () => {
  it('produces expected format', async () => {
    const store = new MemoryStore();
    const id = await generateId(baseInputs, store);
    expect(id).toMatch(/^[0-9A-F]{7}M$/);
  });

  it('is case insensitive for jurisdiction and canal', async () => {
    const store1 = new MemoryStore();
    const id1 = await generateId({...baseInputs, juridiction:'ch-bs', canal:'web'}, store1);
    const store2 = new MemoryStore();
    const id2 = await generateId(baseInputs, store2);
    expect(id1).toBe(id2);
  });

  it('is stable for identical inputs and counter', async () => {
    const store1 = new MemoryStore();
    const id1 = await generateId(baseInputs, store1);
    const store2 = new MemoryStore();
    const id2 = await generateId(baseInputs, store2);
    expect(id1).toBe(id2);
  });

  it('changes with different counters', async () => {
    const store = new MemoryStore();
    const id1 = await generateId(baseInputs, store);
    const id2 = await generateId(baseInputs, store);
    expect(id1).not.toBe(id2);
  });

  it('rejects invalid type', async () => {
    const store = new MemoryStore();
    await expect(generateId({...baseInputs, type: 'X' as any}, store)).rejects.toThrow();
  });

  it('handles collisions by incrementing counter', async () => {
    class CollisionStore extends MemoryStore {
      collisions = 1;
      exists(id: string): boolean {
        if (this.collisions > 0) {
          this.collisions--;
          return true;
        }
        return super.exists(id);
      }
    }
    const store = new CollisionStore();
    const id = await generateId(baseInputs, store);
    expect(id).toMatch(/^[0-9A-F]{7}M$/);
  });
});
