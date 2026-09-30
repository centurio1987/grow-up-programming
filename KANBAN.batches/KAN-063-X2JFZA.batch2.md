---
card: KAN-063-X2JFZA
batch: 2
created: 2026-10-01
branch: KAN-063-X2JFZA
status: 계획
steps: S4, S5, S6, S7
---

# KAN-063-X2JFZA 배치2 — 편 반영(무대 소비 · 규약 없던 자리 · 그림 품질 · 확인 안 한 주장)

카드: [KAN-063-X2JFZA.md](../KANBAN.cards/KAN-063-X2JFZA.md) · 범위 `S4` · `S5` · `S6` · `S7`
선행: [배치1](KAN-063-X2JFZA.batch1.md)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지

병렬 에이전트 넷. 편 묶음이 서로 겹치지 않게 나눴다(treeMaxIndependentSet 은 S5 와 S7 에 걸려 S5 가 둘 다 맡는다). SPEC §13 은 S5 만 고친다. 인용 대장 갱신(remap·--update)은 합류에서 한 번만 한다.

### WP1 · `S4` 넓힌 무대를 쓰는 편 반영

binaryGap·enumerateSubmasks·lowestSetBit(`indexLabel`) · convexHullTrick(`later`) · isPrimeTrial(`layers[].out`) · meetInTheMiddleSubsetSum(`layers[].range`) · nextGreaterElement(`strips`).

**완료 기준**: 7편이 새 필드를 쓰고, 설명 글로 대신하던 자리가 그림으로 옮겨지며, 7편 재출력 후 각 편 check-proof·check-v2 통과.

### WP2 · `S5` 규약 없이 정한 자리 9편

longestSubarrayAtMostSum · sortArray · radixSort · countIslands · connectedComponents · ternarySearch · treeMaxIndependentSet · sieveOfEratosthenes · longestIncreasingSubsequence. 편마다 고치거나 SPEC §13 에 규약으로 올린다. treeMaxIndependentSet 의 역추적 주장(S7 목록)도 여기서.

**완료 기준**: 9편 각각의 처분(고침/규약)과 근거가 보고되고, 고친 편은 재출력 후 통과.

### WP3 · `S6` 그림 품질 셋

radixTree build-over-trie 높이 · subsetSum 참/거짓 구별 · nQueens 판을 table 무대 패널로.

**완료 기준**: radixTree 그림 높이가 약 896px 이하, subsetSum 참 칸이 눈으로 갈림, nQueens 가 손그림 대신 패널로 판을 그림.

### WP4 · `S7` 편 안에서 확인하지 않은 주장 10건

quicksort · subarraySumEqualsK · kthSmallest · palindromePartitioningMinCut · maxFlow · fftMultiply · expectedValueDp · maxBipartiteMatching · dfsTraversal · houseRobber.

**완료 기준**: 건마다 잰 명령·출력 또는 출처가 있고, 본문이 그 결과와 맞는다. 잴 수 없으면 본문이 이미 어림이라고 밝히는지 확인하고 그대로 둔 사유를 적는다.

## 2. 의존과 순서

넷 모두 배치1(무대 필드)에만 기댄다. 합류에서 render-figs --check · check-proof --all · check-citations 를 한 번 돌린다.

## 3. 리스크

- 가이드 본문 줄이 늘면 다른 문서가 가리키는 인용이 밀린다. 합류에서 remap 으로 받는다.
- S7 은 「재지 않은 것을 잰 것처럼」 적을 위험이 가장 크다(이 프로젝트 반려 사유 1위).

## 4. 착수 시점 판단

넷 모두 이번 배치에 둔다.
