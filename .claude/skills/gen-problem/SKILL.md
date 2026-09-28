---
name: gen-problem
description: 알고리즘 가이드(src/algorithms/**/<name>-guide.md) 끝의 「## 실습 — 직접 풀어 보기」에 문제를 쓰거나 더하고, 그 문제를 집행하는 스텁·테스트를 함께 만든다. 문제 만들어줘. 실습 문제 추가해줘. 테스트 환경 구성해줘.
disable-model-invocation: true
argument-hint: <src/algorithms/ 아래 경로, 확장자 없이 — 예: array/kadane/kadane>
---

# gen-problem 스킬 (실습 문제 집필 진입점)

알고리즘 가이드 끝의 실습 절에 **문제 하나**를 쓰고, 그 문제를 **정확히 반영하고 충분히 덮는
테스트** `<name>.test.ts` 와 스텁 `<name>.ts` 를 함께 만든다.

> **2026-09-29 `KAN-060` 부터 문제 문서(`<name>-problem.md`)는 없다.** 유저 지시 원문은
> *"guide 마지막에 문제를 만들어서 실습 항목으로 배치한다. 기존 problem.md는 삭제한다."* 다.
> 이 스킬이 `-problem.md` 를 만들면 지운 파일이 되살아난다.

> **집필 규칙은 이 파일에 없다.** 실습 절의 구조·소절 여섯·쓰는 법은
> `sandbox/algo-guide-v2/SPEC.md` §3 `practice` 가 정본이다. 이 스킬은 **입력을 모아 쓰고
> 검사를 통과시키는 일**만 한다.

## 적용 범위 — `src/algorithms/` 전용

**`src/data-structures/` 대상으로 이 스킬을 부르지 않는다.** 자료구조는 문제를 풀지 않고
계약을 지킨다(ORD-006). 규격의 정본은 `docs/ORD-006-conventions.md` 다.

## 명세

| | |
| --- | --- |
| 구조 | `SPEC.md` §1 `practice`·`practice.problem`·`practice.part` — `### {문제 이름}` 아래 풀 파일 줄 + `####` 여섯(한 줄 요약 · 스토리 · 함수 인터페이스 · 제약 조건 · 문제 상세 · 예시) |
| 쓰는 법 | `SPEC.md` §3 `practice` 의 「소절마다 쓰는 법」 |
| 최대 제약 | **문제 서술이 풀이를 말하지 않는다.** 무엇을 풀지만 말하고 어떻게 풀지는 가이드 본문에 맡긴다 |

## 동작

### 1. 리서치

- **자리 확인** — `<name>-guide.md` 가 있는가. 없으면 가이드부터다(`guide-for-problem`).
  있으면 실습 절에 이미 있는 문제를 읽고, **같은 문제를 두 번 싣지 않는다.**
- **정답 동작 확인** — 정본(`<name>-guide.ref.ts`)이나 구현이 있으면 작은 입력으로 돌려 본다.
  **예시에 실을 출력은 여기서 확정한다** — 손으로 계산한 값을 그대로 싣지 않는다.
- **도메인 사실 수집** — 정수 범위 · 인덱스 0/1 기준 · 안정성처럼 해석이 갈릴 것을 찾아 둔다.
  그것이 제약 조건·문제 상세에서 못 박을 대상이다.

### 2. 집필

1. 가이드 끝 `## 실습 — 직접 풀어 보기` 아래에 `### {문제 이름}` 을 더한다(절이 없으면 절부터).
2. 첫 소절 앞에 풀 파일 줄을 둔다 —
   `풀 파일: [\`<name>.ts\`](./<name>.ts) · 테스트: [\`<name>.test.ts\`](./<name>.test.ts) · 실행: \`bun test src/algorithms/<경로>.test.ts\``.
   가이드 하나에 문제가 둘이면 두 번째 문제는 자기 스텁·테스트 이름을 쓴다.
3. 소절 여섯을 SPEC 순서대로 쓴다.
4. 스텁은 시그니처만 두고 `throw new Error("Not implemented");` 로 채운다.
5. 테스트를 쓴다(`import { test, expect } from "bun:test";`).
   - **본문 예시 = 테스트 케이스.** 모든 예시를 테스트로 옮기고 기대값을 맞춘다.
   - `checklist.md` 의 세 축 — 바운더리 / 성능(CPU 1초 ≈ 10^8 연산 가정으로 제약 상한 입력) /
     엣지 케이스. 기대값은 1단계에서 확인한 정답 동작에 근거한다(추정 금지).
   - 테스트는 **풀이 구현에 기대지 않고** 함수의 외부 계약만 본다.

### 3. 확인

```bash
bun run tools/check-v2.ts src/algorithms/<경로>-guide.md   # P22 — 실습 절 구조 · 풀 파일 실재
bun run tools/check-links.ts check                         # 풀 파일 링크
bun test src/algorithms/<경로>.test.ts                     # 스텁이면 미구현 실패가 정상
```

정본이 있으면 스텁 자리에 정본을 잠시 넣고 테스트가 통과하는지 본 뒤 되돌린다.

**완료 보고** — 가이드·스텁·테스트 경로 · 검사 결과 · 정본으로 돌린 테스트 결과.

## 참조 파일

- `checklist.md` — 테스트 커버리지 기준(바운더리·성능·엣지)
- `../../../sandbox/algo-guide-v2/SPEC.md` — §1 `practice` 행 · §3 `practice`

## 주의

- **구성 항목·금기를 이 파일에 다시 쓰지 않는다.** SPEC 이 정본이다. 바꾸려면 SPEC 을 고친다.
