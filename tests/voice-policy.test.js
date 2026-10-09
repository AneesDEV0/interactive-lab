import test from 'node:test';
import assert from 'node:assert/strict';
import {findRecording,selectArabicVoice,readVoicePreferences} from '../src/shared/voice-policy.js';
test('Default narration uses recordings, never an unrequested synthetic voice',()=>{assert.equal(readVoicePreferences(null).mode,'recordings');assert.equal(readVoicePreferences('broken').rate,1);});
test('Voice settings persist only allowed modes and moderate rates',()=>{assert.deepEqual(readVoicePreferences('{"mode":"device","rate":1.1,"voiceURI":"chosen"}'),{mode:'device',rate:1.1,voiceURI:'chosen'});assert.equal(readVoicePreferences('{"rate":4}').rate,1);});
test('Selected local Arabic narrator remains stable when voice ordering changes',()=>{const a={voiceURI:'A',lang:'ar-SA',localService:true},b={voiceURI:'B',lang:'ar-EG',localService:true};assert.equal(selectArabicVoice([a,b],'B'),b);assert.equal(selectArabicVoice([b,a],'B'),b);assert.equal(selectArabicVoice([{lang:'ar-SA',localService:false}]),null);});
test('Recording matching tolerates whitespace but never changes Arabic meaning or diacritics',()=>{assert.equal(findRecording({r:'تأمّل  الجهاز.'},'تأمّل الجهاز.'),'r');assert.equal(findRecording({r:'هذه المادة موصلة.'},'هذه المادة عازلة.'),null);assert.equal(findRecording({r:'شَغّل'},'شُغّل'),null);});
