# 다항식 곱셈 (FFT)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function fftMultiply(a: number[], b: number[]): number[];
```

## 제약 조건

- `a`, `b` 의 원소는 정수 (number)
- 시간 복잡도 $O((n + m) \log (n + m))$ ($n$, $m$ 은 각각 `a`, `b` 의 길이)
- 부동소수점 FFT 를 사용하는 경우 결과는 가장 가까운 정수로 반올림한다

## 문제 상세

두 정수 계수 배열 $a = [a_0, a_1, \ldots, a_{n-1}]$, $b = [b_0, b_1, \ldots, b_{m-1}]$ 을 다항식의 계수 표현으로 보고, 두 다항식의 곱의 계수 배열을 반환한다.

$$A(x) = \sum_{i=0}^{n-1} a_i x^i,\quad B(x) = \sum_{j=0}^{m-1} b_j x^j$$

$$C(x) = A(x) \cdot B(x) = \sum_{k=0}^{n+m-2} c_k x^k,\quad
  c_k = \sum_{i+j=k} a_i \cdot b_j$$

결과 길이는 $n + m - 1$ 이다.

엣지 케이스:

- 한쪽이 빈 배열이면 결과도 빈 배열 `[]` 을 반환한다.

알고리즘으로는 **FFT (Fast Fourier Transform)** 를 사용한다.

## 예시

```ts
fftMultiply([1, 2], [1, 3]);          // [1, 5, 6]    (1 + 2x)(1 + 3x) = 1 + 5x + 6x^2
fftMultiply([1, 0, 1], [1, 1]);       // [1, 1, 1, 1] (1 + x^2)(1 + x) = 1 + x + x^2 + x^3
fftMultiply([2, 3, 4], [5, 6]);       // [10, 27, 38, 24]
fftMultiply([], [1, 2, 3]);           // []
fftMultiply([1, 2, 3], []);           // []
```
