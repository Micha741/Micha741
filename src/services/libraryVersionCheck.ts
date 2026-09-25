const MANIFEST_URL =
  'https://raw.githubusercontent.com/Micha741/Micha741/claude/confident-cori-ertk4j/library-version.json';

export interface RemoteLibraryVersionInfo {
  version: number;
  updatedAt?: string;
}

/**
 * Stáhne aktuální číslo verze knihovny publikované v GitHub repozitáři.
 * Appka díky tomu ví, jestli existuje novější kód (nové/aktualizované součástky),
 * aniž by cokoliv stahovala nebo měnila offline — jde jen o informativní kontrolu.
 * Vrací null při jakémkoliv selhání (offline, timeout, neplatný JSON) — volající
 * by to měl zobrazit jako "kontrolu se nepodařilo provést", ne jako chybu appky.
 */
export async function fetchRemoteLibraryVersion(): Promise<RemoteLibraryVersionInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(MANIFEST_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as unknown;
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof (data as Record<string, unknown>).version !== 'number'
    ) {
      return null;
    }

    const info = data as { version: number; updatedAt?: unknown };
    return {
      version: info.version,
      updatedAt: typeof info.updatedAt === 'string' ? info.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}
