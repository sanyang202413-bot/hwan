const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rabbitAPI', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setApiKey: (key) => ipcRenderer.invoke('settings:setApiKey', key),
  setVoiceEnabled: (enabled) => ipcRenderer.invoke('settings:setVoiceEnabled', enabled),

  ask: (question) => ipcRenderer.invoke('ask:question', question),
  getWeatherTime: () => ipcRenderer.invoke('info:weatherTime'),
  speak: (text) => ipcRenderer.invoke('tts:speak', text),

  hideWindow: () => ipcRenderer.invoke('window:hide'),
  quitApp: () => ipcRenderer.invoke('window:quit'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  onTtsState: (callback) => {
    const listener = (_e, state) => callback(state);
    ipcRenderer.on('tts:state', listener);
    return () => ipcRenderer.removeListener('tts:state', listener);
  },
});
