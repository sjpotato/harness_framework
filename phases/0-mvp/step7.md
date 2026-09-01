# Step 7: report-view-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md` ("리포트 화면" 절)
- `/docs/UI_GUIDE.md` (색상/컴포넌트/타이포그래피, "영상 정보 카드" 스펙)
- `/docs/ARCHITECTURE.md` (컴포넌트 목록)
- `/docs/ADR.md` (ADR-006)
- step 1에서 생성된 `src/types/report.ts`, `src/types/video.ts`
- step 6에서 만들어진 `App.tsx`의 `report` phase 상태 모양

이전 step까지 완성된 파이프라인이 `report` phase로 전환될 때 어떤 데이터(`videoMeta`, `comments`, `report`)를 들고 있는지 정확히 확인한 뒤 작업하라.

## 작업

아래 컴포넌트를 구현하고 `ReportView.tsx`에 조립하라. `App.tsx`의 `report` phase에서 이 `ReportView`를 렌더링하도록 연결한다.

### `src/components/VideoMetaCard.tsx`
- `VideoMeta`(제목/썸네일) + 리포트 `generatedAt`을 "OO시 OO분 기준"으로 포맷해 표시한다. `docs/UI_GUIDE.md` "영상 정보 카드" 스펙을 따른다.
- `totalCommentsAnalyzed`가 5 미만이면 옅은 회색 톤의 caveat 문구("댓글 수가 적어 신뢰도가 낮을 수 있습니다")를 이 카드 또는 바로 아래에 표시한다 — 경고색(#ef4444)을 쓰지 않는다(`docs/UI_GUIDE.md`).

### `src/components/SentimentChart.tsx`
- `SentimentBreakdown`을 막대 또는 도넛으로 시각화한다. 각 구간에 색상뿐 아니라 라벨("긍정")과 "개수(퍼센트)" 텍스트(예: "62개 (71%)")를 항상 함께 표기한다 — 색상 단독으로 정보를 전달하지 않는다(`docs/UI_GUIDE.md` 디자인 원칙 4).

### `src/components/ThemeList.tsx` / `src/components/FeedbackList.tsx`
- `ThemeSummary[]`, `FeedbackItem[]`(강점/개선점 각각)을 리스트로 표시한다.

### `src/components/CommentQuote.tsx`
- 댓글 원문을 인용 형태로 표시한다. **반드시 텍스트 노드로만 렌더링하고 `dangerouslySetInnerHTML`을 쓰지 마라**(ADR-006, XSS 방지 — 이 규칙은 절대 예외를 두지 마라).

### `ReportView.tsx`
- 위 컴포넌트들을 `docs/UI_GUIDE.md` 레이아웃(max-w-4xl, space-y-8)에 맞춰 조립한다. 총 댓글 수 표기, 대표 댓글 인용 3~5개 렌더링을 포함한다.

컴포넌트 렌더 테스트로 다음을 검증하라: 색상뿐 아니라 텍스트 라벨이 실제로 DOM에 렌더링되는지, 저표본 caveat이 5개 미만일 때만 뜨는지, 댓글 원문에 `<script>` 등이 섞여도 텍스트로만 렌더링되고 실행되지 않는지(코드에 `dangerouslySetInnerHTML`이 전혀 없는지도 정적으로 확인).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/UI_GUIDE.md` 체크: AI 슬롭 안티패턴(블러/그라데이션/보라색 등)을 쓰지 않았는가? 색상 단독 의존이 없는가?
3. `phases/0-mvp/index.json`의 step 7 항목을 규칙대로 업데이트한다. 이 step이 이 phase의 마지막 step이므로, 완료 시 8개 step이 모두 `completed`가 되어야 한다.

## 금지사항

- `dangerouslySetInnerHTML`을 어디에도 쓰지 마라. 이유: ADR-006 — 사용자 생성 콘텐츠(댓글)의 XSS 방지가 이 프로젝트의 핵심 보안 요구사항이다.
- 리포트 저장/공유/다운로드 버튼을 추가하지 마라. 이유: `docs/PRD.md` MVP 제외 사항.
- 기존 테스트를 깨뜨리지 마라.
