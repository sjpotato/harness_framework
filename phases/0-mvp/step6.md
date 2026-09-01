# Step 6: analysis-pipeline-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` ("데이터 흐름", "상태 관리", "에러 처리 아키텍처" 절)
- `/docs/PRD.md` ("에러 케이스 & 엣지 케이스" 표, "사용자 흐름", 취소 관련 서술)
- `/docs/UI_GUIDE.md` ("로딩/에러 상태" 절)
- step 3, 4에서 생성된 `src/services/youtube.ts`, `src/services/claude.ts`
- step 1에서 생성된 `src/lib/errors.ts`
- step 5에서 생성된 `src/components/AppHeader.tsx`, `src/components/UrlInput.tsx`, `App.tsx`

이전 step에서 만들어진 `App.tsx`의 `needs-settings`/`idle` 배선을 그대로 유지한 채 확장하라.

## 작업

`App.tsx`의 상태 머신을 `docs/ARCHITECTURE.md` "데이터 흐름"에 정의된 전체 phase(`fetching-video-meta` → `fetching-comments` → `analyzing` → `report`/`error`)로 확장하고, 아래 컴포넌트를 구현해 연결하라.

### `src/components/LoadingState.tsx`
- phase에 따라 "댓글 수집 중..." / "댓글 분석 중..." 문구를 표시한다. `onCancel: () => void` prop을 받아 취소 버튼을 렌더링한다.
- 분석(Claude) 단계 취소 시에는 `docs/UI_GUIDE.md`에 명시된 보조 문구("이미 시작된 분석 요청은 백그라운드에서 계속될 수 있어요")를 함께 표시한다.

### `src/components/ErrorMessage.tsx`
- `AppError`를 받아 `lib/errors.ts`의 `getErrorMessage`로 문구를 표시한다. `retryable`인 경우에만 "다시 시도" 버튼을 노출하고, 클릭 시 마지막으로 시도한 videoId로 실패했던 단계부터 재시도한다(사용자가 URL을 다시 입력할 필요 없음).

### `App.tsx` 배선
- `idle`에서 URL이 제출되면 `AbortController`를 생성해 상태로 보관하고, `fetchVideoMeta` → `fetchComments` → `analyzeComments`를 순서대로 호출한다(`docs/ARCHITECTURE.md` 데이터 흐름 그대로).
- 각 단계 실패는 해당 `AppError`로 `error` phase로 전환한다. `AbortError`(사용자 취소)는 에러 phase로 가지 않고 바로 `idle`로 복귀한다.
- `fetchComments` 결과가 빈 배열이면 `analyzeComments`를 호출하지 않고 곧바로 `AppError{kind:'no-comments'}`로 처리한다.
- 분석 성공 시 `report` phase로 전환하며 `videoMeta`, `comments`, `report`를 모두 상태에 보관한다(step 7의 `ReportView`가 사용).

테스트는 `services/youtube.ts`, `services/claude.ts`를 mock해서 phase 전이를 검증하라 — 성공 경로, 각 에러 경로, 취소 경로, no-comments 경로를 최소 각 1개씩.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/PRD.md` 에러 케이스 표의 모든 케이스가 서로 다른 문구로 표시되는지, 자동 재시도가 없는지(ADR-009) 확인.
3. `phases/0-mvp/index.json`의 step 6 항목을 규칙대로 업데이트한다.

## 금지사항

- 자동 재시도 로직을 추가하지 마라(`rate-limited`/`network-error`라도 사용자가 버튼을 눌러야 재시도). 이유: ADR-009.
- `no-comments`인 상태에서 `analyzeComments`를 호출하는 코드를 만들지 마라. 이유: 불필요한 과금(`docs/PRD.md`).
- 기존 테스트를 깨뜨리지 마라.
