# Step 2: youtube-url-parsing

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/PRD.md` ("URL 입력 & 검증" 절)
- `/docs/ARCHITECTURE.md`
- step 1에서 생성된 `src/types/`

## 작업

`src/lib/youtube-url.ts`에 순수 함수를 구현하라:

```ts
export function parseVideoId(url: string): string | null
```

지원해야 하는 형식(`docs/PRD.md` 참고):

- `https://www.youtube.com/watch?v={id}` — 뒤에 `&t=30s`, `&list=...` 같은 부가 파라미터가 붙어도 `v` 파라미터만 정상 추출한다.
- `https://youtu.be/{id}` — 뒤에 `?t=30` 등이 붙어도 처리한다.
- `https://www.youtube.com/shorts/{id}`
- 위 3가지가 아니거나 video ID를 특정할 수 없는 문자열(재생목록/채널/커뮤니티 게시물/라이브 전용 URL, 빈 문자열, 임의 텍스트 등)은 `null`을 반환한다 — 예외를 던지지 않는다.

video ID 형식(11자 영숫자·`-`·`_`)까지 검증해 명백히 잘못된 ID는 걸러내되, 실제로 그 영상이 존재하는지는 이 함수의 책임이 아니다(그건 step 3의 `services/youtube.ts` 몫).

`docs/PRD.md` "URL 입력 & 검증" 절의 모든 케이스(정상 3형식, 부가 파라미터 포함, 비지원 URL 유형, 빈 문자열)를 커버하는 테스트를 최소 10개 이상 작성하라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm run test
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. `docs/PRD.md`에 나열된 모든 URL 케이스가 테스트로 커버됐는지 재확인.
3. `phases/0-mvp/index.json`의 step 2 항목을 규칙대로 업데이트한다.

## 금지사항

- 네트워크 호출을 하지 마라. 이유: `docs/ARCHITECTURE.md`에 따라 `lib/`는 부수효과 없는 순수 함수만 둔다.
- 문자열 슬라이싱으로 쿼리 파라미터를 직접 파싱하지 마라 — `URL`/`URLSearchParams` 브라우저 내장 API를 사용하라. 이유: 엣지케이스 누락 위험이 크다.
- 기존 테스트를 깨뜨리지 마라.
