# 가이드 → MDX 변환 작업자 지침 (subagent용)

너는 알고리즘 해설서 `src/.../<name>-guide.md`(마크다운)를 React 시뮬레이션이 포함된
`<name>-guide.mdx`로 변환하는 작업자다. **할당받은 파일 목록만** 처리한다.

## 절대 규칙
1. **소스 `.ts` 파일은 절대 수정하지 마라.** 읽기만 한다(시뮬레이션 정확성 근거).
2. 산문(4개 섹션과 하위 소제목·표·수식·코드블록·mermaid)은 그대로 보존한다. `build-mdx.ts`가
   원문 .md를 그대로 복사하므로, 너는 **시뮬레이션 섹션만** 새로 작성한다.
3. agy 등 외부 CLI를 쓰지 마라. 네가 직접 작성한다.

## 파일당 워크플로우
각 `src/<dir>/<name>/<name>-guide.md`에 대해:

1. `<name>-guide.md`와 형제 `<name>.ts`를 Read 한다. (`.ts`가 `throw new Error("Not implemented")`여도
   문제없다 — 알고리즘 정의에 맞는 올바른 전개를 직접 작성하면 된다.)
2. 시뮬레이션 섹션을 임시 파일 `/tmp/sim_<name>.mdx`에 Write 한다. 형식은 아래 "시뮬레이션 섹션 형식" 참고.
3. 조립: `bun run tools/guide-preview/build-mdx.ts src/<dir>/<name>/<name>-guide.md /tmp/sim_<name>.mdx`
   → `<name>-guide.mdx`가 생성된다(맨 위 import + 산문 + `## 수도 코드와 Activity Diagram` 앞에 시뮬레이션 삽입).
4. 검증: `bun run tools/guide-preview/compile-check.ts src/<dir>/<name>/<name>-guide.mdx`
   - 실패 시 아래 "MDX 안전" 참고해 `.mdx`를 직접 Edit 해 고치고 다시 compile-check. 통과할 때까지 반복.
5. 통과하면 원본 삭제: `rm src/<dir>/<name>/<name>-guide.md` (git 명령은 쓰지 마라 — 단순 rm).

## 시뮬레이션 섹션 형식
`/tmp/sim_<name>.mdx`에 다음 구조로 작성한다(이것만 작성, import/산문은 build-mdx가 처리):

```mdx
## 시뮬레이션

(고정 입력과 그 입력에 대한 알고리즘의 실제 반환값을 한두 문장으로 명시. 색/패널 의미 설명.)

실제 반환값은 `...` 이며, 시뮬레이션 마지막 프레임과 일치한다.

> 대화형 시뮬레이션은 MDX 런타임에서 표시됩니다.

export const steps = [
  { title: "...", detail: "...", /* 프리셋 view에 맞는 필드 */ },
  ...
];

<AlgorithmSimulation view="..." steps={steps} title="..." />
```

- `steps`는 머릿속 추정이 아니라 **소스 코드의 실제 실행 단계**를 작은 고정 입력으로 따라가야 한다.
  마지막 프레임의 결과 상태가 실제 반환값과 일치해야 한다.
- 8~16프레임 정도. 데이터를 재사용하려면 `export const nodes = [...]` 처럼 위에 const를 선언해 각 프레임에서 `nodes, edges` 로 펼쳐 써도 된다(예시 파일 참고).

## 프리셋 view 와 스키마
정확한 필드 스키마는 `.claude/skills/guide-for-problem/simulation-scaffold.md`를 **반드시 Read** 해서 따른다. 요약:
- `view="array"` — `array`, `highlight?`, `marked?`, `pointers?` : 정렬/투포인터/배열 스캔
- `view="graph"` — `nodes`(id,label,x,y 0~100), `edges`(from,to,weight?,directed?), `nodeStatus?`, `nodeValue?`, `activeEdge?` : 그래프
- `view="priorityQueue"` — `heap`([{label,key}]), `highlight?` : 힙/큐
- `view="tree"` — `root`(TreeNodeData) : 트리/재귀
- `view="matrix"` — `matrix`(2D), `rowLabels?`, `colLabels?`, `cells?`([[r,c]]) : DP 표
- `view="keyValue"` — `entries`([{label,value}]) : 변수 스냅샷(범용)
- `view`를 배열로 주면 여러 패널 동시 렌더: `view={["graph","keyValue"]}`

## view 매핑 가이드
- tree → `tree` (+ keyValue 보조)
- dp → `matrix` (DP 표)
- sorting/array/string/binary-search → `array` (포인터/하이라이트)
- graph-flow(매칭/플로우/MST/컷) → `graph` (+ keyValue/priorityQueue 보조)
- number-theory/bit-manipulation/geometry/기타 추상 → `keyValue` (핵심 변수 스냅샷)

## 모범 예시 (반드시 Read 해서 형식 모방)
- `src/shortest-path/dijkstra/dijkstra-guide.mdx` (graph + priorityQueue)
- `src/graph/bfsShortestPath/bfsShortestPath-guide.mdx` (graph + keyValue)
- `src/shortest-path/floydWarshall/floydWarshall-guide.mdx` (matrix)

## MDX 안전 (compile 실패의 주원인)
- 코드블록/`$...$`/`$$...$$` **바깥**의 산문에 **맨 중괄호 `{ }` 또는 홑화살괄호 `< >`** 가 있으면
  MDX가 JS 표현식/태그로 파싱해 실패한다(`Could not parse expression with acorn` 등).
  - 이미 .md에 그런 산문이 있으면(예: `∈ {0, 1}`), 생성된 `.mdx`에서 그 부분을 백틱 코드스팬으로 감싸 고친다:
    `` `∈ {0, 1}` ``. 의미는 보존된다.
- 수식 안의 중괄호(`\{`, `\text{...}`, `\begin{cases}`)는 remark-math가 보호하므로 그대로 둬도 된다.
- 너의 시뮬레이션 섹션 산문에는 맨 중괄호/홑화살괄호를 쓰지 마라(코드/JSX 제외).

## 완료 보고
처리한 각 파일의 `.mdx` 생성·compile 통과·`.md` 삭제 여부를 목록으로 보고하라. 실패해 못 고친 파일이 있으면 명시하라.
