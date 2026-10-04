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

export const knowledge = [
  {id:'safety',patterns:[/اجرب في (البيت|المنزل)|(?:^|\s)المس(?:\s|$)|اعبث|المس.*(فيش|مقبس|سلك|كهرب)|touch.*socket|experiment at home/],ar:'نجرب هنا على الشاشة. اطلب مساعدة شخص بالغ، ولا تعبث بمقابس الكهرباء أو الأسلاك.',en:'We experiment on screen. Ask an adult for help and do not play with sockets or wires.',examples:['هل أجرب في البيت؟','هل ألمس المقبس؟','can I touch a socket?']},
  {id:'recycle',patterns:[/مستعمل|التخلص|تخلص من|نرمي|ارمي|نفايات|وين (ارمي|احط).*بطاري|recycl|dispose/],ar:'أعط البطارية المستعملة لشخص بالغ ليجمعها أو يتخلص منها بالطريقة المناسبة. لا تفتحها.',en:'Give used batteries to an adult for proper collection or disposal. Do not open them.',examples:['ماذا أفعل بالبطارية المستعملة؟','أين أرمي الحجر؟','dispose of battery']},
  {id:'charge',patterns:[/اشحن|شحن|charge/],ar:'البطارية العادية هنا غير قابلة للشحن. يُشحن فقط النوع المخصص للشحن بشاحنه المناسب، مع شخص بالغ.',en:'This ordinary battery is not rechargeable. Only rechargeable types use their matching charger, with an adult.',examples:['هل أشحن هذه البطارية؟','ممكن شحن الحجر؟','can I recharge?']},
  {id:'large_battery',patterns:[/(ثلاج|تلاج|براد|fridge).*(كبير|رحلات|سياره|بطاري|حجر|battery)/,/(بطاري|battery).*(كبير|big).*(ثلاج|fridge)/,/(big|large|camping).*(battery|fridge)/],when:q=>/كبير|رحلات|camp|big|large/.test(q),ar:'نعم، توجد ثلاجات رحلات وأنظمة مصممة لبطاريات مناسبة. هذا يختلف عن البطارية الصغيرة وثلاجة المنزل في نشاطنا.',en:'Yes, camping refrigerators and suitable battery systems exist. They are different from this small battery and our home refrigerator.',examples:['هل يمكن تشغيل ثلاجة ببطارية كبيرة؟','وثلاجات الرحلات؟','big battery for fridge']},
  {id:'size',patterns:[/كل.*(صغير|كبير)|الحجم|size|all.*(small|big)/],ar:'الحجم وحده لا يحدد المصدر. تصميم الجهاز ومتطلباته يحددان التغذية المناسبة، وتوجد أجهزة كبيرة تعمل ببطاريات مناسبة.',en:'Size alone does not decide the source. A device’s design and requirements matter; some large devices use suitable batteries.',examples:['هل كل جهاز صغير يعمل ببطارية؟','هل كل جهاز كبير لا يعمل ببطارية؟','does size decide?']},
  {id:'radio_sound',patterns:[/(اسمع|صوت|hear|sound).*(راديو|radio)|(?:راديو|radio).*(صامت|صوت|silent|sound)/],dynamic:'sound',examples:['لماذا لا أسمع الراديو؟','الراديو بلا صوت','no sound from radio']},
  {id:'radio_produces',patterns:[/(راديو|مذياع|radio).*(يصنع|ينتج|يولد|make|produc)/],ar:'الراديو يستهلك الطاقة الكهربائية ويحوّل جزءًا منها إلى صوت. لا يصنع مصدر الكهرباء.',en:'The radio uses electrical energy and converts some into sound. It does not produce its power supply.',examples:['هل الراديو يصنع الكهرباء؟','هل المذياع يولد كهربا؟','does radio produce electricity?']},
  {id:'together',patterns:[/معا|مع بعض|نفس الوقت|together|same time/],ar:'لدينا بطارية واحدة ننقلها بين الجهازين. عندما ننزعها من الأول يتوقف، ثم يمكن أن يعمل الثاني.',en:'We have one battery to move between these devices. Removing it stops the first, then it can power the second.',examples:['لماذا لا تعمل السيارة والراديو معًا؟','الجهازين بنفس الوقت؟','why not together?']},
  {id:'remove',patterns:[/نزع|ازال|فصل البطاري|شيل|(?:^|\s)شلت(?:\s|$)|remove|disconnect.*battery/],ar:'عند نزع البطارية ينقطع مصدر الطاقة عن الدائرة، فيتوقف الجهاز. يمكن إعادة تركيبها في حجرتها.',en:'Removing the battery breaks the circuit’s power supply, so the device stops. You can put it back in its compartment.',examples:['لماذا تتوقف السيارة عند نزع البطارية؟','إذا شلت الحجر؟','remove the battery']},
  {id:'depletion',patterns:[/تفرغ|تخلص|تنفد|نفاد|empty|run out/],ar:'طاقة البطارية محدودة وقد تنفد مع الاستخدام. في نشاطنا لا نحاكي نفادها، فلا نفسر التوقف بأنها فرغت.',en:'A battery has limited energy that can run out with use. This activity does not simulate depletion.',examples:['هل البطارية تفرغ؟','هل طاقتها تنفد؟','can it run out?']},
  {id:'poles',patterns:[/قطب|علامت|موجب|سالب|\+|−|poles|positive|negative/],ar:'علامتا + و− تدلان على قطبي البطارية. في المحاكاة نركبها حسب علامات الحجرة، حتى يكتمل اتصال القطبين.',en:'The + and − symbols mark the two battery terminals. The simulation matches the compartment markings to connect both terminals.',examples:['ما علامتا + و−؟','ما معنى موجب وسالب؟','battery poles']},
  {id:'visible',patterns:[/تري|نراها|نري|نشوف|شايف|بنشوف|نجوم|خطوط|visible|see electricity/],ar:'لا نرى الكهرباء مباشرة، لكن نلاحظ أثرها كالحركة والصوت والتبريد. الخطوط في النشاط تمثيل تعليمي.',en:'We do not see electricity directly; we observe movement, sound and cooling. The lines here are teaching symbols.',examples:['هل الكهرباء تُرى؟','هل نشوف كهربا؟','can we see electricity?']},
  {id:'generation',patterns:[/من اين.*(كهرب|تيار)|من وين.*(كهرب|تيار)|كيف.*(كهرب|تيار)|(كهرب|تيار).*(من اين|من وين|كيف|بتيجي|تاتي|توصل)|توليد.*كهرب|مصدر.*كهرب|where.*electricity.*come|how.*electricity.*(get|reach|home)/],ar:'تُولّد الكهرباء بطرق مختلفة، منها الشمس والرياح وطرق أخرى، وتنقلها الشبكة إلى المنازل.',en:'Electricity is generated in several ways, including sunlight and wind, and the grid carries it to homes.',examples:['من أين تأتي كهرباء المنزل؟','من وين الكهربا؟','where does electricity come from?']},
  {id:'sockets',patterns:[/كل.*(مقبس|فيش)|محول|all.*socket|adapter/],ar:'لكل جهاز تغذية تناسب تصميمه. بعض الأجهزة تحتاج محولًا مخصصًا؛ لا نجرّب توصيلات حقيقية هنا.',en:'Each device needs a supply suited to its design. Some need a dedicated adapter. We use virtual connections here.',examples:['لماذا لا تشتغل كل الأجهزة من المقبس؟','هل تحتاج محول؟','why not all use sockets?']},
  {id:'better',patterns:[/افضل|احسن|better|best/],ar:'يعتمد على الجهاز والحاجة. البطارية مفيدة للحركة، وكهرباء المنزل مناسبة لأجهزة معينة.',en:'It depends on the device and the need. Batteries are portable; household power suits certain devices.',examples:['أيهما أفضل؟','البطارية أحسن؟','which is better?']},
  {id:'difference',patterns:[/الداخلي|الفرق|فرق بين|شو الفرق|ايش الفرق|difference/],ar:'نقول «كهرباء المنزل». البطارية وكهرباء المنزل كلاهما يزوّد الأجهزة بالطاقة الكهربائية، لكن التغذية ومتطلبات الأجهزة تختلف.',en:'We call it household electricity. Both a battery and the household supply provide electrical energy, with different supply characteristics and device needs.',examples:['ما الفرق بين البطارية والكهرباء الداخلية؟','الكهرباء الداخلية؟','what is the difference?']},
  {id:'dry',patterns:[/جاف|dry/],ar:'البطارية الجافة مصدر صغير محمول للطاقة. كلمة «جافة» لا تعني أنها بلا مواد كيميائية.',en:'A dry cell is a small portable energy source. “Dry” does not mean it contains no chemicals.',examples:['ما البطارية الجافة؟','يعني إيه جافة؟','what is a dry cell?']},
  {id:'chemistry',patterns:[/(بطاري|حجر|battery).*(فيها|تخزن|طاق|كهرب|electric|energy)|طاقه كيميائيه/],ar:'تخزن البطارية طاقة كيميائية تتحول إلى طاقة كهربائية عند تشغيل دائرة مناسبة.',en:'A battery stores chemical energy, which becomes electrical energy in a suitable operating circuit.',examples:['هل البطارية فيها كهرباء؟','هل الحجر يخزن طاقة؟','does a battery have electricity?']},
  {id:'mains',patterns:[/ما.*كهرب.*(منزل|بيت)|شو.*كهرب.*(منزل|بيت)|يعني ايه.*كهرب.*(منزل|بيت)|what.*(household|mains)/],ar:'كهرباء المنزل تغذية تصل عبر شبكة الكهرباء. في تجربتنا يعرض الروبوت البالغ تشغيل الثلاجة بهذا المصدر.',en:'Household electricity is supplied through the power grid. Our adult robot demonstrates it powering the refrigerator.',examples:['ما كهرباء المنزل؟','ما هي كهربا البيت؟','what is mains electricity?']},
  {id:'failed',patterns:[/فشل|غبي|غلطت|fail|stupid/],ar:'هذه نتيجة مفيدة! عندما لا يناسب المصدر الجهاز نتعلم شيئًا جديدًا. المحاولة ليست فشلًا شخصيًا.',en:'This is a useful result! Finding that a source does not suit a device teaches us something new.',examples:['هل فشلت التجربة؟','أنا غلطت؟','did I fail?']},
  {id:'drag',patterns:[/اسحب|السحب|drag/],ar:'اختر البطارية وحرّكها قرب الجهاز. أو انقر البطارية ثم اسم الجهاز؛ الطريقتان تنجزان التجربة نفسها.',en:'Choose the battery and move it near a device, or click the battery then the device name. Both work.',examples:['كيف أسحب؟','السحب صعب','how to drag?']},
  {id:'restart',patterns:[/اعاده|اعيد|من جديد|restart|reset/],ar:'يمكننا البدء من جديد. سيطلب المختبر تأكيدك قبل مسح اكتشافات هذه الجولة.',en:'We can start again. The lab will ask you before clearing this round’s discoveries.',actions:[{id:'restart'}],examples:['أريد إعادة اللعب','نبدأ من جديد','restart please']},
  {id:'solution',patterns:[/الحل|اشرح مباشره|اعطني الجواب|solution|answer directly/],ar:'في تجربتنا تعمل سيارة اللعبة والراديو ببطاريتنا المناسبة لهما. الثلاجة تحتاج كهرباء المنزل؛ الحجم وحده لا يحدد ذلك.',en:'In our activity, the toy car and radio work with our suitable battery. The home refrigerator needs household electricity. Size alone does not determine this.',examples:['أريد الحل','اشرح مباشرة','give me the solution']},
  {id:'hint',patterns:[/تلميح|ساعد|hint|help/],dynamic:'hint',examples:['أريد تلميحًا','ساعدني','a hint please']},
  {id:'next',patterns:[/ماذا افعل|شو اعمل|ماذا بعد|what.*(do|next)/],dynamic:'hint',examples:['ماذا أفعل؟','شو أعمل؟','what do I do next?']},
  {id:'activity',patterns:[/هذا النشاط|هذا المختبر|نلعب|ما هذا|what is this|activity/],ar:'نجرّب مصادر الطاقة للأجهزة، ونلاحظ أي مصدر يناسب كل جهاز. توقعك بداية، والتجربة تساعدنا على الفهم.',en:'We try power sources for devices and observe which one suits each. Predictions begin our exploration; experiments help us understand.',examples:['ما هذا النشاط؟','ما هذا المختبر؟','what is this activity?']},
  {id:'where',patterns:[/اين اضع|وين احط|اين مكان|where.*put|^هذا$|^هي$|^هنا$/],dynamic:'where',examples:['أين أضعها؟','وين أحطها؟','where do I put it?']},
  {id:'why',patterns:[/لماذا|ليه|ليش|why|ما اشتغل|لم يعمل|لم تعمل|لا يعمل|متوقف|توقف|off|not work|طفت|طافي|خربان/],dynamic:'why',examples:['لماذا لم يعمل؟','ليه ما اشتغل؟','why is it off?']},
  {id:'battery',patterns:[/(?:^|\s)(?:ما|شو|ايش) (هي |هو )?(البطاريه|الحجر)|what is a battery/],ar:'البطارية مصدر محمول للطاقة الكهربائية. تخزن طاقة كيميائية تتحول إلى كهرباء في دائرة مناسبة.',en:'A battery is a portable source of electrical energy. Its stored chemical energy is converted in a suitable circuit.',examples:['ما هي البطارية؟','ما هو الحجر؟','what is a battery?']}
];

function hint(s) {
  const a = nextActions(s), d = s.selectedDevice || a.find(x => x.device)?.device;
  if (s.hintLevel < 2) return bi(s, 'انظر إلى الأجهزة. أي جهاز تتوقع أن تستطيع حمله وتشغيله بعيدًا عن المنزل؟ يمكنك تجربة توقعك.', 'Look at the devices. Which might you carry and use away from home? Try your prediction.');
  if (s.hintLevel < 3) {
    const mainsDev = d && DEVICE_MAP[d]?.type === 'mains' ? d : 'fridge';
    return s.discoveredFacts.includes(mainsDev + '_incompatible') || s.discoveredFacts.includes('fridge_incompatible')
      ? bi(s, 'جرّب مشاهدة عرض شرارة على لوحة كهرباء المنزل.', 'Try Sharara’s demonstration on the household electricity panel.')
      : bi(s, 'اختر البطارية، ثم اختر جهازًا لم تجرّبه بعد. لاحظ مكان البطارية واتصال قطبيها.', 'Choose the battery, then an unexplored device. Observe its compartment and both terminals.');
  }
  return bi(s, 'السيارة والراديو في النشاط مصممان لهذه البطارية. الثلاجة تحتاج مصدر المنزل المناسب. اختر جهازًا وجرب.', 'Our car and radio are designed for this battery. The refrigerator needs a suitable household supply. Choose a device to try.');
}

function why(s, q, now) {
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
        : bi(s, d === 'car' ? 'الكهرباء من البطارية شغّلت محرك سيارة اللعبة. لهذا شاهدنا حركتها.' : d === 'radio' ? 'هذا الراديو المحمول مصمم لهذه البطارية المناسبة؛ حوّل جزءًا من طاقتها إلى صوت.' : (meta?.reason || 'الثلاجة تعمل لأن التغذية من شبكة المنزل تناسب متطلباتها.'),
                d === 'car' ? 'Electrical energy from the battery powers the toy’s motor. That is why it moves.' : d === 'radio' ? 'This portable radio is designed for this suitable battery and converts some of its energy into sound.' : (meta?.reason || 'The refrigerator runs because household power meets its requirements.')),
      d
    };
  }

  if (d === 'fridge' && s.discoveredFacts.includes('fridge_incompatible') && st.reason !== 'demo_stopped') {
    return {text: bi(s, 'جرّبت البطارية مع الثلاجة، لكنها لم تعمل بها. هذه البطارية الصغيرة لا توفر التغذية التي تحتاجها ثلاجة المنزل في تجربتنا.', 'You tried the battery with the refrigerator, but it did not power it. This small battery does not provide the supply our home refrigerator needs.'), d};
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

    const matches = knowledge.filter(k => (!k.when || k.when(q)) && k.patterns.some(r => r.test(q)));
    const k = matches[0];

    if (k) {
      intent = k.id;
      confidence = .9;
      text = k[s.language === 'en' ? 'en' : 'ar'];
      if (k.actions) actions.splice(0, actions.length, ...k.actions);
      if (k.dynamic === 'hint') text = hint(s);
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
      // The student answered with a single device name (or responded to clarification)
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
