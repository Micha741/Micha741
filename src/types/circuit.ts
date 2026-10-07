export interface CircuitProjectPart {
  label: string;
  /** Volitelný hint pro porovnání se skladem (název/hodnota hledaná v components). */
  match?: string;
  quantity: number;
}

export interface CircuitProject {
  id: number;
  name: string;
  description: string | null;
  /** Klíč do CIRCUIT_IMAGES (src/assets/circuitImages.ts). */
  image: string | null;
  /** Klíč do CIRCUIT_IMAGES — deska s plošnými spoji, pokud ji zdroj nabízel. */
  pcbImage: string | null;
  parts: CircuitProjectPart[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CircuitProjectInput = Omit<CircuitProject, 'id' | 'createdAt' | 'updatedAt'>;
