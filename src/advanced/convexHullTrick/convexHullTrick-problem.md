# Convex Hull Trick (CHT)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class ConvexHullTrick {
  addLine(m: number, b: number): void;
  query(x: number): number;
}
```

## 제약 조건

- 기울기 $m$: $-10^9 \leq m \leq 10^9$, **비감소(non-decreasing) 순서**로 호출된다.
- 절편 $b$: $-10^{18} \leq b \leq 10^{18}$.
- 쿼리 지점 $x$: $-10^9 \leq x \leq 10^9$ (임의 순서 가능).

## 문제 상세

직선 $\ell_i(x) = m_i \cdot x + b_i$ 들의 집합 $\mathcal{L}$ 을 동적으로 관리하면서, 임의의 $x$ 에 대해 다음 최솟값을 효율적으로 계산할 수 있는 자료구조를 구현하라.

$$\text{query}(x) = \min_{\ell \in \mathcal{L}} \ell(x)$$

### 메서드 명세

- `addLine(m, b)` — 기울기 $m$, 절편 $b$ 인 직선 $y = m x + b$ 를 추가한다. 호출되는 $m$ 값은 **비감소** 순서를 보장한다.
- `query(x)` — 현재까지 추가된 모든 직선 $\ell_i$ 중 $\ell_i(x) = m_i x + b_i$ 의 최솟값 $\min_i (m_i x + b_i)$ 을 반환한다.

세 직선 $\ell_1, \ell_2, \ell_3$ 이 차례로 후보군 상단에 있다고 할 때, $\ell_2$ 가 최솟값을 갖는 구간이 비어 있는 경우(아래 부등식이 성립할 때) $\ell_2$ 는 제거 가능하다.

$$(b_3 - b_1)(m_1 - m_2) \leq (b_2 - b_1)(m_1 - m_3)$$

## 예시

```ts
const cht = new ConvexHullTrick();
cht.addLine(0, 5);           // y = 5
cht.query(10);               // 5

cht.addLine(1, 0);           // y = x
cht.query(10);               // min(5, 10) = 5
cht.query(3);                // min(5, 3)  = 3

cht.addLine(2, -10);         // y = 2x - 10
cht.query(10);               // min(5, 10, 10) = 5
cht.query(0);                // min(5, 0, -10) = -10
```
