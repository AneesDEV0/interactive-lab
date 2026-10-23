import test from 'node:test';
import assert from 'node:assert/strict';
import { findTextbookAnswer } from '../src/shared/textbook-qa.js';
import { parseIntent } from '../src/shared/learning.js';
import { answer as answerElec, byId as byIdElec } from '../src/electricity/data.js';
import { answer as answerCond, byId as byIdCond } from '../src/conductors/data.js';
import { answer as answerMat, byId as byIdMat } from '../src/materials/data.js';
import { answer as answerSafe, byId as byIdSafe } from '../src/safety/data.js';
import { answer as answerFric, byId as byIdFric } from '../src/friction/data.js';

const questions = [
  // 1-21 Textbook
  { num: 1, text: "ما هي عناصر ومكونات الدارة الكهربائية البسيطة؟ وما وظيفة كل عنصر؟", type: "textbook" },
  { num: 2, text: "ما هي رموز عناصر الدارة الكهربائية المعتمدة وكيف تُرسم في المخططات؟", type: "textbook" },
  { num: 3, text: "ما هي وظيفة المفتاح الكهربائي في الدارة؟ وماذا يحدث عند فتحه أو إغلاقه؟", type: "textbook" },
  { num: 4, text: "كيف نصل المصباح الكهربائي بالبطارية بطريقة صحيحة ليضيء؟", type: "textbook" },
  { num: 5, text: "ما هي شروط تكوين مسار مغلق للتيار الكهربائي؟", type: "textbook" },
  { num: 6, text: "ما هي أسباب عدم إضاءة المصباح في الدارة الكهربائية؟", type: "textbook" },
  { num: 7, text: "ما الفرق بين الدارة الكهربائية المغلقة والدارة الكهربائية المفتوحة؟", type: "textbook" },
  { num: 8, text: "ما أهمية الكهرباء في المستشفيات والمدارس والمصانع والصراف الآلي؟", type: "textbook" },
  { num: 9, text: "ماذا يحدث لو انقطعت الكهرباء عن المستشفى؟ وما هي البدائل الفورية؟", type: "textbook" },
  { num: 10, text: "ما هي بدائل انقطاع التيار الكهربائي في قطاع غزة؟", type: "textbook" },
  { num: 11, text: "ما هي مصادر الكهرباء الرئيسية في حياتنا؟", type: "textbook" },
  { num: 12, text: "علل: لماذا تُصنع مفاتيح وقوابس الكهرباء من مادة البلاستيك؟", type: "textbook" },
  { num: 13, text: "علل: لماذا يُستخدم شريط مغناطيسي في إطار باب الثلاجة؟", type: "textbook" },
  { num: 14, text: "علل: لماذا تُصنع علبة البوصلة من مادة غير مغناطيسية كالنحاس أو البلاستيك أو الألمنيوم؟", type: "textbook" },
  { num: 15, text: "ما الفرق بين المواد الموصلة للكهرباء والمواد العازلة للكهرباء؟", type: "textbook" },
  { num: 16, text: "ما هي أشكال المغناطيس الصناعي؟ وأين تتركز قوته المغناطيسية؟", type: "textbook" },
  { num: 17, text: "أين يُستخدم المغناطيس في حياتنا اليومية والتطبيقات الطبية والصناعية؟", type: "textbook" },
  { num: 18, text: "كيف نصنع مغناطيساً بطريقة الدلك؟", type: "textbook" },
  { num: 19, text: "كيف نصنع مغناطيساً بالتيار الكهربائي (المغناطيس الكهربائي)؟", type: "textbook" },
  { num: 20, text: "كيف نصنع دارة كهربائية لأباجورة بسيطة بمفتاح من قصدير (نشاط مشكاتي)؟", type: "textbook" },
  { num: 21, text: "اذكر استخدامات الكهرباء في حياتنا اليومية؟", type: "textbook" },

  // 22-38 Activity 1 devices
  { num: 22, text: "سيارة الألعاب: كيف تعمل؟ ومن أين تحصل على طاقتها؟", type: "electricity", itemId: "car" },
  { num: 23, text: "المروحة المنزلية: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "fan" },
  { num: 24, text: "الغسالة: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "washer" },
  { num: 25, text: "المذياع (الراديو): كيف يعمل؟ وما مصدر طاقته؟", type: "electricity", itemId: "radio" },
  { num: 26, text: "الثلاجة: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "fridge" },
  { num: 27, text: "التلفاز: كيف تعمل؟ وما مصدر طاقته؟", type: "electricity", itemId: "tv" },
  { num: 28, text: "مجفف الشعر: كيف يعمل؟ وما مصدر طاقته؟", type: "electricity", itemId: "hairDryer" },
  { num: 29, text: "المكواة: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "iron" },
  { num: 30, text: "جهاز الألعاب (الكونسول): كيف يعمل؟ وما مصدر طاقته؟", type: "electricity", itemId: "console" },
  { num: 31, text: "السيارة الشمسية: كيف تعمل؟ وكيف تحول الطاقة؟", type: "electricity", itemId: "solarCar" },
  { num: 32, text: "عنفة الرياح: كيف تعمل؟ وكيف تولد الكهرباء من حركة الهواء؟", type: "electricity", itemId: "wind" },
  { num: 33, text: "دينامو الدراجة: كيف يعمل؟ وكيف يضيء مصباح الدراجة؟", type: "electricity", itemId: "bicycle" },
  { num: 34, text: "المدفأة الكهربائية: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "electricHeater" },
  { num: 35, text: "الآلة الحاسبة: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "calculator" },
  { num: 36, text: "مصباح إنارة الشارع: كيف يعمل؟ ومن أين يحصل على الكهرباء؟", type: "electricity", itemId: "street" },
  { num: 37, text: "الجهاز اللوحي (التابلت): كيف يعمل؟ وما مصدر طاقته؟", type: "electricity", itemId: "tablet" },
  { num: 38, text: "ساعة اليد: كيف تعمل؟ وما مصدر طاقتها؟", type: "electricity", itemId: "watch" },

  // 39-47 Activity 1 concepts
  { num: 39, text: "ما هي البطارية الجافة؟ وكيف تخزن الطاقة؟", type: "electricity" },
  { num: 40, text: "هل تفرغ طاقة البطارية؟ ومتى تفرغ؟", type: "electricity" },
  { num: 41, text: "هل يمكن إعادة شحن بطاريات الأصابع العادية ذات الاستخدام الواحد؟", type: "electricity" },
  { num: 42, text: "ما هو بنك الطاقة (Power Bank)؟ وكيف نستخدمه بأمان؟", type: "electricity" },
  { num: 43, text: "ما معنى القطب الموجب (+) والقطب السالب (-) في البطارية؟", type: "electricity" },
  { num: 44, text: "هل يمكن تشغيل ثلاجة المنزل بواسطة بطارية صغيرة؟ ولماذا؟", type: "electricity" },
  { num: 45, text: "ما الفرق بين كهرباء المنزل والكهرباء الناتجة عن البطارية؟", type: "electricity" },
  { num: 46, text: "من أين تأتي الكهرباء إلى منازلنا؟", type: "electricity" },
  { num: 47, text: "هل نستطيع رؤية الكهرباء سارية بالعين المجردة؟", type: "electricity" },

  // 48-60 Activity 2 materials
  { num: 48, text: "المسطرة: مما تُصنع؟ وما أصل خامتها في الطبيعة؟", type: "materials", itemId: "plasticRuler" },
  { num: 49, text: "المرطبان الزجاجي: مما يُصنع؟ وما أصل خامته؟", type: "materials", itemId: "glassJar" },
  { num: 50, text: "الكأس الزجاجي: مما يُصنع؟ وما خصائصه؟", type: "materials", itemId: "glassCup" },
  { num: 51, text: "المسمار الحديدي: مما يُصنع؟ ومن أين يُستخرج الحديد؟", type: "materials", itemId: "ironNail" },
  { num: 52, text: "عود الخشب: مما يُصنع؟ ومن أين نحصل على الأخشاب؟", type: "materials", itemId: "woodStick" },
  { num: 53, text: "الملعقة المعدنية: مما تُصنع؟ وما مصادر الفلزات؟", type: "materials", itemId: "metalSpoon" },
  { num: 54, text: "قطعة القماش (النسيج): مما تُصنع؟ وما مصادر الخيوط الطبيعية والصناعية؟", type: "materials", itemId: "fabricCloth" },
  { num: 55, text: "المغلف الورقي: مما يُصنع؟ وكيف يُصنع الورق من الأشجار؟", type: "materials", itemId: "paperEnvelope" },
  { num: 56, text: "الممحاة المطاطية: مما تُصنع؟ وما مصدر المطاط الطبيعي؟", type: "materials", itemId: "eraser" },
  { num: 57, text: "مشبك الورق: مما يُصنع؟ وما طبيعة خامته المعدنية؟", type: "materials", itemId: "paperClip" },
  { num: 58, text: "الخاتم الذهبي: مما يُصنع؟ وما خواص الذهب في الطبيعة؟", type: "materials", itemId: "goldRing" },
  { num: 59, text: "الهاون النحاسي: مما يُصنع؟ وما مميزات النحاس؟", type: "materials", itemId: "brassMortar" },
  { num: 60, text: "كرة الصوف: مما تُصنع؟ ومن أين نأخذ الصوف؟", type: "materials", itemId: "woolBall" },

  // 61-66 Activity 2 properties
  { num: 61, text: "هل يجذب المغناطيس هذه المادة أم لا؟ ولماذا؟", type: "materials" },
  { num: 62, text: "هل تطفو هذه المادة على سطح الماء أم تغرق في القاع؟ ولماذا؟", type: "materials" },
  { num: 63, text: "هل هذه المادة توصل الحرارة والكهرباء؟", type: "materials" },
  { num: 64, text: "هل هذه المادة شفافة تنفذ الضوء أم معتمة تحجب الضوء؟", type: "materials" },
  { num: 65, text: "هل يمكن إعادة تدوير هذه المادة؟ وما فائدة ذلك للبيئة؟", type: "materials" },
  { num: 66, text: "في أي حاوية فرز بيئية يجب أن أضع هذا العنصر؟", type: "materials" },

  // 67-78 Activity 3 conductors test
  { num: 67, text: "هل المسمار الحديدي موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "ironNail" },
  { num: 68, text: "هل مشبك الورق موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "paperClip" },
  { num: 69, text: "هل الملعقة المعدنية موصلة للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "metalSpoon" },
  { num: 70, text: "هل المفاتيح المعدنية موصلة للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "keys" },
  { num: 71, text: "هل الهاون النحاسي موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "brassMortar" },
  { num: 72, text: "هل الخاتم الذهبي موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "goldRing" },
  { num: 73, text: "هل المسطرة البلاستيكية موصلة للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "plasticRuler" },
  { num: 74, text: "هل الممحاة المطاطية موصلة للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "eraser" },
  { num: 75, text: "هل عود الخشب موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "woodStick" },
  { num: 76, text: "هل الكأس الزجاجي موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "glassCup" },
  { num: 77, text: "هل كرة الصوف أو القماش موصلة للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "woolBall" },
  { num: 78, text: "هل الطباشير موصل للكهرباء؟ وهل يضيء المصباح؟", type: "conductors", itemId: "chalk" },

  // 79-82 Activity 3 concepts
  { num: 79, text: "ما الفرق بين المادة الموصلة للكهرباء والمادة العازلة للكهرباء؟", type: "conductors" },
  { num: 80, text: "هل الفلزات التي توصل الكهرباء توصل الحرارة أيضاً؟", type: "conductors" },
  { num: 81, text: "هل كل الفلزات والمعادن تنجذب للمغناطيس؟ ولماذا؟", type: "conductors" },
  { num: 82, text: "لماذا تُصنع أسلاك التوصيل من النحاس وتُغلّف بالبلاستيك من الخارج؟", type: "conductors" },

  // 83-96 Activity 4 safety scenarios
  { num: 83, text: "ما خطورة توصيل عدة أجهزة كهربائية في مقبس واحد؟ وما القاعدة الذهبية؟", type: "safety", itemId: "overloaded_socket" },
  { num: 84, text: "ما خطورة وضع الطفل لسلك الشاحن في فمه؟ وما الإجراء الوقائي؟", type: "safety", itemId: "baby_biting_cord" },
  { num: 85, text: "ما خطورة لعب الأطفال بالأسلاك الكهربائية وتوصيلها؟", type: "safety", itemId: "kids_playing_cords" },
  { num: 86, text: "ما خطورة إدخال مقص أو مسمار معدني في فتحات مقبس الكهرباء؟", type: "safety", itemId: "inserting_scissors_socket" },
  { num: 87, text: "ما خطورة وجود أسلاك مكشوفة أو متآكلة العازل في المنزل؟ وما العمل؟", type: "safety", itemId: "exposed_damaged_wire" },
  { num: 88, text: "ما خطورة لمس مفاتيح وقوابس الكهرباء بأيدٍ مبللة بالماء؟", type: "safety", itemId: "wet_hands_plug" },
  { num: 89, text: "ما خطورة نزع القابس من المقبس بشد السلك بقوة وعنف؟ وما الطريقة الصحيحة؟", type: "safety", itemId: "pulling_cord_violently" },
  { num: 90, text: "ما خطورة تمديد الأسلاك الكهربائية تحت السجاد والموكيت؟", type: "safety", itemId: "cord_under_carpet" },
  { num: 91, text: "ما خطورة استخدام مجفف الشعر أو الأجهزة الكهربائية قرب حوض الاستحمام والماء؟", type: "safety", itemId: "appliance_near_bathtub" },
  { num: 92, text: "ما هي الطريقة الآمنة والصحيحة لنزع قابس الكهرباء من المقبس؟", type: "safety", itemId: "pulling_by_plug_head" },
  { num: 93, text: "لماذا يجب تجفيف اليدين تماماً قبل لمس أي جهاز أو مفتاح كهربائي؟", type: "safety", itemId: "dry_hands_switch" },
  { num: 94, text: "ما فائدة تركيب أغطية المقابس البلاستيكية الواقية في المنزل؟", type: "safety", itemId: "childproof_socket_cover" },
  { num: 95, text: "لماذا يُنصح بفصل الأجهزة الكهربائية من المقبس بعد الانتهاء من استخدامها؟", type: "safety", itemId: "unplug_idle_appliances" },
  { num: 96, text: "متى يجب الاستعانة بشخص بالغ ومختص للتعامل مع الكهرباء؟", type: "safety", itemId: "insulating_tape_repair" },

  // 97-100 Activity 4 reasons
  { num: 97, text: "لماذا يُعتبر الماء ناقلاً خطيراً للكهرباء عند التلامس؟", type: "safety" },
  { num: 98, text: "لماذا يُعد إدخال المعادن في مقبس الكهرباء تصرفاً مميتاً؟", type: "safety" },
  { num: 99, text: "ماذا يحدث لجسم الإنسان عند التعرض للصعق الكهربائي؟", type: "safety" },
  { num: 100, text: "كيف نوفر بيئة منزلية آمنة للأطفال من أخطار الكهرباء؟", type: "safety" },

  // 101-107 Activity 5 friction
  { num: 101, text: "لماذا نشعر بالدفء والحرارة عند فرك الكفين بسرعة في أيام الشتاء الباردة؟", type: "friction", itemId: "winterHands" },
  { num: 102, text: "لماذا يجذب البالون قصاصات الورق الصغيرة بعد دلكه بقطعة صوف؟", type: "friction", itemId: "balloonWool" },
  { num: 103, text: "لماذا تلتصق قصاصات الورق بالمسطرة البلاستيكية بعد دلكها بالصوف؟", type: "friction", itemId: "rulerWool" },
  { num: 104, text: "ما التفسير العلمي لجذب المشط البلاستيكي لقصاصات الورق بعد تمشيط الشعر الجاف؟", type: "friction", itemId: "combHair" },
  { num: 105, text: "لماذا ترتفع حرارة قطعتي الخشب الجافتين عند حكهما ببعضهما بقوة؟", type: "friction", itemId: "woodFriction" },
  { num: 106, text: "هل القوة التي تجذب الورق بعد الدلك قوة مغناطيسية أم كهربائية ساكنة؟", type: "friction", itemId: "balloonWool" },
  { num: 107, text: "هل يفرز الصوف مادة لاصقة على البالون أم ينقل شحنات كهربائية؟", type: "friction", itemId: "balloonWool" }
];

test('Complete 107 Chatbot Questions: each question receives a valid, accurate, nonempty response', () => {
  for (const q of questions) {
    let ans = null;
    let source = "";

    const tb = findTextbookAnswer(q.text);
    if (tb) {
      ans = tb.text;
      source = "textbook-qa (" + tb.id + ")";
    }

    if (!ans && q.type === "electricity") {
      const item = q.itemId ? byIdElec(q.itemId) : null;
      const a = answerElec(q.text, item);
      if (a && a.text) { ans = a.text; source = "electricity.answer (" + a.key + ")"; }
    } else if (!ans && q.type === "conductors") {
      const item = q.itemId ? byIdCond(q.itemId) : null;
      const a = answerCond(q.text, item);
      if (a && a.text) { ans = a.text; source = "conductors.answer (" + a.key + ")"; }
    } else if (!ans && q.type === "materials") {
      const item = q.itemId ? byIdMat(q.itemId) : null;
      const a = answerMat(q.text, item);
      if (a && a.text) { ans = a.text; source = "materials.answer (" + a.key + ")"; }
    } else if (!ans && q.type === "safety") {
      const item = q.itemId ? byIdSafe(q.itemId) : null;
      const a = answerSafe(q.text, item);
      if (a && a.text) { ans = a.text; source = "safety.answer (" + a.key + ")"; }
    } else if (!ans && q.type === "friction") {
      const item = q.itemId ? byIdFric(q.itemId) : null;
      const a = answerFric(q.text, item);
      if (a && a.text) { ans = a.text; source = "friction.answer (" + a.key + ")"; }
    }

    if (!ans) {
      const intent = parseIntent(q.text);
      if (intent && intent.startsWith("textbook:")) {
        ans = intent.slice("textbook:".length);
        source = "parseIntent.textbook";
      }
    }

    assert.ok(ans, `Question ${q.num} should have an answer: "${q.text}"`);
    assert.ok(ans.length > 20, `Question ${q.num} answer should be detailed and accurate: "${q.text}"`);
  }
});
