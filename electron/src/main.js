const { app, BrowserWindow, Tray, Menu, ipcMain, screen, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const { askGemini } = require('./gemini');
const { getLocation, getWeather, getLocalTime } = require('./location');
const { speak } = require('./tts');
const { ensureDesktopShortcut } = require('./shortcut');

const store = new Store({
  name: 'rabbit-ai-config',
  defaults: {
    geminiApiKey: '',
    voiceEnabled: true,
    windowPos: null,
  },
});

let mainWindow = null;
let tray = null;

const WIN_WIDTH = 380;
const WIN_HEIGHT = 560;

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const savedPos = store.get('windowPos');

  mainWindow = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: savedPos ? savedPos.x : workAreaSize.width - WIN_WIDTH - 24,
    y: savedPos ? savedPos.y : workAreaSize.height - WIN_HEIGHT - 24,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    icon: path.join(__dirname, '..', 'assets', 'icon-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('move', () => {
    const [x, y] = mainWindow.getPosition();
    store.set('windowPos', { x, y });
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'assets', 'tray-icon-32.png'));
  tray.setToolTip('RabbitAI 토끼비서');

  const menu = Menu.buildFromTemplate([
    {
      label: '토끼 보이기/숨기기',
      click: () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '바탕화면 바로가기 만들기',
      click: () => ensureDesktopShortcut(),
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  if (process.platform === 'win32') {
    ensureDesktopShortcut();
  }
});

app.on('window-all-closed', () => {
  // 트레이 상주 앱이므로 창을 닫아도 종료하지 않음 (macOS 제외 전 플랫폼 동일 처리)
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// 실제 SAPI 발화 시작/종료를 렌더러에 알려 토끼의 입 모양 애니메이션을 음성 길이에 맞춘다.
function speakAndNotify(text) {
  if (!store.get('voiceEnabled') || !text) return;
  speak(text, {
    onStart: () => mainWindow && mainWindow.webContents.send('tts:state', 'start'),
    onEnd: () => mainWindow && mainWindow.webContents.send('tts:state', 'end'),
  });
}

// ---------- IPC handlers ----------

ipcMain.handle('settings:get', () => ({
  hasApiKey: !!store.get('geminiApiKey'),
  voiceEnabled: store.get('voiceEnabled'),
}));

ipcMain.handle('settings:setApiKey', (_e, key) => {
  store.set('geminiApiKey', key || '');
  return true;
});

ipcMain.handle('settings:setVoiceEnabled', (_e, enabled) => {
  store.set('voiceEnabled', !!enabled);
  return true;
});

ipcMain.handle('ask:question', async (_e, question) => {
  const apiKey = store.get('geminiApiKey');
  if (!apiKey) {
    return {
      ok: false,
      error: 'NO_API_KEY',
      text: '아직 제 두뇌(Gemini API 키)가 연결되지 않았어요! 설정에서 키를 넣어주세요 🐰',
    };
  }
  try {
    const result = await askGemini({ apiKey, question });
    speakAndNotify(result.text);
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: 'API_ERROR', text: `앗, 답변을 가져오는 중 문제가 생겼어요: ${err.message}` };
  }
});

ipcMain.handle('info:weatherTime', async () => {
  try {
    const loc = await getLocation();
    const [weather, time] = await Promise.all([
      getWeather(loc.lat, loc.lon),
      Promise.resolve(getLocalTime(loc.timezone)),
    ]);
    const text = `지금 ${loc.city}는 ${time.hour}시 ${time.minute}분이고, 날씨는 ${weather.description}, 기온은 ${weather.temp}도예요.`;
    speakAndNotify(text);
    return { ok: true, location: loc, weather, time, text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('window:hide', () => mainWindow && mainWindow.hide());
ipcMain.handle('window:minimize', () => mainWindow && mainWindow.hide());
ipcMain.handle('window:quit', () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.handle('tts:speak', (_e, text) => {
  speakAndNotify(text);
});

ipcMain.handle('shell:openExternal', (_e, url) => shell.openExternal(url));
