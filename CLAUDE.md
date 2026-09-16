# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적 — 트랙이 둘이고 규칙이 다르다

**어느 트랙인지 먼저 확인한다.** 경로가 갈림점이다.

| 트랙 | 경로 | 무엇을 다루는가 | 규격 |
| --- | --- | --- | --- |
| 알고리즘 | `src/algorithms/` (107종) | **문제 풀이.** 주석에 문제가 서술돼 있고, 그것을 푸는 함수와 테스트를 만든다 | 현행 유지 |
| 자료구조 | `src/data-structures/` (69종) | **계약.** 문제가 아니라 구조 자체를 다룬다 | ORD-006 |

### 자료구조 트랙 (ORD-006)

자료구조는 **문제를 풀지 않는다.** `<name>-problem.md` 는 제거하고, 그 자리를 `<name>.ts`
헤더 JSDoc 의 **계약 명세**가 대신한다. 명세에 **내부 표현·알고리즘을 처방하지 않는다** —
진단된 A급 결함 4건의 직접 원인이 그것이다.

| 파일 | 무엇 |
| --- | --- |
| `<name>.ts` | 계약(헤더 JSDoc 여섯 항목) + 실습 스텁. 본문은 **공개 표면만** |
| `<name>.contract.ts` | 계약을 기계가 읽는 형태로 옮긴 것. 계약을 다시 적지 않는다 |
| `<name>.test.ts` | `runContract` 호출부 |
| `_reference/<name>.ts` | 정본 구현. 계약을 실제로 지키는 쪽. 축3 계측(`__cost`)의 의무를 진다 |
| `<name>-guide.mdx` | 가이드 8단계. 코드는 `_reference/` 에서 **추출**한다 |

검증은 4축이다 — 축1 동작 · 축2 불변식 · 축3 복잡도(성장률 $r = C(4n)/C(n)$, **벽시계
금지**) · 축4 동시성(Rust 전용). **작업 전에 `docs/ORD-006-runbook.md` 를 읽는다** —
불변 사실과 배치 카드가 거기 있고, 확정된 규약의 정본은 `docs/ORD-006-conventions.md` 다.

진행 상황과 다음 할 일은 `KANBAN.md`.

## 집필 규칙의 정본은 플러그인이다

문제 문서와 해설 가이드의 **골격·문체·품질 기준은 이 저장소에 없다.**
`authoring-kit` 플러그인의 명세(spec)와 퍼소나(voice)에 산다.

| 무엇 | 어디 |
| --- | --- |
| 항목 구성 · 항목별 작성 방법 · 범위 원칙 | `.claude/authoring/specs/{algo-guide,ds-guide,problem}/` |
| 경로 · 빌드 명령 | `.claude/authoring/paths.json` |
| 지금 서 있는 규칙 조합 | `.claude/authoring.lock.json` |
| 공통 원칙 · 퍼소나 문체 | 플러그인 + `~/.claude/authoring/` (전역 — 여러 프로젝트가 함께 쓴다) |
| 템플릿(캔버스) · 시뮬 규격 | `.claude/skills/guide-for-problem/` (프로젝트 소유) |

**규칙을 스킬 문서에 다시 쓰지 않는다.** 세 프로젝트가 같은 규칙을 각자 한 벌씩 들고 있다가
갈라진 것을 정리한 결과다. 바꾸려면 spec 이나 voice 를 고친다.

집필 진입점은 그대로 `guide-for-problem` · `gen-problem` 이고, 둘 다 내부에서
`authoring-kit:authoring-write` 로 넘긴다. 플러그인이 없으면 **명확히 실패한다** —
구 경로로 조용히 돌아가지 않는다. 구 자산은 git 이력에만 남아 있다.

## Runtime & Package Manager

This project uses **Bun** exclusively. Do not use Node.js, npm, yarn, pnpm, or npx.

- Run files: `bun index.ts` or `bun --hot index.ts` (with hot reload)
- Install dependencies: `bun install`
- Run scripts: `bun run <script>`
- Run packages: `bunx <package> <command>`
- Bun auto-loads `.env` — no dotenv needed

## Testing

```bash
bun test                        # run all tests
bun test index.test.ts          # run a single test file
bun test --watch                # watch mode
```

Test files use `bun:test` (Jest-compatible API):

```ts
import { test, expect } from "bun:test";
```

## 검증 명령 (이 이름 그대로 쓴다)

**한 번에 다 돌리려면 `bun run tools/ci.ts all`.** CI 가 도는 것과 같은 4모드 + 게이트다.
이 저장소의 테스트는 **일부러 실패한다**(학습자 스텁이 `Not implemented` 를 던진다) —
그래서 `bun test` 하나로는 판정이 안 되고 모드를 갈라야 한다.

```bash
bun run tools/ci.ts self       # ① 결함 fixture 가 축3에서 걸리는가
bun run tools/ci.ts reference  # ② _reference/ 정본이 계약을 지키는가(확률 다섯의 통계 판정 포함)
bun run tools/ci.ts practice   # ③ 스텁 채점 — 미구현 실패가 정상, 판정 제외
bun run tools/ci.ts trials     # ④ 통계 판정 자기시험 — fixture 를 시행마다 새 워커로(파일마다 프로세스 하나)
bun run tools/ci.ts gates      # 타입·계약 정합·추출 일치·vector·인용·링크
```

**확률 다섯(`probabilistic/` 의 bloomFilter · cuckooFilter · countMinSketch · hyperLogLog · minHash)의 오차는
워커로 판정한다**(`src/data-structures/_contract/runTrials.ts` — 시행마다 새 워커). 비용은 벽시계가 아니라
워커 수로 센다 — 정본 판정 800 개(`reference`), fixture 자기시험 약 3,000 개(`trials`). Bun 1.3.12 는 한 프로세스가
워커를 수백 개 넘게 띄우면 죽으므로(`docs/ORD-006-conventions.md` 의 `S24` 절) 러너가 워커를 자식 프로세스
(`runTrials.host.ts`) 하나에 128 개까지만 맡긴다. `bun test` 에서 워커를 직접 띄우는 테스트를 새로 쓰지 않는다.

낱개로 쓸 때:

```bash
bun test                                        # 테스트
bunx tsc --noEmit                               # 타입
bunx --bun @biomejs/biome check <경로>          # 린트·포맷 (--write 로 수정)
bun run tools/check-citations.ts                # 인용의 `경로:줄` 이 실재하는지 · 가리키던 내용이 그대로인지(표류) — `--update` 로 대장 갱신
bun run tools/guide-core.ts check               # 가이드 코드가 `_reference/` 추출본과 같은지 검증
bun run tools/emit-vectors.ts --check           # 언어 중립 test vector 가 계약과 어긋났는지 검증
bun run tools/check-links.ts check              # 문서 링크가 실재하는 파일을 가리키는지 검증
bun run tools/check-contract.ts                 # 명세↔스텁↔정본↔스위트 정합 검증
```

파일을 **지우거나 옮기기 전에** 참조를 훑는다. 손 grep 은 패턴을 빠뜨린다.

```bash
bun run tools/check-links.ts refs <경로|디렉터리>
```

Rust 쪽(축1 재생 · 축4 동시성)은 `rust/`에 있다. 실행 방법과 한계는 `rust/README.md`.

```bash
cd rust && cargo test                                              # 축1 + 판정기 자기시험
cd rust && RUSTFLAGS="--cfg loom" cargo test --test loom --release # 축4 선형화·진행 보장
```

**`bunx biome` 을 쓰지 않는다.** npm 의 `biome` 은 이 저장소가 설정한 `@biomejs/biome`
(`biome.json`)와 **다른 패키지**다. 아무것도 검사하지 않고 exit 0 을 돌려주므로, 그걸로
"린트 통과"를 확인하면 확인한 적이 없는 것이 통과로 보고된다. 실제로 한 번 그렇게 보고됐다.

린트 기준선: 저장소 전체는 미정리 상태다(`noNonNullAssertion` 다수, 대부분 `_scratch/`·
`_deprecated/`). **새로 쓰는 파일은 경고 0 으로 둔다.** 전체 정리는 별건이다.

## Preferred APIs (use Bun built-ins, not npm packages)

| Task | Use | Avoid |
|------|-----|-------|
| HTTP server | `Bun.serve()` | `express` |
| SQLite | `bun:sqlite` | `better-sqlite3` |
| Redis | `Bun.redis` | `ioredis` |
| Postgres | `Bun.sql` | `pg`, `postgres.js` |
| WebSocket | built-in `WebSocket` | `ws` |
| File I/O | `Bun.file()` | `fs.readFile/writeFile` |
| Shell | `Bun.$\`cmd\`` | `execa` |

## Frontend (if applicable)

Use `Bun.serve()` with HTML imports — do not use Vite or Webpack. HTML files can directly import `.tsx`/`.jsx` and CSS; Bun bundles automatically.

## TypeScript

Strict mode is enabled. Key settings in `tsconfig.json`:
- `moduleResolution: "bundler"` — use Bun's resolver, not Node's
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` — array/object access may return `undefined`
- `noEmit: true` — Bun handles transpilation directly
