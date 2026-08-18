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

---

## S3 — B0b-2 이해 시험 · 2026-08-19

**한 것.** `tools/comprehension.sh`(V1~V7) + `tools/comprehension.selftest.sh`(자기시험 7항목) +
`verdicts/.gitkeep`.

**구 게이트에서 물려받은 것 넷.** 절대 규칙 — ① 본문만 근거 ② 원문 그대로 인용
③ `근거 없음` ④ **`결론만 있음`**. ④ 가 없으면 V3·V7 은 결론 인용만으로 전부 통과한다.
모델 배치(codex·agy 병렬, 둘 다 무응답일 때만 haiku 순차)와 codex 격리
(`-s read-only` · `-C "$TMP_DIR"` · `unset OPENAI_API_KEY`)도 그대로 가져왔다.

**새로 한 것 넷.** 질문 수를 프롬프트에 **정확히** 적는다(구 스크립트는 "5개"라 말하고 Q1~Q6 을
채점해 Q6 이 조용히 누락될 여지가 있었다) · **V별 판정 파서**(구 스크립트는 마지막 `VERDICT:`
한 줄만 봤다) · **미실행(2)과 미통과(3)를 가른다** · 응답 원문을 `verdicts/` 에 **보관**한다
(구 스크립트는 `mktemp` + `trap rm -rf` 로 지워 판정 근거가 남지 않았다).

**결합은 AND.** 응답한 모델 전부가 PASS 여야 그 V 가 통과다. **형식을 안 지킨 응답은
"응답 없음"이 아니라 미통과**로 센다 — 통과는 명시적이어야 한다.

**절제는 절과 인용을 함께 지운다.** `--ablate trace` 는 `## 한 입력으로 끝까지 굴려 보기` 절을
지우고 본문 전역의 `T#`·`(T1·T2)` 인용까지 걷어낸다. 인용만 남기면 사본이 dangling reference 를
가진 글이 되고, 시험이 "그 절이 실질을 가진다"가 아니라 "참조가 깨졌다"를 잡는다.

**자기시험 7항목(전부 통과).** 무응답→2 · 단독 PASS→0 · 두 모델 불일치→AND 로 3 ·
haiku 단독→0 + 「잠정」 표기 · 형식 미준수→3 · 절제 실행 · 절제가 `T#` 를 함께 지우는가.
판정기의 실패 모드는 조용해서(무응답을 통과로, 형식 미준수를 통과로, 한쪽만 보고 통과로)
화면에는 셋 다 "통과" 로 뜬다 — 그래서 여섯 경로를 스텁으로 고정했다.

**고친 결함 하나.** 자기시험이 처음에 **진짜 `verdicts/` 에 가짜 판정 6건을 남겼다.**
그 디렉터리는 커밋 대상이라 이력에 그대로 갈 뻔했다. `COMPREHENSION_VERDICT_DIR` 로
출력 위치를 덮게 하고 자기시험이 임시 디렉터리를 쓰도록 고쳤다.

**실측.** `bun run tools/ci.ts all` 12단계 통과 · 링크 255건 유효 ·
`bash tools/comprehension.selftest.sh` 12개 단언 전부 ok.

**아직 안 한 것.** 실제 모델로 한 번도 안 돌렸다 — codex 는 2026-09-14 복구, agy 도 할당량
초과다. 첫 실주행은 S7(pilot ① quicksort)이고, 그때 haiku 단독이면 「잠정」으로 표기된다.

---

## S4 — B0b-3 스캐너 · 2026-08-19

**한 것.** `tools/section.ts`(절 식별기) · `tools/check-v2.ts`(P1~P10) ·
`tools/check-v2.test.ts`(통과 표본 1 + 결함 표본 10, 단언 18개) · `tools/bench-alt.ts`.

**절 식별기를 따로 뺐다.** 구 `sectionBody` 는 **고정 헤딩 접두 일치 + 첫 매치 하나**라
`fixed:false` 인 `deep.build` 를 못 찾고 `repeat` 인 `code.step` 은 첫 벌만 본다.
P4(분기 피복)·P7(그림 의무)이 그 자리에서 통째로 헛돌 뻔했다. **어느 규칙으로도 안 잡히는
헤딩은 에러**로 두고, 그때는 나머지 판정을 아예 진행하지 않는다 — 절 식별이 틀린 상태의
"통과"는 의미가 없다.

**"그림"의 정의를 한 곳에 뒀다**(`section.ts` 의 `fences`). P1·P4·P7 이 같은 함수를 쓴다.
정의가 두 벌이면 갈라지고, 갈라진 쪽이 조용히 느슨해진다. 자기시험이 그 정의를 두 번
못 박는다 — **`<!--check-->` 마커는 그림이 아니고**(구 구현은 `<` 로 시작하는 줄을 그림으로
셌다), **`code.step` 의 코드 스니펫도 그림이 아니다**(repeat 절이라 절마다 있어서
코드를 세면 그 절에서 P1·P7 이 무력해진다).

**`.sim.ts` 계약 위반은 경고가 아니라 에러다.** `steps: [...base, {t}]` 는 실제 3인데 정적
계수가 **2로 센다** — 과소 계수는 P3(`trace` 단계 ≥ 프레임 수)을 지나 **얇은 trace 를
통과시킨다.** 판정기가 판정을 못 하는 것보다 나쁘다. 자기시험이 spread·변수 참조·함수 호출
셋을 다 막는지 확인한다.

**P5 는 형식만 잰다.** `T#` 토큰이 하나 있으면 통과다. 계수 논증이 정말 `trace` 에 기대는지는
V7 이 본다 — 문서와 코드 주석 양쪽에 그렇게 적었다. 다만 **`trace` 에 없는 단계를 가리키는
경우**(dangling)는 형식으로 잡을 수 있어 함께 본다.

**`bench-alt.ts` 는 결정론적 계수만 받는다.** 같은 `cases` 를 두 번 돌려 값이 다르면 거부한다
(실측: 난수 케이스가 886 → 4 로 갈려 exit 2). 벽시계를 허용하면 P10 의 "일치" 를 정의할 수
없다. `--check` 는 이미 낸 `.bench.json` 과 달라졌는지만 본다.

**실측.** `bunx tsc --noEmit -p sandbox/algo-guide-v2` **무출력**(이 배치에서 첫 `.ts` 가
들어와 이제 유효하다) · `bun test sandbox/algo-guide-v2` **18 pass / 0 fail** ·
biome 경고 0 · `comprehension.selftest.sh` 통과 · 루트 `ci.ts all` 12단계 통과.

**아직 안 한 것.** P10 은 실제 `.alt.ts` 로 한 번도 안 돌렸다 — pilot 이 없어서다.
첫 실주행은 S7 이다. P7 의 **부류 예외**(`figureExempt`)도 스위치만 있고 목록이 없다 —
그 정본은 S8(B3)이 실제로 써 보고 낸다.
