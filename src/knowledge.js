// ═══════════════════════════════════════════════════════════════════════════
// src/knowledge.js — المحرك المعرفي الذكي لشات بوت الروبوت شرارة
// معالجة لغوية متقدمة (NLP)، تطبيع لهجات، وتوليد ديناميكي لجميع الأجهزة الـ 24
// ═══════════════════════════════════════════════════════════════════════════

import { config, deviceNames, msg, DEVICE_MAP, ALL_DEVICES } from './config.js';
import { nextActions, validAction } from './state.js';

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // إزالة التشكيل والتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}+−\-?؟\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// حساب مسافة ليفنشتاين للتعامل مع الأخطاء الإملائية البسيطة (Levenshtein <= 1)
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export const synonyms = {
  car: ['سياره', 'عربيه', 'سيارة اطفال', 'سياره لعبه', 'car', 'toycar'],
  radio: ['راديو', 'مذياع', 'مسجل', 'radio'],
  flashlight: ['كشاف', 'شعله', 'كشاف جيب', 'مصباح يدوي', 'flashlight', 'torch'],
  wallClock: ['ساعه جدار', 'ساعه حائط', 'ساعه معلقه', 'clock', 'wallclock'],
  remote: ['ريموت', 'تحكم', 'ريموت تلفاز', 'جهاز تحكم', 'remote'],
  calculator: ['حاسبه', 'اله حاسبه', 'اله رقميه', 'calculator'],
  digitalScale: ['ميزان', 'ميزان رقمي', 'ميزان ارضي', 'scale'],
  smokeDetector: ['انذار دخان', 'كاشف دخان', 'جهاز انذار', 'smokedetector'],
  laserPointer: ['ليزر', 'مؤشر ليزر', 'قلم ليزر', 'laser'],
  hearingAid: ['سماعه اذن', 'سماعه طبيه', 'سماعه طبية', 'hearingaid'],
  robotToy: ['روبوت لعبه', 'لعبه روبوت', 'روبوت اطفال', 'robottoy'],
  electricToothbrush: ['فرشاه اسنان', 'فرشاه كهربائيه', 'فرشاة اسنان', 'toothbrush'],

  fridge: ['ثلاجه', 'تلاجه', 'براد', 'fridge', 'refrigerator'],
  microwave: ['ميكروويف', 'مكرويف', 'مايكرويف', 'فرن ميكروويف', 'microwave'],
  washer: ['غساله', 'غسالة ملابس', 'washer', 'washingmachine'],
  airConditioner: ['مكيف', 'تكييف', 'سبلت', 'مكيف هواء', 'airconditioner', /\bac\b/i],
  vacuum: ['مكنسه', 'مكنسة كهربائية', 'مكنسه كهربائيه', 'شفاط', 'vacuum'],
  lamp: ['مصباح مكتب', 'مصباح سلكي', 'اباجوره', 'لمبه مكتب', 'desk lamp', 'desklamp'],
  electricOven: ['فرن كهربائي', 'فرن منزلي', 'oven', 'electricoven'],
  iron: ['مكواه', 'مكوايه', 'كوايه', 'مكواة بخار', 'iron'],
  hairDryer: ['استشوار', 'سشوار', 'مجفف شعر', 'مجفف', 'hairdryer'],
  electricWaterHeater: ['سخان ماء', 'كويزر', 'بويلر', 'سخان كهربائي', 'waterheater'],
  electricHeater: ['مدفاه', 'صوبه', 'دفايه', 'مدفاه كهربائيه', 'heater', 'spaceheater'],
  blender: ['خلاط', 'عصاره', 'خلاط فواكه', 'خلاط كهربائي', 'blender'],

  battery: ['بطاريه', 'حجر', 'بطاريه جافه', 'battery'],
  electricity: ['كهرباء', 'كهربا', 'مقبس', 'فيشه', 'فيش', 'بريز', 'electricity', 'mains']
};

const has = (q, words) => words.some(w => {
  if (w instanceof RegExp) return w.test(q);
  if (q.includes(w)) return true;
  // تسامح خطأ إملائي واحد إذا كانت الكلمة أطول من 4 حروف
  if (w.length >= 5) {
    const qTokens = q.split(/\s+/);
    return qTokens.some(tok => Math.abs(tok.length - w.length) <= 1 && levenshteinDistance(tok, w) <= 1);
  }
  return false;
});

export const deviceIn = (q, s) => {
  const activeIds = s?.devices ? Object.keys(s.devices) : Object.keys(DEVICE_MAP).slice(0, 4);
  const allKnown = Object.keys(synonyms).filter(k => k !== 'battery' && k !== 'electricity');
  const matched = allKnown.filter(k => has(q, synonyms[k]));
  if (matched.length) {
    const inActive = matched.filter(k => activeIds.includes(k));
    return inActive.length ? inActive : matched;
  }
  return [];
};

const bi = (s, ar, en) => (s?.language === 'en' ? en : ar);

function matchTerm(q, words, term) {
  if (term instanceof RegExp) return term.test(q);
  if (term.includes(' ')) return q.includes(term);
  if (term.length <= 3) {
    return words.some(w => w === term || w === 'ال' + term || w === 'ب' + term || w === 'و' + term || w === 'ل' + term || w === 'ف' + term || w === 'ك' + term || w === 'بال' + term || w === 'وال' + term);
  }
  return q.includes(term);
}

function matchConcepts(q, conceptSets) {
  if (!conceptSets || !conceptSets.length) return false;
  const words = q.replace(/[?؟+−\-]/g, ' ').split(/\s+/).filter(Boolean);
  const isMultiSet = Array.isArray(conceptSets[0]) && Array.isArray(conceptSets[0][0]);
  const sets = isMultiSet ? conceptSets : [conceptSets];
  return sets.some(groups => groups.every(group => group.some(term => matchTerm(q, words, term))));
}

function matchItem(k, q) {
  if (k.when && !k.when(q)) return false;
  if (k.patterns && k.patterns.some(r => r.test(q))) return true;
  if (k.concepts && matchConcepts(q, k.concepts)) return true;
  return false;
}

export const knowledge = [
  {
    id: 'safety',
    patterns: [/اجرب في (البيت|المنزل)|(?:^|\s)المس(?:\s|$)|اعبث|المس.*(فيش|مقبس|سلك|كهرب)|touch.*socket|experiment at home|اتكهرب|بكهرب|صعق/],
    concepts: [
      [['المس', 'لمس', 'امسك', 'مسك', 'اعبث', 'العب', 'اتكهرب', 'كهربني', 'صدم', 'خطر', 'خطير', 'بكهرب', 'يكهرب', 'اموت', 'شوك', 'touch', 'shock', 'danger', 'safe'], ['مقبس', 'فيش', 'فيشه', 'سلك', 'اسلاك', 'بريز', 'كهرب', 'منزل', 'حيط', 'socket', 'plug', 'wire']],
      [['اجرب في البيت', 'اجرب بالبيت', 'تجرب في البيت', 'experiment at home']],
      [['المس المقبس', 'المس الفيش', 'touch socket']]
    ],
    ar: 'نجرب هنا على الشاشة بأمان تام. اطلب مساعدة شخص بالغ في المنزل دائماً، ولا تعبث بمقابس الكهرباء أو الأسلاك إطلاقاً.',
    en: 'We experiment on screen safely. Always ask an adult at home and never touch wall sockets or wires.',
    examples: ['هل أجرب في البيت؟', 'هل ألمس المقبس؟', 'can I touch a socket?']
  },
  {
    id: 'safety_rules',
    patterns: [/قواعد السلامه|ارشادات الامان|كيف احمي نفسي|مخاطر الكهربا|safety rules/],
    concepts: [
      [['سلامه', 'امان', 'ارشادات', 'قواعد', 'احمي', 'مخاطر', 'safety', 'rules', 'danger'], ['كهربا', 'كهرباء', 'electricity']]
    ],
    ar: 'قواعد السلامة الذهبية: 1) لا تلمس المقبس أو الفيش بأيدٍ مبللة. 2) لا تشد السلك بقوة. 3) اطلب مساعدة الكبار عند تشغيل الأجهزة الكبيرة.',
    en: 'Golden safety rules: 1) Never touch plugs with wet hands. 2) Do not pull wires. 3) Ask adults to operate large appliances.',
    examples: ['ما هي قواعد السلامة؟', 'كيف أتعامل مع الكهرباء بأمان؟', 'safety rules']
  },
  {
    id: 'recycle',
    patterns: [/مستعمل|التخلص|تخلص من|نرمي|ارمي|نفايات|وين (ارمي|احط).*بطاري|recycl|dispose/],
    concepts: [
      [['مستعمل', 'التخلص', 'تخلص من', 'نتخلص', 'نرمي', 'ارمي', 'نفايات', 'زبال', 'قمام', 'سله', 'تدوير', 'اعاده تدوير', 'dispose', 'recycle', 'throw'], ['بطاري', 'حجر', 'battery']]
    ],
    ar: 'أعط البطارية المستعملة لشخص بالغ ليضعها في حاويات إعادة التدوير المخصصة. لا تفتحها ولا ترمِها في سلة المهملات العادية.',
    en: 'Give used batteries to an adult for proper battery recycling bins. Do not open or discard in regular trash.',
    examples: ['ماذا أفعل بالبطارية المستعملة؟', 'أين أرمي الحجر؟', 'dispose of battery']
  },
  {
    id: 'charge',
    patterns: [/اشحن|شحن|قابل للشحن|charge|recharge/],
    concepts: [
      [['اشحن', 'شحن', 'شاحن', 'ينشحن', 'تنشحن', 'بنشحن', 'اعيد شحن', 'قابله للشحن', 'charge', 'recharge']]
    ],
    ar: 'البطارية الجافة العادية ذات الاستخدام الواحد غير قابلة للشحن ويُمنع شحنها. يُشحن فقط النوع المخصص لذلك بشاحنه الخاص تحت إشراف بالغ.',
    en: 'Disposable dry batteries cannot be recharged. Only specifically labeled rechargeable batteries can be charged by an adult.',
    examples: ['هل أشحن هذه البطارية؟', 'ممكن شحن الحجر؟', 'can I recharge?']
  },
  {
    id: 'power_bank',
    patterns: [/باور بانك|بنك.*طاق|power bank|usb|شاحن متنقل/i],
    concepts: [
      [['باور بانك', 'بنك طاقه', 'بنك الطاقه', 'شاحن متنقل', 'power bank', 'usb', 'powerbank']]
    ],
    ar: 'بنك الطاقة (Power Bank) يحتوي بطاريات قابلة للشحن تخزن طاقة لتغذية الهواتف والأجهزة المحمولة بجهد 5V آمن.',
    en: 'A power bank contains rechargeable batteries storing energy to charge mobile devices at a safe 5V.',
    examples: ['ما هو بنك الطاقة؟', 'هل الباور بانك بطارية؟', 'what is a power bank?']
  },
  {
    id: 'large_battery',
    patterns: [/(ثلاج|تلاج|براد|غسال|مكيف|fridge|washer|ac).*(كبير|رحلات|سياره|بطاري|حجر|battery)/, /(بطاري|battery).*(كبير|big).*(ثلاج|غسال|fridge)/, /(big|large|camping).*(battery|fridge)/],
    when: q => /كبير|رحلات|camp|big|large/.test(q),
    concepts: [
      [['كبير', 'ضخم', 'رحلات', 'camping', 'big', 'large'], ['ثلاج', 'تلاج', 'براد', 'غسال', 'مكيف', 'fridge', 'washer']],
      [['رحلات', 'camping']]
    ],
    ar: 'نعم، توجد ثلاجات رحلات وأجهزة مخصصة تعمل ببطاريات ضخمة ومحولات خاصة. هذا يختلف عن أجهزتنا المنزلية التي تحتاج تيار 220V مباشر.',
    en: 'Yes, special camping refrigerators exist that run on large vehicle battery packs. Home appliances require standard 220V grid power.',
    examples: ['هل يمكن تشغيل ثلاجة ببطارية كبيرة؟', 'وثلاجات الرحلات؟', 'big battery for fridge']
  },
  {
    id: 'size',
    patterns: [/كل.*(صغير|كبير)|الحجم|size|all.*(small|big)/],
    concepts: [
      [['حجم', 'كل صغير', 'كل كبير', 'الحجم بيحدد', 'size', 'all small', 'all big']],
      [['صغير', 'كبير', 'small', 'big'], ['بطاري', 'كهرب', 'تغذي', 'جهاز', 'battery', 'device']]
    ],
    ar: 'الحجم وحده لا يحدد المصدر دائماً! فالمكواة صغيرة الحجم لكنها تحتاج كهرباء 220V قوية لتوليد الحرارة، بينما أجهزة أخرى خفيفة تكتفي ببطارية.',
    en: 'Size alone does not decide the source! An iron is small but needs 220V mains for heat, while portable devices use batteries.',
    examples: ['هل كل جهاز صغير يعمل ببطارية؟', 'هل كل جهاز كبير لا يعمل ببطارية؟', 'does size decide?']
  },
  {
    id: 'radio_sound',
    patterns: [/(اسمع|صوت|hear|sound).*(راديو|radio)|(?:راديو|radio).*(صامت|صوت|silent|sound)/],
    concepts: [
      [['صوت', 'اسمع', 'سامع', 'صامت', 'كتم', 'اغني', 'موسيق', 'sound', 'hear', 'silent', 'mute'], ['راديو', 'مذياع', 'radio']]
    ],
    dynamic: 'sound',
    examples: ['لماذا لا أسمع الراديو؟', 'الراديو بلا صوت', 'no sound from radio']
  },
  {
    id: 'radio_produces',
    patterns: [/(راديو|مذياع|radio).*(يصنع|ينتج|يولد|بولد|بصنع|بنتج|make|produc)/],
    concepts: [
      [['راديو', 'مذياع', 'radio'], ['يصنع', 'ينتج', 'يولد', 'بولد', 'بصنع', 'بنتج', 'يعطي', 'صنع', 'توليد', 'انتاج', 'make', 'produce', 'generate']]
    ],
    ar: 'الراديو مستهلك للطاقة الكهربائية؛ فهو يحول الطاقة الكهربائية القادمة من البطارية إلى طاقة صوتية، ولا ينتج الكهرباء بنفسه.',
    en: 'The radio consumes electrical energy and converts it into sound waves. It does not produce electricity.',
    examples: ['هل الراديو يصنع الكهرباء؟', 'هل المذياع يولد كهربا؟', 'does radio produce electricity?']
  },
  {
    id: 'together',
    patterns: [/معا|مع بعض|نفس الوقت|together|same time|الاثنين مع|التنتين مع|الجهازين مع|كلهم مع/],
    concepts: [
      [['معا', 'مع بعض', 'سوا', 'بنفس الوقت', 'الاثنين', 'التنتين', 'الجهازين', 'together', 'same time', 'both'], ['شغل', 'اشغل', 'نشغل', 'اشتغل', 'شتغل', 'نفس الوقت', 'بطاري', 'سيار', 'راديو', 'جهاز']]
    ],
    ar: 'في مختبرنا أداة بطارية واحدة وقابس واحد لنركز على فحص كل جهاز على حدة. عندما تنقل المصدر إلى جهاز جديد يتوقف الجهاز السابق.',
    en: 'In our lab, we have one test battery and one plug to inspect one device at a time. Moving the source transfers power.',
    examples: ['لماذا لا تعمل الأجهزة معًا؟', 'الجهازين بنفس الوقت؟', 'why not together?']
  },
  {
    id: 'remove',
    patterns: [/نزع|ازال|فصل البطاري|شيل|(?:^|\s)شلت(?:\s|$)|remove|disconnect.*battery/],
    concepts: [
      [['نزع', 'ازال', 'شلت', 'شيل', 'فكيت', 'فك', 'فصل', 'قطعت', 'remove', 'disconnect', 'take off'], ['بطاري', 'حجر', 'سلك', 'توقف', 'وقفت', 'طفى', 'طفت', 'battery']]
    ],
    ar: 'عند نزع البطارية تفتح الدائرة الكهربائية وينقطع سريان التيار، فيتوقف الجهاز عن العمل فوراً.',
    en: 'Removing the battery opens the circuit and stops the current flow, so the device immediately turns off.',
    examples: ['لماذا تتوقف السيارة عند نزع البطارية؟', 'إذا شلت الحجر؟', 'remove the battery']
  },
  {
    id: 'depletion',
    patterns: [/تفرغ|تنفد|نفاد|empty|run out|تفضى|فضيت|(بطاري|حجر|طاق|شحن).*(خلص|تخلص)|(خلص|تخلص).*(بطاري|حجر|طاق|شحن)/],
    concepts: [
      [['تفرغ', 'تخلص', 'تنفد', 'تفضى', 'فضيت', 'خلصت', 'تنتهي', 'نفاد', 'تموت', 'عمر', 'بتضل شغال', 'بتخلص', 'بتفضي', 'فاضيه', 'خالصه', 'run out', 'empty', 'deplet', 'drain', 'die'], ['بطاري', 'حجر', 'طاق', 'شحن', 'battery']]
    ],
    ar: 'طاقة البطارية محدودة وتنفد عند استهلاك المواد الكيميائية بداخلها. في محاكاتنا هنا نفترض أنها ممتلئة وجاهزة دائماً.',
    en: 'Battery energy is finite and depletes as chemical reactants are consumed. In our lab simulation, we assume full charge.',
    examples: ['هل البطارية تفرغ؟', 'هل طاقتها تنفد؟', 'can it run out?']
  },
  {
    id: 'poles',
    patterns: [/قطب|علامت|موجب|سالب|\+|−|poles|positive|negative|عكست.*بطاري|قلبت.*بطاري|بالمقلوب/],
    when: q => /قطب|موجب|سالب|\+|−|poles|positive|negative/.test(q) && q.trim() !== '-',
    concepts: [
      [['قطب', 'قطبين', 'موجب', 'سالب', 'زائد', 'ناقص', '+', '−', 'علامت', 'عكست', 'قلبت', 'بالمقلوب', 'وجهين', 'طرفين', 'طرفي', 'pole', 'positive', 'negative', 'terminal']]
    ],
    ar: 'علامتا (+) و (−) تدلان على القطبين الموجب والسالب. يجب وضع القطب الموجب مع علامة (+) والقطب السالب مع الزنبرك (−) لتكتمل الدائرة.',
    en: 'The (+) and (−) symbols mark the positive and negative poles. Matching them correctly completes the circuit.',
    examples: ['ما علامتا + و−؟', 'ما معنى موجب وسالب؟', 'battery poles']
  },
  {
    id: 'visible',
    patterns: [/تري|نراها|نري|نشوف|شايف|بنشوف|نجوم|خطوط|visible|see electricity|لون.*كهرب|شكل.*كهرب/],
    concepts: [
      [['نشوف', 'اشوف', 'نري', 'نراها', 'شايف', 'بنشوف', 'مرئي', 'تري', 'عين', 'لون', 'شكل', 'شرار', 'خطوط', 'نجوم', 'see', 'visible', 'look'], ['كهرب', 'تيار', 'شحن', 'طاق', 'electricity', 'current']]
    ],
    ar: 'الكهرباء لا تُرى بالعين المجردة، لكننا نستدل عليها بآثارها: كالضوء، والحركة، والصوت، والحرارة.',
    en: 'Electricity cannot be seen directly with our eyes, but we observe its effects: light, motion, sound, and heat.',
    examples: ['هل الكهرباء تُرى؟', 'هل نشوف كهربا؟', 'can we see electricity?']
  },
  {
    id: 'generation',
    patterns: [/من اين.*(كهرب|تيار)|من وين.*(كهرب|تيار)|كيف.*(كهرب|تيار)|(كهرب|تيار).*(من اين|من وين|كيف|بتيجي|تاتي|توصل)|توليد.*كهرب|مصدر.*كهرب|where.*electricity.*come|how.*electricity.*(get|reach|home)/],
    concepts: [
      [['كيف', 'من وين', 'من اين', 'وين', 'شو مصدر', 'ايش مصدر', 'مصدر', 'توليد', 'انتاج', 'بتيجي', 'تاتي', 'توصل', 'تصل', 'بتدخل', 'تدخل', 'نجيب', 'where', 'how', 'source', 'generate', 'produce'], ['كهرب', 'تيار', 'شبك', 'power', 'electric']]
    ],
    ar: 'تُولّد كهرباء المنازل في محطات توليد ضخمة (باستخدام الرياح، أو الشمس، أو المياه، أو الوقود) وتصلنا عبر شبكة الأسلاك والمقابس.',
    en: 'Household electricity is produced in power plants (using wind, solar, hydro, or fuels) and delivered through grid wires to wall sockets.',
    examples: ['من أين تأتي كهرباء المنزل؟', 'من وين الكهربا؟', 'where does electricity come from?']
  },
  {
    id: 'sockets',
    patterns: [/كل.*(مقبس|فيش)|محول|all.*socket|adapter/],
    concepts: [
      [['كل', 'ليش مش كل', 'ليش ما', 'محول', 'ادابتر', 'adapter'], ['مقبس', 'فيش', 'بريز', 'socket']]
    ],
    ar: 'مقبس الجدار يعطي تيار 220V عالي القوة. الأجهزة الصغيرة كألعاب الأطفال تحترق إذا وصلناها مباشرة بالمقبس دون محول مناسب.',
    en: 'Wall sockets deliver powerful 220V current. Small toys would be damaged if directly connected without proper adapters.',
    examples: ['لماذا لا تشتغل كل الأجهزة من المقبس؟', 'هل تحتاج محول؟', 'why not all use sockets?']
  },
  {
    id: 'better',
    patterns: [/افضل|احسن|اقوى|better|best|stronger/],
    concepts: [
      [['افضل', 'احسن', 'اقوي', 'مين احسن', 'مين افضل', 'مين اقوى', 'better', 'best', 'stronger'], ['بطاري', 'حجر', 'كهرب', 'فيش', 'مقبس', 'منزل', 'بيت', 'mains', 'battery']]
    ],
    ar: 'لكل مصدر ميزته! البطارية الجافة تمنحنا الأمان وسهولة الحركة والتنقل، بينما كهرباء المنزل تعطينا طاقة قوية ومستمرة للأجهزة الثقيلة.',
    en: 'Both have distinct advantages! Batteries provide safe mobility, while mains power provides high, continuous energy.',
    examples: ['أيهما أفضل؟', 'البطارية أحسن؟', 'which is better?']
  },
  {
    id: 'difference',
    patterns: [/الداخلي|الفرق|فرق بين|شو الفرق|ايش الفرق|difference/],
    concepts: [
      [['فرق', 'شو الفرق', 'ايش الفرق', 'بيختلف', 'مقارن', 'difference', 'compare', 'داخلي']]
    ],
    ar: 'كلاهما يزودنا بالطاقة الكهربائية، لكن الفرق الرئيسي: البطارية مصدر متنقل بجهد منخفض وآمن (1.5V - 9V)، وكهرباء المنزل مصدر ثابت بجهد عالي وقوي (220V) للأجهزة الكبيرة.',
    en: 'Both supply electrical energy, but the key difference: Batteries are portable, low-voltage, and safe (1.5V - 9V), while mains power is stationary and high-voltage (220V).',
    examples: ['ما الفرق بين البطارية والكهرباء الداخلية؟', 'الكهرباء الداخلية؟', 'what is the difference?']
  },
  {
    id: 'dry',
    patterns: [/جاف|dry/],
    concepts: [
      [['جاف', 'جافه', 'dry'], ['بطاري', 'حجر', 'خليه', 'battery', 'cell']]
    ],
    ar: 'سُميت «جافة» لأن مادتها الكيميائية تكون على هيئة معجون متماسك غير سائل، فلا تسيل أو تتسرب أثناء الحركة والنقل.',
    en: 'Called a “dry cell” because its electrolyte is a moist paste rather than a free liquid, making it safe to move.',
    examples: ['ما البطارية الجافة؟', 'يعني إيه جافة؟', 'what is a dry cell?']
  },
  {
    id: 'chemistry',
    patterns: [/(بطاري|حجر|battery).*(فيها|تخزن|طاق|كهرب|electric|energy)|طاقه كيميائيه/],
    concepts: [
      [['جوا', 'جوه', 'جوات', 'داخل', 'تخزن', 'مخزن', 'طاق', 'مواد', 'مكون', 'تركيب', 'من شو مصنوع', 'كيميائ', 'store', 'inside', 'chemical', 'contain'], ['بطاري', 'حجر', 'battery']]
    ],
    ar: 'تخزن البطارية بداخلها طاقة كيميائية، وتتحول بالتفاعل الكيميائي إلى طاقة كهربائية تسري في الأسلاك عند غلق الدائرة.',
    en: 'A battery stores chemical energy, converting it into electrical current when the circuit is closed.',
    examples: ['هل البطارية فيها كهرباء؟', 'هل الحجر يخزن طاقة؟', 'does a battery have electricity?']
  },
  {
    id: 'mains',
    patterns: [/ما.*كهرب.*(منزل|بيت)|شو.*كهرب.*(منزل|بيت)|يعني ايه.*كهرب.*(منزل|بيت)|what.*(household|mains)/],
    concepts: [
      [['ما', 'شو', 'ايش', 'يعني', 'عرف', 'what is', 'what'], ['كهرباء المنزل', 'كهربا البيت', 'كهرباء الشبكه', 'household electricity', 'mains electricity']]
    ],
    ar: 'كهرباء المنزل هي تيار كهربائي قوي يصلنا بجهد 220 فولت عبر مقابس الجدار لتشغيل الأجهزة المنزلية الكبيرة.',
    en: 'Household mains electricity is a high-power 220V current delivered through wall sockets for major appliances.',
    examples: ['ما كهرباء المنزل؟', 'ما هي كهربا البيت؟', 'what is mains electricity?']
  },
  {
    id: 'failed',
    patterns: [/فشل|غبي|غلطت|fail|stupid|خربت/],
    concepts: [
      [['فشل', 'غبي', 'غلطت', 'انا غلطت', 'خربت', 'انا السبب', 'fail', 'stupid', 'mistake', 'wrong']]
    ],
    ar: 'لا يوجد فشل في العلم! معرفة أن الجهاز لا يعمل بهذا المصدر هي خطوة استكشافية صحيحة تثبت عدم التوافق وتزيدنا معرفة.',
    en: 'There are no failures in science! Discovering that a power source does not fit is a valuable step toward truth.',
    examples: ['هل فشلت التجربة؟', 'أنا غلطت؟', 'did I fail?']
  },
  {
    id: 'drag',
    patterns: [/اسحب|السحب|drag|كيف احرك|تحريك/],
    concepts: [
      [['اسحب', 'سحب', 'تحريك', 'انقل', 'مش عارف اسحب', 'كيف احرك', 'drag', 'move', 'how to drag']]
    ],
    ar: 'طريقتان سهلتان: إما سحب البطارية أو القابس بإصبعك إلى الجهاز وإفلاته، أو النقر على البطارية أولاً ثم النقر على الجهاز المستهدف.',
    en: 'Two easy ways: Drag the battery or plug directly onto the device, or tap the tool then tap the target device.',
    examples: ['كيف أسحب؟', 'السحب صعب', 'how to drag?']
  },
  {
    id: 'restart',
    patterns: [/اعاده|اعيد|من جديد|restart|reset|تصفير|نلعب كمان/],
    concepts: [
      [['اعاده', 'اعيد', 'من جديد', 'تصفير', 'صفر', 'نلعب كمان مره', 'من الاول', 'restart', 'reset', 'start over']]
    ],
    ar: 'يمكننا بدء جولة جديدة بأجهزة عشوائية من بنك الأجهزة الـ 24 عبر زر أجهزة جديدة.',
    en: 'We can start a fresh round with new devices from our 24-device bank using the Reset button.',
    actions: [{ id: 'restart' }],
    examples: ['أريد إعادة اللعب', 'نبدأ من جديد', 'restart please']
  },
  {
    id: 'solution',
    patterns: [/الحل|اشرح مباشره|اعطني الجواب|اعطيني الحل|solution|answer directly/],
    concepts: [
      [['الحل', 'اشرح مباشره', 'اعطني الجواب', 'اعطيني الحل', 'شو النتيجه', 'احكيلي الجواب', 'solution', 'give me answer', 'answer directly']]
    ],
    ar: 'قاعدة الحل الذهبية: الأجهزة الخفيفة والمحمولة وألعاب الأطفال تعمل بالبطاريات الجافة الآمنة، بينما أجهزة التبريد والتسخين والمحركات الثقيلة تحتاج كهرباء المنزل 220V.',
    en: 'Key rule: Portable devices and toys use safe dry batteries; heating, cooling, and heavy motor appliances require 220V mains.',
    examples: ['أريد الحل', 'اشرح مباشرة', 'give me the solution']
  },
  {
    id: 'hint',
    patterns: [/تلميح|ساعدني|ساعد|hint|help/],
    when: q => !/مساعد/.test(q) || /بدي مساعده|طلب مساعده|help/.test(q),
    concepts: [
      [['تلميح', 'ساعدني', 'دلني', 'hint', 'help']]
    ],
    dynamic: 'hint',
    examples: ['أريد تلميحًا', 'ساعدني', 'a hint please']
  },
  {
    id: 'next',
    patterns: [/ماذا افعل|شو اعمل|ماذا بعد|what.*(do|next)|شو اسوي|وجهني|وين اروح|كيف اكمل|شو الخطوه|وين انا واصل|شو نسوي/],
    concepts: [
      [['ماذا افعل', 'شو اعمل', 'شو اسوي', 'شو الخطوه', 'شو بعدين', 'ماذا بعد', 'وجهني', 'مش عارف', 'وين اروح', 'دلني', 'خطوتنا', 'شو نسوي', 'ايش اسوي', 'كيف اكمل', 'وين انا واصل', 'انا وين', 'what to do', 'guide me', 'where to go']]
    ],
    dynamic: 'hint',
    examples: ['ماذا أفعل؟', 'شو أعمل؟', 'what do I do next?']
  },
  {
    id: 'activity',
    patterns: [/هذا النشاط|هذا المختبر|نلعب|ما هذا|what is this|activity|شو فكره|شو بنعمل|عن شو|هاد النشاط|هاد المختبر/],
    concepts: [
      [['هذا النشاط', 'هاد النشاط', 'هادا النشاط', 'هذا المختبر', 'هاد المختبر', 'هادا المختبر', 'شو فكره', 'شو بنعمل', 'شو هاي اللعبه', 'نلعب شو', 'عن شو', 'شو بنتعلم', 'ما هذا', 'what is this', 'activity']]
    ],
    ar: 'مختبر شرارة المتحرك يتيح لك تجربة مصادر الكهرباء للأجهزة ثلاثية الأبعاد تفاعلياً، وتطبيق خطوات المنهج العلمي: أتوقع، أجرب، ألاحظ، وأفسر.',
    en: 'Sharara 3D Lab lets you test power sources on 3D appliances interactively, following the scientific method: Predict, Test, Observe, and Explain.',
    examples: ['ما هذا النشاط؟', 'ما هذا المختبر؟', 'what is this activity?']
  },
  {
    id: 'where',
    patterns: [/اين اضع|وين احط|اين مكان|وين اركب|where.*put|^هذا$|^هي$|^هنا$|وين مكانها|وين بتروح/],
    concepts: [
      [['اين اضع', 'وين احط', 'اين مكان', 'وين اركب', 'وين مكانها', 'وين بتروح', 'وين اوديها', 'مكان البطاريه', 'where put', 'where does it go']]
    ],
    dynamic: 'where',
    examples: ['أين أضعها؟', 'وين أحطها؟', 'where do I put it?']
  },
  {
    id: 'why',
    patterns: [/لماذا|ليه|ليش|why|ما اشتغل|لم يعمل|لم تعمل|لا يعمل|متوقف|توقف|off|not work|طفت|طافي|خربان|ما اشتغلت|مش راضي|طافية/],
    concepts: [
      [['لماذا', 'ليه', 'ليش', 'شو السبب', 'ايش السبب', 'ما اشتغل', 'لم يعمل', 'لم تعمل', 'لا يعمل', 'متوقف', 'توقف', 'طفت', 'طافي', 'خربان', 'ما اشتغلت', 'مش راضي', 'طافية', 'why', 'not work', 'off']]
    ],
    dynamic: 'why',
    examples: ['لماذا لم يعمل؟', 'ليه ما اشتغل؟', 'why is it off?']
  },
  {
    id: 'battery',
    patterns: [/(?:^|\s)(?:ما|شو|ايش) (هي |هو )?(البطاريه|الحجر)|what is a battery/],
    concepts: [
      [['ما هي البطاريه', 'ما هو الحجر', 'شو هي البطاريه', 'شو يعني بطاريه', 'عرف البطاريه', 'ايش البطاريه', 'what is a battery', 'what is battery']]
    ],
    ar: 'البطارية هي مصدر محمول للطاقة الكهربائية، تخزن طاقة كيميائية وتولد تياراً كهربائياً آمناً في الدوائر المغلقة.',
    en: 'A battery is a portable source of electrical energy, storing chemical energy to power closed circuits safely.',
    examples: ['ما هي البطارية؟', 'ما هو الحجر؟', 'what is a battery?']
  },
  {
    id: 'list_devices',
    patterns: [
      /(?:ما|ماهي|ما هي|شو|ايش|اذكر|قائمه|اسماء|وريني|ورجي|فرجيني|عرفني|احكيلي|وين|كم|عدد).*(اجهز|جاهز|اغراض|ادوات|قطع)/,
      /(اجهز|جاهز|اغراض|ادوات|قطع).*(معروض|موجود|متاح|عالطاول|على الطاول|في المختبر|بالمختبر|هنا|معنا|قدام)/,
      /كم (جهاز|جاهز|اجهزه)/,
      /عدد.*(اجهز|جاهز|ادوات|اغراض)/,
      /^(?:شو|ايش|ما|ماهي|ما هي) (عنا|عندنا|في|موجود|معنا)(?: اجهز)?$/,
      /(?:شو|ايش|ما|ماهي|ما هي).*(?:علي|عال|في).*(?:طاول|مكتب|مختبر)/,
      /^(?:ال)?(اجهز|اجهزه|اغراض|ادوات)$/,
      /(what|which|how many|list).*(device|appliance|table|here)/
    ],
    concepts: [
      [['شو', 'ما', 'ماهي', 'ما هي', 'ايش', 'عرفني', 'احكيلي', 'كم', 'عدد', 'قائمه', 'اسماء', 'اذكر', 'وريني', 'ورجي', 'فرجيني', 'what', 'which', 'how many', 'list', 'show'], ['اجهز', 'اجهزه', 'الاجهزه', 'جهاز', 'جاهز', 'اغراض', 'ادوات', 'قطع', 'devices', 'appliances']],
      [['معروض', 'موجود', 'عالطاول', 'على الطاول', 'في المختبر', 'بالمختبر', 'متاح', 'display', 'table', 'here'], ['اجهز', 'اجهزه', 'جهاز', 'جاهز', 'اغراض', 'ادوات', 'devices']],
      [['كم جهاز', 'كم جاهز', 'عدد الاجهزه', 'شو الاجهزه', 'ايش الاجهزه', 'ما هي الاجهزه', 'ماهي الاجهزه', 'ما الاجهزه', 'شو في اجهزه', 'شو عنا اجهزه', 'شو عندنا اجهزه', 'اسماء الاجهزه', 'قائمه الاجهزه', 'شو المعروض', 'ايش المعروض', 'شو على الطاوله', 'ايش على الطاوله', 'شو في عالمكتب', 'شو في عالطاوله', 'شو في عالطاولة']]
    ],
    dynamic: 'list_devices',
    ar: 'الأجهزة المعروضة في مختبرنا هي أجهزة متنوعة للاستكشاف: بعضها بالبطارية الجافة وبعضها بكهرباء المنزل.',
    en: 'The devices displayed on the table are diverse appliances for exploration: some for battery and some for mains power.',
    examples: ['ما هي الأجهزة؟', 'شو الأجهزة المعروضة؟', 'كم جهاز موجود؟', 'what devices are here?']
  }
];

export function hint(s) {
  const activeIds = s?.devices ? Object.keys(s.devices) : Object.keys(DEVICE_MAP).slice(0, 4);
  const isAr = s?.language !== 'en';

  const uncompleted = activeIds.filter(id => !s.devices[id] || s.devices[id].status !== 'running');
  if (uncompleted.length === 0) {
    return bi(s,
      '🏆 توجيه شرارة: رائع ومبهر! لقد استكشفت جميع الأجهزة وعرفت ما يعمل بالبطارية وما يحتاج كهرباء المنزل. افتح الآن لوحة تقرير المحقق لتتويج نجاحك!',
      'All active devices have been discovered successfully! You can now view the Detective Report!'
    );
  }

  const targetDevId = uncompleted[0];
  const dev = DEVICE_MAP[targetDevId];
  const devName = (isAr ? deviceNames.ar[targetDevId] : deviceNames.en[targetDevId]) || targetDevId;

  if (dev.type === 'battery') {
    return bi(s,
      `💡 تلميح شرارة: جهاز «${devName}» مصمم ليكون خفيفاً ومحمولاً ويستهلك ${dev.watts}. اسحب البطارية الجافة إليه وشاهد ما سيحدث!`,
      `Hint: "${devName}" is lightweight and uses ${dev.watts}. Drag the dry battery to it to test!`
    );
  } else {
    return bi(s,
      `🔌 تلميح شرارة: جهاز «${devName}» يحتاج طاقة قوية تتعدى ${dev.watts}. اسحب قابس كهرباء المنزل 220V إليه لتشغيله بنجاح!`,
      `Hint: "${devName}" needs high power (${dev.watts}). Connect the 220V mains plug to power it!`
    );
  }
}

export function why(s, q, now) {
  const normQ = normalize(q);
  const named = deviceIn(normQ, s);
  const activeIds = Object.keys(s?.devices || {});
  const activeNames = (activeIds.length ? activeIds : Object.keys(DEVICE_MAP).slice(0, 4)).map(id => deviceNames[s?.language === 'en' ? 'en' : 'ar'][id] || id);
  const clarifyText = s?.language === 'en'
    ? `Do you mean ${activeNames.slice(0, 3).join(', ')}? Choose a device to understand what happened.`
    : (activeNames.length <= 3
        ? `تقصد ${activeNames.join(' أم ')}؟ اختر الجهاز لنفهم ما حدث.`
        : `تقصد ${activeNames.slice(0, 3).join(' أم ')}؟ اختر الجهاز لنفهم ما حدث.`);

  if (named.length > 1) return { text: clarifyText, clarify: true };
  const recent = s.lastRelevantEvent && now - s.lastRelevantEvent.time < config.contextMaxAgeMs;
  let d = named[0] || (recent ? (s.lastRelevantEvent.device || s.lastAttempt?.device) : null);
  if (!d) return { text: clarifyText, clarify: true };

  const st = s.devices[d] || { status: 'off' };
  const negative = /ما اشتغل|لم يعمل|لم تعمل|لا يعمل|متوقف|توقف|off|not work|طفت|طافي|خربان/.test(q);
  const meta = DEVICE_MAP[d];
  const devName = (s?.language === 'en' ? deviceNames.en[d] : deviceNames.ar[d]) || d;

  if (st.status === 'running') {
    return {
      text: negative
        ? bi(s, `${devName} يعمل الآن بنجاح وتصله الطاقة المناسبة.`, `${devName} is currently running with the proper power source.`)
        : bi(s, meta?.reason || `${devName} يعمل لأن مصدر الطاقة متصل بشكل سليم.`, meta?.reason || `${devName} is running because power is supplied.`),
      d
    };
  }

  // إذا لم نقم بأي تجربة على الجهاز وسأل لماذا تحرك / اشتغل (سؤال إيجابي عن جهاز متوقف لم يجرب)
  if (!negative && (s.attemptsByDevice?.[d] === 0 || !s.attemptsByDevice?.[d]) && !s.discoveredFacts?.includes(d + '_battery') && !s.discoveredFacts?.includes(d + '_mains')) {
    return {
      text: bi(s, `لم نسجل حركة أو تشغيلاً لجهاز ${devName} في تجربتنا بعد. جرّب توصيل مصدر الطاقة المناسب له أولاً!`, `We have not recorded an experiment for ${devName} yet. Try powering it first!`),
      d
    };
  }

  if (meta && (s.discoveredFacts.includes(d + '_incompatible') || (s.lastAttempt?.device === d && meta.type === 'mains')) && st.reason !== 'demo_stopped') {
    const wrongMsg = d === 'fridge'
      ? 'جرّبت البطارية مع الثلاجة، لكن هذه البطارية الصغيرة لا تناسب ثلاجة المنزل في تجربتنا. الثلاجة تعمل بالكهرباء لا بالبطارية.'
      : (meta.wrongReason || `جرّبت البطارية مع ${devName}، لكنها لم تعمل؛ لأن هذا الجهاز يحتاج لكهرباء المنزل الرئيسية 220V.`);
    return { text: bi(s, wrongMsg, `You tried the battery with ${devName}, but it did not work; this device needs 220V mains electricity.`), d };
  }

  if (st.reason === 'transferred') return { text: bi(s, `توقف ${devName} لأنك نقلت البطارية منه إلى جهاز آخر.`, `Device stopped because you transferred the battery to another device.`), d };
  if (st.reason === 'removed') return { text: msg(s, 'remove'), d };
  if (st.reason === 'demo_stopped') return { text: msg(s, 'stopMains'), d };

  const defaultExpl = meta
    ? (meta.type === 'mains'
        ? `${devName} يحتاج إلى كهرباء المنزل (220V) لأن قدرته المطلوبة (${meta.watts}) عالية ولا تكفيه البطارية الصغيرة. جرب توصيله بالفيشة!`
        : `${devName} مصمم ليعمل بالبطارية الجافة الآمنة (${meta.voltage}). جرب تركيب البطارية فيه!`)
    : 'لم يتصل بالجهاز مصدر مناسب بعد. اختر البطارية أو القابس ثم الجهاز وملاحظة النتيجة.';

  return { text: bi(s, defaultExpl, 'No suitable source has been connected yet. Choose the power source then the device.'), d };
}

export function answerQuestion(input, s, { now = Date.now(), repeat = 0, history = [] } = {}) {
  const q = normalize(input), actions = nextActions(s);
  let intent = 'fallback', text = bi(s, 'أساعدك هنا في مصادر الكهرباء والأجهزة. ماذا تريد أن تسألني يا بطل؟', 'I help with batteries and appliances. What would you like to ask?'), ref = null, confidence = .2;

  if (!q) {
    intent = 'empty';
    text = bi(s, 'ما سؤالك؟ يمكنك اختيار سؤال مقترح من الأسفل أو طلب تلميح.', 'What is your question? Choose a suggested question below or ask for a hint.');
  } else if (q.length > 400) {
    intent = 'long';
    text = bi(s, 'لنسأل سؤالاً قصيراً وواضحاً عن جهاز واحد لأساعدك بدقة.', 'Please ask a short question about one appliance.');
  } else {
    const namedDevices = deviceIn(q, s);
    const lastAssistantMsg = history?.filter?.(h => h.role === 'assistant').at(-1);
    const wasClarifying = lastAssistantMsg?.response?.intent === 'clarify';

    const matches = knowledge.filter(k => matchItem(k, q));
    const k = matches[0];

    if (k) {
      intent = k.id;
      confidence = .9;
      text = k[s.language === 'en' ? 'en' : 'ar'];
      if (k.actions) actions.splice(0, actions.length, ...k.actions);
      if (k.dynamic === 'hint') text = hint(s);
      if (k.dynamic === 'list_devices') {
        const activeIds = s?.devices ? Object.keys(s.devices) : (config.devices || Object.keys(DEVICE_MAP).slice(0, 4));
        if (s.language === 'en') {
          const names = activeIds.map(id => DEVICE_MAP[id]?.nameEn || deviceNames.en[id] || id);
          text = `The active appliances on our table right now (${activeIds.length} devices) are: ${names.join(', ')}. Some need the dry battery, and others need the 220V mains socket!`;
        } else {
          const names = activeIds.map(id => `«${DEVICE_MAP[id]?.name || deviceNames.ar[id] || id}»`);
          const formatted = names.length > 1
            ? names.slice(0, -1).join('، و') + '، و' + names[names.length - 1]
            : names[0] || 'الأجهزة المعروضة';
          text = `الأجهزة المعروضة أمامنا على الطاولة الآن (${activeIds.length} أجهزة) هي: ${formatted}. بعضها يعمل بالبطارية الجافة وبعضها الآخر يحتاج كهرباء المنزل. اختر بطارية 🔋 أو فيشة 🔌 وجرّب بنفسك!`;
        }
      }
      if (k.dynamic === 'where') {
        text = s.selectedDevice
          ? bi(s, `اختر البطارية ثم ${deviceNames.ar[s.selectedDevice] || s.selectedDevice}. سنركبها في حجرتها الصحيحة على الشاشة.`, `Choose the battery then ${deviceNames.en[s.selectedDevice] || s.selectedDevice}. We will place it in its bay.`)
          : bi(s, 'حدد الجهاز أولاً من الأجهزة المعروضة لنوجهك لمكان تركيبه.', 'Choose an active device first to guide you.');
      }
      if (k.dynamic === 'why') {
        const r = why(s, q, now);
        text = r.text;
        intent = r.clarify ? 'clarify' : k.id;
        confidence = r.clarify ? .4 : .92;
        ref = !r.clarify && s.lastRelevantEvent?.id || null;
      }
      if (k.dynamic === 'sound') {
        text = (s.devices.radio && s.devices.radio.status !== 'running')
          ? bi(s, 'الراديو متوقف الآن لأن البطارية غير متصلة به. جرّب تركيبها أولاً.', 'The radio is off because the battery is not connected.')
          : s.muted
          ? bi(s, 'الراديو يعمل، لكن الصوت مكتوم. يمكنك تفعيل الصوت عبر زر الصوت في الأعلى.', 'The radio is on, but master sound is muted. Enable it from the sound button.')
          : bi(s, 'الراديو يعمل بنجاح ويعزف نغمات موسيقية واضحة.', 'The radio is running and playing clear musical notes.');
        ref = s.lastRelevantEvent?.id || null;
      }
      const second = matches.find(x => x.id !== k.id && !['why', 'battery', 'chemistry'].includes(x.id) && !x.dynamic);
      if (second && /[؟?].+[؟?]| و(?:هل|ما|لماذا)| and /.test(q) && !['safety', 'restart'].includes(k.id)) {
        text += ' ' + second[s.language === 'en' ? 'en' : 'ar'];
      }
    } else if (namedDevices.length === 1) {
      const d = namedDevices[0];
      const r = why(s, wasClarifying ? ('لماذا لم يعمل ' + d) : ('لماذا ' + d), now);
      text = r.text;
      intent = wasClarifying ? 'why' : 'device_info';
      confidence = .9;
      ref = s.lastRelevantEvent?.id || null;
      if (validAction(s, { id: 'select_device', device: d })) {
        actions.unshift({ id: 'select_device', device: d });
      }
    }
  }

  if (repeat % 2 === 1 && !['empty', 'long', 'fallback', 'clarify'].includes(intent)) {
    text = bi(s, 'لننظر إليها بطريقة أخرى: ', 'Let us look at it another way: ') + text;
  }

  // اقتراح 3 أسئلة جاهزة عند انخفاض الثقة
  let suggestedQuestions = [];
  if (confidence < 0.6) {
    suggestedQuestions = [
      'ما هي الأجهزة المعروضة؟',
      'لماذا تختلف مصادر الكهرباء؟',
      'أريد تلميحاً للمساعدة'
    ];
  }

  return {
    intent,
    text,
    suggestedActions: actions.filter(a => validAction(s, a)).filter((a, i, arr) => arr.findIndex(b => JSON.stringify(a) === JSON.stringify(b)) === i).slice(0, 2),
    suggestedQuestions,
    referencedEventId: ref,
    stateRevision: s.revision,
    confidence
  };
}

// دالة المحادثة الخارجية (Optional Remote AI Integration - Disabled by default)
export async function askRemote(question, state, options = {}) {
  if (!options.enabled || !options.endpoint) {
    return answerQuestion(question, state);
  }
  try {
    const res = await fetch(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, devices: Object.keys(state.devices || {}) }),
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return { intent: 'remote', text: data.text, confidence: 0.95 };
    }
  } catch {}
  return answerQuestion(question, state);
}
