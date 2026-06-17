# 가이드 MDX 마이그레이션 진행상황

`*-guide.md` → `*-guide.mdx` (React 시뮬레이션 포함). **변환 주체: Claude 직접**
(agy `--print`는 자율 에이전트라 리포 소스를 직접 수정하고 프롬프트도 불안정해 폐기).

규칙: 소스 `.ts`는 절대 수정하지 않는다. 기존 산문 4개 섹션을 보존하고, `import` 한 줄 +
`## 시뮬레이션` 섹션(선언형 steps + 프리셋 view)만 추가한다. `simulation-scaffold.md` 준수.

검증(파일/웨이브마다): `compile-check.ts` 통과 → 형제 `.md` `git rm` → 시뮬레이션 타당성 스팟 리뷰.

## 상태 (총 114 = 완료 2 + 잔여 112)

- [x] dijkstra (샘플, 풀 검증)
- [x] bellmanFord (검증)
- [ ] graph (9): articulationPoints, bfsShortestPath, bridgesInGraph, connectedComponents, directedCycleDetection, stronglyConnectedComponents, topologicalSort, undirectedCycleDetection, zeroOneBfs
- [ ] shortest-path 잔여 (4): aStarSearch, dagShortestPath, floydWarshall, spfa
- [ ] graph-flow (7)
- [ ] tree (6)
- [ ] dp (10)
- [ ] sorting (8)
- [ ] data-structures (9)
- [ ] binary-search (4)
- [ ] array (18)
- [ ] bit-manipulation (4)
- [ ] string (8)
- [ ] number-theory (11)
- [ ] geometry (7)
- [ ] advanced (7)

## 뷰 매핑 가이드
- graph 계열(graph/shortest-path/graph-flow) → `view="graph"` (+ `keyValue`/`priorityQueue` 보조)
- tree → `view="tree"`
- dp → `view="matrix"`
- sorting/array/binary-search/string → `view="array"` (포인터/하이라이트)
- number-theory/bit-manipulation/geometry/그 외 → `view="keyValue"` (변수 스냅샷)
