# Count-Min Sketch — 스트리밍 빈도 추정

## 함수 인터페이스

```ts
export class CountMinSketch {
  constructor(width: number, depth: number);
  update(item: string, count: number): void;
  estimate(item: string): number;
}
```

## 제약 조건

- 폭 $w \leq 10^4$ ($1 \leq w$)
- 깊이 $d \leq 16$ ($1 \leq d$)
- 스트림 길이 $n \leq 10^5$
- `count` $\geq 1$

## 문제 상세

폭 $w$ × 깊이 $d$의 카운터 행렬 $C$와 $d$개의 독립 해시 함수 $h_1, h_2, \ldots, h_d$를 사용해 다중 집합의 원소 빈도를 추정하는 확률적 자료구조를 구현하라.

**갱신 (`update`, `count` 횟수만큼 등장):**

$$\forall\, j \in [1, d],\; C[j][\, h_j(x) \bmod w\,] \mathrel{+}= \mathrm{count}$$

**추정 (`estimate`):**

$$\hat{f}(x) = \min_{1 \leq j \leq d} C[j][\, h_j(x) \bmod w\,]$$

정확도 보장: 실제 빈도 $f(x)$에 대해 다음을 만족 (확률 $\geq 1 - \delta$):

$$f(x) \leq \hat{f}(x) \leq f(x) + \varepsilon \cdot N$$

여기서 $N = \sum_y f(y)$ 이고, $w = \lceil e / \varepsilon \rceil$, $d = \lceil \ln(1 / \delta) \rceil$ 로 잡는다. 추정값은 절대 실제 빈도보다 작지 않다 (no underestimate).

### 메서드 명세

- `new CountMinSketch(width, depth)` — 폭 $w$ × 깊이 $d$의 Count-Min Sketch를 생성한다.
- `update(item, count)` — 원소 $x$의 빈도를 $\mathrm{count}$ 만큼 증가시킨다.
- `estimate(item)` — 원소 $x$의 빈도 추정값(실제 빈도의 상한)을 반환한다.

## 예시

```ts
const cms = new CountMinSketch(1000, 4);

cms.update("apple", 3);
cms.update("banana", 5);
cms.update("apple", 2);

cms.estimate("apple");    // >= 5
cms.estimate("banana");   // >= 5
cms.estimate("cherry");   // >= 0 (실제로는 0이지만 더 클 수 있음)
```
