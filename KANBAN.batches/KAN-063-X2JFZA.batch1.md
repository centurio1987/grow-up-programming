---
card: KAN-063-X2JFZA
batch: 1
created: 2026-10-01
branch: KAN-063-X2JFZA
status: 계획
steps: S1, S2, S3
---

# KAN-063-X2JFZA 배치1 — 도구 셋(증명 대조 · 배열 무대 · 필름 머리 폭)

카드: [KAN-063-X2JFZA.md](../KANBAN.cards/KAN-063-X2JFZA.md) · 범위 `S1` · `S2` · `S3`
선행: 없음 (이 카드의 첫 배치)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지

수행 방식은 병렬 에이전트다(2026-10-01 유저 선택). 세 WP 가 서로 다른 파일을 고치므로 동시에 돈다.

### WP1 · `S1` 증명 도구가 펜스 블록 뒤 닫는 마커까지 대조

고칠 자리: `tools/check-proof.ts` 의 블록 수집(펜스 opener 면 close 를 안 찾는다)과 `closeOf`(펜스 줄에서 포기한다). SPEC §0 에 한 문장.

**완료 기준**: `tools/check-proof.test.ts` 에 「펜스 + 사이 문장 + 닫는 마커」 시험(사이 문장이 어긋나면 실패)이 붙어 통과하고, `bun run tools/check-proof.ts` 가 115편에서 그대로 통과한다(닫는 마커가 붙은 17곳 포함).

### WP2 · `S2` 배열 무대 선택 필드 다섯 + 아직/밖 기본값 수정

고칠 자리: `src/_viz/player/arrayStage.ts`. `indexLabel` · `later` · `ArrayLayer.out` · `ArrayLayer.range` · `strips`(비인덱스 띠, `GraphStrip` 과 같은 모양)를 더하고, 값이 null 인 칸을 밖으로 칠하지 않게 기본값을 고친다. SPEC §13 에 필드를 적는다.

**완료 기준**: 필드마다 시험 하나가 통과하고, 기본값 수정으로 바뀌는 6편(babyStepGiantStep·gcd·pollardRho·extendedEuclidean·diffArrayRangeUpdate·nQueens)의 그림을 다시 뽑는다. 새 필드를 쓰는 편 반영은 S4 다.

### WP3 · `S3` CellStageFilm 머리 폭을 필름 전체에서 하나로

고칠 자리: `src/_viz/patterns/CellStage.tsx`(필름의 장마다 layout) · 플레이어의 걸음마다 layout(StepPlayer).

**완료 기준**: 어긋나던 6장(searchInRotatedSortedArray 둘 · findAllOccurrences · insertionSort 둘 · longestIncreasingSubsequence)의 칸 열이 맞고, 다시 뽑은 4편 밖의 필름은 바이트 그대로다.

## 2. 의존과 순서

셋은 서로 기다리지 않는다. SPEC.md 는 WP1(§0)과 WP2(§13)가 다른 절을 고친다. 합류 뒤 `bun run tools/render-figs.ts --check` 를 한 번 돌려 WP2·WP3 가 다시 뽑은 편만 바뀌었는지 본다.

## 3. 리스크

- WP2 와 WP3 가 같은 편(nQueens 는 WP2, longestIncreasingSubsequence 는 WP3)을 다시 뽑을 때, 서로의 코드 변경이 반쯤 들어간 상태에서 뽑힐 수 있다. 합류 뒤 두 쪽 편을 한 번 더 뽑아 --check 로 확정한다.
- 필름 머리 폭 변경이 72편 필름 전부에 닿는다. 바이트 그대로가 아니면 합류에서 멈추고 원인을 본다.

## 4. 착수 시점 판단

세 WP 모두 이번 배치에 둔다(각각 15~40줄 규모, 조사 에이전트 추정).
