---
card: KAN-056-VPCM91
title: 알고리즘 가이드 집필 로직 피드백
created: 2026-09-26
scope: sandbox/algo-guide-v2/**, tools/section.ts, tools/check-v2.ts, tools/check-v2.test.ts, src/algorithms/array/sparseTableRangeMin/**
---

# KAN-056-VPCM91 — 알고리즘 가이드 집필 로직 피드백

## 전략
<!-- 왜 이 접근인가 · 제약 · 버린 대안. 사람이 자유롭게 편집한다. -->
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음). 승인된 플랜: `~/.claude/plans/kan-056-hidden-hopper.md`(Claude 세션 검토 3회 반영).

**무엇이 문제인가.** 알고리즘 가이드 명세 정본 `sandbox/algo-guide-v2/SPEC.md` §3 `deep.build`(「아이디어 상세」)의 직무 ①~⑥이 전부 「단순한 방법 → 아이디어」 서사다. 파일럿 `sparseTableRangeMin-guide.md` 95~367줄이 그 서사이고, 아이디어 자체(표의 모양·채우는 규칙·질의 분해·겹침)는 끝의 몇 단락뿐이다.

**새 구성(유저 결정: 서사 먼저).**

- `### 아이디어를 떠올리는 과정 — {단순한 방법}에서 {아이디어}까지` — 신설 id `deep.origin`. 문제 고정(시그니처·계약·제약·기호표) · 단순한 방법의 수치 반박 · 후보 시험과 반박. 아이디어의 **이름을 대는 데서 멈춘다.** 구조 정의와 그 구조에 기대는 설계 선택(밑 2)은 하지 않는다.
- `### 아이디어 상세 — {아이디어 이름}` — id `deep.build` 유지, 직무 교체. ① 한 문장 + 예시 입력 전체 상태 그림 ② 핵심 성질이 왜 성립하는가(값) ③ 채우는 규칙 ④ 쓰는 법(여러 경우) ⑤ 상태 크기·범위 ⑥ 기대는 전제와 깨지는 경우 ⑦ 설계 선택을 값으로 결론.
- 경계: 아이디어 상세는 개념을 그림과 값으로, `deep.walk` 는 코드로 옮기는 걸음으로. 같은 값은 기존 증명 블록을 가리킨다. 겹침을 이유로 아이디어 상세를 줄이지 않는다(카드 원문 「최대한 자세히」).
- 규칙: L3 → `deep.origin`, L1 → 두 절 모두, L21 범위 그대로(기호표 위치 표기만).

**제약.**

- 110편 재집필은 범위 밖 — 파일럿 승인 뒤 별도 카드. 그래서 `check-v2` 는 `deep.origin` 을 **있을 때만** 검사한다(명세 §8 한시 조항).
- 배치 2(파일럿 집필)는 `/output-style learning` 적용을 확인한 메인 세션이 직접 쓴다. 전역 CLAUDE.md 「답변 말투」가 원고를 누르는 자리가 보이면 수행 내역에 한 줄씩 남긴다.
- 자료구조 트랙(`PATTERNED_DS`)은 건드리지 않는다.

**버린 대안.** 아이디어 먼저·서사 뒤(유저가 서사 먼저를 골랐다) · `deep.origin` 필수 검사 즉시 적용(옛 110편이 전부 걸린다) · `build-html.ts` 라벨 추가(앵커·라벨이 id·헤딩에서 자동 생성된다).

**범위 밖 기록.** `.claude/skills/guide-for-problem/SKILL.md:32` 가 알고리즘 가이드를 아직 「10단계」로 적는다(v2 명세와 어긋남).

## 실행 계획
<!-- `S<n>`은 고정 id — 이름을 바꾸지 않는다. 체크 상태는 doc-step 이 갱신한다. -->
**배치 1 — 명세·스캐너**

- [x] `S1` SPEC.md 개정 — §1 표(`deep.origin` 13, `deep.build` 13.5) · §2 매핑 · §3 `deep.origin` 신설과 `deep.build` 직무 재정의 · §4 그림 의무 목록 · §6 L1·L3 · §7 대응표 · §8 한시 조항 · 그 밖의 `deep.build` 언급 전수(`grep -n 'deep\.build'` 전수 — 파트 1 항목 목록 · `related` 싣는 조건 · bench 입력 · 가장 단순한 방법 재사용 금지 · `deep.math` 조건 등). 완료 기준: grep 결과 자리마다 처분이 정해져 있다
- [x] `S2` 스캐너 — `tools/section.ts` `PATTERNED_ALGO` 에 `deep.origin`, `tools/check-v2.ts` `CONDITIONAL_FIGURE_AND_CODE` 에 `deep.origin`, `tools/check-v2.test.ts` 에 새 절 해소·옛 구성 무회귀 사례. 완료 기준: `bun test tools/check-v2.test.ts` 통과 · `check-v2 --all` 결과가 변경 전과 같다
- [x] `S3` `FEEDBACK.md` 에 지적 → 규칙 → 강제 지점 한 줄. 완료 기준: 기록이 섰고 `check-links` 통과

**배치 2 — 파일럿 재집필(learning 스타일 · 메인 세션)**

- [x] `S4` 서사 절 — 95~367줄 중 서사(`cost-scan`·`prefix-min-fails`·`cost-two-ways`·`cost-precompute-all`)를 `deep.origin` 으로. 아이디어 이름에서 멈춘다. 완료 기준: 구조 정의·밑 2 결론이 이 절에 없다
- [x] `S5` 아이디어 상세 재작성 — 직무 ①~⑦. 새 값은 `proof.ts` 증명 블록으로(표 세 층 전체·겹침 사례), 합 반례는 `pause-overlap` 을 가리킨다, `cost-base` 는 ⑦ 로. `concept`·`deep.walk` 의 옛 절 참조 정리. 완료 기준: `check-proof` 통과 · 재작성률 0.6 이상

**배치 3 — 검증·검토 인계**

- [x] `S6` 검증 전체(아래 「검증」 절) 실행과 결과 기록. 완료 기준: 전 항목 통과, 실패 시 사유 기록
- [x] `S7` HTML 빌드 · 검토서 작성 · 검토로 이동. 완료 기준: 카드가 검토 컬럼에 있고 검토 화면이 열린다

## 검증
<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
```bash
G=src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
bun run tools/check-v2.ts $G
bun run tools/check-proof.ts --all --require
bun run tools/check-v2.ts --all                  # 옛 구성 110편이 새로 깨지지 않는다
bun run tools/check-metaphor.ts --all
bun test tools/check-v2.test.ts
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/section.ts tools/check-v2.ts
bun run tools/check-rework.ts $G '### 아이디어 상세' --base main   # 0.6 이상
bun run tools/ci.ts all
# 아이디어 상세에 서사 증명 표지 0 개
awk '/^### 아이디어 상세 — /{f=1;next} /^### /{f=0} f' $G | grep -cE 'proof:(cost-scan|prefix-min-fails|cost-two-ways|cost-precompute-all)'
# 서사 표지어 — 0 이 목표, 남으면 사유 기록
awk '/^### 아이디어 상세 — /{f=1;next} /^### /{f=0} f' $G | grep -nE '단순한 방법|가장 먼저 떠오르는|차례로 읽|후보|욕심'
# 같은 값 블록 중복 — tools/check-overlap.ts 가 맞으면 그것으로, 아니면 proof.ts 새 키 출력과 pause-* 출력을 대조
bun run tools/build-html.ts $G
```

**사람 판정(최종).** 유저가 HTML 로 두 절을 읽고 「아이디어 상세가 아이디어에 초점을 두고 충분히 자세한가」를 본다. 위 기계 검사는 증명 표지·표지어·재작성률만 재고 산문으로 남은 서사나 설명 품질은 못 잡는다.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-26T21:53 · s:23da538d — `전략` 섹션 교체
- 2026-09-26T21:53 · s:23da538d — `실행 계획` 섹션 교체
- 2026-09-26T21:53 · s:23da538d — `검증` 섹션 교체
- 2026-09-26T21:54 · s:23da538d · S1 doing — 착수
- 2026-09-26T21:55 · s:23da538d · S1 done — SPEC.md 6차 개정 — deep.origin 신설(직무 다섯)·deep.build 직무 일곱으로 교체·§1/§2/§4/§6/§7/§8 반영, deep.build 언급 19자리 처분
- 2026-09-26T21:55 · s:23da538d · S2 doing — 착수
- 2026-09-26T21:57 · s:23da538d · S2 done — section.ts PATTERNED_ALGO 에 deep.origin, check-v2 CONDITIONAL_FIGURE_AND_CODE 에 deep.origin, 테스트 5건 추가(142 통과) · check-v2 --all 전후 동일 · tsc 0
- 2026-09-26T21:57 · s:23da538d · S3 doing — 착수
- 2026-09-26T21:57 · s:23da538d · S3 done — FEEDBACK.md §1 에 R24 — 지적 → 규칙 → 강제 지점
- 2026-09-26T21:58 · s:23da538d · S4 doing — 착수
- 2026-09-26T21:58 · s:23da538d — 배치 2 착수 — /output-style learning 적용을 시스템 알림(Learning output style is active)으로 확인, 메인 세션 직접 집필
- 2026-09-26T22:05 · s:23da538d · S4 done — 서사(95~252줄)를 deep.origin 「아이디어를 떠올리는 과정 — 질의마다 차례로 읽기에서 겹치는 두 조각까지」로 옮기고 아이디어 이름에서 멈추게 끝을 새로 씀(버린 방법 요약 그림 추가)
- 2026-09-26T22:05 · s:23da538d · S5 doing — 착수
- 2026-09-26T22:05 · s:23da538d · S5 done — 아이디어 상세 직무 ①~⑦ 재작성 · 증명 블록 넷 신설(idea-cells·idea-cover·idea-fill·idea-size) · cost-base 를 ⑦ 로 · 합 반례는 pause-overlap 참조 · 재작성률 71% · check-v2 P1~P16 통과 · 증명 22개 일치
- 2026-09-26T22:05 · s:23da538d — 배치 2 동안 전역 CLAUDE.md 「답변 말투」가 원고 분량·상세도를 누른 자리는 관찰되지 않음(원고는 파일 산출물이라 답변 규칙 대상 밖)
- 2026-09-26T22:05 · s:23da538d · S6 doing — 착수
- 2026-09-26T22:12 · s:23da538d — `실행 계획` 섹션 교체
- 2026-09-26T22:20 · s:23da538d · S6 done — ci all: 인용 1건 실패(수정 전 시작) → 인용 11곳 재지정 후 gates 11단계 통과 · check-proof --all --require 통과 · check-v2 --all 전후 동일 · 새 증명 블록과 기존 블록 같은 줄 0 · tsc 0 · check-metaphor 655개 0
- 2026-09-26T22:21 · s:23da538d · S7 doing — 착수
- 2026-09-26T22:21 · s:23da538d · S7 done — 검토서(판단 항목 4) 작성 · 검토로 이동 · 검토 화면 발행
- 2026-09-27T00:50 · s:b3d87b0a — 검토 중 유저 지시로 파일럿 재집필 — 상위 집필 규칙 개정(authoring-kit 0.4.0 어휘 가중치 V5 · 전역 CLAUDE.md 쉬운 말 규칙) 반영. 계산·코드 블록 29개와 증명 표지 10개는 원문 그대로(글자 단위 대조), 두 절 산문만 새로 씀(산문 144줄 중 새로 쓴 비율 98%). check-v2 P1~P16 통과 · 증명 22개 일치 · 리듬 A 적발 0 · 어휘 허용량 초과 0 · 재작성률(main 대비) 아이디어 상세 75%·떠올리는 과정 100% · ci all 17단계 통과. check-proof --all 종료코드 1 은 HEAD 에서도 같아 이 변경과 무관
