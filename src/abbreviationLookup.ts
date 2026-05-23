// Language abbreviations used in etymology sections, mapped to display names.
const LANGUAGE_ABBREVIATIONS: Record<string, string> = {
  AS:   'Anglo-Saxon',
  Dan:  'Danish',
  Du:   'Dutch',
  fr:   'French',
  Fr:   'French',
  Gael: 'Gaelic',
  Goth: 'Gothic',
  Gr:   'Greek',
  Heb:  'Hebrew',
  Icel: 'Icelandic',
  Ir:   'Irish',
  It:   'Italian',
  Jap:  'Japanese',
  L:    'Latin',
  LL:   'Latin',
  LG:   'German',
  NL:   'Latin',
  Nor:  'Norwegian',
  OHG:  'German',
  Per:  'Persian',
  Port: 'Portuguese',
  Prov: 'Provençal',
  Rom:  'Romance',
  Russ: 'Russian',
  Sax:  'Saxon',
  Skr:  'Sanskrit',
  Slav: 'Slavonic',
  Sp:   'Spanish',
  Sw:   'Swedish',
  Teut: 'Teutonic',
  Turk: 'Turkish',
  W:    'Welsh',
};

// Regex matching any language abbreviation followed by a period at a word boundary.
// Sorted longest-first so multi-char abbreviations match before their single-char prefixes.
const LANG_ABBREV_PATTERN = new RegExp(
  `\\b(${Object.keys(LANGUAGE_ABBREVIATIONS).sort((a, b) => b.length - a.length).join('|')})\\.`,
  'g'
);

export function extractEtymLanguages(etymText: string): string[] {
  const seen = new Set<string>();
  const languages: string[] = [];
  let match;
  LANG_ABBREV_PATTERN.lastIndex = 0;
  while ((match = LANG_ABBREV_PATTERN.exec(etymText)) !== null) {
    const lang = LANGUAGE_ABBREVIATIONS[match[1]];
    if (lang && !seen.has(lang)) {
      seen.add(lang);
      languages.push(lang);
    }
  }
  return languages;
}

// Maps Webster's dictionary abbreviations (case-sensitive) to their expanded forms.
// Expansions are lowercased to match the loweredWordToWordId lookup.
const ABBREVIATIONS: Record<string, string> = {
  // Subject / field labels
  Anat:   'anatomy',
  Agric:  'agriculture',
  Alg:    'algebra',
  Antiq:  'antiquity',
  Arch:   'architecture',
  Arith:  'arithmetic',
  Astron: 'astronomy',
  Biol:   'biology',
  Bot:    'botany',
  Chem:   'chemistry',
  Com:    'commerce',
  Conch:  'conchology',
  Dyeing: 'dyeing',
  Eccl:   'ecclesiastical',
  Entom:  'entomology',
  Eth:    'ethics',
  Fort:   'fortification',
  Geog:   'geography',
  Geol:   'geology',
  Geom:   'geometry',
  Gram:   'grammar',
  Her:    'heraldry',
  Ichth:  'ichthyology',
  Illust: 'illustration',
  Log:    'logic',
  Mach:   'machinery',
  Math:   'mathematics',
  Mech:   'mechanics',
  Med:    'medicine',
  Metaph: 'metaphysics',
  Mil:    'military',
  Min:    'mineralogy',
  Mus:    'music',
  Naut:   'nautical',
  Nav:    'navigation',
  Opt:    'optics',
  Ornith: 'ornithology',
  Pharm:  'pharmacy',
  Phon:   'phonetics',
  Physiol:'physiology',
  Print:  'printing',
  Rhet:   'rhetoric',
  Surg:   'surgery',
  Theol:  'theology',
  Zo:     'zoology',
  Zool:   'zoology',

  // Usage / grammar labels
  Obs:    'obsolete',
  Colloq: 'colloquial',
  Pref:   'prefix',
  pref:   'prefix',
  adv:    'adverb',
  esp:    'especially',
  pl:     'plural',
  prob:   'probably',
  perh:   'perhaps',
  lit:    'literally',
  fig:    'figurative',
  cf:     'compare',
  Cf:     'compare',
  Bp:     'bishop',
  Dr:     'doctor',
  Eng:    'english',

  // Language / origin labels
  AS:   'anglo-saxon',
  Dan:  'danish',
  Du:   'dutch',
  fr:   'french',
  Fr:   'french',
  Gael: 'gaelic',
  Goth: 'gothic',
  Gr:   'greek',
  Heb:  'hebrew',
  Icel: 'icelandic',
  Ir:   'irish',
  It:   'italian',
  Jap:  'japanese',
  L:    'latin',
  LL:   'latin',
  LG:   'german',
  NL:   'latin',
  Nor:  'norwegian',
  OHG:  'german',
  Per:  'persian',
  Port: 'portuguese',
  Prov: 'provencal',
  Rom:  'romance',
  Russ: 'russian',
  Sax:  'saxon',
  Skr:  'sanskrit',
  Slav: 'slavonic',
  Sp:   'spanish',
  Sw:   'swedish',
  Teut: 'teutonic',
  Turk: 'turkish',
  W:    'welsh',
};

export function lookupAbbreviation(token: string, loweredWordToWordId: Map<string, string>): string | undefined {
  const expansion = ABBREVIATIONS[token];
  if (!expansion) return undefined;
  return loweredWordToWordId.get(expansion);
}
