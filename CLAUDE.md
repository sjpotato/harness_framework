# 프로젝트: YT 댓글 인사이트

## 기술 스택
- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS
- 외부 API: YouTube Data API v3 (`commentThreads.list`), Anthropic Claude API — 둘 다 브라우저에서 직접 호출
- 서버/백엔드/DB 없음 — 정적 SPA (자세한 내용은 `docs/ARCHITECTURE.md`, `docs/ADR.md` 참고)

## 아키텍처 규칙
- CRITICAL: API 라우트나 서버 코드를 추가하지 않는다. 모든 외부 API 호출은 `src/services/`를 통해 브라우저에서 직접 수행한다 (ADR-001).
- CRITICAL: YouTube API 키·Claude API 키를 코드에 하드코딩하거나 어떤 서버로도 전송하지 않는다. 사용자가 설정 화면에서 입력한 값만 `localStorage`에 저장한다 (ADR-002).
- Claude API를 브라우저에서 직접 호출할 때는 `anthropic-dangerous-direct-browser-access: true` 헤더를 명시적으로 붙인다.
- 디렉토리 책임 분리: 컴포넌트는 `src/components/`, 타입은 `src/types/`, 순수 유틸은 `src/lib/`, 외부 API 래퍼는 `src/services/` (`docs/ARCHITECTURE.md` 참고).
- UI는 `docs/UI_GUIDE.md`의 색상·컴포넌트·안티패턴 규칙을 따른다. 특히 글래스모피즘, 그라데이션 텍스트, 보라/인디고 브랜드 컬러는 금지.
- 댓글 수집은 1페이지(최대 100개, 관련순)까지만 처리한다. 페이지네이션을 추가하지 않는다 (ADR-004).

## 개발 프로세스
- 커밋 메시지는 conventional commits 형식을 따른다 (feat:, fix:, docs:, refactor:, chore:).
- 로직이 있는 `src/lib/` 함수(유튜브 URL 파싱, 감정 비율 계산 등)는 테스트를 작성한다. UI 컴포넌트 스냅샷 테스트는 강제하지 않는다.
- 로그인, 리포트 저장/공유, 채널 단위 분석, 댓글 페이지네이션은 MVP 범위 밖이다 — 요청 없이 임의로 추가하지 않는다 (`docs/PRD.md` MVP 제외 사항 참고).

## 명령어
```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트 (Vitest)
```
