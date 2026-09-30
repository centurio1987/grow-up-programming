---
name: guide-for-problem
description: 알고리즘·자료구조 자체를 설명하는 해설서(가이드)를 작성한다. 알고리즘 가이드는 문서 끝 실습 절에 문제를 싣는다. 리서치 → 집필 → 품질 게이트 → 발행의 4단계 파이프라인으로 진행한다. 문제 해설을 부탁해. 문제 해설을 작성해줘. 문제 해설이 필요해.
disable-model-invocation: true
argument-hint: <file-name-without-extension>
---

# guide-for-problem 스킬 (가이드 집필 진입점)

## 자료구조 v2 집필 경로 (KAN-035 이후)

계약·참조 구현과 주요 구현 계열을 확인한 뒤, 연산과 작은 상태 변화에서 출발해 원고를 쓴다. 계약 요약표는 출처와 보장 종류를 유지해 허용하고 현재 명세 L42로 대조한다. 연산 누락은 초안 뒤에 확인한다. 계약이 배제하는 것·검사 절차를 도입문으로 쓰거나 연산 묶음의 근거를 첫 문장에 강제하지 않는다.

`src/data-structures/**`의 새 가이드 또는 v2 재집필 요청에는 [현재 자료구조 명세](../../../sandbox/ds-guide-v2/SPEC.md)와 [집필 안내](../../../sandbox/ds-guide-v2/AUTHORING.md)를 먼저 읽는다. 명세가 지정한 base와 voice도 함께 사용한다. 원고는 명세의 `.md`·사이드카 형식을 따르며, 작성 에이전트에게 넘기는 경우에도 두 문서의 경로와 적용 범위를 전달한다. 정성적 요령은 집필 참고용으로 전달하고 게이트나 합격 점수로 변환하지 않는다.

이 분기에서는 현재 명세의 생성·검증 절차를 사용한다. 아래의 8단계·MDX·구 `authoring-write` 절차는 기존 경로에 대한 설명이며 v2 집필에 덧붙여 적용하지 않는다. 기존 문서는 재집필 요청 범위 안에서만 변경한다.

## 알고리즘 가이드 — 문제는 실습 절에 (KAN-060 이후)

2026-09-29 부터 알고리즘 가이드는 **문제가 아니라 알고리즘 자체**를 설명한다. 문제는 따로 된
문서(`<name>-problem.md`)가 아니라 가이드 끝 `## 실습 — 직접 풀어 보기` 에 있고, 파트 1·2 는 그
문제를 전제하지 않는다(`SPEC.md` `L49` · §3 `practice`). 입력은 기존 원고 · 정본(`<name>-guide.ref.ts`) ·
스텁 시그니처(`<name>.ts`)다 — 스텁에는 문제 주석이 없다(커밋 `29eab6e` 가 옮겼고, `KAN-060` 이 실습
절로 다시 옮겼다). 실습 문제를 새로 쓰거나 더하는 일은 `gen-problem` 이다.

## 알고리즘 가이드 v2 재집필 경로 (KAN-058)

옛 구성으로 남은 알고리즘 가이드를 파일럿 구성으로 다시 쓰는 경로다. 전개 카드 `KAN-058` 이 편마다
서브에이전트에게 이 절을 넘긴다. **규칙은 여기에 다시 쓰지 않는다** — 무엇을 어떻게 쓰는지는 아래
세 곳이 정한다.

| 무엇 | 어디 |
| --- | --- |
| 골격·항목별 작성법·범위 원칙 | [`sandbox/algo-guide-v2/SPEC.md`](../../../sandbox/algo-guide-v2/SPEC.md) — 특히 §3 `deep.origin`·`deep.build`(`L41`~`L45`), §6 `L49`, §12(`L46`·`L47`), §13(`L48`) |
| 문체 | voice `algorithm-guide-writer` — 검사기가 읽는 사본은 [`.claude/authoring/voices/algorithm-guide-writer/`](../../authoring/voices/algorithm-guide-writer/voice.md) |
| 본보기 | 파일럿 [`src/algorithms/array/sparseTableRangeMin/`](../../../src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md) — 원고와 사이드카 전부(`ref`·`proof`·`sim`·`fig`·`test`·`figs/`). 전개 기준으로 승인된 샘플 둘(`KAN-058.1`, 2026-09-30): 개념이 단순한 편 [`binarySearch`](../../../src/algorithms/binary-search/binarySearch/binarySearch-guide.md)(낯선 개념 절 없이 단계 셋) · 어려운 편 [`stronglyConnectedComponents`](../../../src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.md)(낯선 개념마다 여섯 요소) |

**대상인지 먼저 본다.** `bun run tools/check-v2.ts <가이드>` 가 걸리는 편이 대상이다.
전체 목록은 `bun run tools/check-v2.ts --all`. 위반 목록이 첫 작업 목록이다.

### 입력 — 버리지 않고 옮긴다

- **옛 원고** `<name>-guide.md` — 값·예시 입력·증명·반례는 새 구성으로 옮긴다. 서술 순서만 바꾼다.
- **정본** `<name>-guide.ref.ts` — 본문 코드의 원천이다. 고치지 않는 것이 기본이고, 고치면 `<name>-guide.test.ts` 가 통과해야 한다.
- **증명 블록** `<name>-guide.proof.ts` — 옮긴 값은 그대로 쓰고, 새로 싣는 값은 여기에 블록으로 더한다. **본문에 손으로 적은 수를 남기지 않는다** — 옛 원고의 짧은 실행 결과(걸음 몇 줄 · 검산 · 자기 점검의 자취 · 코드 아래 출력)도 증명 블록이 만들어 대조하게 바꾼다(`KAN-058.1` 검토 4 승인, 2026-09-30).
- **걸음 표** `<name>-guide.sim.ts` — 걸음 재생 패널이 남으면 고쳐 쓰고 새로 만들지 않는다. 걸음 값은 정본 실행에서 받는다(`L48`). 옛 패널(`view: "array"` 등)은 무대 패널(`player: "stage"`)로 옮긴다 — 무대는 「배열」(`stage: "array"`, 본보기 `binarySearch`) · 「층」(`"levels"`, 본보기 파일럿) · 「그래프」(`"graph"`, 본보기 `stronglyConnectedComponents`) 중에서 고르고, 맞는 무대가 없으면 SPEC §13 「다른 갈래의 무대」대로 무대부터 더한다. 필름(정적 그림)과 패널은 같은 무대 함수로 만든다.
- **대안 비교** `<name>-guide.alt.ts`·`.bench.json` — 있으면 그대로 두고, `purpose.alt` 가 바뀌면 함께 맞춘다.

**바꾸지 않는 것.** 문서 끝 `## 실습` 절(`KAN-060` 이 옮긴 문제 서술), 스텁 `<name>.ts`·`<name>.test.ts`,
자료구조 트랙.

### 순서

1. 옛 원고와 파일럿을 함께 읽고 `check-v2` 위반 목록을 본다.
2. `deep.origin` — 알고리즘이 푸는 과제를 입출력·규모로 고정하고(`L49`), 단순한 방법의 수치 반박에서 아이디어의 이름까지 간다.
3. `deep.build` — 단계 지도 그림, 낯선 개념이 있으면 「먼저 알아 둘 개념」(`L41`), `#### {N}단계 — …` 실현 단계(`L42`).
4. 나머지 절 — 핵심 구조는 이름 하나로(`L43`), 「견주다」 없이(`L44`), 본문 반말 없이(`L45`), 실습 문제를 가리키지 않고(`L49` — 본문 코드의 주석도 포함. 정본에서 추출한 코드면 정본 주석을 고치고 가이드 펜스를 맞춘다).
5. 그림 — 자리마다 독자가 알아야 할 것을 한 문장으로 정하고 형식을 고른다(`L46`). 도식은 `<name>-guide.fig.tsx` 에 정의하고 `bun run tools/render-figs.ts <가이드>` 로 `figs/` 를 뽑아 함께 커밋한다. 맞는 패턴이 `src/_viz/patterns/` 에 없으면 SPEC §12 「패턴을 더하는 법」대로 패턴부터 만든다(`src/_viz/patterns.test.tsx` 패턴 등록 가드).
6. 아래 완료 명령을 전부 통과시킨다.

### 편 완료 명령

```bash
G=src/algorithms/<카테고리>/<편>/<편>-guide.md
bun run tools/check-v2.ts $G
bun run tools/check-proof.ts --require $G
bun run tools/render-figs.ts --check
bun test src/algorithms/<카테고리>/<편>/<편>-guide.test.ts
bun run tools/build-html.ts $G
bun run tools/check-metaphor.ts $G     # SPEC 을 고쳤으면 sandbox/algo-guide-v2/SPEC.md 도 함께 준다
bun run tools/guide-core.ts check
bunx tsc --noEmit                      # 사이드카 타입 — bun 은 타입을 안 보고 실행하므로 따로 잰다
```

수식 블록의 `$$` 는 수식과 같은 줄에 붙이지 않고 따로 한 줄에 둔다. `$$\begin{aligned}` 처럼 붙이면
remark-math 가 블록을 닫지 못해 뒤 헤딩이 모두 사라진다 — `build-html` 이 헤딩 수 어긋남으로 잡는다(2026-09-30).

린트는 **만든·고친 파일 경로만** 줘서 실행한다(`bunx --bun @biomejs/biome check <파일…>`). 폴더 전체에 `--write` 를
걸면 손대지 말아야 할 스텁·`_scratch/`·메모 파일까지 고쳐진다 — 전개에서 네 번 되풀이됐다(2026-09-30).

문체 박자 등급은 합격선이 아니라 보고할 값이다. 실습 절 앞까지만 잘라서 잰다(실습은 옮겨 온 문제
서술이다). 파일럿의 파트 1·2 도 C 이므로(2026-09-30 실측) 등급으로 편을 막지 않는다.

```bash
sed '/^## 실습/,$d' $G > <스크래치>/body.md
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/scan_ai_style.py --voice algorithm-guide-writer <스크래치>/body.md
```

**보고할 것.** 통과한 명령 · 문체 박자 등급 · 새로 만든 패턴(있으면 이름과 쓴 자리) · 판단이 필요했던 자리(값을 정하지
못한 곳, 옛 원고와 정본이 어긋난 곳) · 들인 토큰과 시간. 판단이 필요한 자리는 고쳐 넘기지 말고 그대로
적는다 — 사람이 검토에서 본다.

## 기존 집필 경로

`src/$ARGUMENTS.ts`의 **문제 주석**을 입력으로, 문제를 푸는 **깊은 해설서**
`src/$ARGUMENTS-guide.mdx`를 작성한다. 가이드는 sibling `.ts`(학습자 실습 공간)와 **독립적으로
집필·검증**된다 — 본문에 싣는 코드는 가이드 자체로 실행·검증한다.

> **집필 규칙은 이 파일에 없다.** 골격·문체·품질 기준은 `authoring-kit` 플러그인의
> 명세(spec)와 퍼소나(voice)에 산다. 이 스킬은 **어느 명세로 쓸지 고르고 넘기는 일**만 한다.
> 세 프로젝트가 같은 규칙을 각자 한 벌씩 들고 있다가 갈라진 것을 정리한 결과다.

## 어느 명세를 쓰는가

| 대상 | spec | 골격 |
| --- | --- | --- |
| `src/algorithms/**` | [`sandbox/algo-guide-v2/SPEC.md`](../../../sandbox/algo-guide-v2/SPEC.md) — 등록 명세 `algo-guide`(옛 10단계)는 대상을 잃었다 | v2 골격 — 파트 1(아이디어에서 동작하는 코드까지) · 파트 2(적용 조건 · 보장 · 비용) |
| `src/data-structures/**` | `ds-guide` | 8단계 — 계약에서 출발해 그 계약을 지키는 구현으로 (문제 비종속 독립 가이드) |

voice 는 알고리즘이 `algorithm-guide-writer`(이 저장소 전용 · 2026-09-27), 자료구조가 `ppangtolab-teacher`(빵토랩 선생님)다.
알고리즘 가이드의 문체 규칙은 그 voice 의 문체 설정에 있다 — 명세에 다시 쓰지 않는다.

## 동작

### 0. 사전 확인

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py status
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py lock
```

- 플러그인이 없으면 **여기서 멈춘다.** 구 경로로 조용히 돌아가지 않는다 —
  그러면 어떤 규칙으로 쓰였는지 알 수 없게 된다. 구 자산은 git 이력에만 남아 있다 — 복구는 되돌리기지 우회로가 아니다.
- `lock` 이 stale 이면 규칙이 바뀐 것이다. 무엇이 바뀌었는지 확인하고 진행할지 정한다.

### 1. 리서치

`src/$ARGUMENTS.ts` 전체와 함수 시그니처를 읽는다(알고리즘은 가이드 끝 실습 절이 문제 서술이다). 그리고:

- **정답 동작 확인** — 구현이 있으면 `bun test src/$ARGUMENTS.test.ts 2>&1; true`,
  없으면 작은 입력을 손으로 실행해 본다. **본문에 실을 수치는 여기서 확정한다.**
- **재사용 자산 확인** — 같은 주제의 기존 `*-guide.mdx` 에 `export const steps`(시뮬)나
  mermaid 블록이 있으면 가져다 쓴다. 새로 만들지 않는다.
  **가져온 것도 검증 면제가 아니다** — 파서 검증과 서사 대조를 통과해야 한다.
- **앵글 확정** — 이 알고리즘의 "돌파 관찰"이 무엇인가. 부제가 그것을 예고한다.

### 2. 집필 — `authoring-write` 에 위임

```
Skill(authoring-kit:authoring-write) --spec <algo-guide|ds-guide>
```

넘길 것: 대상 파일 경로 · 1단계에서 확정한 사실과 수치 · 재사용할 시뮬/mermaid 위치 · 산출 경로.

`authoring-write` 가 `resolve` 로 규칙을 해석해 집필 워커에 넘기고, 외부 검토와 품질 게이트까지
끌고 간다. **이 스킬이 본문을 직접 쓰지 않는다.**

### 3. 발행

> **이해 게이트(H축)는 여기가 아니라 `authoring-gate` 2단계에서 돈다.** 실행 지점은
> `paths.json` 의 `commands.comprehension_gate` 하나뿐이고, 규칙 본문은 `QUALITY_RUBRIC.md`
> 의 H축에 있다. **이 문서에 다시 쓰지 않는다.**
>
> 2026-08-15 이전에는 이 자리에 3.0 절이 있었다. 그런데 품질 게이트는 2단계
> (`authoring-write`)에서 이미 끝나므로, **"채점보다 먼저"라고 적힌 관문이 실제로는 채점
> 뒤에 놓여 있었다.** 규칙을 두 곳에 적어 둔 결과 배치와 선언이 어긋난 것이라, 절을 지우고
> 집행 지점을 게이트 하나로 합쳤다.

품질 게이트 PASS 후:

1. **빌드 확인** — `bun run tools/guide-preview/compile-check.ts src/$ARGUMENTS-guide.mdx`
   (JSX 문법 오류 하나가 빌드 전체를 깬다)
2. **mermaid 검증** — `bun run tools/guide-preview/check-mermaid.ts src/$ARGUMENTS-guide.mdx`
3. **인덱스 등록** — `문제_가이드_목록.md` 에 **수동 삽입**한다. 중요도 판단이 필요하면
   `알고리즘 중요도 기준 문제 목록.md` 를 참조하고, 판단이 안 서면 사용자에게 묻는다.
   **인덱스 전체를 알파벳순으로 재생성하는 방식은 금지**(중요도 구조 파괴).
4. **완료 보고** — 산출 경로 · 인덱스 삽입 위치 · 게이트 판정(PASS/라운드 수) ·
   생략한 조건부 절과 사유 · `resolve` 해시(어떤 규칙 조합으로 쓰였는지).

## 참조 파일

- `algorithm-guide-canvas.md` · `data-structure-guide-canvas.md` — 템플릿.
  spec 이 `template_ref` 로 가리킨다. **`##` 헤딩 문구·순서를 바꾸지 않는다**
- `simulation-scaffold.md` — `#guide-sim` 위탁 규격. 이 프로젝트의 렌더 계약
- `../../authoring/specs/{algo-guide,ds-guide}/` — 항목 구성과 항목별 작성 방법
- `../../authoring/paths.json` — 경로·빌드 명령
- `../../authoring.lock.json` — 이 프로젝트가 지금 쓰는 규칙 조합
- `solving-problem-canvas.md` — **구 템플릿(ORD-003 이전). 새 집필에 사용 금지** (이력 보존용)

## 주의

- **골격·문체 규칙을 이 파일에 다시 쓰지 않는다.** 그렇게 갈라진 것을 방금 합쳤다.
  규칙을 바꾸려면 spec 이나 voice 를 고친다.
- **기존 `*-guide.mdx` 는 그대로 둔다.** 구 가이드에 구 골격이 남아 있는 것은 위반이 아니다 —
  재집필 지시가 있을 때까지 건드리지 않는다.
- 조건부 절은 해당 없으면 **절 자체를 지우고**, 생략 사유는 **게이트 보고에만** 남긴다.
  독자용 문서에 "해당 없음" 을 남기지 않는다.
- 본문에 싣는 수치·경로·실행 결과는 **실제로 확인한 것만** 쓴다.
- **자동 통과 금지** — 품질 게이트 3라운드를 다 써도 미통과면 그대로 보고한다.
  외부 검토가 둘 다 실패한 상태를 "완성"으로 보고하지 않는다.
