---
card: KAN-063-X2JFZA
batch: 3
created: 2026-10-01
branch: KAN-063-X2JFZA
status: 계획
steps: S8, S9, S10
---

# KAN-063-X2JFZA 배치3 — 스캐너 · 처분표 · 게이트

카드: [KAN-063-X2JFZA.md](../KANBAN.cards/KAN-063-X2JFZA.md) · 범위 `S8` · `S9` · `S10`
선행: [배치2](KAN-063-X2JFZA.batch2.md)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지

한 세션이 순서대로 한다(작고 서로 이어진다).

### WP1 · `S8` 스캐너 오탐

**완료 기준**: bestTimeToBuyAndSellStock 의 P21 경고 0, 시험 통과. 플러그인 쪽 둘은 재현과 수정안만 적는다.

### WP2 · `S9` 처분표

**완료 기준**: 아래 「처분표」가 근거 파일 §7 의 모든 줄을 덮는다.

### WP3 · `S10` 게이트와 검토서

**완료 기준**: `bun run tools/ci.ts gates` 통과, 검토서 발행.

## 2. 의존과 순서

S8 → S9(S8 결과를 표에 적는다) → S10.

## 3. 리스크

플러그인 수정은 여러 프로젝트가 함께 쓰는 파일이라 이 카드에서 하지 않는다 — 검토 판단 항목으로 올린다.

## 4. 착수 시점 판단

셋 모두 이번 배치에 둔다.

## 처분표 — 근거 파일 §7 (`KANBAN.batches/KAN-058-8XT6PC.s11-findings.md`)

| §7 줄 | 후보 | 처분 | 어디서 |
| --- | --- | --- | --- |
| 검사 공백 | 게이트가 `bun test tools` 를 안 돌림 | 이미 닫힘 | KAN-058 S10(커밋 b7e91ed0), `tools/ci.ts` 「추출기·판정기 자기시험」 단계 |
| 배열 무대 | 인덱스 줄 이름 고정 | 고침 — `indexLabel`, 3편 반영 | S2 · S4 |
| 배열 무대 | 「밖」 상태가 하나뿐 | 고침 — 값 없는 칸은 범위 밖이어도 「아직」(기본값, 6편 재출력) · `later` · `layers[].out` | S2 · S4 |
| 배열 무대 | 쌓은 줄 위 구간 괄호 | 고침 — `layers[].range`, meetInTheMiddleSubsetSum · longestIncreasingSubsequence | S2 · S4 · S5 |
| 배열 무대 | 스택 띠를 layers 로 | 고침 — `strips`, nextGreaterElement | S2 · S4 |
| 그 밖 무대 | CellStageFilm 줄 머리 폭 | 고침 — 필름·플레이어 전 장 공통 폭, 4편 6장 재출력 | S3 |
| 그 밖 무대 | 힙 무대 없음 | 버림 — 쓰는 편이 없다. dijkstra 가 「힙 모양 자체가 필요할 때」 만들기로 규약을 세웠고 primMst·medianFromDataStream·topKFrequent 가 따른다 | — |
| 그 밖 무대 | nQueens 판 | 고침 — table 무대 패널(판 4칸 + 비트 7칸 줄) | S6 |
| 규약 없이 정한 자리 | 9편 | 고침 5(sortArray · connectedComponents · treeMaxIndependentSet · sieveOfEratosthenes · longestIncreasingSubsequence) · 규약 4(longestSubarrayAtMostSum · radixSort · countIslands · ternarySearch → SPEC §13) | S5 |
| 그림 품질 | radixTree 세로 1254px | 고침 — 878px | S6 |
| 그림 품질 | subsetSum 참 칸 | 고침 — 거짓을 「·」로 | S6 |
| 증명 도구 | 펜스 뒤 닫는 마커 무시 | 고침 — check-proof, 같은 결함이던 check-v2 P1(`closedProofLines`)도 | S1 · S8 |
| 스캐너 오탐 | P21 「최저가」 | 고침 — check-v2 `PRICE_NOUN` | S8 |
| 스캐너 오탐 | P4 `!==` | 재현됨, 원인이 다름 — 플러그인 `scan_ai_style.py` 가 HTML 주석을 안 걷어 `<!--…-->` 마커 두 개가 느낌표 둘로 세어진다(알고리즘 115편 P4 354문단 중 300). 고치지 않음 → 검토 판단 항목 | S8 |
| 스캐너 오탐 | 천 단위 쉼표 | 재현됨 — 같은 플러그인의 문단 쉼표 밀도 규칙. `\d,\d{3}` 을 빼면 57편 94건이 사라진다. 고치지 않음 → 검토 판단 항목 | S8 |
| 확인 안 한 주장 | 11건 | 측정 3 · 원문 대조 2(glibc qsort 주장은 틀려 정정) · 문장 정정 2 · 이미 밝힘 2 · 해당 없음 2 · treeMaxIndependentSet 복원은 증명 블록으로 실행 확인 | S7 · S5 |
| 「견주다」 | 자료구조 19편 124곳 | 넘김 — KAN-036 메모(KAN-058 검토 8 에서 이미 받음) | KAN-036 |

### 이 카드에서 새로 드러난 것

| 무엇 | 처분 |
| --- | --- |
| NodeGraphFilm 2장(convexHull walk-upper · ahoCorasick walk-ac-scan)도 장마다 첫 칸 x 가 다르다 | 검토 판단 항목 |
| 짝 없는 닫는 마커(`<!--/proof-->`)를 잡는 검사가 없다 | 검토 판단 항목 |
| radixSort 층 「자리 값」도 정본이 따로 저장하지 않는 값이다(L48) | 검토 판단 항목 |
| convexHullTrick 의 `hull` 줄도 스택 띠다(`strips` 로 옮기지 않음) | 검토 판단 항목 |
