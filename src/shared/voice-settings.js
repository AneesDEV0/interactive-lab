import {modal,esc} from './components.js';

export async function mountVoiceSettings(audio){
  document.querySelector('#app').insertAdjacentHTML('beforeend',modal('voice-settings','إعدادات الصوت',`
    <p>اختر مصدرًا واحدًا لصوت شرارة.</p>
    <label for="voice-mode">مصدر الصوت</label>
    <select id="voice-mode"><option value="recordings">صوت سَنا — الأردن (المعتمد)</option><option value="device">قراءة بصوت الجهاز</option></select>
    <p id="voice-description" class="muted"></p>
    <div id="device-voice-options" hidden><label for="device-voice">الصوت العربي على جهازك</label><select id="device-voice"></select></div>
    <label for="voice-rate">سرعة القراءة</label><select id="voice-rate"><option value="0.9">أبطأ قليلًا</option><option value="1">السرعة الأصلية</option><option value="1.1">أسرع قليلًا</option></select>
    <button id="preview-voice" class="primary">جرّب الصوت</button>
    <p>نص التجربة: البطارية تُزوِّد سيارة الألعاب بالكهرباء، فيُحوِّل المحرّك الطاقة إلى حركة.</p>
    <p id="voice-preview-status" role="status" class="muted"></p>
    <small>التسجيلات المعتمدة مسجلة بصوت «سَنا — الأردن» ومحفوظة محليًا للعمل دون إنترنت. عند اختيار قراءة الجهاز، يُستخدم الصوت المحلي المثبت على نظامك.</small>`));
  const button=document.createElement('button');button.textContent='إعدادات الصوت';button.dataset.open='voice-settings';
  (document.querySelector('.assistant details')||document.querySelector('#help')).append(button);
  const $=id=>document.getElementById(id);
  const refresh=()=>{
    const voices=audio.voices();$('device-voice').innerHTML=voices.length?voices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)}</option>`).join(''):'<option value="">لا يوجد صوت عربي محلي</option>';
    if(voices.some(v=>v.voiceURI===audio.preferences.voiceURI))$('device-voice').value=audio.preferences.voiceURI;
    $('voice-mode').value=audio.preferences.mode;$('voice-rate').value=String(audio.preferences.rate);
    $('device-voice-options').hidden=audio.preferences.mode!=='device';
    $('voice-description').textContent=audio.preferences.mode==='device'?'هذا صوت آلي من جهازك؛ قد يختلف وضوح العربية من جهاز لآخر.':(audio.preferences.mode==='human'||audio.preferences.mode==='recordings')?'صوت سَنا — الأردن المعتمد لجميع أنشطة المنصة التعليمية.':'صوت ثابت من ملفات الموقع.';
  };
  $('voice-mode').onchange=()=>{audio.configure({mode:$('voice-mode').value});refresh();};
  $('device-voice').onchange=()=>audio.configure({voiceURI:$('device-voice').value});
  $('voice-rate').onchange=()=>audio.configure({rate:Number($('voice-rate').value)});
  $('preview-voice').onclick=()=>audio.speak('البطارية تُزوِّد سيارة الألعاب بالكهرباء، فيُحوِّل المحرّك الطاقة إلى حركة.',true);
  $('voice-settings').addEventListener('close',()=>audio.stop());
  window.speechSynthesis?.addEventListener('voiceschanged',refresh);
  await audio.manifestReady;
  if(audio.humanRecordings.length)$('voice-mode').insertAdjacentHTML('beforeend','<option value="human">التسجيل البشري</option>');
  else if(audio.preferences.mode==='human')audio.configure({mode:'recordings'});
  refresh();
}
