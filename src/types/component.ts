export type ComponentCategory =
  | 'IO'
  | 'Rezistor'
  | 'Kondenzátor'
  | 'Cívka'
  | 'Dioda'
  | 'Tranzistor'
  | 'Konektor'
  | 'Spínač/Relé'
  | 'Modul'
  | 'Ostatní';

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  'IO',
  'Rezistor',
  'Kondenzátor',
  'Cívka',
  'Dioda',
  'Tranzistor',
  'Konektor',
  'Spínač/Relé',
  'Modul',
  'Ostatní',
];

export interface ElectronicComponent {
  id: number;
  name: string;
  category: ComponentCategory;
  manufacturer: string | null;
  packageType: string | null;
  value: string | null;
  quantity: number;
  location: string | null;
  datasheetUrl: string | null;
  notes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ComponentInput = Omit<ElectronicComponent, 'id' | 'createdAt' | 'updatedAt'>;
