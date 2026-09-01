# Step 1: types-and-storage

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/PRD.md`
- `/docs/ADR.md` (ADR-002)
- step 0에서 생성된 `src/` 디렉토리 구조

이전 step에서 만들어진 프로젝트 스캐폴딩을 꼼꼼히 확인하고, 그 구조를 그대로 따라 작업하라.

## 작업

`docs/ARCHITECTURE.md`에 정의된 타입들과 `lib/storage.ts`, `lib/errors.ts`를 구현하라.

### `src/types/comment.ts`
```ts
export interface Comment {
  id: string;
  text: string;
}
// RawCommentThread: YouTube commentThreads.list 응답 중 실제 사용하는 필드만 최소한으로 타이핑
```

### `src/types/video.ts`
```ts
export interface VideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  commentsEnabled: boolean;
}
```

### `src/types/report.ts`
```ts
export interface SentimentBreakdown {
  positive: { count: number; percent: number };
  negative: { count: number; percent: number };
  neutral: { count: number; percent: number };
}
export interface ThemeSummary { title: string; description: string }
export interface FeedbackItem { point: string; evidenceCommentIds: string[] }
export interface SentimentReport {
  sentiment: SentimentBreakdown;
  themes: ThemeSummary[];
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  representativeCommentIds: string[];
  totalCommentsAnalyzed: number;
  generatedAt: string; // ISO 8601, 클라이언트가 직접 부여 (ARCHITECTURE.md 참고)
}
```

### `src/types/settings.ts`
```ts
export interface ApiKeys { youtube: string; claude: string }
```

### `src/lib/storage.ts`
```ts
export function getApiKeys(): ApiKeys | null
export function setApiKeys(keys: ApiKeys): void
export function clearApiKeys(): void
```
- localStorage 키 이름에는 명확한 prefix를 쓴다(예: `ytci:youtubeApiKey`, `ytci:claudeApiKey`) — 범용적인 이름(`apiKey` 등)은 쓰지 않는다.
- `.env.local`에 `VITE_YOUTUBE_API_KEY`/`VITE_CLAUDE_API_KEY`가 있고 localStorage에 저장된 값이 없으면, `getApiKeys()`는 그 값을 기본값으로 반환한다. 단 이 반환값을 자동으로 localStorage에 쓰지는 마라 — 사용자가 설정 화면에서 명시적으로 저장해야만 영속화된다(ADR-002).

### `src/lib/errors.ts`
```ts
export type AppError =
  | { kind: 'invalid-url' }
  | { kind: 'unsupported-url-type' }
  | { kind: 'missing-api-key'; which: 'youtube' | 'claude' }
  | { kind: 'invalid-api-key'; which: 'youtube' | 'claude' }
  | { kind: 'quota-exceeded' }
  | { kind: 'video-not-found' }
  | { kind: 'video-restricted' }
  | { kind: 'comments-disabled' }
  | { kind: 'no-comments' }
  | { kind: 'network-error'; retryable: true }
  | { kind: 'analysis-parse-failed' }
  | { kind: 'rate-limited'; retryable: true };

export function getErrorMessage(error: AppError): string
```
`getErrorMessage`는 `docs/PRD.md` "에러 케이스 & 엣지 케이스" 표의 문구를 그대로 매핑하라. 모든 `kind`를 exhaustive하게 처리해 컴파일 타임에 누락을 잡을 수 있게 구현하라(예: `switch`문 + `never` 타입 체크).

각 함수/타입에 대한 단위 테스트를 작성하라 — 특히 `storage.ts`의 저장/조회/삭제와 `.env.local` fallback 동작, `errors.ts`의 모든 `kind`가 메시지를 반환하는지.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/ARCHITECTURE.md`의 타입 정의와 일치하는가, `CLAUDE.md` CRITICAL 규칙 위반이 없는가 확인.
3. `phases/0-mvp/index.json`의 step 1 항목을 규칙대로 업데이트한다(성공/실패/blocked — harness.md 참고).

## 금지사항

- 이 step에서 UI 컴포넌트나 실제 API 호출 로직을 만들지 마라. 이유: 레이어 분리 원칙 — 다음 step들(youtube-url-parsing, youtube-service, claude-service, UI)의 책임이다.
- 기존 테스트를 깨뜨리지 마라.
