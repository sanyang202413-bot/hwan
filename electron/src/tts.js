const { app } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PS_SCRIPT = path.join(__dirname, 'speak.ps1');

/**
 * Windows 내장 SAPI(System.Speech)로 텍스트를 귀여운 톤(높은 피치 + 살짝 빠른 속도,
 * 가능하면 여성/어린이 음색)으로 읽어준다. Windows가 아닌 환경에서는 조용히 무시한다.
 */
function speak(text) {
  if (process.platform !== 'win32' || !text) return;

  const tmpFile = path.join(os.tmpdir(), `rabbitai-tts-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, text, { encoding: 'utf8' });
  } catch (err) {
    console.error('TTS temp file write failed:', err);
    return;
  }

  const ps = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-TextPath', tmpFile],
    { windowsHide: true }
  );

  ps.on('error', (err) => console.error('TTS spawn failed:', err));
  ps.on('close', () => {
    fs.unlink(tmpFile, () => {});
  });
}

module.exports = { speak };
