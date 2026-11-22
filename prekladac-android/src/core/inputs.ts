// Pohodlné vyplňování: adresy bez http(s)://, ID klienta Google bez konce „.apps.googleusercontent.com“
// a kontrola délky (nechybí znak?). Stejná pravidla jako ve Windows (prekladac/inputs.py), společné příklady
// v prekladac/tests/fixtures/input_cases.json.

export const GOOGLE_SUFFIX = '.apps.googleusercontent.com';
const LOCAL_PORTS = new Set(['5005', '11434', '5000', '8080', '80']);

/** Adresa v domácí síti (NAS, Ollama v počítači) – tam bývá http, jinde https. */
export function isLocalHost(hostPort: string): boolean {
  const [host, port] = hostPort.toLowerCase().split(/:(?=\d+$)/);
  if (port && LOCAL_PORTS.has(port)) return true;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.lan') || host.endsWith('.home')) return true;
  const m = host.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!m) return !host.includes('.') && host.length > 0; // jméno počítače bez domény (NAS, DiskStation)
  const a = +m[1], b = +m[2];
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

/** Doplní http:// nebo https://, když chybí (doma http, jinak https). */
export function normalizeUrl(v: string): string {
  let s = (v ?? '').trim().replace(/\s+/g, '');
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return s;
  s = s.replace(/^\/+/, '').replace(/^(https?):?\/*/i, (_m, p) => `${p.toLowerCase()}://`);
  if (/^https?:\/\//i.test(s)) return s;
  const hostPort = s.split('/')[0];
  return (isLocalHost(hostPort) ? 'http://' : 'https://') + s;
}

/** Doplní konec ID klienta Google (stačí napsat část před tečkou, i useknutý konec se dokončí). */
export function normalizeGoogleClientId(v: string): string {
  const s = (v ?? '').trim().replace(/\s+/g, '');
  if (!s) return '';
  const dot = s.indexOf('.');
  const head = dot < 0 ? s : s.slice(0, dot);
  const tail = dot < 0 ? '' : s.slice(dot).toLowerCase();
  if (!/^\d+-[A-Za-z0-9]+$/.test(head)) return s;
  if (tail === '' || GOOGLE_SUFFIX.startsWith(tail) || tail === '.') return head + GOOGLE_SUFFIX;
  return s;
}

/** Upozornění k ID klienta ('' = v pořádku). */
export function checkGoogleClientId(v: string): string {
  const s = (v ?? '').trim();
  if (!s) return '';
  if (/^\d+-[a-z0-9]{32}\.apps\.googleusercontent\.com$/.test(s)) return '';
  const m = s.match(/^(\d+)-([A-Za-z0-9]*)(\..*)?$/);
  if (!m) return 'ID klienta má tvar 123456789012-…(32 znaků)….apps.googleusercontent.com – zkontrolujte ho.';
  if ((m[3] ?? '') !== GOOGLE_SUFFIX) return `Konec ID má být „${GOOGLE_SUFFIX}“.`;
  const n = m[2].length;
  if (n !== 32) return n < 32
    ? `Za pomlčkou chybí ${32 - n} ${n === 31 ? 'znak' : 32 - n < 5 ? 'znaky' : 'znaků'} (má jich být 32, je ${n}).`
    : `Za pomlčkou je o ${n - 32} ${n - 32 === 1 ? 'znak' : n - 32 < 5 ? 'znaky' : 'znaků'} víc (má jich být 32, je ${n}).`;
  if (/[A-Z]/.test(m[2])) return 'V ID klienta jsou jen malá písmena – zkopírujte ho znovu.';
  return '';
}

/** Upozornění k tajnému klíči klienta Google ('' = v pořádku). */
export function checkGoogleSecret(v: string): string {
  const s = (v ?? '').trim();
  if (!s) return '';
  if (/^GOCSPX-[A-Za-z0-9_-]{28}$/.test(s)) return '';
  if (!s.startsWith('GOCSPX-')) return 'Tajný klíč klienta začíná „GOCSPX-“ – zkontrolujte, že jste zkopírovali celý.';
  const n = s.length - 7;
  if (n < 28) return `Tajnému klíči chybí ${28 - n} ${28 - n === 1 ? 'znak' : 28 - n < 5 ? 'znaky' : 'znaků'} (za GOCSPX- má být 28, je ${n}).`;
  if (n > 28) return `Tajný klíč je o ${n - 28} ${n - 28 === 1 ? 'znak' : n - 28 < 5 ? 'znaky' : 'znaků'} delší (za GOCSPX- má být 28, je ${n}).`;
  return 'V tajném klíči je nepovolený znak – zkopírujte ho znovu.';
}
