import {config,deviceNames,msg,DEVICE_MAP} from './config.js';
import {nextActions,validAction} from './state.js';

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}+−\-?؟\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const synonyms = {
  car: ['سياره', 'عربيه', 'سيارة', 'car', 'toycar'],
  radio: ['راديو', 'مذياع', 'radio'],
  fridge: ['ثلاجه', 'تلاجه', 'براد', 'fridge', 'refrigerator'],
  flashlight: ['كشاف', 'شعله', 'مصباح يدوي', 'شعلة', 'flashlight', 'torch'],
  wallClock: ['ساعه جدار', 'ساعه حائط', 'ساعه', 'ساعة', 'clock', 'wallclock'],
  remote: ['ريموت', 'تحكم', 'ريموت تلفاز', 'remote'],
  calculator: ['حاسبه', 'اله حاسبه', 'حاسبة', 'calculator'],
  digitalScale: ['ميزان', 'وزن', 'scale'],
  smokeDetector: ['انذار دخان', 'كاشف دخان', 'دخان', 'انذار', 'smokedetector'],
  laserPointer: ['ليزر', 'مؤشر ليزر', 'قلم ليزر', 'laser'],
  hearingAid: ['سماعه اذن', 'سماعه طبيه', 'سماعه', 'سماعة', 'hearingaid'],
  robotToy: ['روبوت', 'لعبه روبوت', 'robot', 'robottoy'],
  electricToothbrush: ['فرشاه اسنان', 'فرشاه', 'فرشاة', 'toothbrush'],
  microwave: ['ميكروويف', 'مكرويف', 'مايكرويف', 'microwave'],
  washer: ['غساله', 'غسالة', 'washer', 'washingmachine'],
  airConditioner: ['مكيف', 'تكييف', 'سبلت', 'airconditioner', 'ac'],
  vacuum: ['مكنسه', 'مكنسة', 'شفاط', 'vacuum'],
  lamp: ['مصباح', 'لمبه', 'اباجوره', 'مصباح مكتب', 'lamp'],
  electricOven: ['فرن', 'فرن كهربائي', 'oven'],
  iron: ['مكواه', 'مكوايه', 'كوايه', 'مكواة', 'iron'],
  hairDryer: ['استشوار', 'سشوار', 'مجفف شعر', 'مجفف', 'hairdryer'],
  electricWaterHeater: ['سخان ماء', 'سخان', 'كويزر', 'بويلر', 'waterheater'],
  electricHeater: ['مدفاه', 'صوبه', 'دفايه', 'مدفأة', 'heater'],
  blender: ['خلاط', 'عصاره', 'خلاط فواكه', 'blender'],
  battery: ['بطاريه', 'حجر', 'بطارية', 'battery'],
  electricity: ['كهرباء', 'كهربا', 'electricity', 'مقبس', 'فيشه', 'فيشة', 'فيش']
};

const has = (q, words) => words.some(w => q.includes(w));

export const deviceIn = (q, s) => {
  const activeIds = s?.devices ? Object.keys(s.devices) : ['car', 'radio', 'fridge'];
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
    ar: 'نجرب هنا على الشاشة. اطلب مساعدة شخص بالغ، ولا تعبث بمقابس الكهرباء أو الأسلاك.',
    en: 'We experiment on screen. Ask an adult for help and do not play with sockets or wires.',
    examples: ['هل أجرب في البيت؟', 'هل ألمس المقبس؟', 'can I touch a socket?']
  },
  {
    id: 'recycle',
    patterns: [/مستعمل|التخلص|تخلص من|نرمي|ارمي|نفايات|وين (ارمي|احط).*بطاري|recycl|dispose/],
    concepts: [
      [['مستعمل', 'التخلص', 'تخلص من', 'نتخلص', 'نرمي', 'ارمي', 'نفايات', 'زبال', 'قمام', 'سله', 'تدوير', 'اعاده تدوير', 'dispose', 'recycle', 'throw'], ['بطاري', 'حجر', 'battery']]
    ],
    ar: 'أعط البطارية المستعملة لشخص بالغ ليجمعها أو يتخلص منها بالطريقة المناسبة. لا تفتحها.',
    en: 'Give used batteries to an adult for proper collection or disposal. Do not open them.',
    examples: ['ماذا أفعل بالبطارية المستعملة؟', 'أين أرمي الحجر؟', 'dispose of battery']
  },
  {
    id: 'charge',
    patterns: [/اشحن|شحن|charge/],
    concepts: [
      [['اشحن', 'شحن', 'شاحن', 'ينشحن', 'تنشحن', 'بنشحن', 'اعيد شحن', 'charge', 'recharge']]
    ],
    ar: 'البطارية العادية هنا غير قابلة للشحن. يُشحن فقط النوع المخصص للشحن بشاحنه المناسب، مع شخص بالغ.',
    en: 'This ordinary battery is not rechargeable. Only rechargeable types use their matching charger, with an adult.',
    examples: ['هل أشحن هذه البطارية؟', 'ممكن شحن الحجر؟', 'can I recharge?']
  },
  {
    id: 'large_battery',
    patterns: [/(ثلاج|تلاج|براد|fridge).*(كبير|رحلات|سياره|بطاري|حجر|battery)/, /(بطاري|battery).*(كبير|big).*(ثلاج|fridge)/, /(big|large|camping).*(battery|fridge)/],
    when: q => /كبير|رحلات|camp|big|large/.test(q),
    concepts: [
      [['كبير', 'ضخم', 'رحلات', 'camping', 'big', 'large'], ['ثلاج', 'تلاج', 'براد', 'fridge']],
      [['رحلات', 'camping']]
    ],
    ar: 'نعم، توجد ثلاجات رحلات وأنظمة مصممة لبطاريات مناسبة. هذا يختلف عن البطارية الصغيرة وثلاجة المنزل في نشاطنا.',
    en: 'Yes, camping refrigerators and suitable battery systems exist. They are different from this small battery and our home refrigerator.',
    examples: ['هل يمكن تشغيل ثلاجة ببطارية كبيرة؟', 'وثلاجات الرحلات؟', 'big battery for fridge']
  },
  {
    id: 'size',
    patterns: [/كل.*(صغير|كبير)|الحجم|size|all.*(small|big)/],
    concepts: [
      [['حجم', 'كل صغير', 'كل كبير', 'الحجم بيحدد', 'size', 'all small', 'all big']],
      [['صغير', 'كبير', 'small', 'big'], ['بطاري', 'كهرب', 'تغذي', 'جهاز', 'battery', 'device']]
    ],
    ar: 'الحجم وحده لا يحدد المصدر. تصميم الجهاز ومتطلباته يحددان التغذية المناسبة، وتوجد أجهزة كبيرة تعمل ببطاريات مناسبة.',
    en: 'Size alone does not decide the source. A device’s design and requirements matter; some large devices use suitable batteries.',
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
    ar: 'الراديو يستهلك الطاقة الكهربائية ويحوّل جزءًا منها إلى صوت. لا يصنع مصدر الكهرباء.',
    en: 'The radio uses electrical energy and converts some into sound. It does not produce its power supply.',
    examples: ['هل الراديو يصنع الكهرباء؟', 'هل المذياع يولد كهربا؟', 'does radio produce electricity?']
  },
  {
    id: 'together',
    patterns: [/معا|مع بعض|نفس الوقت|together|same time|الاثنين مع|التنتين مع|الجهازين مع/],
    concepts: [
      [['معا', 'مع بعض', 'سوا', 'بنفس الوقت', 'الاثنين', 'التنتين', 'الجهازين', 'together', 'same time', 'both'], ['شغل', 'اشغل', 'نشغل', 'اشتغل', 'شتغل', 'نفس الوقت', 'بطاري', 'سيار', 'راديو', 'جهاز']]
    ],
    ar: 'لدينا بطارية واحدة ننقلها بين الجهازين. عندما ننزعها من الأول يتوقف، ثم يمكن أن يعمل الثاني.',
    en: 'We have one battery to move between these devices. Removing it stops the first, then it can power the second.',
    examples: ['لماذا لا تعمل السيارة والراديو معًا؟', 'الجهازين بنفس الوقت؟', 'why not together?']
  },
  {
    id: 'remove',
    patterns: [/نزع|ازال|فصل البطاري|شيل|(?:^|\s)شلت(?:\s|$)|remove|disconnect.*battery/],
    concepts: [
      [['نزع', 'ازال', 'شلت', 'شيل', 'فكيت', 'فك', 'فصل', 'قطعت', 'remove', 'disconnect', 'take off'], ['بطاري', 'حجر', 'سلك', 'توقف', 'وقفت', 'طفى', 'طفت', 'battery']]
    ],
    ar: 'عند نزع البطارية ينقطع مصدر الطاقة عن الدائرة، فيتوقف الجهاز. يمكن إعادة تركيبها في حجرتها.',
    en: 'Removing the battery breaks the circuit’s power supply, so the device stops. You can put it back in its compartment.',
    examples: ['لماذا تتوقف السيارة عند نزع البطارية؟', 'إذا شلت الحجر؟', 'remove the battery']
  },
  {
    id: 'depletion',
    patterns: [/تفرغ|تنفد|نفاد|empty|run out|تفضى|فضيت|(بطاري|حجر|طاق|شحن).*(خلص|تخلص)|(خلص|تخلص).*(بطاري|حجر|طاق|شحن)/],
    concepts: [
      [['تفرغ', 'تخلص', 'تنفد', 'تفضى', 'فضيت', 'خلصت', 'تنتهي', 'نفاد', 'تموت', 'عمر', 'بتضل شغال', 'بتخلص', 'بتفضي', 'فاضيه', 'خالصه', 'run out', 'empty', 'deplet', 'drain', 'die'], ['بطاري', 'حجر', 'طاق', 'شحن', 'battery']]
    ],
    ar: 'طاقة البطارية محدودة وقد تنفد مع الاستخدام. في نشاطنا لا نحاكي نفادها، فلا نفسر التوقف بأنها فرغت.',
    en: 'A battery has limited energy that can run out with use. This activity does not simulate depletion.',
    examples: ['هل البطارية تفرغ؟', 'هل طاقتها تنفد؟', 'can it run out?']
  },
  {
    id: 'poles',
    patterns: [/قطب|علامت|موجب|سالب|\+|−|-|poles|positive|negative|عكست.*بطاري|قلبت.*بطاري|بالمقلوب/],
    concepts: [
      [['قطب', 'قطبين', 'موجب', 'سالب', 'زائد', 'ناقص', '+', '−', '-', 'علامت', 'عكست', 'قلبت', 'بالمقلوب', 'وجهين', 'طرفين', 'طرفي', 'pole', 'positive', 'negative', 'terminal']]
    ],
    ar: 'علامتا + و− تدلان على قطبي البطارية. في المحاكاة نركبها حسب علامات الحجرة، حتى يكتمل اتصال القطبين.',
    en: 'The + and − symbols mark the two battery terminals. The simulation matches the compartment markings to connect both terminals.',
    examples: ['ما علامتا + و−؟', 'ما معنى موجب وسالب؟', 'battery poles']
  },
  {
    id: 'visible',
    patterns: [/تري|نراها|نري|نشوف|شايف|بنشوف|نجوم|خطوط|visible|see electricity|لون.*كهرب|شكل.*كهرب/],
    concepts: [
      [['نشوف', 'اشوف', 'نري', 'نراها', 'شايف', 'بنشوف', 'مرئي', 'تري', 'عين', 'لون', 'شكل', 'شرار', 'خطوط', 'نجوم', 'see', 'visible', 'look'], ['كهرب', 'تيار', 'شحن', 'طاق', 'electricity', 'current']]
    ],
    ar: 'لا نرى الكهرباء مباشرة، لكن نلاحظ أثرها كالحركة والصوت والتبريد. الخطوط في النشاط تمثيل تعليمي.',
    en: 'We do not see electricity directly; we observe movement, sound and cooling. The lines here are teaching symbols.',
    examples: ['هل الكهرباء تُرى؟', 'هل نشوف كهربا؟', 'can we see electricity?']
  },
  {
    id: 'generation',
    patterns: [/من اين.*(كهرب|تيار)|من وين.*(كهرب|تيار)|كيف.*(كهرب|تيار)|(كهرب|تيار).*(من اين|من وين|كيف|بتيجي|تاتي|توصل)|توليد.*كهرب|مصدر.*كهرب|where.*electricity.*come|how.*electricity.*(get|reach|home)/],
    concepts: [
      [['كيف', 'من وين', 'من اين', 'وين', 'شو مصدر', 'ايش مصدر', 'مصدر', 'توليد', 'انتاج', 'بتيجي', 'تاتي', 'توصل', 'تصل', 'بتدخل', 'تدخل', 'نجيب', 'where', 'how', 'source', 'generate', 'produce'], ['كهرب', 'تيار', 'شبك', 'power', 'electric']]
    ],
    ar: 'تُولّد الكهرباء بطرق مختلفة، منها الشمس والرياح وطرق أخرى، وتنقلها الشبكة إلى المنازل.',
    en: 'Electricity is generated in several ways, including sunlight and wind, and the grid carries it to homes.',
    examples: ['من أين تأتي كهرباء المنزل؟', 'من وين الكهربا؟', 'where does electricity come from?']
  },
  {
    id: 'sockets',
    patterns: [/كل.*(مقبس|فيش)|محول|all.*socket|adapter/],
    concepts: [
      [['كل', 'ليش مش كل', 'ليش ما', 'محول', 'ادابتر', 'adapter'], ['مقبس', 'فيش', 'بريز', 'socket']]
    ],
    ar: 'لكل جهاز تغذية تناسب تصميمه. بعض الأجهزة تحتاج محولًا مخصصًا؛ لا نجرّب توصيلات حقيقية هنا.',
    en: 'Each device needs a supply suited to its design. Some need a dedicated adapter. We use virtual connections here.',
    examples: ['لماذا لا تشتغل كل الأجهزة من المقبس؟', 'هل تحتاج محول؟', 'why not all use sockets?']
  },
  {
    id: 'better',
    patterns: [/افضل|احسن|اقوى|better|best|stronger/],
    concepts: [
      [['افضل', 'احسن', 'اقوي', 'مين احسن', 'مين افضل', 'مين اقوى', 'better', 'best', 'stronger'], ['بطاري', 'حجر', 'كهرب', 'فيش', 'مقبس', 'منزل', 'بيت', 'mains', 'battery']]
    ],
    ar: 'يعتمد على الجهاز والحاجة. البطارية مفيدة للحركة، وكهرباء المنزل مناسبة لأجهزة معينة.',
    en: 'It depends on the device and the need. Batteries are portable; household power suits certain devices.',
    examples: ['أيهما أفضل؟', 'البطارية أحسن؟', 'which is better?']
  },
  {
    id: 'difference',
    patterns: [/الداخلي|الفرق|فرق بين|شو الفرق|ايش الفرق|difference/],
    concepts: [
      [['فرق', 'شو الفرق', 'ايش الفرق', 'بيختلف', 'مقارن', 'difference', 'compare', 'داخلي']]
    ],
    ar: 'نقول «كهرباء المنزل». البطارية وكهرباء المنزل كلاهما يزوّد الأجهزة بالطاقة الكهربائية، لكن التغذية ومتطلبات الأجهزة تختلف.',
    en: 'We call it household electricity. Both a battery and the household supply provide electrical energy, with different supply characteristics and device needs.',
    examples: ['ما الفرق بين البطارية والكهرباء الداخلية؟', 'الكهرباء الداخلية؟', 'what is the difference?']
  },
  {
    id: 'dry',
    patterns: [/جاف|dry/],
    concepts: [
      [['جاف', 'جافه', 'dry'], ['بطاري', 'حجر', 'خليه', 'battery', 'cell']]
    ],
    ar: 'البطارية الجافة مصدر صغير محمول للطاقة. كلمة «جافة» لا تعني أنها بلا مواد كيميائية.',
    en: 'A dry cell is a small portable energy source. “Dry” does not mean it contains no chemicals.',
    examples: ['ما البطارية الجافة؟', 'يعني إيه جافة؟', 'what is a dry cell?']
  },
  {
    id: 'chemistry',
    patterns: [/(بطاري|حجر|battery).*(فيها|تخزن|طاق|كهرب|electric|energy)|طاقه كيميائيه/],
    concepts: [
      [['جوا', 'جوه', 'جوات', 'داخل', 'تخزن', 'مخزن', 'طاق', 'مواد', 'مكون', 'تركيب', 'من شو مصنوع', 'كيميائ', 'store', 'inside', 'chemical', 'contain'], ['بطاري', 'حجر', 'battery']]
    ],
    ar: 'تخزن البطارية طاقة كيميائية تتحول إلى طاقة كهربائية عند تشغيل دائرة مناسبة.',
    en: 'A battery stores chemical energy, which becomes electrical energy in a suitable operating circuit.',
    examples: ['هل البطارية فيها كهرباء؟', 'هل الحجر يخزن طاقة؟', 'does a battery have electricity?']
  },
  {
    id: 'mains',
    patterns: [/ما.*كهرب.*(منزل|بيت)|شو.*كهرب.*(منزل|بيت)|يعني ايه.*كهرب.*(منزل|بيت)|what.*(household|mains)/],
    concepts: [
      [['ما', 'شو', 'ايش', 'يعني', 'عرف', 'what is', 'what'], ['كهرباء المنزل', 'كهربا البيت', 'كهرباء الشبكه', 'household electricity', 'mains electricity']]
    ],
    ar: 'كهرباء المنزل تغذية تصل عبر شبكة الكهرباء. في تجربتنا يعرض الروبوت البالغ تشغيل الثلاجة بهذا المصدر.',
    en: 'Household electricity is supplied through the power grid. Our adult robot demonstrates it powering the refrigerator.',
    examples: ['ما كهرباء المنزل؟', 'ما هي كهربا البيت؟', 'what is mains electricity?']
  },
  {
    id: 'failed',
    patterns: [/فشل|غبي|غلطت|fail|stupid|خربت/],
    concepts: [
      [['فشل', 'غبي', 'غلطت', 'انا غلطت', 'خربت', 'انا السبب', 'fail', 'stupid', 'mistake', 'wrong']]
    ],
    ar: 'هذه نتيجة مفيدة! عندما لا يناسب المصدر الجهاز نتعلم شيئًا جديدًا. المحاولة ليست فشلًا شخصيًا.',
    en: 'This is a useful result! Finding that a source does not suit a device teaches us something new.',
    examples: ['هل فشلت التجربة؟', 'أنا غلطت؟', 'did I fail?']
  },
  {
    id: 'drag',
    patterns: [/اسحب|السحب|drag|كيف احرك|تحريك/],
    concepts: [
      [['اسحب', 'سحب', 'تحريك', 'انقل', 'مش عارف اسحب', 'كيف احرك', 'drag', 'move', 'how to drag']]
    ],
    ar: 'اختر البطارية وحرّكها قرب الجهاز. أو انقر البطارية ثم اسم الجهاز؛ الطريقتان تنجزان التجربة نفسها.',
    en: 'Choose the battery and move it near a device, or click the battery then the device name. Both work.',
    examples: ['كيف أسحب؟', 'السحب صعب', 'how to drag?']
  },
  {
    id: 'restart',
    patterns: [/اعاده|اعيد|من جديد|restart|reset|تصفير|نلعب كمان/],
    concepts: [
      [['اعاده', 'اعيد', 'من جديد', 'تصفير', 'صفر', 'نلعب كمان مره', 'من الاول', 'restart', 'reset', 'start over']]
    ],
    ar: 'يمكننا البدء من جديد. سيطلب المختبر تأكيدك قبل مسح اكتشافات هذه الجولة.',
    en: 'We can start again. The lab will ask you before clearing this round’s discoveries.',
    actions: [{id: 'restart'}],
    examples: ['أريد إعادة اللعب', 'نبدأ من جديد', 'restart please']
  },
  {
    id: 'solution',
    patterns: [/الحل|اشرح مباشره|اعطني الجواب|اعطيني الحل|solution|answer directly/],
    concepts: [
      [['الحل', 'اشرح مباشره', 'اعطني الجواب', 'اعطيني الحل', 'شو النتيجه', 'احكيلي الجواب', 'solution', 'give me answer', 'answer directly']]
    ],
    ar: 'في تجربتنا تعمل سيارة اللعبة والراديو ببطاريتنا المناسبة لهما. الثلاجة تحتاج كهرباء المنزل؛ الحجم وحده لا يحدد ذلك.',
    en: 'In our activity, the toy car and radio work with our suitable battery. The home refrigerator needs household electricity. Size alone does not determine this.',
    examples: ['أريد الحل', 'اشرح مباشرة', 'give me the solution']
  },
  {
    id: 'hint',
    patterns: [/تلميح|ساعد|hint|help/],
    concepts: [
      [['تلميح', 'ساعدني', 'ساعد', 'دلني', 'hint', 'help']]
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
    ar: 'نجرّب مصادر الطاقة للأجهزة، ونلاحظ أي مصدر يناسب كل جهاز. توقعك بداية، والتجربة تساعدنا على الفهم.',
    en: 'We try power sources for devices and observe which one suits each. Predictions begin our exploration; experiments help us understand.',
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
    ar: 'البطارية مصدر محمول للطاقة الكهربائية. تخزن طاقة كيميائية تتحول إلى كهرباء في دائرة مناسبة.',
    en: 'A battery is a portable source of electrical energy. Its stored chemical energy is converted in a suitable circuit.',
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
  const activeIds = s?.devices ? Object.keys(s.devices) : ['car', 'radio', 'fridge'];
  const explored = s?.exploredDevices || [];
  const discovered = s?.discoveredFacts || [];
  const isAr = s?.language !== 'en';

  if (explored.length === 0) {
    if (s?.hintLevel < 2) {
      return bi(s,
        '🔍 توجيه شرارة: انظر إلى الأجهزة الثلاثة. أي جهاز تتوقع أن تستطيع حمله وتشغيله بعيدًا عن المنزل؟ اختر البطارية وجرّب توقعك!',
        'Look at the devices. Which might you carry and use away from home? Try your prediction.'
      );
    }
    return bi(s,
      '🔍 توجيه شرارة: اختر البطارية ثم ضعها في سيارة اللعبة أو الراديو لنبدأ الاستكشاف والملاحظة معاً!',
      'Choose the battery, then place it in the car or radio to begin our experiment.'
    );
  }

  const mainsDev = activeIds.find(id => DEVICE_MAP[id]?.type === 'mains') || 'fridge';
  if ((discovered.includes(mainsDev + '_incompatible') || discovered.includes('fridge_incompatible')) && !discovered.includes(mainsDev + '_mains') && !discovered.includes('fridge_mains')) {
    return bi(s,
      '🔌 توجيه شرارة: لاحظنا أن البطارية الصغيرة لا تكفي لتشغيل الثلاجة! جرّب الآن مشاهدة عرض شرارة على لوحة كهرباء المنزل لتشاهد مصدرها الحقيقي.',
      'Try Sharara’s demonstration on the household electricity panel to see the refrigerator run on mains power.'
    );
  }

  const unexplored = activeIds.filter(id => !explored.includes(id));
  if (unexplored.length > 0) {
    const nextDev = unexplored[0];
    const nextName = (isAr ? deviceNames.ar[nextDev] : deviceNames.en[nextDev]) || nextDev;
    const isMains = DEVICE_MAP[nextDev]?.type === 'mains';
    return bi(s,
      `💡 توجيه شرارة: أحسنت في استكشاف الأجهزة السابقة! حان دور «${nextName}». ${isMains ? 'هل تتوقع أن تكفيه بطاريتنا الصغيرة أم يحتاج كهرباء المنزل؟ جرّب وضعه عليه!' : 'اختر البطارية وجرب تركيبها فيه ولاحظ مكان القطبين.'}`,
      `Choose the battery, then try "${nextName}". Observe its compartment and power source.`
    );
  }

  return bi(s,
    '🏆 توجيه شرارة: رائع ومبهر! لقد استكشفت جميع الأجهزة وعرفت ما يعمل بالبطارية وما يحتاج كهرباء المنزل. افتح الآن جدول المقارنة أو ابدأ الاختبار لتتويج نجاحك!',
    'The car and radio are designed for this battery. The refrigerator needs household electricity. You can open the comparison or quiz now!'
  );
}

export function why(s, q, now) {
  const normQ = normalize(q);
  const named = deviceIn(normQ, s);
  const activeIds = Object.keys(s?.devices || {});
  const activeNames = (activeIds.length ? activeIds : ['car', 'radio', 'fridge']).map(id => deviceNames[s?.language === 'en' ? 'en' : 'ar'][id] || id);
  const clarifyText = s?.language === 'en'
    ? `Do you mean ${activeNames.slice(0, 3).join(', ')}? Choose a device to understand what happened.`
    : (activeNames.length <= 3
        ? `تقصد ${activeNames.join(' أم ')}؟ اختر الجهاز لنفهم ما حدث.`
        : `تقصد ${activeNames.slice(0, 3).join(' أم ')}؟ اختر الجهاز لنفهم ما حدث.`);

  if (named.length > 1) return {text: clarifyText, clarify: true};
  const recent = s.lastRelevantEvent && now - s.lastRelevantEvent.time < config.contextMaxAgeMs;
  let d = named[0] || (recent ? (s.lastRelevantEvent.device || s.lastAttempt?.device) : null);
  if (!d) return {text: clarifyText, clarify: true};

  const st = s.devices[d] || {status: 'off'};
  const negative = /ما اشتغل|لم يعمل|لم تعمل|لا يعمل|متوقف|توقف|off|not work/.test(q);
  const meta = DEVICE_MAP[d];
  const devName = (s?.language === 'en' ? deviceNames.en[d] : deviceNames.ar[d]) || d;

  if (st.status === 'running') {
    return {
      text: negative
        ? bi(s, `${devName} يعمل الآن. ${st.source === 'mains' || d === 'fridge' ? 'مصدره كهرباء المنزل، ويظهر مؤشر التبريد.' : 'البطارية متصلة بقطبي الحجرة وتزوّده بالطاقة.'}`,
                `${devName} is running now. ${st.source === 'mains' || d === 'fridge' ? 'It uses household power and shows a cooling indicator.' : 'The battery is connected at both terminals and supplies energy.'}`)
        : bi(s, d === 'car' ? 'الكهرباء من البطارية شغّلت محرك سيارة اللعبة. لهذا شاهدنا حركتها. 💡 جرّب الآن نقل البطارية إلى الراديو لنسمع صوته!' : d === 'radio' ? 'هذا الراديو المحمول مصمم لهذه البطارية المناسبة؛ حوّل جزءًا من طاقتها إلى صوت.' : (meta?.reason || 'الثلاجة تعمل لأن التغذية من شبكة المنزل تناسب متطلباتها.'),
                d === 'car' ? 'Electrical energy from the battery powers the toy’s motor. That is why it moves.' : d === 'radio' ? 'This portable radio is designed for this suitable battery and converts some of its energy into sound.' : (meta?.reason || 'The refrigerator runs because household power meets its requirements.')),
      d
    };
  }

  if (d === 'fridge' && s.discoveredFacts.includes('fridge_incompatible') && st.reason !== 'demo_stopped') {
    return {text: bi(s, 'جرّبت البطارية مع الثلاجة، لكنها لم تعمل بها. هذه البطارية الصغيرة لا توفر التغذية التي تحتاجها ثلاجة المنزل في تجربتنا. 💡 يمكنك الآن الضغط على عرض كهرباء المنزل لتشاهد كيف تعمل بأمان عبر شبكة المنزل!', 'You tried the battery with the refrigerator, but it did not power it. This small battery does not provide the supply our home refrigerator needs.'), d};
  }

  if (st.reason === 'transferred') return {text: bi(s, 'توقف الجهاز لأنك نقلت البطارية منه. بقي اكتشافك محفوظًا؛ يمكنك إعادة البطارية إلى حجرته.', 'It stopped because you moved the battery away. Your discovery is saved; you can return the battery to its compartment.'), d};
  if (st.reason === 'removed') return {text: msg(s, 'remove'), d};
  if (st.reason === 'demo_stopped') return {text: msg(s, 'stopMains'), d};

  if (meta && (s.discoveredFacts.includes(d + '_incompatible') || (s.lastAttempt?.device === d && meta.type === 'mains')) && st.reason !== 'demo_stopped') {
    const wrongMsg = meta.wrongReason || `جرّبت البطارية مع ${devName}، لكنها لم تعمل؛ لأن هذا الجهاز يحتاج لكهرباء المنزل الرئيسية.`;
    return {text: bi(s, wrongMsg, `You tried the battery with ${devName}, but it did not work; this device needs household electricity.`), d};
  }
  if (/لماذا|ليه|why/.test(q) && named.length && /تحرك|اشتغل|تعمل|عملت/.test(q) && !negative) {
    return {text: bi(s, 'لم نسجل هذه التجربة بعد. تتوقع ماذا سيحدث؟ يمكنك التجربة ثم نلاحظ معًا.', 'We have not recorded that experiment yet. What do you predict? Try it and we can observe together.'), d};
  }

  const defaultExpl = meta
    ? (meta.type === 'mains'
        ? `${devName} يحتاج إلى كهرباء المنزل (220V) لأن طاقته المطلوبة عالية ولا تكفيه البطارية الصغيرة. جرب توصيله بالفيشة!`
        : `${devName} مصمم ليعمل بالبطارية الجافة الآمنة. جرب تركيب البطارية فيه!`)
    : 'لم يتصل بالجهاز مصدر مناسب بعد. يمكنك اختيار البطارية ثم الجهاز وملاحظة النتيجة.';

  return {text: bi(s, defaultExpl, 'No suitable source has been connected yet. Choose the power source then the device and observe the result.'), d};
}

export function answerQuestion(input, s, {now = Date.now(), repeat = 0, history = []} = {}) {
  const q = normalize(input), actions = nextActions(s);
  let intent = 'fallback', text = bi(s, 'أساعدك هنا في البطاريات والأجهزة. ماذا تريد أن تعرف عنها؟', 'I help with batteries and devices here. What would you like to know about them?'), ref = null, confidence = .2;

  if (!q) {
    intent = 'empty';
    text = bi(s, 'ما سؤالك؟ يمكنك اختيار سؤال جاهز أو طلب تلميح.', 'What is your question? Choose a suggested question or ask for a hint.');
  } else if (q.length > 400) {
    intent = 'long';
    text = bi(s, 'لنسأل سؤالًا قصيرًا عن جهاز واحد، حتى أساعدك بوضوح.', 'Please ask a short question about one device so I can help clearly.');
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
        const activeIds = s?.devices ? Object.keys(s.devices) : (config.devices || ['car', 'radio', 'fridge']);
        if (s.language === 'en') {
          const names = activeIds.map(id => DEVICE_MAP[id]?.id || deviceNames.en[id] || id);
          text = `The active appliances on our table right now (${activeIds.length} devices) are: ${names.join(', ')}. Some need the dry battery, and others need the mains socket!`;
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
          ? bi(s, `اختر البطارية ثم ${deviceNames.ar[s.selectedDevice] || s.selectedDevice}. سنجرّب تركيبها في مكانها الصحيح على الشاشة.`, `Choose the battery then ${deviceNames.en[s.selectedDevice] || s.selectedDevice}. We will try it in its proper place on screen.`)
          : bi(s, 'تقصد السيارة أم الراديو أم الثلاجة؟ اختر الجهاز أولًا.', 'Do you mean the car, radio or refrigerator? Choose a device first.');
      }
      if (k.dynamic === 'why') {
        const r = why(s, q, now);
        text = r.text;
        intent = r.clarify ? 'clarify' : k.id;
        confidence = r.clarify ? .4 : .92;
        ref = !r.clarify && s.lastRelevantEvent?.id || null;
      }
      if (k.dynamic === 'sound') {
        text = (s.devices.radio?.status !== 'running')
          ? bi(s, 'الراديو متوقف الآن لأن البطارية غير متصلة به. جرّب تركيبها أولًا.', 'The radio is off because the battery is not connected. Try placing it first.')
          : s.muted
          ? bi(s, 'الراديو يعمل، لكن الصوت مكتوم. الموجات المرئية تؤكد تشغيله؛ يمكنك تفعيل الصوت.', 'The radio is running, but sound is muted. The visible waves show it is on; you can enable sound.')
          : bi(s, 'الراديو يعمل ويعزف مقطعًا قصيرًا فقط. الموجات كافية للملاحظة؛ يمكنك إعادة تشغيل المقطع بزر الاستماع للراديو.', 'The radio is running and plays only a short tune. Its visible waves are enough to observe; use the radio replay button to hear it again.');
        ref = s.lastRelevantEvent?.id || null;
      }
      const second = matches.find(x => x.id !== k.id && !['why', 'battery', 'chemistry'].includes(x.id) && !x.dynamic);
      if (second && /[؟?].+[؟?]| و(?:هل|ما|لماذا)| and /.test(q) && !['safety', 'restart'].includes(k.id)) {
        text += ' ' + second[s.language === 'en' ? 'en' : 'ar'];
      }
    } else if (namedDevices.length === 1) {
      // The student answered with a single device name (or responded to clarification or asked about a device)
      const d = namedDevices[0];
      const r = why(s, wasClarifying ? ('لماذا لم يعمل ' + d) : ('لماذا ' + d), now);
      text = r.text;
      intent = wasClarifying ? 'why' : 'device_info';
      confidence = .9;
      ref = s.lastRelevantEvent?.id || null;
      if (validAction(s, {id: 'select_device', device: d})) {
        actions.unshift({id: 'select_device', device: d});
      }
    }
  }

  if (repeat % 2 === 1 && !['empty', 'long', 'fallback', 'clarify'].includes(intent)) {
    text = bi(s, 'لننظر إليها بطريقة أخرى: ', 'Let’s look at it another way: ') + text;
  }

  return {
    intent,
    text,
    suggestedActions: actions.filter(a => validAction(s, a)).filter((a, i, arr) => arr.findIndex(b => JSON.stringify(a) === JSON.stringify(b)) === i).slice(0, 2),
    referencedEventId: ref,
    stateRevision: s.revision,
    confidence
  };
}
