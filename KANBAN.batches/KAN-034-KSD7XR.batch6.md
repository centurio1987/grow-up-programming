---
card: KAN-034-KSD7XR
batch: 6
created: 2026-08-28
branch: KAN-034-KSD7XR
status: 계획
steps: S8
---

# KAN-034-KSD7XR 배치6 — v1 잔여 처분

카드: [KAN-034-KSD7XR.md](../KANBAN.cards/KAN-034-KSD7XR.md) · 범위 `S8`
선행: [배치5](./KAN-034-KSD7XR.batch5.md)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지

### WP1 · `S8` v1 잔여 처분 (`KAN-034.8-BK1Q3A`)

111편이 다 교체돼도 둘이 남는다 — `_deprecated/` 의 구판 가이드와, 대상이 0 이 된
`tools/check-guide-rhythm.ts` 의 알고리즘 몫이다. **대상이 0 인 스캐너는 통과 표시가 무의미해지고
다음 사람이 그것을 근거로 읽는다.**

**완료 기준**: `_deprecated/` 처분 완료 · `check-guide-rhythm.ts` 가 자료구조만 봄 ·
`bun run tools/check-links.ts check` 통과

## 2. 의존과 순서

배치5 가 닫힌 뒤에만 돈다. `check-guide-rhythm.ts` 의 알고리즘 몫을 걷는 판단이
「대상이 0 이다」에 걸려 있고, 그것은 W3 이 끝나야 참이 된다.

파일을 지우거나 옮기기 전에 `bun run tools/check-links.ts refs <경로|디렉터리>` 로 참조를 훑는다.

## 3. 리스크

- `_deprecated/` 를 지울지 남길지는 **처분 방식이 갈리는 자리**다. 지우면 git 이력에만 남는다.
  구판을 참조하는 문서가 있으면 링크가 깨지므로 `refs` 스윕이 먼저다.
- `check-guide-rhythm.ts` 를 통째로 지우지 않는다 — 자료구조 트랙이 아직 그것을 쓴다.

## 4. 카드 종료 판정

이 배치가 닫히면 카드 「검증」 절의 셋이 동시에 참이어야 한다.

```bash
find src/algorithms -name '*-guide.mdx' -not -path '*_deprecated*' -not -path '*_scratch*' | wc -l   # 0
grep -c 'src/algorithms' tools/_baseline/guide-rhythm.tsv                                             # 0
bun run tools/ci.ts all
```

## 5. 착수 시점 판단
<!-- 착수할 때 채운다. -->
