---
name: guide-for-problem
description: src/$ARGUMENTS.ts 주석을 참고하여, 문제를 풀기위한 해설서(가이드)를 작성한다. 리서치 → 집필 → 품질 게이트 → 발행의 4단계 파이프라인으로 진행한다. 문제 해설을 부탁해. 문제 해설을 작성해줘. 문제 해설이 필요해.
disable-model-invocation: true
argument-hint: <file-name-without-extension>
---

# guide-for-problem 스킬 (가이드 집필 진입점)

`src/$ARGUMENTS.ts`의 **문제 주석**을 입력으로, 문제를 푸는 **깊은 해설서**
`src/$ARGUMENTS-guide.mdx`를 작성한다. 가이드는 sibling `.ts`(학습자 실습 공간)와 **독립적으로
집필·검증**된다 — 본문에 싣는 코드는 가이드 자체로 실행·검증한다.

> **집필 규칙은 이 파일에 없다.** 골격·문체·품질 기준은 `authoring-kit` 플러그인의
> 명세(spec)와 퍼소나(voice)에 산다. 이 스킬은 **어느 명세로 쓸지 고르고 넘기는 일**만 한다.
> 세 프로젝트가 같은 규칙을 각자 한 벌씩 들고 있다가 갈라진 것을 정리한 결과다.

## 어느 명세를 쓰는가

| 대상 | spec | 골격 |
| --- | --- | --- |
| `src/algorithms/**` | `algo-guide` | 10단계 — 순진한 방법에서 출발해 관찰로 단서를 얻고 최적화로 |
| `src/data-structures/**` | `ds-guide` | 5단계 — 스펙 전수 + 언제 쓰는가 (문제 비종속 독립 가이드) |

voice 는 둘 다 `ppangto-teacher`(빵토 선생님)다.

## 동작

### 0. 사전 확인

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py status
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py lock
```

- 플러그인이 없으면 **여기서 멈춘다.** 구 경로로 조용히 돌아가지 않는다 —
  그러면 어떤 규칙으로 쓰였는지 알 수 없게 된다. `_deprecated/` 의 구 자산은 복구용이지 우회로가 아니다.
- `lock` 이 stale 이면 규칙이 바뀐 것이다. 무엇이 바뀌었는지 확인하고 진행할지 정한다.

### 1. 리서치

`src/$ARGUMENTS.ts` 전체(특히 문제 주석)와 함수 시그니처를 읽는다. 그리고:

- **정답 동작 확인** — 구현이 있으면 `bun test src/$ARGUMENTS.test.ts 2>&1; true`,
  없으면 작은 입력을 손으로 돌려 본다. **본문에 실을 수치는 여기서 확정한다.**
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
- `../../authoring.lock.json` — 이 프로젝트가 서 있는 규칙 조합
- `solving-problem-canvas.md` — **구 템플릿(ORD-003 이전). 새 집필에 사용 금지** (이력 보존용)
- `../_deprecated/README.md` — 플러그인이 대체한 구 자산과 대응표

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
