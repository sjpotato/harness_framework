# Step 5: settings-and-header-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md` ("API 키 설정" 절, "사용자 흐름")
- `/docs/UI_GUIDE.md` (색상/컴포넌트/네비게이션)
- `/docs/ARCHITECTURE.md` (컴포넌트 책임, 상태 관리)
- step 1에서 생성된 `src/lib/storage.ts`, `src/types/settings.ts`
- step 2에서 생성된 `src/lib/youtube-url.ts`

## 작업

아래 컴포넌트를 구현하고, `App.tsx`에 `needs-settings` ↔ `idle` 두 phase만 우선 연결하라(분석 파이프라인은 step 6의 몫).

### `src/components/ApiKeySettings.tsx`
- YouTube/Claude API 키 입력 필드 2개(비밀번호 형태 마스킹 + "표시" 토글), 저장 버튼, 키 지우기 버튼.
- 각 필드 옆에 발급 방법 안내(YouTube Data API는 Google Cloud Console, Claude API는 Anthropic Console에서 발급)와 "분석 1회당 Anthropic 계정에 과금된다"는 고지 문구를 넣는다(`docs/PRD.md` "API 키 설정" 절).
- 저장 시 빈 값이면 저장하지 않고 안내만 표시한다(빈 값 검증만 수행, 실제 키 유효성 검사는 하지 않음).

### `src/components/UrlInput.tsx`
- URL 입력창. 입력/붙여넣기 즉시 `lib/youtube-url.ts`의 `parseVideoId`로 형식을 검증하고, 잘못된 형식이면 인라인 에러를 표시한다.
- 두 군데에서 재사용 가능하도록 설계한다: (1) 최초 idle 화면의 큰 입력창, (2) step 6에서 `AppHeader`에 넣을 컴팩트한 버전. props로 크기/스타일 variant를 받게 한다.

### `src/components/AppHeader.tsx`
- `needs-settings`가 아닌 모든 phase에서 렌더링된다(`App.tsx`가 조건부 렌더링). 좌측 앱 이름, 가운데~우측 `UrlInput`(컴팩트 variant), 우측 끝 설정 아이콘.
- `docs/UI_GUIDE.md` "네비게이션" 절의 스타일(그림자·블러 없이 `border-b`만)을 따른다.

### `App.tsx`
- `docs/ARCHITECTURE.md`의 `AppState` discriminated union 전체를 타입으로 정의하되, 이 step에서는 `needs-settings`와 `idle`만 실제로 동작하게 한다(나머지 phase는 타입만 존재해도 된다 — 다음 step들에서 채운다).
- 앱 시작 시 `lib/storage.ts`의 `getApiKeys()`로 키 존재 여부를 확인해 초기 phase를 결정한다.
- 설정 아이콘을 클릭하면 언제든 설정 화면으로 돌아갈 수 있어야 한다(`docs/PRD.md` 사용자 흐름 7번). 이미 다른 phase(분석 중/리포트 등, 이번 step에서는 존재하지 않지만 향후를 위해)에 있었더라도 설정으로 이동하면 그 상태는 버려지고 이후 idle로 돌아가도 된다 — 별도 확인 모달을 만들지 않는다(`docs/UI_GUIDE.md` 디자인 원칙 3).

컴포넌트 렌더 테스트(React Testing Library)로 URL 검증 에러 표시, 키 저장/삭제, 설정 화면 왕복을 검증하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/UI_GUIDE.md`의 AI 슬롭 안티패턴을 쓰지 않았는지, 모달/마법사 형태가 아닌지 확인.
3. `phases/0-mvp/index.json`의 step 5 항목을 규칙대로 업데이트한다.

## 금지사항

- 이 step에서 YouTube/Claude 서비스 호출을 실제로 연결하지 마라(step 6의 몫). "분석 시작" 버튼은 있어도 되지만 클릭 핸들러는 최소 스텁이거나 no-op이어도 된다.
- 모달/마법사 형태로 설정 화면을 구현하지 마라. 이유: `docs/UI_GUIDE.md` 디자인 원칙 3.
- 기존 테스트를 깨뜨리지 마라.
