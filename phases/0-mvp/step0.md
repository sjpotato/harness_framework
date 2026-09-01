# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/UI_GUIDE.md`

## 작업

Vite + React 18 + TypeScript(strict) 프로젝트를 저장소 루트에 스캐폴딩하라.

1. Vite 공식 react-ts 템플릿 방식으로(또는 동등한 수동 구성으로) 루트에 프로젝트를 생성한다. 이미 존재하는 `docs/`, `scripts/`, `.claude/`, `phases/`, `CLAUDE.md`, `.gitignore`, `.env.local` 등은 절대 건드리지 마라.
2. `tsconfig.json`에 strict 모드를 켠다.
3. Tailwind CSS를 설치·구성한다(`tailwind.config.js`, `postcss.config.js`, 진입 CSS에 `@tailwind` 지시어). `docs/UI_GUIDE.md`의 배경(#0a0a0a, #141414)·텍스트 색상 토큰을 Tailwind 커스텀 색상 또는 CSS 변수로 등록해 이후 step들이 재사용할 수 있게 한다.
4. Vitest + @testing-library/react를 설치하고 `vite.config.ts`에 test 설정을 추가한다.
5. ESLint 기본 설정을 유지/보강한다(Vite react-ts 템플릿 기본값이면 충분).
6. `package.json`에 `dev`, `build`, `lint`, `test` 스크립트가 `CLAUDE.md`에 명시된 대로 동작하도록 구성한다(`npm run dev`, `npm run build`, `npm run lint`, `npm run test`).
7. `docs/ARCHITECTURE.md`의 디렉토리 구조에 맞춰 `src/components/`, `src/types/`, `src/lib/`, `src/services/` 디렉토리를 만든다(빈 디렉토리는 git이 추적하지 않으므로 `.gitkeep` 등으로 존재를 보장). 이번 step에서는 그 안에 실제 로직 파일을 만들지 마라 — 다음 step들의 몫이다.
8. `App.tsx`는 다크모드 배경(#0a0a0a)이 적용된 최소 자리표시자만 두고, 화면 상태 머신은 아직 구현하지 마라(step 5~6에서 구현한다).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 모두 실행해 통과를 확인한다.
2. 아키텍처 체크리스트를 확인한다:
   - `docs/ARCHITECTURE.md`의 디렉토리 구조와 일치하는가?
   - `CLAUDE.md`의 CRITICAL 규칙(서버/API 라우트 추가 금지 등)을 위반하지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 0 항목을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary"`에 생성한 스캐폴딩 구조를 한 줄로 요약
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message"` 기록
   - 사용자 개입이 필요한 경우(예: npm 레지스트리 접근 불가) → `"status": "blocked"`, `"blocked_reason"` 기록 후 즉시 중단

## 금지사항

- 백엔드/서버/API 라우트 코드를 추가하지 마라. 이유: 이 프로젝트는 서버 없는 순수 프론트엔드 SPA다(ADR-001).
- `docs/`, `.claude/`, `scripts/`, `phases/`, `CLAUDE.md`, `.env.local`, `.gitignore`의 기존 내용을 변경하지 마라. 이유: 이번 step의 책임 범위가 아니며 하네스 동작에 영향을 줄 수 있다.
- 기존 테스트를 깨뜨리지 마라.
