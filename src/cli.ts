#!/usr/bin/env node
import { generateId, MemoryStore, Inputs } from './id.js';

function parseArgs(): Record<string,string> {
  const args = process.argv.slice(2);
  const res: Record<string,string> = {};
  for (let i=0; i<args.length; i+=2) {
    const key = args[i];
    const val = args[i+1];
    if (!key.startsWith('--') || val === undefined) {
      throw new Error('Usage: genref --type M --date 2025-08-14 --juridiction CH-BS --canal WEB');
    }
    res[key.slice(2)] = val;
  }
  return res;
}

async function main() {
  try {
    const opts = parseArgs();
    const secret = process.env.SECRET_SALT;
    if (!secret) {
      throw new Error('SECRET_SALT env variable required');
    }
    const inputs: Inputs = {
      type: opts.type,
      date: opts.date,
      juridiction: opts.juridiction,
      canal: opts.canal,
      secret_salt: secret
    };
    const store = new MemoryStore();
    const id = await generateId(inputs, store);
    console.log(id);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
