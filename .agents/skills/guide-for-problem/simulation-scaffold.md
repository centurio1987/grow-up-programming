# 시뮬레이션 scaffold 레퍼런스

해설서(`*-guide.mdx`)의 `## 시뮬레이션` 섹션은 공용 모듈 `src/_guide-sim`을 import 해
**선언형 데이터만** 작성한다. 시각화 로직(컴포넌트/Hook/CSS)은 전부 모듈 안에 있으므로,
**해설서에서는 JSX 컴포넌트나 React Hook을 직접 작성하지 않는다.**

## 작성 규칙

1. MDX 상단에 import 한 줄만 추가한다:
   ```js
   import { AlgorithmSimulation } from "#guide-sim";
   ```
2. `## 시뮬레이션` 섹션에서 `steps` 배열(상태 스냅샷의 나열)을 `const`로 선언하고,
   알맞은 프리셋 `view`를 골라 컴포넌트를 렌더한다:
   ```jsx
   export const steps = [ /* … 프레임들 … */ ];

   <AlgorithmSimulation view="array" steps={steps} title="버블 정렬 한 패스" />
   ```
3. `steps`의 각 원소(프레임)는 선택한 `view`의 스키마를 따른다. `view`를 배열로 주면
   여러 패널을 위에서 아래로 함께 렌더한다(예: `view={["graph", "priorityQueue"]}`).
4. **정확성**: `steps`는 머릿속 추정이 아니라 원본 `src/<name>.ts` 함수의 실제 실행을
   따라야 한다. 작은 고정 입력을 정하고, 그 입력에 대한 **실제 반환값**을 해설 본문에 명시하라.
   마지막 프레임의 결과 상태는 그 실제 반환값과 일치해야 한다(검증 단계에서 대조됨).
5. 좌표(`graph`의 `x`,`y`)는 0~100 정규화 좌표로 직접 배치한다.
6. 외부 라이브러리 import 금지. `#guide-sim` 외의 import를 추가하지 않는다.

## 공통 프레임 필드

모든 프레임은 다음을 가질 수 있다.

| 필드 | 타입 | 의미 |
|------|------|------|
| `title` | `string?` | 이 단계 제목 |
| `detail` | `string?` | 이 단계 설명 |

## 프리셋 view 와 스키마

### `view="array"` — 배열/정렬/투포인터
| 필드 | 타입 | 의미 |
|------|------|------|
| `array` | `(number\|string)[]` | 배열 값 |
| `highlight` | `number[]?` | 비교/주목 인덱스(빨강) |
| `marked` | `number[]?` | 확정 인덱스(회색) |
| `pointers` | `Record<string, number>?` | 이름 붙은 포인터: `{ i: 0, j: 3 }` |

### `view="graph"` — 그래프 탐색/최단경로
| 필드 | 타입 | 의미 |
|------|------|------|
| `nodes` | `{ id, label?, x, y }[]` | 노드. `x`,`y`는 0~100 |
| `edges` | `{ from, to, weight?, directed? }[]` | 간선 |
| `nodeStatus` | `Record<id, "default"\|"frontier"\|"active"\|"visited">?` | 노드 색 |
| `nodeValue` | `Record<id, string\|number>?` | 노드 위 라벨(예: 거리) |
| `activeEdge` | `{ from, to }?` | 현재 완화/검사 중 간선(빨강) |

### `view="priorityQueue"` — 힙/큐 내부 상태
| 필드 | 타입 | 의미 |
|------|------|------|
| `heap` | `{ label: string, key: number\|string }[]` | 배열 순서대로의 원소 |
| `highlight` | `number[]?` | 강조 인덱스 |

### `view="tree"` — 트리/재귀 구조
| 필드 | 타입 | 의미 |
|------|------|------|
| `root` | `TreeNodeData \| null` | 루트. `{ id, label?, status?, children? }` |

### `view="matrix"` — DP 표/2차원 배열
| 필드 | 타입 | 의미 |
|------|------|------|
| `matrix` | `(number\|string\|null)[][]` | 셀 값(`null`은 빈 칸) |
| `rowLabels` | `(string\|number)[]?` | 행 라벨 |
| `colLabels` | `(string\|number)[]?` | 열 라벨 |
| `cells` | `[number, number][]?` | 강조 셀 `[행, 열]` |

### `view="keyValue"` — 범용 상태 패널(변수 스냅샷)
| 필드 | 타입 | 의미 |
|------|------|------|
| `entries` | `{ label: string, value: string\|number }[]` | 변수명/값 목록 |

> 어떤 프리셋으로도 표현이 어려운 드문 경우에만 `keyValue`로 핵심 변수 스냅샷을
> 단계별로 보여주는 최소 시뮬레이션을 작성한다.

## 예시 (array)

```jsx
import { AlgorithmSimulation } from "#guide-sim";

export const steps = [
  { title: "초기 상태", detail: "정렬 전 배열", array: [5, 2, 4, 1] },
  { title: "5 vs 2 비교", detail: "5 > 2 → 교환", array: [5, 2, 4, 1], highlight: [0, 1] },
  { title: "교환 후", array: [2, 5, 4, 1], pointers: { i: 1 } },
  // …
  { title: "정렬 완료", array: [1, 2, 4, 5], marked: [0, 1, 2, 3] },
];

<AlgorithmSimulation view="array" steps={steps} title="버블 정렬 1패스" />
```
