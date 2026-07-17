export interface ScriptureData {
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translation: string;
  text: string;
}

// Multi-translation mockup database
export const MOCK_BIBLE_DB: Record<string, Record<string, string>> = {
  'John 3:16': {
    ESV: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    NIV: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    NLT: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    AMP: 'For God so [greatly] loved and dearly prized the world, that He [even] gave His [one and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life.',
    KJV: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  'Romans 8:28': {
    ESV: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
    NIV: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    NLT: 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.',
    AMP: 'And we know [with great confidence] that God [who is deeply concerned about us] causes all things to work together for good for those who love God, to those who are called according to His plan and purpose.',
    KJV: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  'Ephesians 2:8': {
    ESV: 'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God,',
    NIV: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—',
    NLT: 'God saved you by his grace when you believed. And you can’t take credit for this; it is a gift from God.',
    AMP: 'For it is by free grace (God’s unmerited favor) that you are saved (delivered from judgment and made partakers of Christ’s salvation) through [your] faith. And this [salvation] is not of yourselves [of your own doing, it came not through your own effort], but it is the gift of God;',
    KJV: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:',
  },
  'Ephesians 2:9': {
    ESV: 'not a result of works, so that no one may boast.',
    NIV: 'not by works, so that no one can boast.',
    NLT: 'Salvation is not a reward for the good things we have done, so none of us can boast about it.',
    AMP: 'not as a result of [your] works [your efforts and physical obedience to the law], so that no one may [boast or] take credit for it.',
    KJV: 'Not of works, lest any man should boast.',
  },
  'Genesis 1:1': {
    ESV: 'In the beginning, God created the heavens and the earth.',
    NIV: 'In the beginning God created the heavens and the earth.',
    NLT: 'In the beginning God created the heavens and the earth.',
    AMP: 'In the beginning God (Prepare, Create, Fashion) created the heavens and the earth.',
    KJV: 'In the beginning God created the heaven and the earth.',
  },
  'Proverbs 3:5': {
    ESV: 'Trust in the LORD with all your heart, and do not lean on your own understanding.',
    NIV: 'Trust in the LORD with all your heart and lean not on your own understanding;',
    NLT: 'Trust in the LORD with all your heart; do not depend on your own understanding.',
    AMP: 'Trust in and rely confidently on the LORD with all your heart and do not rely on your own insight or understanding.',
    KJV: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  },
  'Proverbs 3:6': {
    ESV: 'In all your ways acknowledge him, and he will make straight your paths.',
    NIV: 'in all your ways submit to him, and he will make your paths straight.',
    NLT: 'Seek his will in all you do, and he will show you which path to take.',
    AMP: 'In all your ways know and acknowledge and recognize Him, and He will make your paths straight and smooth [removing obstacles that block your way].',
    KJV: 'In all thy ways acknowledge him, and he shall direct thy paths.',
  },
  'John 15:5': {
    ESV: 'I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.',
    NIV: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
    NLT: 'Yes, I am the vine; you are the branches. Those who remain in me, and I in them, will produce much fruit. For apart from me you can do nothing.',
    AMP: 'I am the Vine; you are the branches. The one who abides in Me and I in him bears much fruit, for [otherwise] apart from Me [that is, cut off from vital union with Me] you can do nothing.',
    KJV: 'I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.',
  },
  '1 Corinthians 13:4': {
    ESV: 'Love is patient and kind; love does not envy or boast; it is not arrogant',
    NIV: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',
    NLT: 'Love is patient and kind. Love is not jealous or boastful or proud',
    AMP: 'Love endures with patience and serenity, love is kind and thoughtful, and is not jealous or envious; love does not brag and is not proud or arrogant.',
    KJV: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,',
  },
  'Psalm 23:1': {
    ESV: 'The LORD is my shepherd; I shall not want.',
    NIV: 'The LORD is my shepherd, I lack nothing.',
    NLT: 'The LORD is my shepherd; I have all that I need.',
    AMP: 'The LORD is my Shepherd [to feed, to guide, and to shield me], I shall not want.',
    KJV: 'The LORD is my shepherd; I shall not want.',
  },
};

// Book shorthand translation dictionary to standard book name
const BOOK_MAP: Record<string, string> = {
  gen: 'Genesis', genesis: 'Genesis',
  ex: 'Exodus', exod: 'Exodus', exodus: 'Exodus',
  lev: 'Leviticus', leviticus: 'Leviticus',
  num: 'Numbers', numbers: 'Numbers',
  deut: 'Deuteronomy', deuteronomy: 'Deuteronomy',
  josh: 'Joshua', joshua: 'Joshua',
  judg: 'Judges', judges: 'Judges',
  ruth: 'Ruth',
  '1sam': '1 Samuel', '1 samuel': '1 Samuel',
  '2sam': '2 Samuel', '2 samuel': '2 Samuel',
  '1kgs': '1 Kings', '1 kings': '1 Kings',
  '2kgs': '2 Kings', '2 kings': '2 Kings',
  '1chr': '1 Chronicles', '1 chr': '1 Chronicles',
  '2chr': '2 Chronicles', '2 chr': '2 Chronicles',
  ezra: 'Ezra',
  neh: 'Neh', nehemiah: 'Nehemiah',
  esth: 'Esther', esther: 'Esther',
  job: 'Job',
  ps: 'Psalm', psalm: 'Psalm', psalms: 'Psalm',
  prov: 'Proverbs', proverbs: 'Proverbs',
  eccl: 'Ecclesiastes', ecclesiastes: 'Ecclesiastes',
  song: 'Song of Solomon',
  isa: 'Isaiah', isaiah: 'Isaiah',
  jer: 'Jeremiah', jeremiah: 'Jeremiah',
  lam: 'Lamentations', lamentations: 'Lamentations',
  ezek: 'Ezekiel', ezekiel: 'Ezekiel',
  dan: 'Daniel', daniel: 'Daniel',
  hos: 'Hosea', hosea: 'Hosea',
  joel: 'Joel',
  amos: 'Amos',
  obad: 'Obadiah',
  jonah: 'Jonah',
  mic: 'Micah', micah: 'Micah',
  nah: 'Nahum',
  hab: 'Habakkuk',
  zeph: 'Zephaniah',
  hag: 'Haggai',
  zech: 'Zechariah',
  mal: 'Malachi',
  matt: 'Matthew', matthew: 'Matthew',
  mark: 'Mark',
  luke: 'Luke', lk: 'Luke',
  jn: 'John', john: 'John',
  acts: 'Acts',
  rom: 'Romans', romans: 'Romans',
  '1cor': '1 Corinthians', '1 cor': '1 Corinthians',
  '2cor': '2 Corinthians', '2 cor': '2 Corinthians',
  gal: 'Galatians', galatians: 'Galatians',
  eph: 'Ephesians', ephesians: 'Ephesians',
  phil: 'Philippians', philippians: 'Philippians',
  col: 'Colossians', colossians: 'Colossians',
  '1thess': '1 Thessalonians', '1 thess': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2 thess': '2 Thessalonians',
  '1tim': '1 Timothy', '1 tim': '1 Timothy',
  '2tim': '2 Timothy', '2 tim': '2 Timothy',
  titus: 'Titus',
  philem: 'Philemon',
  heb: 'Hebrews', hebrews: 'Hebrews',
  jas: 'James', james: 'James',
  '1pet': '1 Peter', '1 pet': '1 Peter',
  '2pet': '2 Peter', '2 pet': '2 Peter',
  '1jn': '1 John', '1 jn': '1 John',
  '2jn': '2 John', '2 jn': '2 John',
  '3jn': '3 John', '3 jn': '3 John',
  jude: 'Jude',
  rev: 'Revelation', revelation: 'Revelation',
};

// Clean reference name to match MOCK_BIBLE_DB keys
export function resolveStandardReference(bookStr: string, chapter: number, verseStart: number, verseEnd?: number): string {
  const normalizedBook = bookStr.toLowerCase().replace(/\s+/g, '');
  const standardBookName = BOOK_MAP[normalizedBook] || bookStr;
  
  if (verseEnd && verseEnd > verseStart) {
    return `${standardBookName} ${chapter}:${verseStart}-${verseEnd}`;
  }
  return `${standardBookName} ${chapter}:${verseStart}`;
}

export interface ParseResult {
  raw: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  translationOverride?: string;
  standardReference: string;
}

// Regex to catch scriptures like "Rom 8:28", "John 3:16-17", "1 Cor 13:4 AMP", "Proverbs 3:5" (no verse is handled as verse 1)
const BIBLE_REGEX = /\b(1\s*[A-Za-z]+|2\s*[A-Za-z]+|3\s*[A-Za-z]+|[A-Za-z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?(?:\s+(ESV|NIV|NLT|AMP|KJV))?\b/i;

export function parseScriptureRef(text: string): ParseResult | null {
  const match = text.match(BIBLE_REGEX);
  if (!match) return null;

  const [raw, bookStr, chapStr, verseStartStr, verseEndStr, transStr] = match;
  const normalizedBook = bookStr.toLowerCase().replace(/\s+/g, '');
  
  // If the book does not exist in our map, it might not be a scripture
  if (!BOOK_MAP[normalizedBook]) return null;

  const book = BOOK_MAP[normalizedBook];
  const chapter = parseInt(chapStr, 10);
  const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : 1;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;
  
  const standardReference = resolveStandardReference(book, chapter, verseStart, verseEnd);

  return {
    raw,
    book,
    chapter,
    verseStart,
    verseEnd,
    translationOverride: transStr ? transStr.toUpperCase() : undefined,
    standardReference,
  };
}

// Simulates API fetch for a scripture
export async function fetchScripture(reference: string, translation: string): Promise<ScriptureData> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const match = parseScriptureRef(reference);
      const standardRef = match ? match.standardReference : reference;
      
      if (match && match.verseEnd && match.verseEnd > match.verseStart) {
        // Range query!
        // We will fetch each verse from verseStart to verseEnd
        const verseTexts: string[] = [];
        let anyFound = false;
        
        for (let v = match.verseStart; v <= match.verseEnd; v++) {
          const singleRef = `${match.book} ${match.chapter}:${v}`;
          const verseDict = MOCK_BIBLE_DB[singleRef];
          if (verseDict) {
            const t = verseDict[translation] || verseDict['ESV'];
            if (t) {
              verseTexts.push(`[${v}] ${t}`);
              anyFound = true;
            }
          } else {
            // Placeholder text for missing verses in offline database
            verseTexts.push(`[${v}] This is a placeholder verse text for ${match.book} ${match.chapter}:${v} in the offline database.`);
          }
        }
        
        if (anyFound) {
          resolve({
            reference: standardRef,
            book: match.book,
            chapter: match.chapter,
            verseStart: match.verseStart,
            verseEnd: match.verseEnd,
            translation,
            text: verseTexts.join(' '),
          });
          return;
        }
      }
      
      const verseDict = MOCK_BIBLE_DB[standardRef];
      if (verseDict) {
        const text = verseDict[translation] || verseDict['ESV'] || 'Scripture verse text not available in mock database.';
        resolve({
          reference: standardRef,
          book: match?.book || 'Unknown Book',
          chapter: match?.chapter || 1,
          verseStart: match?.verseStart || 1,
          verseEnd: match?.verseEnd,
          translation,
          text,
        });
      } else {
        // Fallback for any other requested verse
        resolve({
          reference: standardRef,
          book: match?.book || 'Unknown Book',
          chapter: match?.chapter || 1,
          verseStart: match?.verseStart || 1,
          verseEnd: match?.verseEnd,
          translation,
          text: `[Mock] "For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future." (Faith Pad local offline fallback for ${standardRef} ${translation})`,
        });
      }
    }, 400); // 400ms latency to simulate REST query
  });
}
