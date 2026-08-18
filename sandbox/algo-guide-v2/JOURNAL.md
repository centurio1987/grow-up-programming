# JOURNAL — KAN-033-E8KHSV

배치 결과 · 반려 사유 · 실측값 · 확정 `SPEC.md` 해시를 **아래로만 덧붙인다.**
이미 적힌 줄은 고치지 않는다. 기록 없이 도는 반려 루프를 막는 것이 이 파일의 목적이다.

---

## S1 — B0a 본 저장소 예외 6건 · 2026-08-19 · 커밋 `b39e515`

**한 것.** 의존성 8개(`unified`·`remark-parse`·`remark-gfm`·`remark-rehype`·`rehype-stringify`·
`unist-util-visit`·`shiki`·`@shikijs/rehype`) · `tsconfig.json` exclude 에 `sandbox/**` ·
`tools/check-links.ts` 의 `check`·`refs` 에서 `verdicts/` 만 제외 · `tools/ci.ts` SELF 에
`bun test src/_guide-sim` · `src/_guide-sim/index.tsx` 4곳 + 회귀 테스트 9종 · 칸반 이동과
실행 문서 전면 개정.

**실측.** `bun run tools/ci.ts all` 12단계 통과 · `bunx tsc --noEmit` 무출력 ·
`bun test src/_guide-sim` **14 pass / 0 fail / 36 expect** · 새 코드 린트 경고 0
(`index.tsx` 에 남은 9건은 전부 기존 뷰 컴포넌트의 미정리분이라 이 카드 범위 밖).

**플랜에서 벗어난 결정 하나.** 플랜 5판은 `view` 타입을 임의 문자열로 넓히자고 했는데,
그러면 **오타 뷰 이름이 타입으로 안 잡힌다.** `.mdx` 소비자 182편이 tsc 대상이 아니라 대신
잡아 줄 것이 없다. 제네릭 `E extends string = never` + `NoInfer<E>` 로 바꿔 **`extraViews` 에
등록한 이름만** 허용되게 했다. `NoInfer` 가 없으면 TS 가 `view` 에서도 `E` 를 추론해
`view="typo"` 가 통과한다 — 실제로 한 번 통과했고 회귀 테스트 9번이 그것을 못 박는다.

**설계에서 바뀐 것 하나.** `extraViews` 충돌 시 throw 하는 규칙을 컴포넌트 레벨 테스트로
시험하려다 실패했다 — React 는 렌더 중 예외를 자기 큐에서 다시 던지므로 `act` 안의
try/catch 가 못 잡는다. `resolveRegistry` 를 export 해 순수 함수로 직접 시험한다.

**옮긴 자리.** 작업은 `main` 이 아니라 워크트리
`/Users/centurio/orca/workspaces/code_test/KAN-033-E8KHSV`(브랜치 동명)에서 한다.
예외 6건을 `main` 에 미리 넣을 실익이 없다 — 샌드박스가 `main` 에 없으므로 `main` 의 CI 는
영향을 안 받고, 카드 규율만 깨진다.

**주워 온 것.** 이 워크트리에 이전 세션(2026-08-18, 커밋 `13e31d5`)이 쓴 카드 실행 문서가
이미 있었다. 결정이 셋 갈려(spec 등록 여부 · 샌드박스 경로 · MDX 승계 여부) 전략·실행 계획·
검증 세 절을 전면 교체하고 `scope` 를 새 경로로 고쳤다.

---

## S2 — B0b-1 명세 · 2026-08-19

**한 것.** 샌드박스 골조(`pilot/`·`viz/`·`tools/`·`verdicts/`·`_smoke/`) · `.gitignore`(`*.html`) ·
`tsconfig.json` · `SPEC.md` · `README.md` · 이 파일.

**정정 하나.** 플랜 5판 본문이 "24항목"이라 적었는데 표의 행은 **25개**다(컨테이너 3개 포함).
`SPEC.md` 의 25가 맞고, 그 사실을 `SPEC.md` §0 에 적어 뒀다.

**미리 적어 두는 함정.** 이 디렉터리에 첫 `.ts` 가 생기는 것은 S4(`check-v2.ts`)다.
그 전까지 `bunx tsc --noEmit -p sandbox/algo-guide-v2` 는 입력 0개라 **`TS18003` 으로 실패하는
것이 정상**이다. `bun test`·`biome check` 도 같은 이유로 exit 1 이다 — 초반 배치에서 이 셋을
"실패"로 읽지 않는다.

**`code.step` 의 절 식별을 잔여 규칙으로 정했다.** `fixed:false` + `repeat` 라 정규식으로
이름을 강제할 수 없다 — 강제하면 단계 이름을 알고리즘에 맞춰 짓지 못한다. `## 코드로 옮기기`
컨테이너 안에서 `code.pseudo`·`code.final` 로 해소되지 않은 `###` 전부가 `code.step` 이고,
어느 것으로도 안 잡히는 헤딩이 있으면 **에러**다(조용히 넘기면 그 절이 어느 판정에도 안 걸린다).
