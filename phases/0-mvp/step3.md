# Step 3: youtube-service

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` ("외부 API 연동 상세 > YouTube Data API v3" 절)
- `/docs/PRD.md` ("에러 케이스 & 엣지 케이스" 표)
- `/docs/ADR.md` (ADR-010)
- step 1, 2에서 생성된 `src/types/`, `src/lib/errors.ts`, `src/lib/youtube-url.ts`

## 작업

`src/services/youtube.ts`에 두 함수를 구현하라. 둘 다 취소를 지원하기 위해 `AbortSignal`을 받는다.

```ts
export async function fetchVideoMeta(
  videoId: string, apiKey: string, signal?: AbortSignal
): Promise<VideoMeta>

export async function fetchComments(
  videoId: string, apiKey: string, signal?: AbortSignal
): Promise<Comment[]>
```

`docs/ARCHITECTURE.md`에 명시된 엔드포인트·파라미터·에러 매핑을 그대로 구현하라(ADR-010 — 두 호출을 반드시 이 순서로):

- `fetchVideoMeta`: `GET https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id={videoId}&key={apiKey}` 호출. 결과 없음 → `AppError{kind:'video-not-found'}` throw, `status.privacyStatus`가 `public`이 아니면 → `AppError{kind:'video-restricted'}` throw, 통계에 댓글 수 필드가 없으면(댓글 비활성화) → `AppError{kind:'comments-disabled'}` throw. 성공 시 `snippet.title`/`snippet.thumbnails.medium.url`로 `VideoMeta`를 조립한다.
- `fetchComments`: `GET https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={videoId}&maxResults=100&order=relevance&key={apiKey}` 호출. `items[].snippet.topLevelComment.snippet.textOriginal`만 추출해 `Comment[]`로 매핑한다(대댓글은 무시).
- 두 함수 모두 HTTP 403(키 무효/쿼터초과 — 응답 바디의 reason으로 구분), 네트워크 실패, 타임아웃(10초)을 각각 `invalid-api-key`/`quota-exceeded`/`network-error` `AppError`로 매핑해 throw한다. 원본 fetch 에러를 그대로 던지지 마라.
- 외부에서 전달된 `signal`이 abort되면 fetch가 `AbortError`를 던지게 하고, 이 경우는 `AppError`로 감싸지 말고 그대로 다시 throw하라 — 호출부(step 6의 App.tsx)가 "사용자 취소"와 "실제 에러"를 구분해야 한다.

`fetch`를 mock한 단위 테스트로 성공/각 에러 매핑/취소 케이스를 검증하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/ADR.md` ADR-010에 정의된 호출 순서(videos.list 먼저, commentThreads.list 나중)를 지켰는지 확인.
3. `phases/0-mvp/index.json`의 step 3 항목을 규칙대로 업데이트한다.

## 금지사항

- `videos.list` 실패를 무시하고 바로 `commentThreads.list`로 넘어가지 마라. 이유: ADR-010의 목적(에러 사전 판별 + 메타데이터 확보)이 무의미해진다.
- API 키를 `console.log` 등으로 남기지 마라.
- 기존 테스트를 깨뜨리지 마라.
