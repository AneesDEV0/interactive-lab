// ═══════════════════════════════════════════════════════════════════════════
// src/audio.js — المنظومة الصوتية الهجينة ثلاثية الطبقات (3-Tier Audio Engine)
// الطبقة 1: ملفات MP3 جاهزة مع مشغل Singleton متوافق 100% مع iOS Safari وAndroid
// الطبقة 2: احتياط Web Speech API فائق الحماية من التجميد ومسح الذاكرة (GC)
// الطبقة 3: كشف المتصفحات المدمجة (In-App) وحالات كتم الصوت مع إشعار المستخدم
// ═══════════════════════════════════════════════════════════════════════════

// ─── بنك المفاتيح والنصوص الصوتية المعتمدة للمنصة ───
export const AUDIO_REGISTRY = {
  // 1. المهمات والتحديات
  'mission.battery': { file: './audio/ar/mission.battery.mp3', text: 'هيا يا بطل العلوم! ابحث عن جهازين يعملان بالبطاريات الجافة، واضغط فحص 3D لتكتشف حجرة البطاريات أو سلك الكهرباء!' },
  'mission.mains': { file: './audio/ar/mission.mains.mp3', text: 'هيا يا ذكي! ابحث عن جهازين يحتاجان كهرباء المنزل 220 فولت، واضغط فحص 3D لتفحص الجهاز بنفسك!' },
  
  // 2. تلميحات المحقق
  'hint.battery': { file: './audio/ar/hint.battery.mp3', text: 'تلميح المحقق: اضغط زر فحص 3D على الأجهزة، وابحث عن الجهاز الذي يحتوي على حجرة بطاريات صغيرة وزوج من الأقطاب!' },
  'hint.mains': { file: './audio/ar/hint.mains.mp3', text: 'تلميح المحقق: اضغط زر فحص 3D على الأجهزة، وابحث عن الجهاز الذي يمتد منه سلك كهربائي قوي ينتهي بفيشة جدارية!' },

  // 3. رسائل الواجهة والتحقق
  'ui.welcome_ar': { file: './audio/ar/ui.welcome_ar.mp3', text: 'مرحباً بك يا بطل العلوم في النشاط التقويمي! حَدِّدْ جهازين يعملان بالمصدر المطلوب وتجنب الفخاخ. اضغط على الأجهزة لاختيارها، واضغط فحص ثري دي لكشف أسرارها!' },
  'ui.select_two': { file: './audio/ar/ui.select_two.mp3', text: 'اخْتَرْ جهازين أولاً يا بطل العلوم للتحقق من إجابتك!' },
  'ui.need_two': { file: './audio/ar/ui.need_two.mp3', text: 'اخْتَرْ جهازين لتكتمل إجابتك، متبقٍ جهاز واحد يا بطل!' },
  'ui.limit_two': { file: './audio/ar/ui.limit_two.mp3', text: 'حَدِّدْ جهازين فقط يا بطل، أو ألغِ تحديد أحدهما أولاً!' },
  'ui.ready_validate': { file: './audio/ar/ui.ready_validate.mp3', text: 'رائع، اكتمل جهازان! اضغط الآن زر: تحقق من إجابتي.' },
  'ui.win': { file: './audio/ar/ui.win.mp3', text: 'أنت بطل وعبقري! إجابة صحيحة مئة بالمئة! كشفت جميع الأجهزة وتجنبت الفخاخ ببراعة!' },
  'ui.general_wrong': { file: './audio/ar/ui.general_wrong.mp3', text: 'قريباً جداً يا بطل! تفحص الأجهزة عبر زر فحص ثري دي واكتشف مصدر طاقتها بنفسك. حاول مرة أخرى!' },
  'ui.voice_enabled': { file: './audio/ar/ui.voice_enabled.mp3', text: 'تم تفعيل التوجيه الصوتي بنجاح!' },

  // 4. أجهزة البطاريات الجافة الـ 12
  'guide.car.prompt': { file: './audio/ar/guide.car.prompt.mp3', text: 'انظر لسيارة الألعاب، من أين تستمد طاقتها للحركة والانطلاق بحرية؟' },
  'guide.car.correct': { file: './audio/ar/guide.car.correct.mp3', text: 'أنت بطل وعبقري! سيارة الألعاب تعمل ببطارية جافة آمنة للأطفال.' },
  'guide.car.wrong': { file: './audio/ar/guide.car.wrong.mp3', text: 'قريباً جداً يا بطل! سيارة الأطفال لعبة محركة آمنة، هل تحتاج سلك جدار أم بطارية؟ حاول ثانية!' },
  'guide.car.inspect': { file: './audio/ar/guide.car.inspect.mp3', text: 'هيا يا محقق! تفحص سيارة الأطفال اللعبة من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.car.select': { file: './audio/ar/guide.car.select.mp3', text: 'حَدَّدْتَ سيارة الأطفال اللعبة! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.car.deselect': { file: './audio/ar/guide.car.deselect.mp3', text: 'ألغيتَ تحديد سيارة الأطفال اللعبة! اخْتَرْ جهازاً آخر.' },

  'guide.radio.prompt': { file: './audio/ar/guide.radio.prompt.mp3', text: 'تفحص الراديو المحمول، كيف يرافقنا في الرحلات دون أسلاك جدارية؟' },
  'guide.radio.correct': { file: './audio/ar/guide.radio.correct.mp3', text: 'ممتاز يا بطل! الراديو المحمول الصغير يستمد طاقته من البطاريات الجافة.' },
  'guide.radio.wrong': { file: './audio/ar/guide.radio.wrong.mp3', text: 'قريباً جداً! هذا راديو محمول خفيف للرحلات، هل يحتاج مقبس جداري أم بطارية؟ حاول مجدداً!' },
  'guide.radio.inspect': { file: './audio/ar/guide.radio.inspect.mp3', text: 'هيا يا محقق! تفحص الراديو المحمول الصغير من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.radio.select': { file: './audio/ar/guide.radio.select.mp3', text: 'حَدَّدْتَ الراديو المحمول! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.radio.deselect': { file: './audio/ar/guide.radio.deselect.mp3', text: 'ألغيتَ تحديد الراديو المحمول! اخْتَرْ جهازاً آخر.' },

  'guide.flashlight.prompt': { file: './audio/ar/guide.flashlight.prompt.mp3', text: 'تفحص كشاف الجيب، كيف يضيء في الأماكن المظلمة البعيدة دون أسلاك؟' },
  'guide.flashlight.correct': { file: './audio/ar/guide.flashlight.correct.mp3', text: 'إجابة صحيحة ورائعة! كشاف الجيب يعتمد على بطارية جافة داخل مقبضه.' },
  'guide.flashlight.wrong': { file: './audio/ar/guide.flashlight.wrong.mp3', text: 'فكر معي يا بطل! كشاف الجيب نحمله باليد في كل مكان، هل البطارية الجافة تناسبه؟ حاول ثانية!' },
  'guide.flashlight.inspect': { file: './audio/ar/guide.flashlight.inspect.mp3', text: 'هيا يا محقق! تفحص كشاف الجيب من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.flashlight.select': { file: './audio/ar/guide.flashlight.select.mp3', text: 'حَدَّدْتَ كشاف الجيب! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.flashlight.deselect': { file: './audio/ar/guide.flashlight.deselect.mp3', text: 'ألغيتَ تحديد كشاف الجيب! اخْتَرْ جهازاً آخر.' },

  'guide.wallClock.prompt': { file: './audio/ar/guide.wallClock.prompt.mp3', text: 'تأمل ساعة الحائط المعلقة، ما الذي يجعل عقاربها تدور لأشهر دون سلك كهرباء؟' },
  'guide.wallClock.correct': { file: './audio/ar/guide.wallClock.correct.mp3', text: 'أحسنت يا عبقري! ساعة الحائط تكتفي ببطارية جافة واحدة تدوم طويلاً.' },
  'guide.wallClock.wrong': { file: './audio/ar/guide.wallClock.wrong.mp3', text: 'انظر للساعة المعلقة في الحائط، لا يوجد سلك يتدلى منها! ما مصدر طاقتها؟ حاول مجدداً!' },
  'guide.wallClock.inspect': { file: './audio/ar/guide.wallClock.inspect.mp3', text: 'هيا يا محقق! تفحص ساعة الحائط الجدارية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.wallClock.select': { file: './audio/ar/guide.wallClock.select.mp3', text: 'حَدَّدْتَ ساعة الحائط الجدارية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.wallClock.deselect': { file: './audio/ar/guide.wallClock.deselect.mp3', text: 'ألغيتَ تحديد ساعة الحائط الجدارية! اخْتَرْ جهازاً آخر.' },

  'guide.remote.prompt': { file: './audio/ar/guide.remote.prompt.mp3', text: 'تفحص ريموت التلفاز، أين نضع خلايا الطاقة لتغيير القنوات بحرية؟' },
  'guide.remote.correct': { file: './audio/ar/guide.remote.correct.mp3', text: 'بطل متألق! ريموت التحكم عن بعد يعمل ببطاريتين جافتين صغيرتين.' },
  'guide.remote.wrong': { file: './audio/ar/guide.remote.wrong.mp3', text: 'تذكر يا بطل! ريموت التلفاز نحمله بيدنا ونتحرك به، ما مصدر طاقته المناسب؟ حاول مرة أخرى!' },
  'guide.remote.inspect': { file: './audio/ar/guide.remote.inspect.mp3', text: 'هيا يا محقق! تفحص جهاز التحكم عن بعد من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.remote.select': { file: './audio/ar/guide.remote.select.mp3', text: 'حَدَّدْتَ جهاز التحكم عن بعد! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.remote.deselect': { file: './audio/ar/guide.remote.deselect.mp3', text: 'ألغيتَ تحديد جهاز التحكم عن بعد! اخْتَرْ جهازاً آخر.' },

  'guide.calculator.prompt': { file: './audio/ar/guide.calculator.prompt.mp3', text: 'تفحص الآلة الحاسبة، ما مصدر الطاقة الخفيف الذي يشغل شاشتها الرقمية؟' },
  'guide.calculator.correct': { file: './audio/ar/guide.calculator.correct.mp3', text: 'إجابة رائعة وصحيحة! الآلة الحاسبة تكتفي ببطارية جافة خفيفة.' },
  'guide.calculator.wrong': { file: './audio/ar/guide.calculator.wrong.mp3', text: 'الآلة الحاسبة تحتاج طاقة ضئيلة جداً ولا نوصلها بالجدار، فكر وجرّب ثانية!' },
  'guide.calculator.inspect': { file: './audio/ar/guide.calculator.inspect.mp3', text: 'هيا يا محقق! تفحص الآلة الحاسبة من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.calculator.select': { file: './audio/ar/guide.calculator.select.mp3', text: 'حَدَّدْتَ الآلة الحاسبة الإلكترونية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.calculator.deselect': { file: './audio/ar/guide.calculator.deselect.mp3', text: 'ألغيتَ تحديد الآلة الحاسبة الإلكترونية! اخْتَرْ جهازاً آخر.' },

  'guide.digitalScale.prompt': { file: './audio/ar/guide.digitalScale.prompt.mp3', text: 'انظر للميزان الرقمي، كيف نقيس وزننا به في أي مكان بالغرفة بأمان؟' },
  'guide.digitalScale.correct': { file: './audio/ar/guide.digitalScale.correct.mp3', text: 'أنت بطل العلوم! الميزان المنزلي يعمل بالبطاريات الجافة بحرية وأمان.' },
  'guide.digitalScale.wrong': { file: './audio/ar/guide.digitalScale.wrong.mp3', text: 'الميزان يوضع على الأرضية بلا أسلاك تعيق الحركة، ما مصدر طاقته المناسب؟ حاول ثانية!' },
  'guide.digitalScale.inspect': { file: './audio/ar/guide.digitalScale.inspect.mp3', text: 'هيا يا محقق! تفحص الميزان الرقمي المنزلي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.digitalScale.select': { file: './audio/ar/guide.digitalScale.select.mp3', text: 'حَدَّدْتَ الميزان الرقمي المنزلي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.digitalScale.deselect': { file: './audio/ar/guide.digitalScale.deselect.mp3', text: 'ألغيتَ تحديد الميزان الرقمي المنزلي! اخْتَرْ جهازاً آخر.' },

  'guide.smokeDetector.prompt': { file: './audio/ar/guide.smokeDetector.prompt.mp3', text: 'تفحص إنذار الدخان بالسقف، كيف يحمينا حتى لو انقطعت كهرباء المنزل بالكامل؟' },
  'guide.smokeDetector.correct': { file: './audio/ar/guide.smokeDetector.correct.mp3', text: 'عبقري يا بطل! إنذار الدخان يعمل ببطارية جافة ليبقى متيقظاً دائماً لحمايتنا.' },
  'guide.smokeDetector.wrong': { file: './audio/ar/guide.smokeDetector.wrong.mp3', text: 'إنذار الدخان يجب أن يعمل حتى عند انقطاع كهرباء البيت، فماذا يحتاج؟ حاول مجدداً!' },
  'guide.smokeDetector.inspect': { file: './audio/ar/guide.smokeDetector.inspect.mp3', text: 'هيا يا محقق! تفحص جهاز إنذار الدخان من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.smokeDetector.select': { file: './audio/ar/guide.smokeDetector.select.mp3', text: 'حَدَّدْتَ جهاز إنذار الدخان! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.smokeDetector.deselect': { file: './audio/ar/guide.smokeDetector.deselect.mp3', text: 'ألغيتَ تحديد جهاز إنذار الدخان! اخْتَرْ جهازاً آخر.' },

  'guide.laserPointer.prompt': { file: './audio/ar/guide.laserPointer.prompt.mp3', text: 'تفحص مؤشر الليزر التعليمي، كيف يضيء في يد المعلم أثناء الشرح بحرية؟' },
  'guide.laserPointer.correct': { file: './audio/ar/guide.laserPointer.correct.mp3', text: 'إجابة متقنة وصحيحة! مؤشر الليزر يعمل ببطاريات جافة دقيقة.' },
  'guide.laserPointer.wrong': { file: './audio/ar/guide.laserPointer.wrong.mp3', text: 'مؤشر الليزر قلم صغير وخفيف، هل يحتاج كهرباء جدارية أم بطارية؟ فكر وحاول!' },
  'guide.laserPointer.inspect': { file: './audio/ar/guide.laserPointer.inspect.mp3', text: 'هيا يا محقق! تفحص مؤشر الليزر التعليمي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.laserPointer.select': { file: './audio/ar/guide.laserPointer.select.mp3', text: 'حَدَّدْتَ مؤشر الليزر التعليمي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.laserPointer.deselect': { file: './audio/ar/guide.laserPointer.deselect.mp3', text: 'ألغيتَ تحديد مؤشر الليزر التعليمي! اخْتَرْ جهازاً آخر.' },

  'guide.hearingAid.prompt': { file: './audio/ar/guide.hearingAid.prompt.mp3', text: 'انظر لسماعة الأذن الطبية، ما مصدر طاقتها فائق الصغر والآمن داخل الأذن؟' },
  'guide.hearingAid.correct': { file: './audio/ar/guide.hearingAid.correct.mp3', text: 'رائع جداً يا ذكي! السماعة الطبية تعمل ببطارية جافة دقيقة جداً كحبة العدس.' },
  'guide.hearingAid.wrong': { file: './audio/ar/guide.hearingAid.wrong.mp3', text: 'السماعة توضع داخل الأذن ويجب أن تكون آمنة وصغيرة جداً، ما مصدر طاقتها؟ حاول ثانية!' },
  'guide.hearingAid.inspect': { file: './audio/ar/guide.hearingAid.inspect.mp3', text: 'هيا يا محقق! تفحص سماعة الأذن الطبية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.hearingAid.select': { file: './audio/ar/guide.hearingAid.select.mp3', text: 'حَدَّدْتَ سماعة الأذن الطبية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.hearingAid.deselect': { file: './audio/ar/guide.hearingAid.deselect.mp3', text: 'ألغيتَ تحديد سماعة الأذن الطبية! اخْتَرْ جهازاً آخر.' },

  'guide.robotToy.prompt': { file: './audio/ar/guide.robotToy.prompt.mp3', text: 'تفحص روبوت الألعاب الذكي، كيف يتحرك ويصدر أصواتاً وأضواءً آمنة للأطفال؟' },
  'guide.robotToy.correct': { file: './audio/ar/guide.robotToy.correct.mp3', text: 'إجابة بطل حقيقي! روبوت الأطفال يعمل ببطاريات جافة آمنة وسهلة الاستبدال.' },
  'guide.robotToy.wrong': { file: './audio/ar/guide.robotToy.wrong.mp3', text: 'ألعاب الأطفال مصممة لتكون آمنة وسهلة الحركة، هل نوصلها بمقبس الجدار؟ حاول ثانية!' },
  'guide.robotToy.inspect': { file: './audio/ar/guide.robotToy.inspect.mp3', text: 'هيا يا محقق! تفحص روبوت الألعاب الذكي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.robotToy.select': { file: './audio/ar/guide.robotToy.select.mp3', text: 'حَدَّدْتَ روبوت الألعاب الذكي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.robotToy.deselect': { file: './audio/ar/guide.robotToy.deselect.mp3', text: 'ألغيتَ تحديد روبوت الألعاب الذكي! اخْتَرْ جهازاً آخر.' },

  'guide.electricToothbrush.prompt': { file: './audio/ar/guide.electricToothbrush.prompt.mp3', text: 'تفحص فرشاة الأسنان الكهربائية، كيف تدور بأمان تام قرب صنبور الماء؟' },
  'guide.electricToothbrush.correct': { file: './audio/ar/guide.electricToothbrush.correct.mp3', text: 'أحسنت يا مبدع! فرشاة الأسنان تعمل ببطارية جافة معزولة وآمنة تماماً.' },
  'guide.electricToothbrush.wrong': { file: './audio/ar/guide.electricToothbrush.wrong.mp3', text: 'الماء والكهرباء الجدارية خطر شديد! كيف تعمل الفرشاة بأمان؟ حاول مجدداً!' },
  'guide.electricToothbrush.inspect': { file: './audio/ar/guide.electricToothbrush.inspect.mp3', text: 'هيا يا محقق! تفحص فرشاة الأسنان الكهربائية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.electricToothbrush.select': { file: './audio/ar/guide.electricToothbrush.select.mp3', text: 'حَدَّدْتَ فرشاة الأسنان الكهربائية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.electricToothbrush.deselect': { file: './audio/ar/guide.electricToothbrush.deselect.mp3', text: 'ألغيتَ تحديد فرشاة الأسنان الكهربائية! اخْتَرْ جهازاً آخر.' },

  // 5. أجهزة كهرباء المنزل 220V الـ 12
  'guide.fridge.prompt': { file: './audio/ar/guide.fridge.prompt.mp3', text: 'تفحص الثلاجة المنزلية جيداً، هل تحتاج لطاقة كبيرة لتبريد وحفظ الأطعمة باستمرار؟' },
  'guide.fridge.correct': { file: './audio/ar/guide.fridge.correct.mp3', text: 'أنت بطل وعبقري! الثلاجة تحتاج تيار 220 فولت القوي والمستمر من مقبس الجدار.' },
  'guide.fridge.wrong': { file: './audio/ar/guide.fridge.wrong.mp3', text: 'قريباً جداً يا بطل! لكن تذكر، الثلاجة كبيرة وتحتوي محرك تبريد ضخم، هل تكفيها بطارية صغيرة؟ حاول ثانية!' },
  'guide.fridge.inspect': { file: './audio/ar/guide.fridge.inspect.mp3', text: 'هيا يا محقق! تفحص الثلاجة المنزلية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.fridge.select': { file: './audio/ar/guide.fridge.select.mp3', text: 'حَدَّدْتَ الثلاجة المنزلية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.fridge.deselect': { file: './audio/ar/guide.fridge.deselect.mp3', text: 'ألغيتَ تحديد الثلاجة المنزلية! اخْتَرْ جهازاً آخر.' },

  'guide.microwave.prompt': { file: './audio/ar/guide.microwave.prompt.mp3', text: 'انظر لفرن الميكروويف، كيف يسخن وجبات الطعام في ثوانٍ معدودة؟' },
  'guide.microwave.correct': { file: './audio/ar/guide.microwave.correct.mp3', text: 'ممتاز يا بطل! الميكروويف يستهلك طاقة حرارية هائلة تتطلب كهرباء المنزل 220 فولت.' },
  'guide.microwave.wrong': { file: './audio/ar/guide.microwave.wrong.mp3', text: 'تسخين الطعام السريع يتطلب قدرة تتعدى 1000 واط، هل البطارية الجافة تكفي لذلك؟ حاول ثانية!' },
  'guide.microwave.inspect': { file: './audio/ar/guide.microwave.inspect.mp3', text: 'هيا يا محقق! تفحص فرن الميكروويف من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.microwave.select': { file: './audio/ar/guide.microwave.select.mp3', text: 'حَدَّدْتَ فرن الميكروويف! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.microwave.deselect': { file: './audio/ar/guide.microwave.deselect.mp3', text: 'ألغيتَ تحديد فرن الميكروويف! اخْتَرْ جهازاً آخر.' },

  'guide.washer.prompt': { file: './audio/ar/guide.washer.prompt.mp3', text: 'تفحص الغسالة الآلية جيداً، هل تحتاج لمحرك جبار لتدوير الملابس وسحب وضخ المياه؟' },
  'guide.washer.correct': { file: './audio/ar/guide.washer.correct.mp3', text: 'إجابة صحيحة ومبهرة! الغسالة تدير محركاً قوياً يستمد طاقته من مقبس الجدار 220 فولت.' },
  'guide.washer.wrong': { file: './audio/ar/guide.washer.wrong.mp3', text: 'الغسالة تدير محركاً كبيراً ومضخات ماء قوية، هل تكفيها بطارية صغيرة؟ حاول مرة أخرى!' },
  'guide.washer.inspect': { file: './audio/ar/guide.washer.inspect.mp3', text: 'هيا يا محقق! تفحص الغسالة الآلية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.washer.select': { file: './audio/ar/guide.washer.select.mp3', text: 'حَدَّدْتَ الغسالة الآلية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.washer.deselect': { file: './audio/ar/guide.washer.deselect.mp3', text: 'ألغيتَ تحديد الغسالة الآلية! اخْتَرْ جهازاً آخر.' },

  'guide.airConditioner.prompt': { file: './audio/ar/guide.airConditioner.prompt.mp3', text: 'تفحص مكيف الهواء، كيف يبرد الغرفة بالكامل في أيام الصيف الحارة؟' },
  'guide.airConditioner.correct': { file: './audio/ar/guide.airConditioner.correct.mp3', text: 'بطل العلوم! مكيف الهواء يسحب طاقة كهربائية عالية جداً من شبكة المنزل الرئيسية.' },
  'guide.airConditioner.wrong': { file: './audio/ar/guide.airConditioner.wrong.mp3', text: 'تبريد غرفة كاملة يتطلب قدرة كهربائية جبارة لا تملكها البطاريات، فكر وحاول ثانية!' },
  'guide.airConditioner.inspect': { file: './audio/ar/guide.airConditioner.inspect.mp3', text: 'هيا يا محقق! تفحص مكيف الهواء المنزلي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.airConditioner.select': { file: './audio/ar/guide.airConditioner.select.mp3', text: 'حَدَّدْتَ مكيف الهواء المنزلي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.airConditioner.deselect': { file: './audio/ar/guide.airConditioner.deselect.mp3', text: 'ألغيتَ تحديد مكيف الهواء المنزلي! اخْتَرْ جهازاً آخر.' },

  'guide.vacuum.prompt': { file: './audio/ar/guide.vacuum.prompt.mp3', text: 'انظر للمكنسة الكهربائية، من أين تستمد قوة الشفط الجبارة لتنظيف السجاد؟' },
  'guide.vacuum.correct': { file: './audio/ar/guide.vacuum.correct.mp3', text: 'أحسنت يا ذكي! المكنسة الكهربائية موصولة مباشرة بسلك وقابس كهرباء المنزل.' },
  'guide.vacuum.wrong': { file: './audio/ar/guide.vacuum.wrong.mp3', text: 'محرك الشفط السريع يسحب الأتربة بقوة هائلة، ما مصدر الكهرباء المناسب له؟ حاول مجدداً!' },
  'guide.vacuum.inspect': { file: './audio/ar/guide.vacuum.inspect.mp3', text: 'هيا يا محقق! تفحص المكنسة الكهربائية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.vacuum.select': { file: './audio/ar/guide.vacuum.select.mp3', text: 'حَدَّدْتَ المكنسة الكهربائية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.vacuum.deselect': { file: './audio/ar/guide.vacuum.deselect.mp3', text: 'ألغيتَ تحديد المكنسة الكهربائية! اخْتَرْ جهازاً آخر.' },

  'guide.lamp.prompt': { file: './audio/ar/guide.lamp.prompt.mp3', text: 'تفحص مصباح المكتب السلكي، كيف يمنحنا إضاءة دائمة ومستقرة أثناء المذاكرة؟' },
  'guide.lamp.correct': { file: './audio/ar/guide.lamp.correct.mp3', text: 'إجابة صحيحة يا بطل! مصباح المكتب السلكي متصل مباشرة بقابس كهرباء المنزل.' },
  'guide.lamp.wrong': { file: './audio/ar/guide.lamp.wrong.mp3', text: 'انظر لسلك المصباح الممتد للجدار، إنه يعمل بكهرباء المنزل المباشرة! حاول ثانية!' },
  'guide.lamp.inspect': { file: './audio/ar/guide.lamp.inspect.mp3', text: 'هيا يا محقق! تفحص مصباح المكتب السلكي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.lamp.select': { file: './audio/ar/guide.lamp.select.mp3', text: 'حَدَّدْتَ مصباح المكتب السلكي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.lamp.deselect': { file: './audio/ar/guide.lamp.deselect.mp3', text: 'ألغيتَ تحديد مصباح المكتب السلكي! اخْتَرْ جهازاً آخر.' },

  'guide.electricOven.prompt': { file: './audio/ar/guide.electricOven.prompt.mp3', text: 'تفحص الفرن الكهربائي، كيف يولد حرارة شديدة لطهي وصنع أشهى المأكولات؟' },
  'guide.electricOven.correct': { file: './audio/ar/guide.electricOven.correct.mp3', text: 'أنت عبقري ومميز! الفرن الكهربائي يستهلك طاقة حرارية ضخمة من كهرباء المنزل 220 فولت.' },
  'guide.electricOven.wrong': { file: './audio/ar/guide.electricOven.wrong.mp3', text: 'طهي الطعام يحتاج حرارة تتجاوز 200 درجة مئوية، هل تنتجها بطارية جافة؟ حاول ثانية!' },
  'guide.electricOven.inspect': { file: './audio/ar/guide.electricOven.inspect.mp3', text: 'هيا يا محقق! تفحص الفرن الكهربائي المنزلي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.electricOven.select': { file: './audio/ar/guide.electricOven.select.mp3', text: 'حَدَّدْتَ الفرن الكهربائي المنزلي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.electricOven.deselect': { file: './audio/ar/guide.electricOven.deselect.mp3', text: 'ألغيتَ تحديد الفرن الكهربائي المنزلي! اخْتَرْ جهازاً آخر.' },

  'guide.iron.prompt': { file: './audio/ar/guide.iron.prompt.mp3', text: 'تأمل مكواة الملابس البخارية، كيف تنتج الحرارة العالية اللازمة لكي الأقمشة؟' },
  'guide.iron.correct': { file: './audio/ar/guide.iron.correct.mp3', text: 'رائع جداً يا بطل! سخان المكواة يحول تيار كهرباء المنزل القوي إلى حرارة شديدة.' },
  'guide.iron.wrong': { file: './audio/ar/guide.iron.wrong.mp3', text: 'المكواة تحول طاقة كهربائية كبيرة إلى حرارة شديدة، فما مصدر طاقتها الحقيقي؟ حاول مجدداً!' },
  'guide.iron.inspect': { file: './audio/ar/guide.iron.inspect.mp3', text: 'هيا يا محقق! تفحص مكواة الملابس البخارية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.iron.select': { file: './audio/ar/guide.iron.select.mp3', text: 'حَدَّدْتَ مكواة الملابس البخارية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.iron.deselect': { file: './audio/ar/guide.iron.deselect.mp3', text: 'ألغيتَ تحديد مكواة الملابس البخارية! اخْتَرْ جهازاً آخر.' },

  'guide.hairDryer.prompt': { file: './audio/ar/guide.hairDryer.prompt.mp3', text: 'انظر لمجفف الشعر، كيف يدفع هواءً ساخناً وقوياً لتجفيف الشعر في لحظات؟' },
  'guide.hairDryer.correct': { file: './audio/ar/guide.hairDryer.correct.mp3', text: 'إجابة متقنة وصحيحة! مجفف الشعر يدمج مروحة وسخاناً يعملان بكهرباء المنزل القوية.' },
  'guide.hairDryer.wrong': { file: './audio/ar/guide.hairDryer.wrong.mp3', text: 'الاستشوار يجمع بين مروحة سريعة وسخان حراري، هل تكفيه بطارية صغيرة؟ حاول ثانية!' },
  'guide.hairDryer.inspect': { file: './audio/ar/guide.hairDryer.inspect.mp3', text: 'هيا يا محقق! تفحص مجفف الشعر من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.hairDryer.select': { file: './audio/ar/guide.hairDryer.select.mp3', text: 'حَدَّدْتَ مجفف الشعر! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.hairDryer.deselect': { file: './audio/ar/guide.hairDryer.deselect.mp3', text: 'ألغيتَ تحديد مجفف الشعر! اخْتَرْ جهازاً آخر.' },

  'guide.electricWaterHeater.prompt': { file: './audio/ar/guide.electricWaterHeater.prompt.mp3', text: 'تفحص سخان الماء الكهربائي، كيف يسخن عشرات اللترات من الماء للاستحمام؟' },
  'guide.electricWaterHeater.correct': { file: './audio/ar/guide.electricWaterHeater.correct.mp3', text: 'أحسنت يا بطل العلوم! سخان الماء متصل دائماً بمقبس كهرباء المنزل 220 فولت.' },
  'guide.electricWaterHeater.wrong': { file: './audio/ar/guide.electricWaterHeater.wrong.mp3', text: 'تسخين خزانات مياه كاملة يتطلب تياراً كهربائياً عالي الشدة من الجدار، حاول مجدداً!' },
  'guide.electricWaterHeater.inspect': { file: './audio/ar/guide.electricWaterHeater.inspect.mp3', text: 'هيا يا محقق! تفحص سخان الماء الكهربائي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.electricWaterHeater.select': { file: './audio/ar/guide.electricWaterHeater.select.mp3', text: 'حَدَّدْتَ سخان الماء الكهربائي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.electricWaterHeater.deselect': { file: './audio/ar/guide.electricWaterHeater.deselect.mp3', text: 'ألغيتَ تحديد سخان الماء الكهربائي! اخْتَرْ جهازاً آخر.' },

  'guide.electricHeater.prompt': { file: './audio/ar/guide.electricHeater.prompt.mp3', text: 'تفحص المدفأة الكهربائية، كيف تشع الدفء والحرارة في أرجاء الغرفة الباردة؟' },
  'guide.electricHeater.correct': { file: './audio/ar/guide.electricHeater.correct.mp3', text: 'بطل حقيقي! المدفأة الكهربائية تحتاج طاقة حرارية هائلة من كهرباء المنزل 220 فولت.' },
  'guide.electricHeater.wrong': { file: './audio/ar/guide.electricHeater.wrong.mp3', text: 'تدفئة الغرفة تحتاج قدرة كهربائية جبارة لا تستطيع البطارية توفيرها، حاول ثانية!' },
  'guide.electricHeater.inspect': { file: './audio/ar/guide.electricHeater.inspect.mp3', text: 'هيا يا محقق! تفحص المدفأة الكهربائية الحرارية من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.electricHeater.select': { file: './audio/ar/guide.electricHeater.select.mp3', text: 'حَدَّدْتَ المدفأة الكهربائية الحرارية! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.electricHeater.deselect': { file: './audio/ar/guide.electricHeater.deselect.mp3', text: 'ألغيتَ تحديد المدفأة الكهربائية الحرارية! اخْتَرْ جهازاً آخر.' },

  'guide.blender.prompt': { file: './audio/ar/guide.blender.prompt.mp3', text: 'تفحص خلاط العصائر، كيف يدير شفراته بسرعة فائقة لجرش الفواكه والثلج؟' },
  'guide.blender.correct': { file: './audio/ar/guide.blender.correct.mp3', text: 'أنت نجم العلوم! محرك الخلاط القوي يعمل بكهرباء المنزل 220 فولت ليفرم بقوة.' },
  'guide.blender.wrong': { file: './audio/ar/guide.blender.wrong.mp3', text: 'جرش الثلج والفواكه يتطلب عزم دوران جبار وسرعة فائقة من مقبس الجدار، حاول ثانية!' },
  'guide.blender.inspect': { file: './audio/ar/guide.blender.inspect.mp3', text: 'هيا يا محقق! تفحص خلاط العصائر المنزلي من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟' },
  'guide.blender.select': { file: './audio/ar/guide.blender.select.mp3', text: 'حَدَّدْتَ خلاط العصائر المنزلي! اخْتَرْ جهازاً ثانياً يا بطل.' },
  'guide.blender.deselect': { file: './audio/ar/guide.blender.deselect.mp3', text: 'ألغيتَ تحديد خلاط العصائر المنزلي! اخْتَرْ جهازاً آخر.' }
};

// ─── إدارة حالة المنظومة الصوتية ───
let audioSingleton = null;
let currentPlaybackToken = 0;
let isAudioUnlocked = false;
let webAudioCtx = null;
let activeUtterances = new Set();
let pendingPlayback = null;

// ─── كشف المتصفحات المدمجة (In-App Browsers) ───
export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  return /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram|TikTok|wv|Snapchat/i.test(ua);
}

// ─── مشغل الصوت الوحيد (Singleton HTMLAudioElement) ───
export function getAudioSingleton() {
  if (!audioSingleton && typeof window !== 'undefined') {
    audioSingleton = new Audio();
    audioSingleton.playsInline = true;
    audioSingleton.setAttribute('playsinline', '');
    audioSingleton.setAttribute('webkit-playsinline', '');
    audioSingleton.preload = 'auto';
  }
  return audioSingleton;
}

// ─── فتح قفل الصوت الشامل (Universal Audio Unlock) ───
export function unlockAudioSystem() {
  if (isAudioUnlocked || typeof window === 'undefined') return;
  isAudioUnlocked = true;

  // 1. فتح Web Audio Context
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      webAudioCtx = webAudioCtx || new AudioContextClass();
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume();
      }
    }
  } catch {}

  // 2. فتح عنصر الـ Audio عبر تشغيل ملف صامت متناهي القصر (Data-URI)
  try {
    const audio = getAudioSingleton();
    if (audio) {
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    }
  } catch {}

  // 3. فتح Web Speech API بنطق صامت
  try {
    if (globalThis.speechSynthesis) {
      if (globalThis.speechSynthesis.paused) {
        globalThis.speechSynthesis.resume();
      }
      const dummy = new SpeechSynthesisUtterance(' ');
      dummy.volume = 0.01;
      dummy.rate = 10;
      globalThis.speechSynthesis.speak(dummy);
    }
  } catch {}

  // 4. تنفيذ أي نطق معلق كان ينتظر التفاعل
  if (pendingPlayback) {
    const { key, fallbackText, options } = pendingPlayback;
    pendingPlayback = null;
    speakKey(key, fallbackText, options);
  }

  // إشعار الواجهة بأن الصوت تم فتحه
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('audio-unlocked'));
  }
}

// ربط فتح القفل بأول تفاعل من المستخدم
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const handleFirstInteraction = () => {
    unlockAudioSystem();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleFirstInteraction, { capture: true }));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleFirstInteraction, { capture: true, once: true, passive: true }));
}

// ─── إيقاف كافة الأصوات فوراً ───
export function stopAudio() {
  currentPlaybackToken++;

  // إيقاف الـ Audio Element
  if (audioSingleton) {
    try {
      audioSingleton.pause();
      audioSingleton.currentTime = 0;
    } catch {}
  }

  // إيقاف الـ Speech Synthesis
  if (typeof globalThis !== 'undefined' && globalThis.speechSynthesis) {
    try {
      globalThis.speechSynthesis.cancel();
    } catch {}
  }
}

// ─── تنظيف النص من الرموز التعبيرية لتحسين نطق TTS ───
export function cleanSpeechText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, ' ')
    .replace(/[«»"'“”„`~*_#\[\]{}()<>➔→•|/\\=^~+−]/g, ' ')
    .replace(/[-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── اختيار أفضل صوت عربي طبيعي ───
export function selectBestVoice(voices, lang = 'ar') {
  if (!voices || !voices.length) return null;
  const targetPrefix = String(lang || 'ar').slice(0, 2).toLowerCase();
  const matching = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));
  if (!matching.length) {
    return voices.find(v => v.default) || voices[0] || null;
  }

  const scoreVoice = v => {
    let s = 0;
    const name = (v.name || '').toLowerCase();
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');

    if (name.includes('salma') || name.includes('zariyah') || name.includes('fatima') || name.includes('sana')) s += 300;
    if (name.includes('laila') || name.includes('mariam') || name.includes('zeina') || name.includes('hoda')) s += 200;
    if (name.includes('female') || name.includes('woman') || name.includes('girl')) s += 150;
    if (name.includes('natural') || name.includes('online') || name.includes('neural')) s += 100;
    if (name.includes('google')) s += 50;

    if (name.includes('shakir') || name.includes('hamed') || name.includes('hamdan') || 
        name.includes('naayf') || name.includes('maged') || name.includes('tarik') || 
        name.includes('youssef') || name.includes('male') || name.includes('man')) {
      s -= 200;
    }

    if (vLang === 'ar-sa' || vLang === 'ar-eg' || vLang === 'ar-ae') s += 25;
    if (!v.localService) s += 20;
    if (v.default) s += 5;
    return s;
  };

  return [...matching].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

// ─── الطبقة 2: تشغيل Web Speech API (احتياط ذكي) ───
export function speakTts(text, lang = 'ar', options = {}, token = null) {
  if (!globalThis.speechSynthesis) return false;

  const cleaned = cleanSpeechText(text);
  if (!cleaned) return false;

  try {
    if (globalThis.speechSynthesis.paused) {
      globalThis.speechSynthesis.resume();
    }
  } catch {}

  let voices = [];
  try {
    voices = globalThis.speechSynthesis.getVoices() || [];
  } catch {}
  const voice = selectBestVoice(voices, lang);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang === 'en' ? 'en-US' : 'ar-SA';
  }

  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  activeUtterances.add(utterance);
  if (typeof window !== 'undefined') window.__currentSpeechUtterance = utterance;

  const cleanup = () => {
    activeUtterances.delete(utterance);
    if (typeof window !== 'undefined' && window.__currentSpeechUtterance === utterance) {
      window.__currentSpeechUtterance = null;
    }
  };

  utterance.onend = cleanup;
  utterance.onerror = cleanup;

  try {
    setTimeout(() => {
      if (token !== null && token !== currentPlaybackToken) return;
      try {
        if (globalThis.speechSynthesis.paused) globalThis.speechSynthesis.resume();
        globalThis.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('TTS speak error:', err);
      }
    }, 15);
    return true;
  } catch {
    return false;
  }
}

// ─── الدالة الرئيسية للمنظومة الهجينة (Tier 1 -> Tier 2 -> Tier 3) ───
export async function speakKey(key, fallbackText = '', options = {}) {
  // إيقاف أي صوت سابق وتحديث توكن التشغيل
  stopAudio();
  const token = currentPlaybackToken;

  // إذا لم يكن الصوت مفعلاً، لا تفعل شيئاً
  if (options.enabled === false) return false;

  // التحقق مما إذا كان الصوت يحتاج فتح قفل أولاً على الجوال
  if (!isAudioUnlocked && typeof window !== 'undefined') {
    pendingPlayback = { key, fallbackText, options };
  }

  const entry = AUDIO_REGISTRY[key];
  const audioFilePath = entry ? entry.file : null;
  const spokenText = fallbackText || (entry ? entry.text : key);

  // ─── الطبقة 1: تشغيل ملف MP3 المسجل مسبقاً ───
  if (audioFilePath) {
    try {
      const audio = getAudioSingleton();
      if (audio) {
        // دعم المسارات النسبية المتوافقة مع public أو root
        const isPublicPath = typeof window !== 'undefined' && window.location.pathname.includes('/public/');
        const resolvedPath = isPublicPath && audioFilePath.startsWith('./') ? `.${audioFilePath}` : audioFilePath;

        audio.src = resolvedPath;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          await playPromise;
          // إذا تغير التوكن أثناء الانتظار، نوقف الصوت
          if (token !== currentPlaybackToken) {
            audio.pause();
            return false;
          }
          return true;
        }
      }
    } catch (err) {
      // إذا فشل تشغيل MP3 (ملف غير موجود أو قيد متصفح)، ننتقل للطبقة 2
      console.warn(`[Audio Tier-1 Fallback] تعذر تشغيل MP3 للمفتاح (${key}):`, err.message);
    }
  }

  // ─── الطبقة 2: تشغيل الاحتياط عبر Web Speech API ───
  const ttsSuccess = speakTts(spokenText, 'ar', options, token);
  if (ttsSuccess) {
    return true;
  }

  // ─── الطبقة 3: إشعار النظام بحالة الفشل للتعامل معها بصرياً ───
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('audio-playback-failed', {
      detail: { key, text: spokenText, inApp: detectInAppBrowser() }
    }));
  }

  return false;
}

// دالة التوافقية السابقة
export function speak(text, lang = 'ar', options = {}) {
  // البحث عن مفتاح يطابق النص إن وجد
  const matchingKey = Object.keys(AUDIO_REGISTRY).find(k => AUDIO_REGISTRY[k].text === text);
  if (matchingKey) {
    return speakKey(matchingKey, text, options);
  }
  stopAudio();
  return speakTts(text, lang, options, currentPlaybackToken);
}

// ─── مؤثر نغمة الراديو التفاعلية ───
export async function radioTune() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    webAudioCtx = webAudioCtx || new AudioContextClass();
    if (webAudioCtx.state === 'suspended') await webAudioCtx.resume();

    for (const [i, f] of [392, 440, 523.25, 440, 392, 329.63].entries()) {
      const o = webAudioCtx.createOscillator(), g = webAudioCtx.createGain(), t = webAudioCtx.currentTime + i * .22;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.035, t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.connect(g);
      g.connect(webAudioCtx.destination);
      o.start(t);
      o.stop(t + .21);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── دوال التوجيه الصوتي التفاعلية للمختبر المتحرك (Dynamic Lab Helpers) ───
export function speakIntro(mode = 'dynamic') {
  const msg = mode === 'dynamic'
    ? 'أَهْلًا بِكَ يَا بَطَلَ العُلُومِ فِي مُخْتَبَرِ شَرَارَةَ المُتَحَرِّك! اسْحَبِ البَطَّارِيَّةَ أَوِ القَابِسَ وَجَرِّبْ تَشْغِيلَ الأَجْهِزَةِ ثُلَاثِيَّةِ الأَبْعَاد!'
    : 'أَهْلًا بِكَ فِي النَّشَاطِ التَّقْوِيمِيِّ الثَّابِت!';
  return speak(msg, 'ar');
}

export function speakToolPick(tool) {
  const msg = tool === 'battery'
    ? 'اخْتَرْتَ البَطَّارِيَّةَ الجَافَّة! اسْحَبْهَا وَأَفْلِتْهَا فَوْقَ أَحَدِ الأَجْهِزَةِ لِتَجْرِبَةِ تَشْغِيلِه!'
    : 'اخْتَرْتَ قَابِسَ الكَهْرَبَاءِ 220 فُولْت! اسْحَبْهُ وَصِلْهُ بِالجِهَازِ لِمُشَاهَدَةِ مَا سَيَحْدُث!';
  return speak(msg, 'ar');
}

export function speakDropSuccess(deviceName, reason = '') {
  const msg = `رَائِعٌ جِدًّا! أَحْسَنْتَ عَمَلًا مُمَيَّزًا! اكْتَمَلَتِ الدَّائِرَةُ الكَهْرَبَائِيَّةُ وَتَمَّ تَشْغِيلُ ${deviceName} بِنَجَاح! ${reason}`;
  return speak(msg, 'ar');
}

export function speakDropIncompatible(deviceName, wrongReason = '') {
  const msg = `حَاوِلْ مَرَّةً أُخْرَى يَا بَطَل! جِهَازُ ${deviceName} لَا يَعْمَلُ بِهَذَا المَصْدَرِ. ${wrongReason}`;
  return speak(msg, 'ar');
}

export function speakHint(hintText) {
  const msg = `تَلْمِيحٌ ذَكِيّ: ${hintText}`;
  return speak(msg, 'ar');
}

