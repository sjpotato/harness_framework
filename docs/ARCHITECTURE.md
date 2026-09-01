# 아키텍처

## 디렉토리 구조
```
src/
├── main.tsx                # 엔트리 포인트
├── App.tsx                 # 최상위 컴포넌트. 화면 상태 머신(설정/입력/로딩/리포트/에러) 오케스트레이션
├── components/
│   ├── AppHeader.tsx       # 상단 고정 헤더: 앱 이름, URL 재입력창(idle 이후 모든 phase에서 표시), 설정 아이콘
│   ├── ApiKeySettings.tsx  # API 키 입력/저장/삭제 + 발급 안내 링크 + 과금 고지 문구
│   ├── UrlInput.tsx        # URL 입력 + 형식 검증 (AppHeader와 최초 idle 화면 양쪽에서 재사용)
│   ├── LoadingState.tsx    # "수집 중"/"분석 중" 단계별 로딩 표시 + 취소 버튼(onCancel)
│   ├── ErrorMessage.tsx    # 에러 케이스별 안내 문구 표시 (PRD.md 에러 케이스 표와 1:1 대응)
│   ├── ReportView.tsx      # 리포트 레이아웃 컨테이너
│   ├── VideoMetaCard.tsx   # 분석 대상 영상 제목/썸네일 + 분석 시각 + 저표본 caveat 표시
│   ├── SentimentChart.tsx  # 긍정/부정/중립 비율 시각화 (색상 + % + 라벨 텍스트 병기, 개수도 표기)
│   ├── ThemeList.tsx       # 핵심 테마 리스트
│   ├── FeedbackList.tsx    # 강점/개선점 리스트
│   └── CommentQuote.tsx    # 대표 댓글 인용 (텍스트 전용 렌더링, XSS 방지 — ADR-006)
├── types/
│   ├── comment.ts          # Comment, RawCommentThread (YouTube API 원본 응답 타입)
│   ├── video.ts            # VideoMeta (title, thumbnailUrl, commentsEnabled 등 videos.list 응답 매핑)
│   ├── report.ts           # SentimentReport, SentimentBreakdown(비율+개수), ThemeSummary, FeedbackItem, generatedAt
│   └── settings.ts         # ApiKeys
├── lib/
│   ├── youtube-url.ts      # parseVideoId(url): string | null — 순수 함수, 쿼리 파라미터(t, list 등) 무시하고 v만 추출
│   ├── storage.ts          # getApiKeys/setApiKeys/clearApiKeys (localStorage 래퍼)
│   └── errors.ts           # AppError 타입 계층, 에러 → 사용자 메시지 매핑
└── services/
    ├── youtube.ts          # fetchVideoMeta(videoId, apiKey, signal), fetchComments(videoId, apiKey, signal)
    └── claude.ts           # analyzeComments(comments, apiKey, signal): Promise<SentimentReport>
```

## 컴포넌트 책임
- `App.tsx`가 화면 상태(설정 없음 / URL 입력 / 수집 중 / 분석 중 / 리포트 / 에러)를 하나의 상태 머신으로 관리하고, 하위 컴포넌트는 props로 받은 데이터만 렌더링한다(자체 API 호출 없음).
- `AppHeader`는 `needs-settings`를 제외한 모든 phase에서 렌더링되어, 화면 전환 없이 새 URL 입력과 설정 진입을 항상 제공한다(PRD.md 사용자 흐름 6·7번).
- `services/`만 외부 API를 직접 호출한다. 컴포넌트에서 `fetch`를 직접 쓰지 않는다.
- `lib/`는 부수효과 없는 순수 함수만 둔다(`storage.ts`의 localStorage 접근은 유일한 예외이자 명시적으로 격리된 지점).

## 데이터 흐름
```
[App 상태: idle]
  사용자가 URL 입력(최초 화면 또는 AppHeader 상시 입력창) → lib/youtube-url.ts parseVideoId()
    실패 → [App 상태: error] invalid-url / unsupported-url-type 표시, 종료
    성공 → [App 상태: fetching-video-meta]

  services/youtube.ts fetchVideoMeta(videoId, youtubeApiKey, signal)
    실패(쿼터/키/네트워크/영상없음/비공개/댓글비활성) → [App 상태: error] 케이스별 AppError
    사용자가 취소 클릭 → signal.abort() → [App 상태: idle] 복귀 (에러 아님)
    성공 → videoMeta 확보 → [App 상태: fetching-comments; videoMeta]

  services/youtube.ts fetchComments(videoId, youtubeApiKey, signal)
    실패(네트워크 등) → [App 상태: error] 케이스별 AppError
    사용자가 취소 클릭 → [App 상태: idle] 복귀
    댓글 0개 → [App 상태: error] no-comments 안내, Claude 호출 생략
    성공(댓글 1개 이상) → [App 상태: analyzing; videoMeta, comments]

  services/claude.ts analyzeComments(comments, claudeApiKey, signal)
    실패(키/rate limit/네트워크/스키마 파싱 실패) → [App 상태: error] 케이스별 AppError
    사용자가 취소 클릭 → 응답을 기다리지 않고 [App 상태: idle] 복귀(요청 자체는 이미 과금됐을 수 있음 — PRD.md 참고)
    성공 → generatedAt 타임스탬프 부여 → [App 상태: report] ReportView 렌더링(videoMeta 포함)
```

## 상태 관리
- `App.tsx`에서 discriminated union으로 화면 상태를 표현한다:
```ts
type AppState =
  | { phase: 'needs-settings' }
  | { phase: 'idle' }
  | { phase: 'fetching-video-meta' }
  | { phase: 'fetching-comments'; videoMeta: VideoMeta }
  | { phase: 'analyzing'; videoMeta: VideoMeta; comments: Comment[] }
  | { phase: 'report'; videoMeta: VideoMeta; comments: Comment[]; report: SentimentReport }
  | { phase: 'error'; error: AppError };
```
- 진행 중인 `fetching-video-meta` / `fetching-comments` / `analyzing` phase는 `AbortController`를 하나 들고 있다가 사용자가 취소를 누르면 `abort()`를 호출하고 즉시 `idle`로 되돌린다. 취소는 `AppError`가 아니라 상태 전이일 뿐이다 — 사용자가 의도적으로 중단한 것이므로 에러 문구를 보여주지 않는다.
- API 키만 `localStorage`에 영속화한다(`lib/storage.ts`). 그 외 상태(영상 메타데이터, 댓글, 리포트, 에러)는 컴포넌트 메모리 상태로만 존재하며 새로고침 시 소멸한다(PRD.md "MVP 제외 사항" 참고).
- 전역 상태 라이브러리는 쓰지 않는다 — 상태 트리가 `App.tsx` 한 곳에서 시작해 props로만 내려가는 규모.

## 에러 처리 아키텍처
- `lib/errors.ts`에 에러 타입 계층을 정의한다:
```ts
type AppError =
  | { kind: 'invalid-url' }
  | { kind: 'unsupported-url-type' }          // 재생목록/채널/라이브 등
  | { kind: 'missing-api-key'; which: 'youtube' | 'claude' }
  | { kind: 'invalid-api-key'; which: 'youtube' | 'claude' }
  | { kind: 'quota-exceeded' }
  | { kind: 'video-not-found' }
  | { kind: 'video-restricted' }              // 비공개/연령제한
  | { kind: 'comments-disabled' }
  | { kind: 'no-comments' }
  | { kind: 'network-error'; retryable: true }
  | { kind: 'analysis-parse-failed' }
  | { kind: 'rate-limited'; retryable: true };
```
- `services/youtube.ts`, `services/claude.ts`는 HTTP 상태 코드/응답 바디를 위 `AppError`로 매핑해서 throw한다 — 원본 `fetch` 에러 객체를 컴포넌트까지 그대로 전파하지 않는다.
- `ErrorMessage.tsx`는 `AppError['kind']`를 key로 하는 문구 매핑 테이블 하나로 모든 케이스를 표시한다(PRD.md 에러 케이스 표와 1:1 대응, ADR-005).
- `retryable: true`인 에러에만 "다시 시도" 버튼을 노출한다. 자동 재시도는 하지 않는다(ADR-009).

## 외부 API 연동 상세

### YouTube Data API v3
두 엔드포인트를 순서대로 호출한다(ADR-010):

1. `GET /videos?part=snippet,status,statistics&id={videoId}&key={apiKey}` — 영상 존재 여부·공개 상태(`status.privacyStatus`)·댓글 활성화 여부(`statistics.commentCount` 존재 여부)를 먼저 확인하고, `snippet.title`/`snippet.thumbnails.medium.url`을 `VideoMeta`로 추출한다. 응답 `items`가 비어있으면 `video-not-found`, `privacyStatus`가 `private`/`unlisted` 등이면 `video-restricted`, 댓글 비활성화면 `comments-disabled`로 매핑한다.
2. `GET /commentThreads?part=snippet&videoId={videoId}&maxResults=100&order=relevance&key={apiKey}` — 1단계를 통과한 영상에 대해서만 호출. 응답의 `items[].snippet.topLevelComment.snippet.textOriginal`만 추출해 `Comment[]`로 변환한다(HTML이 아닌 원문 텍스트 사용, 대댓글은 무시).

두 호출 모두 `signal`(AbortController)을 받아 사용자가 취소를 누르면 즉시 중단한다. 타임아웃: 각 10초, 초과 시 `network-error`.

### Anthropic Claude API
- 엔드포인트: `POST https://api.anthropic.com/v1/messages`
- 필수 헤더: `x-api-key`, `anthropic-version`, `anthropic-dangerous-direct-browser-access: true`, `content-type: application/json`
- 프롬프트에 댓글 목록(최대 100개)을 구조화해 전달하고, 응답은 **JSON만**, **한국어로** 반환하도록 명시적으로 지시한다(댓글 원문 언어와 무관하게 테마/피드백 텍스트는 한국어 고정 — PRD.md 참고. tool use 또는 프롬프트 내 JSON 스키마 명시로 구조 강제, 구체적 방식은 구현 step에서 결정).
- `signal`(AbortController)을 받아 취소를 지원하되, 이미 전송된 요청 자체는 서버 측에서 계속 처리되어 과금될 수 있다 — 클라이언트는 응답을 기다리지 않고 화면만 되돌릴 뿐이다.
- 응답 파싱/스키마 검증 실패 시 동일 요청을 1회 재시도한다. 재시도 후에도 실패하면 `analysis-parse-failed`(ADR-007).
- `SentimentReport.generatedAt`은 Claude 응답이 도착한 시각을 클라이언트에서 직접 기록한다(`new Date().toISOString()`) — LLM이 생성한 타임스탬프에 의존하지 않는다.
- 타임아웃: 30초.

## 보안/개인정보 고려사항
- 댓글 원문은 사용자 생성 콘텐츠(UGC)이므로 `CommentQuote.tsx`는 React의 기본 텍스트 렌더링만 사용하고 `dangerouslySetInnerHTML`을 쓰지 않는다 — XSS 방지(ADR-006).
- 댓글 작성자의 채널명/프로필 이미지 등 개인 식별 정보는 애초에 상태에 저장하지 않는다(PRD.md 참고) — 저장하지 않으면 노출도 없다.
- API 키는 `localStorage`에 평문 저장된다는 한계를 설정 화면에 안내 문구로 명시한다(공용 PC 주의, ADR-002).

## 성능 고려사항
- 댓글 최대 100개 기준 Claude 프롬프트 토큰 수는 대략 수천 토큰 수준으로 예상되며, 응답 지연은 수 초 내외로 기대한다(정확한 수치는 구현 후 실측).
- 댓글 수집(YouTube)과 분석(Claude)은 순차 실행한다 — 분석이 수집 결과에 의존하므로 병렬화 불필요.

## 배포
- 정적 빌드 산출물(Vite build) 형태. GitHub Pages / Vercel(static) / Netlify 등 정적 호스팅이면 어디든 가능. 서버 런타임 불필요.
- 배포 시 `.env.local`은 포함되지 않는다(gitignore) — 각 사용자가 브라우저에서 직접 키를 입력해야 한다(ADR-002).

## 브라우저 지원
- 최신 Chrome/Edge/Safari 등 evergreen 브라우저 기준. `localStorage`, `fetch`, ES2020+ 문법을 지원하는 환경을 가정한다. 구형 브라우저/IE는 지원하지 않는다.
