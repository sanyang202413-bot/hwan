# RabbitAI 🐰 - 토끼 AI 데스크톱 위젯 (Windows)

바탕화면에 상주하는 귀여운 토끼 모양 AI 비서 위젯입니다.

## 기능

1. **실시간 팩트체크 질의응답** — Gemini API의 Google 검색 그라운딩(`google_search` 도구)을
   사용해, 질문에 답하기 전 웹에서 최신 사실을 확인한 뒤 답변합니다. 확인되지 않은 내용은
   추측하지 않고 모른다고 답합니다.
2. **위치 기반 날씨/시간** — IP 기반 위치 조회(API 키 불필요) 후 Open-Meteo로 실시간 날씨를
   가져와 바로 보여줍니다.
3. **바탕화면 바로가기** — 설치 시 자동으로 바탕화면 바로가기가 생성되며, 트레이 메뉴에서
   "바탕화면 바로가기 만들기"로 언제든 재생성할 수 있습니다.
4. **귀여운 토끼 음성 답변** — Windows 내장 SAPI 음성엔진을 SSML로 제어해 피치를 높이고
   속도를 살짝 올려 귀여운 톤으로 모든 답변을 읽어줍니다(무료, 추가 설치 불필요).

## 실행 파일 (바로 사용)

`dist/` 폴더에 있는 실행 파일 중 하나를 사용하면 됩니다 (별도 채팅으로 전달됨).

- `RabbitAI Setup 1.0.0.exe` — 설치형. 실행하면 설치 마법사가 뜨고, 바탕화면/시작메뉴
  바로가기가 자동으로 생성됩니다. **권장**.
- `RabbitAI 1.0.0.exe` — 포터블 버전. 설치 없이 바로 실행됩니다. 바탕화면 바로가기가
  필요하면 트레이 메뉴에서 생성하세요.

최초 실행 후 트레이(작업표시줄 우측 하단)의 토끼 아이콘을 클릭하면 위젯이 나타납니다.

## 최초 설정 — Gemini API 키

1. https://aistudio.google.com/apikey 에서 무료로 Gemini API 키를 발급받습니다.
2. 위젯 우측 상단 ⚙️(설정) 버튼을 눌러 키를 입력하고 저장합니다.
3. 키는 이 PC의 사용자 폴더(`%APPDATA%/RabbitAI`)에만 저장되며 외부로 전송되지 않습니다.

## 소스에서 직접 빌드하기

```bash
npm install
npm start          # 개발 모드 실행
npm run build:win  # Windows용 .exe 빌드 (dist/ 에 생성)
```

## 프로젝트 구조

```
electron/
  src/
    main.js        # 메인 프로세스, 트레이, 창, IPC
    preload.js      # contextBridge로 렌더러에 안전한 API 노출
    gemini.js        # Gemini 검색 그라운딩 팩트체크
    location.js      # IP 위치 + 날씨(Open-Meteo)
    tts.js / speak.ps1  # Windows SAPI 기반 귀여운 음성 출력
    shortcut.js       # 바탕화면 바로가기 생성
    renderer/          # 위젯 UI (HTML/CSS/JS)
  assets/            # 토끼 아이콘 (앱 아이콘, 트레이 아이콘)
  scripts/gen_icons.py  # 아이콘 생성 스크립트
```

## 참고 사항

- 음성 출력과 바탕화면 바로가기 자동 생성은 Windows 전용 기능입니다.
- 위치/날씨/Gemini 호출은 실제 인터넷 연결이 있는 Windows PC에서 정상 동작합니다
  (개발 환경인 리눅스 샌드박스는 외부 네트워크가 제한되어 있어 UI/로직만 검증했습니다).
- Gemini API는 무료 등급으로도 사용 가능하지만, 요청량에 따라 Google의 요금 정책이
  적용될 수 있습니다.
