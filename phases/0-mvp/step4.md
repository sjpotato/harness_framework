# Step 4: claude-service

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` ("외부 API 연동 상세 > Anthropic Claude API" 절)
- `/docs/ADR.md` (ADR-003, ADR-007, ADR-011)
- `/docs/PRD.md` ("AI 감정분석 & 피드백 생성" 절)
- step 1에서 생성된 `src/types/report.ts`, `src/lib/errors.ts`

## 작업

`src/services/claude.ts`:

```ts
export async function analyzeComments(
  comments: Comment[], apiKey: string, signal?: AbortSignal
): Promise<SentimentReport>
```

- `POST https://api.anthropic.com/v1/messages` 호출. 헤더: `x-api-key`, `anthropic-version`, `anthropic-dangerous-direct-browser-access: true`, `content-type: application/json`.
- 프롬프트에 댓글 목록(최대 100개, id+text)을 구조화해 넣고, 응답을 **JSON만, 한국어로** 반환하도록 명시적으로 지시한다. tool use(도구 정의로 JSON 스키마 강제)를 우선 고려하고, 어렵다면 프롬프트 내 스키마 명시 + 응답 파싱으로 대체한다.
- 응답에서 긍정/부정/중립 각각의 개수·비율, 테마 3~5개, 강점/개선점(근거 댓글 id 포함), 대표 댓글 id 3~5개를 추출해 `SentimentReport`로 조립한다. `generatedAt`은 Claude 응답이 아니라 `new Date().toISOString()`으로 클라이언트가 직접 채운다(ARCHITECTURE.md 참고). `totalCommentsAnalyzed`는 입력받은 `comments.length`.
- JSON 파싱/스키마 검증 실패 시 동일 요청을 정확히 1회만 재시도한다. 재시도도 실패하면 `AppError{kind:'analysis-parse-failed'}`를 throw한다(ADR-007).
- 401 → `invalid-api-key`, 429/529 → `rate-limited`(retryable:true), 네트워크/타임아웃(30초) → `network-error`(retryable:true)로 매핑한다.
- `signal`이 abort되면 fetch를 중단하고 `AbortError`를 그대로 전달한다(youtube.ts와 동일 패턴). 단, Claude 요청이 이미 서버에 도달했다면 서버 측 처리(및 과금)는 막을 수 없다는 점을 코드 주석으로 짧게 남겨라(ADR-011).

`fetch`를 mock해서 성공/파싱실패-재시도/각 에러코드/취소 케이스를 테스트하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 재시도가 정확히 1회로 제한되는지, `generatedAt`이 클라이언트 시각인지 테스트로 확인.
3. `phases/0-mvp/index.json`의 step 4 항목을 규칙대로 업데이트한다.

## 금지사항

- 재시도를 1회를 초과해서 하지 마라. 이유: ADR-007 — 비용·지연 억제.
- 댓글 원문을 번역해서 담지 마라(대표 댓글 인용은 원문 그대로, 테마·피드백 텍스트만 한국어). 이유: `docs/PRD.md` "AI 감정분석" 절.
- 기존 테스트를 깨뜨리지 마라.
