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
    id: 'dip',
    name: 'DIP',
    fullName: 'Dual In-line Package',
    pinCount: '4–64 vývodů',
    pitch: '2,54 mm',
    description:
      'Klasické THT pouzdro se dvěma řadami vývodů po stranách, montuje se do otvorů v DPS ' +
      'nebo do patice. Nejběžnější u starších/výukových IO (např. 555, 74xx, operační ' +
      'zesilovače). Snadno vyměnitelné díky velké rozteči a možnosti použít paticovou objímku.',
  },
  {
    id: 'sip',
    name: 'SIP',
    fullName: 'Single In-line Package',
    pinCount: '3–12 vývodů',
    pitch: '2,54 mm',
    description:
      'THT pouzdro s jedinou řadou vývodů. Časté u rezistorových/odporových sítí, malých ' +
      'modulů a některých regulátorů. Montuje se kolmo k DPS.',
  },
  {
    id: 'soic',
    name: 'SOIC',
    fullName: 'Small Outline Integrated Circuit',
    pinCount: '8–28 vývodů',
    pitch: '1,27 mm',
    description:
      'SMD obdoba DIP pouzdra — dvě řady vývodů typu gull-wing po delších stranách, ale menší ' +
      'a s jemnější roztečí. Jedno z nejběžnějších SMD pouzder pro IO střední velikosti.',
  },
  {
    id: 'sot23',
    name: 'SOT-23',
    fullName: 'Small Outline Transistor',
    pinCount: '3–6 vývodů',
    pitch: '0,95 mm',
    description:
      'Velmi malé SMD pouzdro s vývody po dvou stranách (2+1 u 3pinové verze). Typické pro ' +
      'tranzistory, diody a jednoduché IO (např. malé regulátory, logická hradla s málo piny).',
  },
  {
    id: 'sot89',
    name: 'SOT-89',
    fullName: 'Small Outline Transistor (výkonová varianta)',
    pinCount: '3–4 vývody',
    pitch: '1,5 mm',
    description:
      'Větší a plošší SMD tranzistorové pouzdro s velkou kovovou chladicí ploškou na spodní ' +
      'straně (přiléhá k mědi DPS), pro vyšší ztrátový výkon než SOT-23. Časté u SMD regulátorů ' +
      'a výkonnějších tranzistorů.',
  },
  {
    id: 'to92',
    name: 'TO-92',
    fullName: 'Transistor Outline 92',
    pinCount: '3 vývody',
    pitch: '1,27–2,54 mm',
    description:
      'Klasické THT plastové pouzdro s půlkruhovým tvarem a třemi vývody v řadě — nejběžnější ' +
      'pouzdro malých signálových tranzistorů, JFETů a nízkoproudých regulátorů.',
  },
  {
    id: 'to220',
    name: 'TO-220',
    fullName: 'Transistor Outline 220',
    pinCount: '3–7 vývodů',
    pitch: '2,54 mm',
    description:
      'Výkonové THT pouzdro s kovovou chladicí ploškou (často s montážním otvorem pro šroub ' +
      'na chladič). Typické pro výkonové tranzistory, MOSFETy a lineární regulátory (7805, ' +
      'LM317 apod.).',
  },
  {
    id: 'qfn',
    name: 'QFN',
    fullName: 'Quad Flat No-leads',
    pinCount: '8–68 vývodů',
    pitch: '0,4–0,65 mm',
    description:
      'SMD bezvývodové čtvercové pouzdro — kontaktní plošky jsou jen po obvodu spodní strany, ' +
      'často s velkou termální/zemnící ploškou uprostřed. Malé rozměry, dobré tepelné a ' +
      'vysokofrekvenční vlastnosti, ale obtížnější vizuální kontrola pájených spojů.',
  },
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
