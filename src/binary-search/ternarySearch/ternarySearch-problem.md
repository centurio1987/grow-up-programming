# Ternary Search — 단봉 함수의 극값 탐색

## 한 줄 요약

> 단봉 함수와 탐색 구간, 허용 오차를 받아, 최솟값이 위치한 $x$ 좌표를 오차 $\varepsilon$ 이내로 반환한다.

## 스토리

드론 기사 현우는 산악 지형의 특정 계곡 안에서 기압이 가장 낮은 지점을 찾아야 한다. 계곡은 U자 형태로 딱 하나의 최저점이 있으며, 왼쪽이나 오른쪽으로 이동할수록 기압이 높아진다. 현우는 현재 구간을 세 등분한 두 지점에서 기압을 측정한다.

왼쪽 측정치가 오른쪽보다 높으면 최저점은 오른쪽 구간에 있다고 판단해 왼쪽 1/3을 버리고, 반대면 오른쪽 1/3을 버린다. 이를 반복하면 구간이 충분히 좁아지고, 그 중간점이 최저 기압 위치라고 확신할 수 있다.

## 함수 인터페이스

```ts
export function ternarySearch(
  f: (x: number) => number,
  lo: number,
  hi: number,
  epsilon: number,
): number;
```

- `f` — 닫힌 구간 $[\text{lo}, \text{hi}]$ 위에서 정의된 단봉 함수 (유일한 최솟값 보장)
- `lo` — 탐색 구간의 하한
- `hi` — 탐색 구간의 상한
- `epsilon` — 허용 오차 ($\varepsilon > 0$)
- 반환 — 최솟값 위치 $x^{*}$의 근삿값. 실제 최솟값 위치와의 오차는 $\varepsilon$ 이내.

## 제약 조건

- $f$는 $[\text{lo}, \text{hi}]$ 위에서 단봉이며 유일한 최솟값을 가진다.
- $\text{lo} < \text{hi}$
- $\varepsilon > 0$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

닫힌 구간 $[\text{lo}, \text{hi}]$ 위에서 단봉(unimodal) 함수 $f$가 주어진다. 단봉 함수란 구간 내에서 단 하나의 극솟값(최솟값)을 가지며, 그 지점의 왼쪽은 감소, 오른쪽은 증가하는 함수를 말한다.

최솟값의 위치 $x^{*}$를 오차 $\varepsilon$ 이내로 추정한다.

$$\text{ternarySearch}(f, \text{lo}, \text{hi}, \varepsilon) \approx \arg\min_{x \in [\text{lo}, \text{hi}]} f(x)$$

반환값은 탐색 종료 시점의 구간 중점으로, 실제 최솟값 위치와의 오차는 $\varepsilon$ 이내여야 한다.

## 예시

```ts
// f(x) = (x - 2)^2, 최솟값 위치 x = 2
ternarySearch((x) => (x - 2) ** 2, 0, 5, 1e-6);     // ≈ 2.0 — f의 꼭짓점

// f(x) = (x + 1)^2 + 3, 최솟값 위치 x = -1
ternarySearch((x) => (x + 1) ** 2 + 3, -10, 10, 1e-6);  // ≈ -1.0 — 음수 구간의 최솟점

// f(x) = x^2, 최솟값 위치 x = 0
ternarySearch((x) => x * x, -100, 100, 1e-9);        // ≈ 0.0 — 구간 중앙의 최솟점

// f(x) = |x - 2|, 최솟값 위치 x = 2
ternarySearch((x) => Math.abs(x - 2), -10, 10, 1e-9); // ≈ 2.0 — 절댓값 함수 최솟점

// epsilon이 클수록 정밀도가 낮다
ternarySearch((x) => (x - 3) ** 2 + 5, -10, 10, 1e-3); // ≈ 3.0 (오차 1e-2 이내)
```
