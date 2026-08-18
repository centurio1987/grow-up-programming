---
card: KAN-033-E8KHSV
title: 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.
created: 2026-08-18
scope: sandbox/guide-rework/**, .claude/authoring/specs/learn-guide/**
---

# KAN-033-E8KHSV — 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.

## 전략
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음).

### 지시의 두 요구가 충돌해 보이는 지점부터 푼다

"기존의 가이드나 집필 스킬에 의존하지 말라"와 "authoring-kit 플러그인으로 일관성 있는
문체를 유지한다"는 서로 다른 층을 가리킨다. **버리는 것은 골격**(`algo-guide` spec 의 항목
구성, `guide-for-problem` 캔버스)이고, **유지하는 것은 문체**(voice)다. 그래서 새 spec
`learn-guide` 를 `authoring-spec` 으로 새로 등록하고, voice 는 이미 등록된
`ppangtolab-teacher`("작은 단계로 쪼개 끝까지 이해시키는" 문체)를 그대로 쓴다.

### 재기획의 근거는 취향이 아니라 실측 실패다

`.claude/authoring/paths.json` 의 `_note_algo-guide` 가 현행 예시
(`src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.mdx`)의 이해 게이트 실측 결과를
기록한다 — 2026-08-15 codex·agy 둘 다 FAIL, 사유는 **Q1 절차 층위 대안 미제시**와
**Q5 실수 결과값 미제시**다. 카드가 요구한 "개념 설명만 보고도 전체 컨셉을 이해"와
"오해 포인트를 환기시키고 그것을 받아들여 전개하면 참이 아님을 보인다"가 정확히 그 두 실패
항목을 겨눈다. 새 골격의 성패 판정도 같은 게이트로 한다.

### 웹 버전은 새로 만들지 않는다 — 이미 저장소에 있다

- `src/_guide-sim/index.tsx` — `AlgorithmSimulation`. 선언형 `steps` 프레임 + 프리셋 `view`
  6종(`array`·`graph`·`priorityQueue`·`tree`·`matrix`·`keyValue`). 카드가 말한 "자체 구축한
  viz 기능"이 이것이다.
- `tools/guide-preview/` — `build-mdx.ts`(md + 시뮬레이션 절 조립) · `compile-check.ts`(검증)
  · `serve.ts`(MDX→JS→`Bun.build`→`Bun.serve`).
- 수식은 `remark-math` + `rehype-katex` 가 이미 `serve.ts` 에 물려 있어 카드의 LaTeX 요구가
  새 인프라 없이 충족된다.

**그러므로 astro 는 기본안이 아니다.** 다만 `serve.ts` 는 프리뷰 서버이지 배포용 정적 산출
경로가 아니다 — 정적 export 가 되는지 S7 에서 실측하고, 그 판정 **뒤에** 도구를 정한다.
판정 전에 astro 를 들이면 있는 인프라를 두고 한 벌을 더 얹게 된다.

### md 와 웹은 한 원본에서 갈라진다

두 벌을 따로 쓰면 반드시 갈라진다. 이 저장소가 `tools/guide-core.ts check` 로 가이드 코드와
`_reference/` 추출본의 일치를 기계로 강제하는 이유가 그것이다. md 를 원본으로 두고 웹은
시뮬레이션 절만 얹는 현행 `build-mdx.ts` 조립 방식을 승계한다. **갈리는 것은 시각화 수단
하나뿐이다** — md 는 ascii art, 웹은 `_guide-sim` 프리셋.

### 샌드박스 경계

전 과정을 `sandbox/guide-rework/` 안에서 한다. `src/algorithms/` 의 기존 가이드는 pilot 이
승인되기 전까지 한 글자도 건드리지 않는다. 이 카드 frontmatter 의 `scope` 가 그 경계이고,
루트 독립성 판정도 그 값으로 이뤄진다.

### 버린 대안 셋

| 대안 | 왜 버렸나 |
|---|---|
| astro 를 먼저 도입 | 판정 없이 인프라를 늘린다. `_guide-sim`+MDX 로 되는지부터 잰다 |
| 기존 `algo-guide` spec 개정 | 카드가 명시적으로 배제했고, 실패한 골격 위 덧칠이 된다 |
| 107종 동시 착수 | 카드가 pilot 승인을 선행 조건으로 못박았다 |

### 아직 확인 안 한 것

벤치마크 대상인 **openai 의 learning 스킬**과 **Claude 데스크톱 앱의 `/learn` 스킬**은 이
저장소 밖이라 아직 확인하지 않았다. S1 에서 조사하고, 끝내 확인 못 한 항목은 추측으로 채우지
않고 "확인 안 함"으로 남긴다.

## 실행 계획
각 단계에 완료 기준을 단다. `S<n>` 은 고정 id 이므로 이름을 바꾸지 않는다.

- [ ] `S1` 벤치마크 조사 — openai learning 스킬 · Claude 데스크톱 `/learn`
      완료 기준: `sandbox/guide-rework/research/benchmark.md` 에 두 대상의 **이해 유도 장치**를
      출처와 함께 정리. 확인 못 한 항목은 "확인 안 함"으로 명시. 추측 서술 0건.
- [ ] `S2` 항목 구성 확정 — 카드가 준 "의미"를 항목명으로 번역
      완료 기준: `sandbox/guide-rework/outline.md` 에 항목 표(항목명 · 그 항목이 답하는 질문 ·
      필수/선택 · 판정 방법). 카드 원문의 의미 항목이 **하나도 누락 없이** 매핑됐음을 대조표로 보임.
- [ ] `S3` 파이프라인 실측 — `_guide-sim` 프리셋과 조립 경로가 실제로 도는지
      완료 기준: 샌드박스에 최소 예제 1편을 넣고 `build-mdx.ts` → `compile-check.ts` 통과,
      `serve.ts` 기동 확인. 6개 프리셋 중 pilot 에 쓸 view 를 지목.
- [ ] `S4` 새 spec `learn-guide` 등록 — `authoring-spec`
      완료 기준: `.claude/authoring/specs/learn-guide/` 생성, `authoring.lock.json` 의 `specs` 에
      항목 추가, voice 는 `ppangtolab-teacher` 로 바인딩. `authoring-doctor` 진단 통과.
- [ ] `S5` pilot 대상 선정 + md 버전 집필
      완료 기준: 대상 알고리즘 1종 선정 사유를 문서화하고, `authoring-write learn-guide` 로
      md 초안 완성. ascii art 시각화 포함. 분량 상한 없음.
- [ ] `S6` pilot 웹 버전 조립
      완료 기준: `_guide-sim` 시뮬레이션 절을 얹어 `.mdx` 산출, `compile-check.ts` 통과,
      LaTeX 수식이 KaTeX 로 렌더됨을 프리뷰에서 확인.
- [ ] `S7` 정적 export 판정 — html 단독인가 astro 인가
      완료 기준: `serve.ts` 의 `Bun.build` 산출물을 정적으로 낼 수 있는지 실측. 되면 astro 를
      쓰지 않는다는 판정과 근거, 안 되면 무엇이 막는지 구체적 사유를 기록. **판정 없이 도구를
      고르지 않는다.**
- [ ] `S8` 품질 게이트 — 문체와 이해를 각각 잰다
      완료 기준: `authoring-gate` 통과 + 이해 게이트(`comprehension-gate.sh`) 실행. Q1·Q5 가
      PASS 여야 한다 — 현행 예시가 FAIL 한 바로 그 두 항목이다.
- [ ] `S9` 승인 요청 산출물
      완료 기준: `review-init` 으로 검토 요청서 작성(판단 항목에 항목 구성·시각화 수준·문체를
      각각 물음으로 기재), 리포트 발행, 카드를 검토로 이동.

## 검증
이 카드가 끝난 것으로 판정하는 기준이다. pilot 1편에 대해 전부 통과해야 한다.

```bash
# 웹 버전이 실제로 컴파일되는가
bun run tools/guide-preview/compile-check.ts sandbox/guide-rework/pilot/<name>-guide.mdx

# 문체 — authoring-kit 게이트
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py status   # learn-guide spec 등록 확인

# 이해 — 현행 예시가 FAIL 한 게이트. 종료코드 0=통과 · 3=미통과 · 2=미실행(통과 아님)
bash .claude/skills/guide-for-problem/scripts/comprehension-gate.sh \
    sandbox/guide-rework/pilot/<name>-guide.mdx

# 샌드박스 경계를 넘지 않았는가 — src/ 아래가 하나도 안 바뀌어야 한다
git diff --name-only main...HEAD -- src/ | wc -l   # 0 이어야 한다
```

기계가 판정하지 못하는 것 셋은 검토 요청서(`S9`)의 「판단 항목」으로 넘긴다 — 항목 구성이
카드의 의미 요구를 다 덮는가 · 시각화가 이해에 실제로 기여하는가 · 문체가 일관된가.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-08-18T16:08 · s:39f2e657 — `전략` 섹션 교체
- 2026-08-18T16:08 · s:39f2e657 — `실행 계획` 섹션 교체
- 2026-08-18T16:08 · s:39f2e657 — `검증` 섹션 교체
