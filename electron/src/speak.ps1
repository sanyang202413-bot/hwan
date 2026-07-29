# RabbitAI 귀여운 음성 출력 스크립트
# 텍스트 파일을 읽어 SSML로 감싼 뒤 피치를 올리고 속도를 살짝 빠르게 하여
# 귀엽고 앳된 토끼 느낌의 목소리로 읽어준다 (Windows 내장 SAPI 사용, 무료).
param(
    [Parameter(Mandatory = $true)][string]$TextPath
)

Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

try {
    $synth.SelectVoiceByHints(
        [System.Speech.Synthesis.VoiceGender]::Female,
        [System.Speech.Synthesis.VoiceAge]::Child
    )
} catch {
    try {
        $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
    } catch {}
}

$synth.Rate = 2
$synth.Volume = 100

$text = Get-Content -LiteralPath $TextPath -Raw -Encoding UTF8
if (-not $text) { exit 0 }

$escaped = [System.Security.SecurityElement]::Escape($text)
$ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR"><prosody pitch="+35%" rate="+15%">' + $escaped + '</prosody></speak>'

try {
    $synth.SpeakSsml($ssml)
} catch {
    $synth.Speak($text)
}
