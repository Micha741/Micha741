export interface PackageReferenceEntry {
  id: string;
  name: string;
  fullName: string;
  pinCount: string;
  pitch: string;
  description: string;
}

// Reference přehled běžných pouzder IC pro vizuální identifikaci neznámé
// součástky podle tvaru/typu vývodů. Standardizované obecné informace,
// nezávislé na konkrétním výrobci.
export const PACKAGE_REFERENCE: PackageReferenceEntry[] = [
  {
    id: 'tssop',
    name: 'TSSOP',
    fullName: 'Thin Shrink Small Outline Package',
    pinCount: '8–56 vývodů',
    pitch: '0,4–0,65 mm',
    description:
      'Dvouřadé (SOIC-podobné) velmi tenké pouzdro s jemnou roztečí vývodů typu gull-wing po ' +
      'obou delších stranách. Užší a delší tvar než klasické SOIC. Běžné u logických obvodů, ' +
      'malých mikrokontrolérů a driverů. Existuje ve více variantách šířky/délky pouzdra podle ' +
      'počtu vývodů.',
  },
  {
    id: 'plcc',
    name: 'PLCC',
    fullName: 'Plastic Leaded Chip Carrier',
    pinCount: '20–84 vývodů',
    pitch: '1,27 mm',
    description:
      'Čtvercové nebo obdélníkové plastové pouzdro s vývody stočenými do tvaru "J" po všech ' +
      'čtyřech stranách (vývody schované pod tělem pouzdra). Montuje se buď přímo pájením, nebo ' +
      'do PLCC patice. Dříve časté u starších EPROM/mikrokontrolérů.',
  },
  {
    id: 'lccc',
    name: 'LCCC',
    fullName: 'Leadless Ceramic Chip Carrier',
    pinCount: '20–84 vývodů',
    pitch: '1,27 mm',
    description:
      'Keramické bezvývodové pouzdro — kontakty jsou jen plošky po obvodu spodní/boční strany, ' +
      'žádné vyčnívající nožičky. Vysoká teplotní a mechanická odolnost, typické pro vojenské, ' +
      'letecké a jinak náročné aplikace. Vyžaduje speciální patici nebo přesné pájení.',
  },
  {
    id: 'qfp',
    name: 'QFP',
    fullName: 'Quad Flat Package',
    pinCount: '32–256 vývodů',
    pitch: '0,4–0,8 mm',
    description:
      'Čtvercové/obdélníkové SMD pouzdro s tenkými vývody do tvaru "gull-wing" (racčí křídlo) ' +
      'vystupujícími po všech čtyřech stranách. Velmi časté u FPGA, mikrokontrolérů a dalších ' +
      'obvodů se středním až vysokým počtem vývodů. Varianty: LQFP (nízkoprofilové), TQFP ' +
      '(tenké).',
  },
  {
    id: 'bqfp',
    name: 'BQFP',
    fullName: 'Bumpered Quad Flat Package',
    pinCount: '44–196 vývodů',
    pitch: '0,5–0,65 mm',
    description:
      'QFP s přidanými plastovými "nárazníky" (bumpers) v rozích pouzdra, které chrání jemné ' +
      'vývody před ohnutím/poškozením při manipulaci a skladování. Jinak elektricky i rozměrově ' +
      'obdobné běžnému QFP.',
  },
  {
    id: 'bga',
    name: 'BGA',
    fullName: 'Ball Grid Array',
    pinCount: '~100–2000+ vývodů',
    pitch: '0,4–1,27 mm (mřížka kuliček)',
    description:
      'Vývody nejsou boční nožičky, ale mřížka pájecích kuliček na spodní straně pouzdra — ' +
      'umožňuje mnohem vyšší hustotu vývodů na malé ploše než QFP. Typické pro procesory, ' +
      'paměti a jiné obvody s velkým počtem pinů. Montáž vyžaduje reflow pájení, kontrola spojů ' +
      'pod pouzdrem obvykle jen rentgenem (spoje nejsou vizuálně přístupné).',
  },
];
