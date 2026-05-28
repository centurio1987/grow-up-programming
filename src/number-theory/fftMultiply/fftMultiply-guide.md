# fftMultiply — FFT 다항식 곱셈 해설

## 성능 목표 예측

| 항목 | 값 |
|------|-----|
| 입력 크기 | $n = \|a\|$, $m = \|b\|$, 실용 범위 $n, m \leq 10^6$ |
| 시간 복잡도 | $O((n+m) \log (n+m))$ |
| 공간 복잡도 | $O(n+m)$ |

**naive 접근의 한계.** 직접 합성곱을 계산하면 $c_k = \sum_{i+j=k} a_i b_j$이므로 $O(nm)$이다. $n = m = 10^5$이면 $10^{10}$번의 곱셈이 필요해 수십 초가 걸린다. 큰 수 곱셈이나 다항식 곱셈이 빈번한 경쟁 프로그래밍에서 $O(n^2)$은 곧 시간 초과이다.

**목표 복잡도와 근거.** 결과 길이 $L = n + m - 1$에 대해 $N \geq L$인 가장 작은 2의 거듭제곱 $N$을 잡으면, FFT가 $O(N \log N) = O((n+m) \log(n+m))$이다. DFT의 합성곱 정리($\text{DFT}(a * b) = \text{DFT}(a) \cdot \text{DFT}(b)$)를 이용해 주파수 영역에서 점별 곱으로 변환하기 때문이다.

**공간 트레이드오프.** 복소수 배열 크기 $N$이 $O(n+m)$이다. 부동소수점 FFT는 정밀도 한계($\approx 10^{15}$)가 있어 큰 정수 계수에서 반올림 오차가 발생할 수 있다. NTT(수론적 변환)를 쓰면 정확하지만 특정 모듈러 $p$에 제한된다.

---

## 목표 함수

```ts
function fftMultiply(a: number[], b: number[]): number[]
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `a` | 첫 번째 다항식의 계수 배열 (낮은 차수부터) | 정수 배열 |
| `b` | 두 번째 다항식의 계수 배열 (낮은 차수부터) | 정수 배열 |

**반환값**: 두 다항식의 곱 $C(x) = A(x) \cdot B(x)$의 계수 배열. 길이는 $n + m - 1$ ($n = \|a\|$, $m = \|b\|$). 빈 배열이면 `[]`.

**엣지케이스**:
1. `a = []` 또는 `b = []` → `[]`
2. `a = [1], b = [1]` → `[1]` ($1 \cdot 1 = 1$)
3. `a = [1, 1], b = [1, 1]` → `[1, 2, 1]` ($(1+x)^2 = 1 + 2x + x^2$)
4. `a = [3, 2], b = [1, 4]` → `[3, 14, 8]` ($c_0 = 3, c_1 = 12+2=14, c_2 = 8$)

---

## 핵심 아이디어

**핵심 아이디어**: "주파수 영역에서 다항식 곱은 점별 곱이므로, FFT로 변환·곱·역변환 세 단계면 O(n²)이 O(n log n)으로 줄어든다"

다항식 $A(x) \cdot B(x)$의 계수 표현에서 합성곱 $c_k = \sum_{i+j=k} a_i b_j$를 직접 계산하면 $O(nm)$이다. 합성곱 정리에 따라 이를 DFT로 변환하면 주파수 영역에서 점별 곱 $O(N)$으로 바뀌고, Cooley-Tukey FFT로 DFT를 $O(N \log N)$에 계산할 수 있다. 정방향 FFT 두 번, 점별 곱 한 번, 역방향 FFT 한 번이면 전체가 $O((n+m) \log(n+m))$에 완료된다.

**풀이 구조**
1. 결과 길이 $n + m - 1$ 이상인 가장 작은 2의 거듭제곱 $N$ 결정
2. 두 배열을 길이 $N$으로 0-패딩해 복소수 배열로 변환
3. 두 배열에 각각 정방향 FFT 적용
4. 두 FFT 결과를 원소별로 곱하기
5. 역방향 FFT(IFFT) 적용 후 실수부를 반올림해 정수 계수 복원

**조건**: 부동소수점 FFT는 계수 값이 클수록 반올림 오차가 커진다. $|a_i|, |b_j| \leq C$이고 배열 길이가 $N$이면 결과 계수가 최대 $N \cdot C^2$에 달하며, 이 값이 double 정밀도($\approx 10^{15}$) 이내여야 정확한 결과를 얻을 수 있다.

**대표 예시**: $(1 + x) \cdot (1 + x) = 1 + 2x + x^2$ 계산
$a = [1, 1]$, $b = [1, 1]$, 결과 길이 3이므로 $N = 4$로 0-패딩. FFT 변환, 점별 곱, IFFT 후 실수부 반올림하면 $[1.0, 2.0, 1.0, 0.0]$의 앞 3개 원소 $[1, 2, 1]$을 얻는다.

**언제 쓰나**
두 다항식의 곱, 두 정수 배열의 합성곱, 큰 정수 곱셈처럼 $O(n^2)$ 합성곱이 병목이 되는 문제에서 사용한다. 단, 계수나 배열이 매우 크면 정밀도 문제가 생기므로 NTT(수론적 변환)를 고려해야 한다.

---

### 원형 아이디어와 naive 접근

$c_k = \sum_{i+j=k} a_i b_j$를 직접 계산하면 $O(nm)$이다. 이는 다항식의 "계수 표현"에서 곱을 정의대로 수행하는 것이다. "계수 표현 대신 다른 표현으로 바꾸면 곱이 더 빠르지 않을까?"라는 질문이 핵심이다.

### 어떤 관찰이 돌파구가 되는가

- **핵심 관찰 1 (합성곱 정리)**: 시간 영역에서의 합성곱은 주파수 영역에서 점별 곱에 대응한다. $\text{DFT}(a * b)[k] = \text{DFT}(a)[k] \cdot \text{DFT}(b)[k]$이다. 주파수 영역에서의 곱은 $O(N)$이다.
- **핵심 관찰 2 (FFT의 분할 정복)**: DFT를 직접 계산하면 $O(N^2)$이지만, $N = 2^k$일 때 Cooley-Tukey 알고리즘으로 $O(N \log N)$에 계산할 수 있다. 짝수/홀수 인덱스로 분리해 크기 $N/2$의 두 DFT로 재귀 분해하기 때문이다.
- **핵심 관찰 3 (부동소수점 반올림)**: 부동소수점 FFT를 쓸 때 결과의 허수부를 버리고 실수부를 반올림하면 정수 계수를 정확히 복원할 수 있다. 단, 계수가 크면 반올림 오차가 커지므로 주의가 필요하다.

### 관찰을 형식화: 상태/구조 정의

Cooley-Tukey FFT의 재귀 구조를 정의한다. 크기 $N$의 DFT를 짝수 인덱스 배열과 홀수 인덱스 배열 각각의 크기 $N/2$ DFT로 분해한다:

$$\text{DFT}(a)[k] = \text{DFT}(a_\text{even})[k \bmod N/2] + \omega_N^k \cdot \text{DFT}(a_\text{odd})[k \bmod N/2]$$

여기서 $\omega_N = e^{2\pi i/N}$은 원시 $N$제곱근이다.

이 형태여야 하는 이유: DFT의 주기성 $\omega_N^{k+N/2} = -\omega_N^k$을 이용하면 $N/2$ DFT 두 개로 $N$ DFT 전체를 $O(N)$에 재조합할 수 있기 때문이다.

### 점화식 또는 핵심 연산

FFT 재귀 관계:

$$\text{DFT}(a)[k] = \text{DFT}(a_\text{even})[k] + \omega_N^k \cdot \text{DFT}(a_\text{odd})[k] \quad (0 \leq k < N/2)$$

$$\text{DFT}(a)[k + N/2] = \text{DFT}(a_\text{even})[k] - \omega_N^k \cdot \text{DFT}(a_\text{odd})[k]$$

**유도**: $\text{DFT}(a)[k] = \sum_{j=0}^{N-1} a_j \omega_N^{jk}$를 짝수 $j = 2l$과 홀수 $j = 2l+1$로 분리하면:

$$\text{DFT}(a)[k] = \sum_l a_{2l} \omega_N^{2lk} + \omega_N^k \sum_l a_{2l+1} \omega_N^{2lk}$$
$$= \sum_l a_{2l} \omega_{N/2}^{lk} + \omega_N^k \sum_l a_{2l+1} \omega_{N/2}^{lk}$$
$$= \text{DFT}(a_\text{even})[k] + \omega_N^k \cdot \text{DFT}(a_\text{odd})[k]$$

$k + N/2$ 경우는 $\omega_N^{k+N/2} = -\omega_N^k$를 이용해 유도된다.

### 정당성 — 왜 이것이 옳은가

**합성곱 정리 정당성**: DFT와 IDFT의 선형성과 순환 합성곱의 정의에서 직접 증명된다.

**FFT 재귀 정당성**: 위 유도로 $N$-DFT가 두 $N/2$-DFT와 $O(N)$ 나비 연산으로 정확히 표현됨을 보였다.

**반올림 정당성**: 정수 계수 배열의 결과 $c_k$는 정수이므로, 부동소수점 오차가 $0.5$ 미만이면 `Math.round`로 정확히 복원된다. 계수 크기 $|a_i|, |b_j| \leq C$이고 배열 길이 $\leq N$이면 $|c_k| \leq N \cdot C^2$이다. $N = 10^6$, $C = 10^4$이면 $|c_k| \leq 10^{14}$로 double의 정밀도($\approx 10^{15}$) 안에 있다.

**까다로운 케이스**: $N$이 정확히 $n + m - 1$과 같을 때 경계를 넘지 않아야 한다. 빈 배열 입력은 루프 진입 전에 처리한다.

### 구현 디테일과 최적화

- **배열 크기 $N$**: $n + m - 1$ 이상인 가장 작은 2의 거듭제곱을 계산한다. `N = 1; while (N < n + m - 1) N <<= 1`.
- **0-padding**: `a`와 `b`를 길이 $N$으로 0 패딩한다.
- **반복적 FFT**: 재귀 대신 비트 역순 순열(bit-reversal permutation)로 데이터를 재배열한 뒤 하위 크기부터 bottom-up으로 나비 연산을 수행하면 캐시 효율이 높다.
- **IFFT**: FFT와 동일한 알고리즘에서 $\omega_N$ 대신 $\omega_N^{-1}$을 쓰고, 마지막에 $N$으로 나누면 된다.
- **함정**: 부동소수점 FFT에서 삼각함수 계산이 반복될 때 오차가 누적된다. 미리 회전 인자 테이블을 계산해두거나, 재귀적으로 회전 인자를 절반씩 계산하면 정밀도가 향상된다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function fft(a, invert):
    N = a.length
    if N == 1: return

    // 비트 역순 순열 (bit-reversal)
    j = 0
    for i = 1 to N-1:
        bit = N >> 1
        while j & bit: j ^= bit; bit >>= 1
        j ^= bit
        if i < j: swap(a[i], a[j])

    // 불변식: 각 단계 len에서 a[k..k+len-1]이 DFT됨
    len = 2
    while len <= N:
        wLen = invert ? exp(-2πi/len) : exp(2πi/len)
        for i = 0 to N-1 step len:
            w = 1
            for j = 0 to len/2-1:
                u = a[i+j]; v = w * a[i+j+len/2]
                a[i+j]        = u + v    // 나비 연산
                a[i+j+len/2]  = u - v
                w *= wLen
        len <<= 1

    if invert:
        for each x in a: x /= N

function fftMultiply(a, b):
    if a is empty or b is empty: return []
    n = a.length; m = b.length
    N = 1
    while N < n + m - 1: N <<= 1    // 2의 거듭제곱

    fa = a에 (N-n)개 0 추가 (복소수로 변환)
    fb = b에 (N-m)개 0 추가

    fft(fa, false)    // 정방향 FFT
    fft(fb, false)
    for k = 0 to N-1:
        fa[k] = fa[k] * fb[k]    // 불변식: fa[k] = A[k]*B[k]
    fft(fa, true)     // 역방향 FFT

    return [round(fa[k].real) for k = 0..n+m-2]
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B{a 또는 b 빈 배열?}
    B -- Yes --> C([return []])
    B -- No  --> D["N = 최소 2의 거듭제곱 ≥ n+m-1\nfa, fb = 0-패딩(복소수)"]
    D --> E["FFT(fa, false)\nFFT(fb, false)"]
    E --> F["fa[k] = fa[k]*fb[k]\n(k=0..N-1, 원소별 곱)"]
    F --> G["FFT(fa, true)\n역변환"]
    G --> H["결과[k] = round(fa[k].real)\n(k=0..n+m-2)"]
    H --> I([return 결과])
```

**핵심 불변식**: FFT 완료 후 `fa[k] = DFT(a)[k]`이며, 원소별 곱 후 IFFT하면 `fa[k] = c_k = Σ_{i+j=k} a_i b_j`가 성립한다.
