const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PS_SCRIPT = path.join(__dirname, 'speak.ps1');

/**
 * Windows 내장 SAPI(System.Speech)로 텍스트를 귀여운 톤(높은 피치 + 살짝 빠른 속도,
 * 가능하면 여성/어린이 음색)으로 읽어준다. Windows가 아닌 환경에서는 조용히 무시한다.
 * onStart/onEnd 콜백으로 실제 발화 시작/종료 시점을 알려줘서 렌더러의 입 모양
 * 애니메이션을 실제 음성 길이에 맞출 수 있게 한다.
 */
function speak(text, { onStart, onEnd } = {}) {
  if (process.platform !== 'win32' || !text) {
    onEnd?.();
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `rabbitai-tts-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, text, { encoding: 'utf8' });
  } catch (err) {
    console.error('TTS temp file write failed:', err);
    onEnd?.();
    return;
  }

  const ps = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-TextPath', tmpFile],
    { windowsHide: true }
  );

  ps.on('spawn', () => onStart?.());
  ps.on('error', (err) => {
    console.error('TTS spawn failed:', err);
    onEnd?.();
  });
  ps.on('close', () => {
    fs.unlink(tmpFile, () => {});
    onEnd?.();
  });
}

module.exports = { speak };
