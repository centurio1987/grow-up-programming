# Ternary Search — 단봉 함수의 극값 탐색

## 함수 인터페이스

```ts
export function ternarySearch(
  f: (x: number) => number,
  lo: number,
  hi: number,
  epsilon: number,
): number;
```

## 제약 조건

- $f$는 $[\text{lo}, \text{hi}]$ 위에서 단봉이며 유일한 최솟값을 가진다.
- $\text{lo} < \text{hi}$, $\varepsilon > 0$.

## 문제 상세

닫힌 구간 $[\text{lo}, \text{hi}]$ 위에서 단봉(unimodal) 함수 $f$가 주어진다.
$f$가 유일한 최솟값을 가질 때, 그 최솟값의 위치 $x^{*}$를 오차 $\varepsilon$ 이내로 추정한다.

$$\text{ternarySearch}(f, \text{lo}, \text{hi}, \varepsilon) \approx \arg\min_{x \in [\text{lo}, \text{hi}]} f(x)$$

반환값은 종료 시점의 탐색 구간 중점으로, 실제 최솟값 위치와의 오차는 $\varepsilon$ 이내여야 한다.

## 예시

```ts
// f(x) = (x - 2)^2 의 최솟값 위치는 x = 2
ternarySearch((x) => (x - 2) ** 2, 0, 5, 1e-6);    // ≈ 2

// f(x) = (x + 1)^2 + 3 의 최솟값 위치는 x = -1
ternarySearch((x) => (x + 1) ** 2 + 3, -10, 10, 1e-6);    // ≈ -1
```
