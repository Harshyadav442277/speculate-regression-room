/**
 * M1 smoke: proves the installed @mozaik-ai/core imports at runtime and that
 * the configuration gate reports honestly. Makes NO provider call.
 *
 * Run: node_modules/.bin/tsx tests/runtime-config.smoke.ts
 */
import { checkRuntimeConfig, installedModelNames } from '../src/runtime/index.js';

let failures = 0;
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const models = installedModelNames();
check('installed package exposes bundled models', models.length > 0, `${models.length} models`);
console.log('      ' + models.map((m) => `${m.name}(${m.provider})`).join(', '));

// Unknown provider is rejected with a usable reason.
const bad = checkRuntimeConfig({ SPECULATE_PROVIDER: 'nope' } as NodeJS.ProcessEnv);
check('unknown provider rejected', !bad.ready && !!bad.reason, bad.reason);

// Missing credentials are reported as not-ready, never as ready-but-empty.
const noKey = checkRuntimeConfig({ SPECULATE_PROVIDER: 'openai' } as NodeJS.ProcessEnv);
check('missing credential reported', !noKey.ready && /OPENAI_API_KEY/.test(noKey.reason ?? ''), noKey.reason);

// Unknown model name is rejected against the installed list, not a hardcoded one.
const badModel = checkRuntimeConfig({
  SPECULATE_PROVIDER: 'openai',
  SPECULATE_MODEL: 'gpt-4o',
  OPENAI_API_KEY: 'x',
} as NodeJS.ProcessEnv);
check('unknown model rejected', !badModel.ready && /not bundled/.test(badModel.reason ?? ''), badModel.reason);

// The DeepSeek/OpenAI env collision found in 4.0.5 is caught.
const collision = checkRuntimeConfig({
  SPECULATE_PROVIDER: 'openai',
  OPENAI_API_KEY: 'x',
  OPENAI_BASE_URL: 'https://api.deepseek.com',
} as NodeJS.ProcessEnv);
check('OPENAI_BASE_URL collision caught', !collision.ready && /OPENAI_BASE_URL/.test(collision.reason ?? ''), collision.reason);

// A fully configured environment reports ready. "Ready" means configured, not reachable.
const ok = checkRuntimeConfig({ SPECULATE_PROVIDER: 'openai', OPENAI_API_KEY: 'x' } as NodeJS.ProcessEnv);
check('configured env reports ready', ok.ready && ok.model === 'gpt-5.4-nano', `${ok.provider}/${ok.model}`);

// No credential material may appear in any returned reason.
const leak = [bad, noKey, badModel, collision, ok].some((r) => (r.reason ?? '').includes('x'.repeat(1)) && (r.reason ?? '').includes('API_KEY=') );
check('no credential value echoed in reasons', !leak);

console.log('\nActual local environment (no network call):');
console.log(JSON.stringify(checkRuntimeConfig(), null, 2));

process.exit(failures === 0 ? 0 : 1);
