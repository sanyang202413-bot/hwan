const chatLog = document.getElementById('chat-log');
const composer = document.getElementById('composer');
const input = document.getElementById('question-input');
const rabbitInner = document.getElementById('rabbit-inner');
const infoText = document.getElementById('info-text');
const btnRefreshInfo = document.getElementById('btn-refresh-info');
const btnVoice = document.getElementById('btn-voice');
const btnSettings = document.getElementById('btn-settings');
const btnMinimize = document.getElementById('btn-minimize');
const btnQuit = document.getElementById('btn-quit');

const settingsOverlay = document.getElementById('settings-overlay');
const apiKeyInput = document.getElementById('api-key-input');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');

let voiceEnabled = true;

function addMessage(text, who = 'bot') {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function addSources(sources) {
  if (!sources || !sources.length) return;
  const div = document.createElement('div');
  div.className = 'msg sources';
  div.textContent = '출처: ' + sources.slice(0, 3).map((s) => s.title || s.uri).join(' · ');
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

let speakingFailSafe = null;

function setSpeaking(isSpeaking) {
  rabbitInner.classList.toggle('talking', isSpeaking);
  clearTimeout(speakingFailSafe);
  if (isSpeaking) {
    // 어떤 이유로든 tts:state 'end'가 유실될 경우를 대비한 최대 지속 시간
    speakingFailSafe = setTimeout(() => rabbitInner.classList.remove('talking'), 20000);
  }
}

// 메인 프로세스가 보내는 실제 SAPI 발화 시작/종료 이벤트로 입 모양 애니메이션을 구동한다.
window.rabbitAPI.onTtsState((state) => setSpeaking(state === 'start'));

async function refreshInfo() {
  infoText.textContent = '위치/날씨 불러오는 중...';
  const res = await window.rabbitAPI.getWeatherTime();
  if (res.ok) {
    infoText.textContent = `${res.location.city} · ${res.time.hour}:${res.time.minute} · ${res.weather.description} ${res.weather.temp}°C`;
  } else {
    infoText.textContent = '위치/날씨 정보를 가져오지 못했어요';
  }
}

async function handleAsk(question) {
  addMessage(question, 'user');
  input.value = '';
  const thinking = addMessage('생각하는 중... 🐰', 'bot');

  const res = await window.rabbitAPI.ask(question);
  thinking.remove();

  addMessage(res.text, 'bot');
  if (res.ok) addSources(res.sources);
  // 실제 말하기 애니메이션은 main 프로세스의 tts:state 이벤트(onTtsState)로 트리거된다.
}

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  handleAsk(q);
});

btnRefreshInfo.addEventListener('click', refreshInfo);

btnVoice.addEventListener('click', async () => {
  voiceEnabled = !voiceEnabled;
  await window.rabbitAPI.setVoiceEnabled(voiceEnabled);
  btnVoice.textContent = voiceEnabled ? '🔊' : '🔇';
  btnVoice.classList.toggle('active', voiceEnabled);
});

btnMinimize.addEventListener('click', () => window.rabbitAPI.hideWindow());
btnQuit.addEventListener('click', () => window.rabbitAPI.quitApp());

btnSettings.addEventListener('click', () => settingsOverlay.classList.remove('hidden'));
btnCloseSettings.addEventListener('click', () => settingsOverlay.classList.add('hidden'));

btnSaveSettings.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  await window.rabbitAPI.setApiKey(key);
  settingsOverlay.classList.add('hidden');
  addMessage('설정이 저장됐어요! 이제 질문해보세요 🐰', 'bot');
});

async function init() {
  const settings = await window.rabbitAPI.getSettings();
  voiceEnabled = settings.voiceEnabled !== false;
  btnVoice.textContent = voiceEnabled ? '🔊' : '🔇';
  btnVoice.classList.toggle('active', voiceEnabled);

  if (!settings.hasApiKey) {
    addMessage('처음 오셨네요! 오른쪽 위 ⚙️ 설정에서 Gemini API 키를 먼저 등록해주세요.', 'bot');
    settingsOverlay.classList.remove('hidden');
  }

  refreshInfo();
}

init();
