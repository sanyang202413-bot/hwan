# 인식 모델 보관 자리 (선택)

이 폴더가 비어 있으면 게임은 Google 공식 주소에서 인식 모델을 받아 씁니다. 대부분은 그대로 두면 됩니다.

행사장 인터넷에서 Google 주소가 막히는 경우까지 대비하려면, 아래 파일을 내려받아 **이름을 바꾸지 말고** 이 폴더에 올려 두세요. 파일이 있으면 게임이 이 폴더의 모델을 먼저 씁니다.

| 파일 이름 | 용도 | 내려받기 |
|---|---|---|
| `pose_landmarker_lite.task` | 기본 (가벼움 · 모바일 권장) | https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task |
| `pose_landmarker_full.task` | 세부 설정의 "정밀 · PC 권장" | https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task |

모델은 Google MediaPipe가 공개한 파일입니다.
