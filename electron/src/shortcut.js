const { app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * 바탕화면에 RabbitAI 바로가기(.lnk)를 생성한다.
 * - 설치 버전(NSIS)은 설치 시 자동으로 만들어지지만, 포터블 실행/재생성 요청 시
 *   PowerShell WScript.Shell COM 객체로 직접 .lnk를 만든다.
 */
function ensureDesktopShortcut() {
  if (process.platform !== 'win32') return;

  const desktop = app.getPath('desktop');
  const shortcutPath = path.join(desktop, 'RabbitAI 토끼비서.lnk');
  const targetExe = process.execPath;
  const iconPath = path.join(process.resourcesPath || path.join(__dirname, '..'), 'assets', 'icon.ico');
  const fallbackIcon = path.join(__dirname, '..', 'assets', 'icon.ico');
  const icon = fs.existsSync(iconPath) ? iconPath : fallbackIcon;

  const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
$Shortcut.TargetPath = "${targetExe.replace(/\\/g, '\\\\')}"
$Shortcut.WorkingDirectory = "${path.dirname(targetExe).replace(/\\/g, '\\\\')}"
$Shortcut.IconLocation = "${icon.replace(/\\/g, '\\\\')}"
$Shortcut.Description = "RabbitAI 토끼비서 실행"
$Shortcut.Save()
`;

  const tmpPs1 = path.join(os.tmpdir(), `rabbitai-shortcut-${Date.now()}.ps1`);
  fs.writeFileSync(tmpPs1, psScript, 'utf8');

  const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tmpPs1], {
    windowsHide: true,
  });
  ps.on('close', () => fs.unlink(tmpPs1, () => {}));
  ps.on('error', (err) => console.error('바로가기 생성 실패:', err));
}

module.exports = { ensureDesktopShortcut };
