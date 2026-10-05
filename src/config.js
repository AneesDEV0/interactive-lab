// ═══════════════════════════════════════════════════════════════════════════
// src/config.js — بنك الأجهزة الـ 24 المطور والإعدادات والنصوص ثنائية اللغة
// دقة علمية لصف رابع ابتدائي، وتقديرات طاقة تقريبية (Watts)، وإرشادات سلامة
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_DEVICES = [
  // ─── 12 جهازاً يعمل بالبطارية الجافة (1.5V – 9V) ───
  {
    id: 'car',
    name: 'سيارة الأطفال اللعبة',
    nameEn: 'Toy Car',
    type: 'battery',
    icon: 'car',
    voltage: '3V (2xAA)',
    watts: '~2 واط تقريباً',
    safety: 'آمنة تماماً للأطفال وتعمل بجهد كهربائي منخفض.',
    reason: 'تعمل ببطاريات جافة آمنة للأطفال تسمح لها بالحركة على الأرض بحرية.',
    wrongReason: 'لا تحتاج كهرباء رئيسية قوية! وصلها بمقبس الجدار خطر عليها وتكفيها بطارية آمنة.'
  },
  {
    id: 'radio',
    name: 'الراديو المحمول الصغير',
    nameEn: 'Portable Radio',
    type: 'battery',
    icon: 'radio',
    voltage: '3V (2xAA)',
    watts: '~3 واط تقريباً',
    safety: 'محمول وآمن للاستخدام في الرحلات الخارجية.',
    reason: 'الراديو مصمم للتنقل في الرحلات لذلك يستمد طاقته من البطاريات الجافة.',
    wrongReason: 'هذا راديو محمول صغير، البطارية الجافة تكفيه تماماً ولا يحتاج تياراً كبيراً.'
  },
  {
    id: 'flashlight',
    name: 'كشاف الجيب (الشعلة)',
    nameEn: 'Flashlight',
    type: 'battery',
    icon: 'bolt',
    voltage: '1.5V (1xAA)',
    watts: '~1 واط تقريباً',
    safety: 'مصباح يدوي محمول آمن في حالات الطوارئ والظلام.',
    reason: 'يعتمد على البطارية الجافة ليعمل في أي مكان مظلم دون الحاجة لأسلاك.',
    wrongReason: 'كشاف الجيب مصمم ليكون محمولاً، الكهرباء الرئيسية تقيده والبطارية هي مصدره.'
  },
  {
    id: 'wallClock',
    name: 'ساعة الحائط الجدارية',
    nameEn: 'Wall Clock',
    type: 'battery',
    icon: 'refresh',
    voltage: '1.5V (1xAA)',
    watts: '~0.001 واط تقريباً',
    safety: 'استهلاك طاقة ضئيل جداً وآمن على الجدار.',
    reason: 'تعمل ببطارية جافة واحدة (AA) لتستمر بالحركة لأشهر طويلة على الحائط.',
    wrongReason: 'ساعة الحائط تستهلك طاقة ضئيلة جداً، يكفيها حجر بطارية واحد دون أسلاك.'
  },
  {
    id: 'remote',
    name: 'جهاز التحكم عن بُعد',
    nameEn: 'TV Remote',
    type: 'battery',
    icon: 'settings',
    voltage: '3V (2xAAA)',
    watts: '~0.1 واط تقريباً',
    safety: 'محمول وخفيف ويرسل إشارات ضوئية تحت حمراء آمنة.',
    reason: 'يعمل ببطاريتين جافتين صغيرتين (AAA) لسهولة حمله والتحكم بالشاشة.',
    wrongReason: 'ريموت التلفاز محمول في يدك، مقبس الجدار لا يناسبه إطلاقاً!'
  },
  {
    id: 'calculator',
    name: 'الآلة الحاسبة الإلكترونية',
    nameEn: 'Calculator',
    type: 'battery',
    icon: 'star',
    voltage: '1.5V (خلية زر)',
    watts: '~0.0005 واط تقريباً',
    safety: 'آمنة جداً وتعتمد على بطارية دقيقة أو خلية شمسية مساعدة.',
    reason: 'تستهلك طاقة ضئيلة جداً وتكفيها بطارية جافة دائرية صغيرة للعمل.',
    wrongReason: 'الآلة الحاسبة تكتفي بخلية بطارية جافة خفيفة ولا تحتاج تياراً مستمراً.'
  },
  {
    id: 'digitalScale',
    name: 'الميزان الرقمي المنزلي',
    nameEn: 'Digital Scale',
    type: 'battery',
    icon: 'check',
    voltage: '3V (2xAAA)',
    watts: '~0.2 واط تقريباً',
    safety: 'يوضع على الأرض بحرية دون أسلاك قد تسبب التعثر.',
    reason: 'يعمل ببطاريتين جافتين (AAA) ليتم وضعه ونقله على الأرضية بحرية دون أسلاك.',
    wrongReason: 'الميزان يحتاج إلى الأمان والحركة الحرة داخل الغرفة بدون سلك كهرباء.'
  },
  {
    id: 'smokeDetector',
    name: 'جهاز إنذار الدخان',
    nameEn: 'Smoke Detector',
    type: 'battery',
    icon: 'shield',
    voltage: '9V (بطارية مربعة)',
    watts: '~0.05 واط تقريباً',
    safety: 'جهاز حماية منزلي أساسي يجب فحصه دورياً.',
    reason: 'يعمل ببطارية جافة (9V) ليبقى متيقظاً وينبهنا حتى لو انقطعت كهرباء المنزل تماماً!',
    wrongReason: 'إنذار الدخان السقفي مصمم ليعمل بالبطارية لضمان الإنذار حتى في انقطاع التيار العام.'
  },
  {
    id: 'laserPointer',
    name: 'مؤشر الليزر التعليمي',
    nameEn: 'Laser Pointer',
    type: 'battery',
    icon: 'eye',
    voltage: '3V (2xLR44)',
    watts: '~0.02 واط تقريباً',
    safety: 'أداة تعليمية، تجنب توجيه الضوء نحو العين مباشرة.',
    reason: 'يستخدم بطاريات جافة دائرية صغيرة تتيح للمعلم التحرك والشرح بحرية.',
    wrongReason: 'مؤشر الليزر قلم محمول خفيف، والكهرباء الجدارية لا تناسبه.'
  },
  {
    id: 'hearingAid',
    name: 'سماعة الأذن الطبية',
    nameEn: 'Hearing Aid',
    type: 'battery',
    icon: 'volume',
    voltage: '1.4V (خلية زر)',
    watts: '~0.002 واط تقريباً',
    safety: 'جهاز طبي فائق الصغر والأمان داخل الأذن.',
    reason: 'تعتمد على بطارية جافة دقيقة كحبة العدس لتعمل طوال اليوم داخل الأذن بأمان.',
    wrongReason: 'السماعة الطبية توضع داخل الأذن، ولا يمكن وصلها بالكهرباء الرئيسية للأمان!'
  },
  {
    id: 'robotToy',
    name: 'روبوت الألعاب الذكي',
    nameEn: 'Toy Robot',
    type: 'battery',
    icon: 'bolt',
    voltage: '4.5V (3xAA)',
    watts: '~4 واط تقريباً',
    safety: 'لعبة أطفال متحركة بأصوات وأضواء آمنة.',
    reason: 'لعبة أطفال متحركة تعمل ببطاريات جافة آمنة لتدوير محركاته وإضاءة عينيه بحرية.',
    wrongReason: 'ألعاب الأطفال صُممت لتعمل بالبطاريات الجافة الآمنة، ووصلها بمقبس الجدار خطر عليها جداً!'
  },
  {
    id: 'electricToothbrush',
    name: 'فرشاة الأسنان الكهربائية',
    nameEn: 'Electric Toothbrush',
    type: 'battery',
    icon: 'refresh',
    voltage: '1.5V - 3V',
    watts: '~2 واط تقريباً',
    safety: 'مقبض عازل ومقاوم لرذاذ الماء للاستخدام الآمن بالحمام.',
    reason: 'تستخدم بطارية جافة داخل مقبضها العازل لتدوير رأس الفرشاة بأمان تام قرب الماء.',
    wrongReason: 'استخدام كهرباء المنزل قرب مياه الحمام خطر شديد؛ لذلك تعمل ببطارية جافة آمنة ومعزولة.'
  },

  // ─── 12 جهازاً يحتاج كهرباء المنزل الرئيسية (220V) ───
  {
    id: 'fridge',
    name: 'الثلاجة المنزلية',
    nameEn: 'Refrigerator',
    type: 'mains',
    icon: 'fridge',
    voltage: '220V',
    watts: '~200 واط تقريباً (مستمر)',
    safety: 'جهاز منزلي كبير، لا تلمس الأسلاك الخلفية واستعن ببالغ.',
    reason: 'تعمل بمحرك ضاغط تبريد قوي يتطلب تيار 220 فولت مستمر من المقبس الجداري.',
    wrongReason: 'البطارية الجافة ضعيفة جداً! الثلاجة تحتوي على ضاغط تبريد ضخم يحتاج كهرباء رئيسية مستمرة.'
  },
  {
    id: 'microwave',
    name: 'فرن الميكروويف',
    nameEn: 'Microwave Oven',
    type: 'mains',
    icon: 'home',
    voltage: '220V',
    watts: '~1200 واط تقريباً',
    safety: 'تسخين فائق السرعة، يتم تشغيله بمساعدة الكبار.',
    reason: 'يحتاج طاقة كهربائية عالية الجهد لتوليد حرارة فورية، ولا تكفيه البطارية الصغيرة.',
    wrongReason: 'الميكروويف يولد حرارة عالية جداً تتعدى 1000 واط، والبطارية الجافة تعجز عن ذلك تماماً!'
  },
  {
    id: 'washer',
    name: 'الغسالة الآلية',
    nameEn: 'Washing Machine',
    type: 'mains',
    icon: 'refresh',
    voltage: '220V',
    watts: '~2000 واط تقريباً',
    safety: 'تحتوي محركات ومضخات ماء قوية تتطلب مقبس جداري مؤرض.',
    reason: 'تحتوي محركاً عملاقاً لتدوير الملابس وسحب المياه، وطاقتها من الكهرباء الرئيسية.',
    wrongReason: 'الغسالة تدير محركاً كبيراً ومضخات ماء، والبطارية الصغيرة لا تملك هذه القوة الكهربائية.'
  },
  {
    id: 'airConditioner',
    name: 'مكيف الهواء المنزلي',
    nameEn: 'Air Conditioner',
    type: 'mains',
    icon: 'snow',
    voltage: '220V',
    watts: '~2500 واط تقريباً',
    safety: 'سحب تيار كهربائي عالٍ جداً يتطلب قاطع حماية خاص.',
    reason: 'يستهلك قدرة كهربائية هائلة لتبريد الغرفة بأكملها ويحتاج مقبساً رئيسياً.',
    wrongReason: 'مكيف الهواء يسحب طاقة كهربائية عالية جداً لا يمكن توفيرها إلا عبر كهرباء المنزل.'
  },
  {
    id: 'vacuum',
    name: 'المكنسة الكهربائية',
    nameEn: 'Vacuum Cleaner',
    type: 'mains',
    icon: 'play',
    voltage: '220V',
    watts: '~1600 واط تقريباً',
    safety: 'محرك شفط فائق السرعة، تأكد من سلامة السلك أثناء الحركة.',
    reason: 'تحتاج شفطاً هوائياً فائق القوة يستمد طاقته من سلك وقابس كهرباء المنزل.',
    wrongReason: 'محرك الشفط السريع يحتاج تياراً قوياً ومستمراً من مقبس الجدار.'
  },
  {
    id: 'lamp',
    name: 'مصباح المكتب السلكي',
    nameEn: 'Desk Lamp',
    type: 'mains',
    icon: 'bolt',
    voltage: '220V',
    watts: '~40 واط تقريباً',
    safety: 'موصول مباشرة بالجدار، تجنب لمس المصباح وهو ساخن.',
    reason: 'موصول بسلك وقابس مباشر في جدار الغرفة للإنارة الدائمة دون استبدال بطاريات.',
    wrongReason: 'هذا المصباح مكتبي سلكي يعمل مباشرة بكهرباء المنزل 220V ولا يحتوي حجرة بطاريات.'
  },
  {
    id: 'electricOven',
    name: 'الفرن الكهربائي المنزلي',
    nameEn: 'Electric Oven',
    type: 'mains',
    icon: 'home',
    voltage: '220V',
    watts: '~2400 واط تقريباً',
    safety: 'حرارة عالية لطهي الطعام، لا تلمس الأسطح الساخنة.',
    reason: 'يحتاج طاقة حرارية هائلة تتعدى 2000 واط لطهي الطعام، ولا تكفيه البطارية.',
    wrongReason: 'الفرن يسخن لدرجات حرارة شديدة لصنع الطعام، وهذا يتطلب تيار كهرباء المنزل القوي.'
  },
  {
    id: 'iron',
    name: 'مكواة الملابس البخارية',
    nameEn: 'Steam Iron',
    type: 'mains',
    icon: 'shield',
    voltage: '220V',
    watts: '~1800 واط تقريباً',
    safety: 'سطح تسخين معدني شديد السخونة، يتعامل معها شخص بالغ فقط.',
    reason: 'توليد حرارة شديدة لكيّ الأقمشة يتطلب تياراً كهربائياً قوياً من قابس الجدار.',
    wrongReason: 'سخان المكواة يحول طاقة كهربائية ضخمة إلى حرارة، والبطارية لا تستطيع تشغيله.'
  },
  {
    id: 'hairDryer',
    name: 'مجفف الشعر (الاستشوار)',
    nameEn: 'Hair Dryer',
    type: 'mains',
    icon: 'arrow',
    voltage: '220V',
    watts: '~1500 واط تقريباً',
    safety: 'يدمج بين مروحة وسخان، لا تستخدمه أبداً قرب حوض الاستحمام الممتلئ.',
    reason: 'يدمج بين محرك هواء سريع وسخان حراري جبار، ولا يعمل إلا بمقبس كهرباء المنزل.',
    wrongReason: 'الاستشوار يجمع بين الهواء الساخن والمروحة القوية، وهو بحاجة لكهرباء رئيسية.'
  },
  {
    id: 'electricWaterHeater',
    name: 'سخان الماء الكهربائي',
    nameEn: 'Water Heater',
    type: 'mains',
    icon: 'plus',
    voltage: '220V',
    watts: '~2000 واط تقريباً',
    safety: 'جهاز تسخين مياه مركزي متصل بشبكة المنزل بأمان وعزل تام.',
    reason: 'يقوم بتسخين عشرات اللترات من الماء بقضيب تسخين ضخم متصل بكهرباء المنزل.',
    wrongReason: 'تسخين كميات كبيرة من المياه يتطلب تياراً عالي الشدة من الشبكة الرئيسية.'
  },
  {
    id: 'electricHeater',
    name: 'المدفأة الكهربائية الحرارية',
    nameEn: 'Space Heater',
    type: 'mains',
    icon: 'plus',
    voltage: '220V',
    watts: '~2000 واط تقريباً',
    safety: 'تشع حرارة قوية، أبعد الأقمشة والستائر عنها دائماً.',
    reason: 'تحتوي قضبان تسخين تشع حرارة هائلة لتدفئة الغرفة، وتستهلك تيار 220 فولت ضخماً.',
    wrongReason: 'تدفئة الغرفة تحتاج طاقة حرارية جبارة لا يمكن لأي بطارية جافة صغيرة توفيرها إطلاقاً!'
  },
  {
    id: 'blender',
    name: 'خلاط العصائر المنزلي',
    nameEn: 'Kitchen Blender',
    type: 'mains',
    icon: 'refresh',
    voltage: '220V',
    watts: '~600 واط تقريباً',
    safety: 'شفرات حادة سريعة، تأكد من إغلاق الغطاء قبل التشغيل.',
    reason: 'يدير شفرات حادة فائقة السرعة لجرش الثلج والفواكه بقوة محرك كهربائي 220 فولت.',
    wrongReason: 'محرك الخلاط يحتاج عزم دوران هائل وسرعة فائقة من كهرباء المنزل لتقطيع وسحق الفواكه.'
  }
];

export const DEVICE_MAP = Object.fromEntries(ALL_DEVICES.map(d => [d.id, d]));

// ─── حقيبة الخلط المتوازنة (Fisher-Yates Shuffle Bag) ───
// تضمن عدم تكرار الأجهزة القريب واختيار جهازين بطارية وجهازين كهرباء منزلية
let batteryBag = [];
let mainsBag = [];

function refillBags() {
  const batteries = ALL_DEVICES.filter(d => d.type === 'battery').map(d => d.id);
  const mains = ALL_DEVICES.filter(d => d.type === 'mains').map(d => d.id);

  // خلط فيشر-ياتس
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  batteryBag = shuffle(batteries);
  mainsBag = shuffle(mains);
}

export function pickRandomDevices(count = 4) {
  const featured = ['car', 'radio', 'fridge'];
  const additionalPool = ALL_DEVICES
    .filter(d => d.id !== 'car' && d.id !== 'radio' && d.id !== 'fridge')
    .map(d => d.id);

  const remaining = Math.max(0, count - featured.length);
  const extra = [...additionalPool];
  for (let i = extra.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [extra[i], extra[j]] = [extra[j], extra[i]];
  }

  const chosen = [...featured, ...extra.slice(0, remaining)];
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  return chosen.slice(0, count);
}

export const config = {
  ageRange: [6, 9],
  defaultLanguage: 'ar',
  idleMs: 20000,
  contextMaxAgeMs: 120000,
  devices: pickRandomDevices(4)
};

export const deviceNames = {
  ar: Object.fromEntries(ALL_DEVICES.map(d => [d.id, d.name])),
  en: Object.fromEntries(ALL_DEVICES.map(d => [d.id, d.nameEn || d.name]))
};

export const copy = {
  ar: {
    brand: 'مختبر شرارة',
    tagline: 'متحري مصادر الكهرباء والأجهزة',
    title: 'من أين تأتي الطاقة؟',
    subtitle: 'أجهزة متنوعة، بطارية جافة وكهرباء منزل... جرّب واكتشف!',
    lab: 'مختبر البطاريات والأجهزة المتحرك',
    start: 'ابدأ الاكتشاف',
    welcome: 'أهلًا يا مستكشف العلوم!',
    intro: 'تفحص الأجهزة المعروضة! توقّع مصدر طاقة كل جهاز، ثم اسحب البطارية أو القابس للتحقق.',
    help: 'مساعدة',
    chat: 'اسأل شرارة',
    sound: 'الصوت',
    muted: 'الصوت مكتوم',
    reset: 'أجهزة جديدة',
    compare: 'دفتر اكتشافاتي',
    detectiveReport: 'لوحة تقرير المحقق',
    safety: 'نجرب هنا على الشاشة بأمان. كهرباء المنزل في الواقع يتعامل معها شخص بالغ.',
    battery: 'البطارية الجافة',
    pick: 'اختر البطارية',
    remove: 'استعد البطارية',
    mains: 'كهرباء المنزل 220V',
    demo: 'توصيل بكهرباء المنزل',
    stopDemo: 'فصل القابس الجداري',
    guide: 'اسحب البطارية أو القابس إلى أحد الأجهزة لتجربة تشغيله.',
    dropGuide: 'ضع البطارية في حجرة الجهاز المناسبة؛ أو صل القابس بمقبس الطاقة.',
    sourceNote: 'كل مصدر يزوّد الجهاز بالطاقة الكهربائية المناسبة لقدرته وتصميمه.',
    prediction: 'توقّعك العلمي: كيف يعمل هذا الجهاز؟',
    predictBattery: '🔋 بطارية جافة',
    predictMains: '🔌 كهرباء المنزل',
    yes: 'نعم',
    no: 'لا',
    skip: 'تخطَّ التوقع وجرّب مباشرة',
    now: 'الحالة الآن',
    running: 'يعمل بنجاح',
    off: 'متوقف',
    paused: 'متوقف مؤقتًا',
    discovered: 'ما اكتشفته',
    notYet: 'لم يُختبر بعد',
    batteryFits: 'عمل بالبطارية الجافة (آمن ومحمول)',
    fridgeFact: 'البطارية غير كافية (يحتاج تياراً كبيراً)',
    mainsFact: 'عمل بكهرباء المنزل 220V (قدرة عالية)',
    close: 'إغلاق',
    hint: 'تلميح المحقق',
    listen: 'استمع للتوجيه',
    stop: 'إيقاف الصوت',
    resetView: 'إعادة زاوية المشاهدة',
    inspect: 'تدوير وتفحص 3D',
    zoomIn: 'تقريب',
    zoomOut: 'إبعاد',
    cards: 'الأجهزة التفاعلية المعروضة',
    settings: 'إعدادات',
    motion: 'تقليل الحركة',
    language: 'اللغة',
    age: 'الفئة العمرية',
    send: 'أرسل',
    ask: 'اسأل شرارة عن أي جهاز أو تجربة…',
    chatInfo: 'مساعد ذكي مدعوم بقواعد علمية دقيقة لصف رابع ابتدائي.',
    challenge: 'تحدي المصادر',
    challengeIntro: 'اختر المصدر الذي أثبتت التجربة أنه يناسب كل جهاز.',
    explain: 'لماذا تختلف مصادر الكهرباء بين الأجهزة؟',
    explainGood: 'لأن لكل جهاز حاجة وقدرة من الطاقة تناسب تصميمه ووظيفته',
    explainBad: 'لأن حجم الجهاز وحده هو الذي يحدد مصدر الكهرباء دائماً',
    badge: 'مستكشف مصادر الطاقة',
    congrats: 'أحسنت الملاحظة والتجربة العلمية!',
    finish: 'عرض تقرير الجولة',
    next: 'الجولة التالية',
    confirm: 'نبدأ بأجهزة جديدة؟',
    confirmBody: 'سيتم اختيار 4 أجهزة عشوائية جديدة من بنك الأجهزة الـ 24 لتجربتها.',
    continue: 'متابعة جولتي',
    restart: 'أجهزة جديدة',
    tutorial: 'اسحب البطارية أو القابس إلى الجهاز، أو انقر المصدر ثم انقر الجهاز المستهدف.',
    tutorialTitle: 'كيف نختبر الأجهزة؟',
    doneTutorial: 'فهمت، لنبدأ!',
    skipTutorial: 'تخطَّ الشرح',
    robot: 'شرارة',
    robotRole: 'صديقك ومساعدك في المختبر',
    adultDemo: 'توصيل آمن بكهرباء المنزل الرئيسية يقوم به شرارة.',
    progress: 'اكتشافاتك',
    steps: ['أتوقّع', 'أجرّب', 'ألاحظ', 'أفسّر', 'أقارن'],
    power: 'جرّب التشغيل',
    door: 'افتح / أغلق الباب',
    cooling: 'تبريد يعمل ❄️',
    fallback: 'يمكنك تجربة النشاط بالبطاقات التفاعلية البديلة.',
    homeDrop: 'البطارية مكانها حجرة الجهاز المناسب.',
    symbolic: 'الأنيميشن ثلاثي الأبعاد يوضح سريان الطاقة؛ الكهرباء لا تُرى بالعين المجردة.',
    activity: 'التجربة',
    available: 'جاهز للاستكشاف',
    quitHint: 'سأكمل وحدي',
    powerMeterTitle: 'مقياس القدرة الكهربائية',
    powerMeterDesc: 'مقارنة بين قدرة البطارية الصغيرة وحاجة هذا الجهاز للطاقة:'
  },
  en: {
    brand: 'Sharara Lab',
    tagline: 'Energy Detective for Grade 4',
    title: 'Where Does Energy Come From?',
    subtitle: 'Various devices, dry battery and mains electricity... test and discover!',
    lab: '3D Moving Battery & Devices Lab',
    start: 'Start Exploring',
    welcome: 'Welcome, Science Explorer!',
    intro: 'Inspect the 4 devices! Predict their energy source, then drag the battery or plug to test.',
    help: 'Help',
    chat: 'Ask Sharara',
    sound: 'Sound',
    muted: 'Muted',
    reset: 'New Devices',
    compare: 'Discovery Log',
    detectiveReport: 'Detective Report',
    safety: 'We experiment safely here on screen. Real mains electricity requires an adult.',
    battery: 'Dry Cell Battery',
    pick: 'Pick Battery',
    remove: 'Return Battery',
    mains: 'Mains Electricity 220V',
    demo: 'Connect to Mains',
    stopDemo: 'Disconnect Mains',
    guide: 'Drag the battery or mains plug to a device to test powering it.',
    dropGuide: 'Place the battery in the correct compartment; or connect the mains plug.',
    sourceNote: 'Each power source provides the appropriate voltage and current for device design.',
    prediction: 'Scientific Prediction: How does this device run?',
    predictBattery: '🔋 Dry Battery',
    predictMains: '🔌 Mains 220V',
    yes: 'Yes',
    no: 'No',
    skip: 'Skip prediction and test directly',
    now: 'Current State',
    running: 'Running',
    off: 'Off',
    paused: 'Paused',
    discovered: 'What You Discovered',
    notYet: 'Not tested yet',
    batteryFits: 'Powered by Dry Battery (Safe & Portable)',
    fridgeFact: 'Battery is insufficient (Needs high power)',
    mainsFact: 'Powered by Mains Electricity 220V (High power)',
    close: 'Close',
    hint: 'Detective Hint',
    listen: 'Listen to Guide',
    stop: 'Stop Audio',
    resetView: 'Reset Camera View',
    inspect: '3D Rotate & Inspect',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    cards: 'Active Interactive Devices',
    settings: 'Settings',
    motion: 'Reduce Motion',
    language: 'Language',
    age: 'Age Range',
    send: 'Send',
    ask: 'Ask Sharara about any device or test…',
    chatInfo: 'Intelligent assistant with rules grounded in 4th grade curriculum.',
    challenge: 'Source Challenge',
    challengeIntro: 'Choose the energy source proven by your experiments for each device.',
    explain: 'Why do energy sources differ between devices?',
    explainGood: 'Because each device has a specific power demand matching its design and function',
    explainBad: 'Because device size alone always decides the energy source',
    badge: 'Energy Source Explorer',
    congrats: 'Outstanding scientific observation and testing!',
    finish: 'View Round Report',
    next: 'Next Round',
    confirm: 'Start with new devices?',
    confirmBody: '4 random devices from the 24-device bank will be selected.',
    continue: 'Continue My Round',
    restart: 'New Devices',
    tutorial: 'Drag the battery or plug to the device, or click the tool then click the device.',
    tutorialTitle: 'How to Test Devices?',
    doneTutorial: 'Got it, let us start!',
    skipTutorial: 'Skip Tutorial',
    robot: 'Sharara',
    robotRole: 'Your Lab Assistant Friend',
    adultDemo: 'Safe demonstration of mains connection performed by Sharara.',
    progress: 'Discoveries',
    steps: ['Predict', 'Test', 'Observe', 'Explain', 'Compare'],
    power: 'Try Powering',
    door: 'Open / Close Door',
    cooling: 'Cooling active ❄️',
    fallback: 'You can test the activity with 2D interactive cards.',
    homeDrop: 'Battery belongs to the appropriate device bay.',
    symbolic: '3D animations represent energy flow; electricity is not directly visible.',
    activity: 'Experiment',
    available: 'Ready for Exploration',
    quitHint: 'I will continue alone',
    powerMeterTitle: 'Power Demand Meter',
    powerMeterDesc: 'Comparison between battery power and device demand:'
  }
};

export const messages = {
  start: ['لنكتشف مصدر طاقة هذه الأجهزة! اختر البطارية أو القابس ثم اسحبه إلى أحد الأجهزة لبدء التجربة!', 'Let’s discover the power sources of these devices! Drag a source to test.'],
  select: ['اختر البطارية أو القابس ثم جرّبها مع هذا الجهاز.', 'Choose the battery or plug and try it with this device.'],
  pick: ['ضعها في مكان البطارية بالجهاز.', 'Place it in the device’s battery compartment.'],
  pickBattery: ['أمسكتَ بالبطارية الجافة! اسحبها وضعها فوق جهاز يعمل بالبطارية.', 'Picked dry battery! Drag and drop it onto a battery-compatible device.'],
  pickMains: ['أمسكتَ بقابس 220V! صِله بجهاز منزلي كبير يحتاج طاقة قوية.', 'Picked 220V plug! Connect it to a high-power household appliance.'],
  car: ['تحركت اللعبة! البطارية مناسبة لها.', 'The toy moved! This battery suits it.'],
  radio: ['اشتغل الراديو! حصل على الطاقة من البطارية.', 'The radio is on! The battery supplies its energy.'],
  fridge: ['هذه البطارية الصغيرة لا تناسب ثلاجة المنزل في تجربتنا. الثلاجة تعمل بالكهرباء لا بالبطارية.', 'This small battery does not meet the home refrigerator’s needs in our experiment.'],
  fridgeAgain: ['بقيت النتيجة نفسها. الثلاجة تحتاج كهرباء لا بالبطارية.', 'The result is the same. The refrigerator needs mains power, not battery.'],
  outside: ['لم تصل البطارية إلى مكانها بعد. جرّب قرب الجهاز أو اختره بالنقر.', 'The battery has not reached its place. Try nearer the device or click its name.'],
  cancel: ['عادت البطارية للصينية. يمكنك المحاولة مجددًا.', 'The battery is back in the tray. You can try again.'],
  remove: ['توقف الجهاز لأن مصدر طاقته انفصل.', 'The device stopped because its power source was removed.'],
  transfer: ['توقف الأول، ويعمل الثاني بالبطارية.', 'The first stopped; the second is now powered by the battery.'],
  repeat: ['أكدت ملاحظتك مرة أخرى!', 'You confirmed your observation!'],
  match: ['توقعك وافق ما شاهدناه! أحسنت الملاحظة.', 'Your prediction matched what we observed!'],
  different: ['كانت النتيجة مختلفة عن توقعنا. هذا اكتشاف علمي جديد!', 'The result was different from our prediction. A new discovery!'],
  mains: ['الآن تعمل الثلاجة بالمصدر المناسب لها. شرارة يعرض التوصيل افتراضيًا.', 'The refrigerator now has a suitable supply. Sharara demonstrates the connection virtually.'],
  stopMains: ['توقفت التغذية، فتوقف التشغيل.', 'The supply stopped, so the refrigerator stopped.'],
  needsPower: ['الجهاز يحتاج مصدرًا مناسبًا أولًا.', 'The device needs a suitable power source first.'],
  idle: ['هل تريد تلميحًا صغيرًا أو مساعدة من شرارة؟', 'Would you like a small hint?'],
  explored: ['اكتشفت أن كل جهاز يحتاج مصدرًا يناسبه. لنقارن!', 'You discovered that each device needs a suitable source. Let’s compare!'],
  quizWrong: ['تذكر ما حدث عندما جرّبت هذا الجهاز. يمكنك المحاولة مجددًا.', 'Remember what happened when you tried it. You can try again.'],
  quizRight: ['هذه هي النتيجة التي لاحظناها! إجابة صحيحة.', 'That matches what we observed!'],
  complete: ['أحسنت الملاحظة والتجربة! بطل العلوم.', 'Well observed and explored!'],
  asset: ['جهزنا شكلًا بديلًا؛ يمكنك متابعة التجربة.', 'A substitute model is ready; you can keep exploring.'],
  renderer: ['يمكنك تجربة النشاط بالبطاقات التفاعلية.', 'You can explore using the interactive device cards.'],
  chat: ['لنجرّب سؤالًا جاهزًا أو تلميحًا من شرارة.', 'Try a suggested question or a hint.'],
  audio: ['يمكنك قراءة الرسالة ومشاهدة الحركة.', 'You can read the message and watch the visual effects.'],
  homeDrop: ['البطارية مكانها حجرة الجهاز المناسب. عادت إلى الصينية.', 'The battery belongs in a suitable device compartment. It is back in the tray.'],
  batteryIncompatible: ['حاول مجدداً! هذا الجهاز يحتاج طاقة كهربائية عالية من مقبس 220V.', 'Try again! This device demands high power from a 220V wall socket.'],
  mainsIncompatible: ['انتبه يا بطل! هذا جهاز محمول خفيف صُمم ليعمل ببطارية جافة آمنة دون أسلاك.', 'Be careful! This portable device is designed for safe batteries.'],
  cancelDrag: ['أعدتَ المصدر إلى مكانه. اختر أداة وجرّب جهازاً آخر!', 'Power tool returned to tray. Pick a tool and try another device!'],
  dropOutside: ['لم تضع المصدر على أي جهاز. اسحبه وأفلته فوق الجهاز مباشرة.', 'Tool was dropped outside. Drag and drop directly onto a device.'],
  roundComplete: ['ألف مبارك! اكتشفتَ مصادر طاقة جميع الأجهزة في هذه الجولة بنجاح!', 'Congratulations! You successfully explored all devices in this round!']
};

export const msg = (s, key) => {
  const lang = (typeof s === 'object' ? s?.language : s) === 'en' ? 'en' : 'ar';
  const entry = messages[key];
  if (Array.isArray(entry)) {
    return lang === 'en' ? entry[1] : entry[0];
  }
  return key;
};

