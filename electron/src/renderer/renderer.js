const chatLog = document.getElementById('chat-log');
const composer = document.getElementById('composer');
const input = document.getElementById('question-input');
const avatar = document.getElementById('rabbit-avatar');
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

function setSpeaking(isSpeaking) {
  avatar.classList.toggle('speaking', isSpeaking);
}

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

  if (voiceEnabled) {
    setSpeaking(true);
    const estMs = Math.min(Math.max(res.text.length * 90, 1200), 12000);
    setTimeout(() => setSpeaking(false), estMs);
  }
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
