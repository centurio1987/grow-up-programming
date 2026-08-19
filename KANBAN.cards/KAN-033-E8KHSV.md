---
card: KAN-033-E8KHSV
title: 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.
created: 2026-08-18
scope: sandbox/algo-guide-v2/**, src/_guide-sim/**, tools/check-links.ts, tools/ci.ts, tsconfig.json, package.json, bun.lock, KANBAN.md, KANBAN.cards/**, KANBAN.reviews/**, .kanban/**
---

# KAN-033-E8KHSV — 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.

## 전략
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음).
전략 전문은 `~/.claude/plans/optimized-frolicking-eagle.md`(개정 5판)이고, 아래는 그 요지다.

> **2026-08-19 전면 개정.** 이전 판(2026-08-18)의 전략은 폐기했다. 서브에이전트 검토를 네 차례
> 거치면서 근거가 무너진 결정이 셋이다 — ① `authoring-kit` 의 판정 경로를 쓰기로 한 것 ②
> MDX 조립을 승계하기로 한 것 ③ 항목을 늘려 결손을 메우려 한 것. 각각의 사유를 아래에 적는다.

### 카드의 두 요구는 층이 아니라 **인프라**에서 충돌한다

이전 판은 "버리는 것은 골격, 유지하는 것은 문체"로 정리했다. 그 정리는 맞지만 **부족했다** —
`authoring-kit` 의 판정 경로(`authoring-gate` · `comprehension-gate.sh` · `paths.json` ·
`authoring.lock.json`)가 전부 구 골격에 묶여 있어서, voice 만 쓰려 해도 그 경로가 딸려 온다.

결정적 근거는 이해 게이트 질문지다. `comprehension-gate.sh:14` 의 *"질문 유형이 고정"* 을
이전 판은 골격 독립의 증거로 읽었는데, **반대다** — 그 고정된 질문 유형이 구 골격의 의무를
질문지에 박아 둔 것이다. Q1(a)·Q3·Q5 의 담당 절이 구 명세의 `naive`·`idea.proof`·`impl` 이고,
`:143` 이 하나라도 FAIL 이면 전체 FAIL 이다.

**그래서 `authoring-kit` 에서 쓰는 것은 voice 하나다.** `voice.md`·`voice.json` 을 **읽어서**
집필 프롬프트에 싣고, 판정 장치는 전부 샌드박스에 새로 짓는다. 전역 자산을 고치지 않는다.
이 결정 하나로 예외 3건(`paths.json`·lock·spec 등록)과 A급 결함 넷이 함께 사라졌다.

### 재기획의 근거는 취향이 아니라 실측 실패다 (유지)

`.claude/authoring/paths.json:28` 이 현행 예시(`mosAlgorithm-guide.mdx`)의 실측을 기록한다 —
2026-08-15 codex·agy 둘 다 FAIL, 사유는 **Q1 절차 층위 대안 미제시**와 **Q5 실수 결과값 미제시**.
pilot ② 가 바로 그 편이다.

다만 **귀속을 바로잡았다.** `docs/comprehension-gate-audit.md:23` 은 실패 52편 중 50편이
Q1 **(b)** — 경쟁 설계 대조 — 라고 적는다. Q1(a)(가장 단순한 방법)는 `:29-30` 이
*"가이드들이 실제로 하는 대조는 naive ↔ 최종 해법 하나뿐"* 이라 적어 **이미 충족되던 항목**이다.
그래서 신설 항목은 `mistake`(Q5, 6편) 하나뿐이고, Q1(a)·Q3 는 **직무 재정의와 절 복원**으로 푼다.

### 항목을 늘려서 결손을 메우지 않는다

`audit:53-54` — *"측정 없이 항목만 늘면 문서는 체크박스의 합집합이 되고, 집필은 채우기가 된다."*
`:57-58` — *"처방도 항목 추가가 아니라 기존 `naive` 절 **직무의 재정의**로 간다."*

이전 개정에서 `deep.naive` 를 신설했다가 이 문장에 걸려 되돌렸다. 지금은 그 직무가
`deep.build` 의 직무 1·2로 들어가 있고, `deep.proof` 는 신설이 아니라 구 `idea.proof` 의
복원(잃었던 엣지 케이스 직무 포함)이다.

### 웹 버전은 MDX 를 승계하지 않는다 — md→HTML 로 간다

이전 판은 `build-mdx.ts` 조립을 승계하기로 했다. **실측이 그 판단을 뒤집었다** — MDX 는 산문
안의 홑화살괄호에서 깨진다(`i<n`·`l<=r`·`Array<T>` 전부 컴파일 실패). `curL < l` 류가 반드시
나오는 알고리즘 산문에서 이건 상시 지뢰다. 그리고 기존 MDX 파이프라인에 맞추는 선택 자체가
카드 지시(*"기존 집필 스킬에 의존하지 말고"*) 위반이라는 지적을 받았다.

`unified` + `remark`/`rehype` 로 md→HTML 을 직접 짓고, 마커 자리만 `<div data-viz>` 로 바꿔
`Bun.build` 번들을 인라인한다. 새 devDependencies 8개가 든다.

**`astro` 는 쓰지 않는다.** 카드가 준 분기에 대한 판정이다 — 시각화가 React 컴포넌트 하나와
선언형 데이터로 끝나고 HTML 한 장에 인라인되므로, 라우팅·서버·콘텐츠 컬렉션이 필요 없다.

### md 와 웹은 한 원본에서 갈라진다 (유지, 규약을 조임)

`<name>-guide.md` 하나가 원본이고 마커 둘이 갈림점이다.

```
<!--viz:{id}-->        + 바로 다음 ```text 펜스 하나   → 시각화
<!--check:{id}-->  …  <!--/check-->                    → 답 접힘 (deep.check 전용)
```

**마커 노드는 커스텀 타입으로 재타이핑해야 한다** — `type:"html"` 을 유지한 채 `data.hName` 을
달면 속성이 아니라 **노드가 통째로 사라진다**(실측). `hChildren` 에 원래 ascii 를 `<pre>` 로
남겨 JS 가 꺼져도 그림이 살아 있게 한다.

### 샌드박스 경계와 본 저장소 예외 6건

전 과정을 `sandbox/algo-guide-v2/` 안에서 한다(이전 판의 `sandbox/guide-rework/` 를 대체).
`src/algorithms/` 의 기존 가이드 111편은 pilot 승인 전까지 한 글자도 건드리지 않는다.

다만 **"본 저장소 무변경"은 지킬 수 없다.** 여섯을 열고 각각의 이유를 플랜에 적었다 —
`package.json`+`bun.lock`(의존성 8개) · `tsconfig.json`(샌드박스 제외) ·
`tools/check-links.ts`(`verdicts/` 만 제외) · `tools/ci.ts`(`_guide-sim` 회귀를 SELF 에) ·
`src/_guide-sim/index.tsx`(4곳 + 회귀 테스트 9종) · 칸반.

### 버린 대안 넷

| 대안 | 왜 버렸나 |
|---|---|
| astro 를 도입 | 라우팅·서버가 필요 없다. HTML 한 장으로 끝난다 |
| 기존 `algo-guide` spec 개정 | 카드가 명시적으로 배제했고, 실패한 골격 위 덧칠이 된다 |
| MDX 조립 승계 | 산문의 홑화살괄호에서 깨진다(실측). 카드 지시 위반이기도 하다 |
| `authoring-gate`·이해 게이트 사용 | 구 골격에 묶여 있어 새 골격이 구조적으로 통과 못 한다 |

### 아직 확인 안 한 것

**Claude 데스크톱 앱의 `/learn` 스킬은 원문을 확인하지 못했다.** 웹 검색으로 안 잡혔고,
로컬 `learning-output-style` 플러그인 원문과 ChatGPT Study Mode 지침 요지 둘로 대체했다.
이 사실을 B5 결재에 함께 올린다 — 추측으로 채우지 않는다.

## 실행 계획
배치 단위는 플랜 5판의 B0a~B5 와 1:1이다. work 하나가 배치 하나이고, 완료 기준을 함께 적는다.

- [x] `S1` 본 저장소 예외 6건 — 단독 커밋 (B0a)
      완료 기준: `bun run tools/ci.ts all` 초록 · `bunx tsc --noEmit` 무출력 ·
      `bun test src/_guide-sim` 14개 통과 · 새 코드 린트 경고 0
- [x] `S2` 명세 — `SPEC.md` 24항목 + id↔헤딩 매핑 + 작성법 + L1~L19 (B0b-1)
      완료 기준: 24항목 전부 직무가 적혔고, `repeat`·`fixed:false` 절의 헤딩 패턴이 정규식으로 적혔다
- [x] `S3` 이해 시험 — `tools/comprehension.sh` V1~V7 (B0b-2)
      완료 기준: 절대 규칙 넷(본문만 근거·원문 인용·`근거 없음`·`결론만 있음`) 프롬프트 탑재 ·
      AND 결합 · codex 격리(`-s read-only`·`-C tmp`·`unset OPENAI_API_KEY`) ·
      종료코드 3분기(0/2/3) · V별 판정 파서 · `verdicts/` 보관
- [x] `S4` 스캐너 — `tools/check-v2.ts` P1~P10 + `tools/bench-alt.ts` (B0b-3)
      완료 기준: 자기 fixture 11벌(통과 1 + 각 P 위반 1)이 기대대로 갈린다.
      `.sim.ts` 계약 제약(인라인 배열 리터럴만, spread 금지)을 P3 이 **에러로** 잡는다
- [x] `S5` 부류 후보 조사 — 읽기 전용 (B0c)
      완료 기준: 111편 `view=` 분포표 + "그림이 성립하지 않는" **후보** 목록.
      정본이 아니라 후보임을 문서에 명시한다
- [x] `S6` 빌드 파이프라인 — `tools/build-html.ts` + `_smoke/` (B1)
      완료 기준: 합격 기준 아홉 전부. 특히 **JS-off 에서 ascii 그림이 보인다** ·
      **빈 `steps` 마커에서 ascii 가 살아 있다** · **번들 인라인이 페이지를 안 깨뜨린다**
- [x] `S7` pilot ① quicksort → 편 단위 제출 (B2)
      완료 기준: V1~V7 통과 · `check-v2` 통과 · 절제 시험 2종(인용 함께 제거) ·
      최악 입력을 실제로 구성했다(`quicksort.ts:30` 이 결정적 중앙 피벗이라 정렬 배열이 최악이 아니다)
- [x] `S8` L10 예외 판정 + viz — 대표 1편의 `concept`·`trace`·`perf.derive` 세 절 (B3)
      완료 기준: 계산 블록 대체안이 서는지 실물로 판정 · **L11·P6·L19 의 처분도 함께 정한다**
- [x] `S9` pilot ② mosAlgorithm → 편 단위 제출 (B4)
      완료 기준: S7 과 같음 + `perf.derive` 가 질의 정렬 전처리를 총식에 넣는다(L15)
- [x] `S10` 종합 승인 요청 (B5)
      완료 기준: 결재 항목 셋을 함께 올렸다 — ① `perf` 를 코드 뒤로 옮긴 것(카드 원문 순서와 다름)
      ② `L7` 이 카드 원문의 "최악(O)·통상(theta)" 짝짓기를 위반으로 규정한 것
      ③ Claude 데스크톱 `/learn` 원문 미확인

**중단 조건 넷**(하나라도 걸리면 집필을 멈추고 규격으로 돌아간다)

1. 절제 시험에서 결과가 안 바뀌면 — 그 절은 장식이다. `check-guide-rhythm.ts:22-28` 의
   사고가 이 자리다(slidingWindowMaximum, 2026-08-16)
2. B3 판정에서 "그림이 성립하지 않는 부류"가 **5카테고리**를 넘으면 — L10·L11 재설계.
   부류 = 카테고리 디렉터리. 현재 후보는 4카테고리
3. 이해 시험이 같은 V번호에서 **2회 연속** 실패하면 — 명세가 문제다.
   **미실행(exit 2)은 이 카운터에 넣지 않는다**
4. B3 의 계산 블록 대체안이 서지 않으면 — L10 을 MUST 에서 내린다

**배치 중단**: 이해 시험이 미실행(exit 2)이면 판정하지 않고 배치를 멈춘다.

**반려**: 유저 반려 라운드 상한 3(편별). 3회면 항목을 더 얹지 않고 `JOURNAL.md` 에 사유 전문을
정리해 카드 재기획 요청서를 낸다.

**재작업 — 2026-08-19 검토 반려분**(결재 4·6·7 이 미승인으로 돌아왔다)

- [>] `S11` 이해 시험 판정 모델 `sonnet` 재판정 (B6) <!-- claim:s=52c6dc70 t=2026-08-19T16:35 -->
      완료 기준: 폴백 모델이 `sonnet`(`comprehension.sh:32`) · quicksort·mosAlgorithm 본편과
      절제 사본을 **같은 모델로 재실행**해 `purpose.alt` 절제의 판정력을 다시 잰다 ·
      haiku 회차의 결론(판정력 없음)은 그 전까지 결론으로 쓰지 않는다
- [ ] `S12` pilot ③ knapsack01 (dp·matrix) → 편 단위 제출 (B7)
      완료 기준: S7 과 같음. 고른 근거는 dp 10편 중 유일한 `view="matrix"`(결재 7 이 지목한
      matrix 부류) · 테스트 존재(L9) · 구 v3.0.0 가이드가 있어 대조가 된다(커밋 `3d232f4`)
- [ ] `S13` 검토 요청서 재작성 — 판단 항목마다 배경 접기 (B7)
      완료 기준: `review-init --force` 가 종료코드 12 로 안 막힌다 · 모든 물음에 `<details>` 배경 ·
      내부 기호(`L7`·`L10`·`P5`·`V2`)를 배경에서 풀고 `파일:줄` 로 원문을 걸었다 ·
      `validate` 의 "배경 없는 판단 항목" 경고 0

## 검증
배치마다 아래를 돌린다. 샌드박스는 **루트 타입 검사에서 빠져 있으므로**(`tsconfig.json` exclude)
반드시 `-p` 로 따로 판정한다.

```bash
bunx tsc --noEmit -p sandbox/algo-guide-v2                 # 샌드박스 전용
bunx --bun @biomejs/biome check sandbox/algo-guide-v2      # .ts 가 생긴 뒤부터
bun test sandbox/algo-guide-v2                             # .test.ts 가 생긴 뒤부터
bun run sandbox/algo-guide-v2/tools/check-v2.ts <파일>      # P1~P10
bun run sandbox/algo-guide-v2/tools/build-html.ts <파일>    # 빌드 + 스모크 (L19)
bash sandbox/algo-guide-v2/tools/comprehension.sh <파일>    # V1~V7
bun run tools/ci.ts all                                     # 배치 종료마다
```

**함정 둘을 미리 적는다(실측).**

- `bun test <경로>` 와 `bunx --bun @biomejs/biome check <디렉터리>` 는 **대상 파일이 0개면
  exit 1** 이다. 초반 배치(S1~S3)에서는 돌리지 않는다 — 돌리면 무조건 빨간불이다.
- **`bunx biome` 을 쓰지 않는다.** npm 의 `biome` 은 이 저장소가 설정한 `@biomejs/biome` 와
  다른 패키지이고 아무것도 검사하지 않고 exit 0 을 준다(`CLAUDE.md`).

**`tools/check-guide-rhythm.ts` 는 호출하지 않는다.** 규칙은 P1·P2 로 옮겼다. 호출해도
R2~R4·R6 은 `hasTrace`(구 헤딩 문자열 **접두 일치**, `:53`·`:183`·`:221-222`)가 새 헤딩과
어긋나 **조용히 공전한다** — 통과 표시가 거짓이 된다.

**판정 장치와 그것이 재는 것**

| 장치 | 재는 것 |
|---|---|
| 이해 시험 V1~V7 | 외부 모델이 본문만 읽고 이해했는가. **응답한 모델 전부 PASS(AND)** |
| `check-v2.ts` P1~P10 | 기계로 셀 수 있는 것. P5(결속)는 **형식만** 재고 실질은 V7 |
| 절제 시험 | `trace`·`purpose.alt` 가 장식인가. **그 절과 그것을 가리키는 `T#` 인용을 함께 지운다** |
| `bench-alt.ts` | L13 의 **결정론적** 계수(비교 횟수·이동 칸 수). 벽시계는 안 쓴다 |
| `bun test` | L9 — 완성 코드가 기존 테스트의 **입출력 케이스**를 통과 |
| 유저 | 최종 승인. **편 단위**, 항목 id 로 반려 |

**이해 시험의 현재 한계**: codex 사용 한도가 2026-09-14 복구, agy 도 한도 초과라 지금은
haiku 단독 판정이 될 수 있다. 그 경우 **「잠정」으로 표기**하고 codex 복구 후 재판정 대상에
등록한다. 미실행(exit 2)은 통과가 아니고, 카운터에도 넣지 않으며 배치를 멈춘다.

**본 저장소 예외 6건의 검증**(S1 에서 이미 통과):
`bun run tools/ci.ts all` 초록 · `bunx tsc --noEmit` 무출력 · `bun test src/_guide-sim` 14개 통과 ·
새 코드 린트 경고 0(기존 `index.tsx` 의 미정리 경고 9건은 이 카드 범위 밖).

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-08-18T16:08 · s:39f2e657 — `전략` 섹션 교체
- 2026-08-18T16:08 · s:39f2e657 — `실행 계획` 섹션 교체
- 2026-08-18T16:08 · s:39f2e657 — `검증` 섹션 교체
- 2026-08-19T02:35 · s:84bb27db — `전략` 섹션 교체
- 2026-08-19T02:35 · s:84bb27db — `실행 계획` 섹션 교체
- 2026-08-19T02:35 · s:84bb27db — `검증` 섹션 교체
- 2026-08-19T02:35 · s:84bb27db · S1 done — B0a — 예외 6건(의존성 8개·tsconfig·check-links·ci.ts·_guide-sim 4곳+회귀 9종·칸반). ci.ts all 초록, tsc 무출력, guide-sim 14 pass
- 2026-08-19T02:43 · s:84bb27db · S2 done — SPEC.md 25항목(플랜의 '24'는 오기) + id↔헤딩 매핑 + 항목별 작성법 + L1~L19. README·JOURNAL·tsconfig·.gitignore 동반. ci.ts all 통과, 링크 255건 유효
- 2026-08-19T02:52 · s:84bb27db · S3 done — comprehension.sh V1~V7 + 자기시험 7항목. 절대 규칙 넷·AND 결합·codex 격리·종료코드 3분기·verdicts 보관. 자기시험이 진짜 verdicts 를 오염시키던 결함 수정
- 2026-08-19T03:01 · s:84bb27db · S4 done — section.ts(절 식별기) + check-v2.ts(P1~P10) + 자기시험 18단언 + bench-alt.ts. tsc -p 무출력, 18 pass, biome 0
- 2026-08-19T03:06 · s:84bb27db · S5 done — survey-views.ts + SURVEY.md. keyValue 단독 22편/4카테고리(임계 5 미만). 플랜의 대표 선정 규칙이 _deprecated 조건 때문에 아무것도 못 골라 수정 → babyStepGiantStep
- 2026-08-19T03:14 · s:84bb27db · S6 done — build-html.ts + mount.ts + 연기 시험 10단언. 합격 기준 아홉 전부 실측 통과. 마커를 커스텀 노드로 재타이핑(html 타입 유지 시 노드 소멸), 빈 steps 에서 createRoot 미호출로 ascii 폴백 생존
- 2026-08-19T03:33 · s:84bb27db · S7 done — pilot ① quicksort 25항목. check-v2 P1~P10 통과, V1~V7 전부 통과(haiku 단독 잠정), 절제 시험 둘 다 겨눈 항목만 떨어짐(trace→V6, purpose.alt→V2). 실측: 최악 28=n(n-1)/2, 정렬 입력 13
- 2026-08-19T03:38 · s:84bb27db · S8 done — L10 예외 열지 않음 — babyStepGiantStep 세 절 다 그림이 자연스럽게 섰다(가설 거짓). SPEC 조항·스캐너 figureExempt 스위치 제거. mosAlgorithm 신규 viz 도 불필요
- 2026-08-19T04:17 · s:84bb27db · S9 done — pilot ② mosAlgorithm 25항목. 중단 조건 1 발동 → purpose.alt 의 경쟁 설계 축을 정렬 순서에서 자료구조(펜윅)로 바꿈. 판정기 분산 실측 — trace 절제는 판정력 있고 purpose.alt 절제는 haiku 단독으로 없음
- 2026-08-19T04:22 · s:84bb27db · S10 done — 검토 요청서 작성(판단 항목 7), 카드 검토로 이동. 결재 항목: perf 순서·O/Θ 규정·/learn 미확인·haiku 단독 판정·purpose.alt 절제 판정력·L10 예외 표본 1편·pilot 두 편 다 array 계열
- 2026-08-19T15:45 · s:52c6dc70 — 검토 반려(유저) — 사유: 맥락을 전혀 모르니 판단 항목의 내용이 전혀 이해가 가지 않는다. 앞으로는 맥락 이해를 위한 배경을 collapse 형식으로 판단 항목 하위에 포함해라.
- 2026-08-19T15:45 · s:52c6dc70 — 검토 결과 — 결재 1·2·3·5 승인(체크됨). 결재 4·6·7 은 미승인 + 지시 하위항 부여.
- 2026-08-19T15:45 · s:52c6dc70 — 유저 지시(결재 4) — 업무 신뢰도와 일관성이 문제라면 haiku 대신 sonnet 을 사용해라. 이해 시험 판정 모델을 sonnet 으로 교체한다.
- 2026-08-19T15:45 · s:52c6dc70 — 유저 지시(결재 6) — L10 같은 내부 기호를 그대로 쓰지 말고 원문이나 링크를 제공하라는 원칙이 이미 있다. 반복 지적이 없도록 강제 지점에 박는다.
- 2026-08-19T15:45 · s:52c6dc70 — 유저 지시(결재 7) — pilot 은 mosAlgorithm 을 포함하고 나머지 한 편은 dp 부류에서 고른다.
- 2026-08-19T15:58 · s:52c6dc70 — `실행 계획` 섹션 교체
- 2026-08-19T16:00 · s:52c6dc70 — S11~S13 신설 — 재작업 계획을 실행 계획에 넣었다. pilot ③ 은 knapsack01(dp 10편 중 유일한 view=matrix · 테스트 존재 · 구 v3.0.0 가이드 대조 가능).
- 2026-08-19T16:00 · s:52c6dc70 — comprehension.sh 폴백 판정 모델 haiku → sonnet 교체(FALLBACK_MODEL 환경변수화). 자기시험 7항목 통과 · ci.ts all 12단계 통과.
- 2026-08-19T16:35 · s:52c6dc70 · S11 doing — 착수
- 2026-08-19T16:45 · s:52c6dc70 · S11 — S11 sonnet 재판정 4회 완료 — quicksort 본편 r02 통과 / quicksort purpose.alt 절제 r02 미통과(V2) / mosAlgorithm 본편 r10 미통과(V2·V6) / mosAlgorithm purpose.alt 절제 r07 미통과(V2·V6). 본편이 sonnet 에서 떨어진 것은 처음이다 — 분석 미완, S11 은 열린 채로 둔다.
