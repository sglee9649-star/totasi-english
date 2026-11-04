# 토타시 영어
토타시와 함께 공부하는 개인용 영어 회화 PWA. 정적 파일이라 GitHub Pages 등 HTTPS 호스팅에 그대로 올리면 됩니다.
- 로컬 실행: `python3 -m http.server` 후 http://localhost:8000
- 로직 테스트: `node tests/srs.test.js`
- 파일을 바꾸면 `app.js`의 APP_VERSION과 `sw.js`의 CACHE 버전을 함께 올려 주세요.
- 새 학습 모드는 `app.js`의 STUDY_MENU에 추가합니다.
- AI 교정은 Claude API(claude-haiku-5-5)를 브라우저에서 직접 호출하며, 키는 각 기기 설정에 저장됩니다.
