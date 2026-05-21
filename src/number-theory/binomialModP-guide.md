# binomialModP — 이항계수 mod p 해설

## 성능 목표 예측

| 항목 | 값 |
|------|-----|
| 입력 범위 | $n, k \geq 0$, $p \geq 2$ (소수), bigint |
| 전처리 ($n < p$) | $O(n)$ — 팩토리얼 배열 구성 |
| 쿼리 ($n < p$) | $O(\log p)$ — fastPower 역원 계산 |
| Lucas 적용 ($n \geq p$) | $O(\log_p n \cdot \log p)$ — 각 자릿수마다 쿼리 |
| 공간 복잡도 | $O(\min(n, p))$ — 팩토리얼 배열 |

**naive 접근의 한계.** $\binom{n}{k} = n! / (k! (n-k)!)$을 직접 계산하면, $n!$이 천문학적으로 커지고 나눗셈이 정수 연산에서 정확히 이루어지지 않는 경우가 있다. 또한 $n \geq p$이면 $n!$에 $p$의 배수가 포함되어 $n! \bmod p = 0$이 되어 직접 역원을 구할 수 없다.

**목표 복잡도와 근거.** $n < p$이면 팩토리얼 전처리 $O(n)$ 후 페르마의 소정리로 역원을 $O(\log p)$에 구한다. $n \geq p$이면 Lucas 정리로 문제를 $\log_p n$개의 서브문제로 분해하며, 각각이 $n < p$ 케이스로 귀결된다.

**공간 트레이드오프.** $n < p$이면 팩토리얼 배열 $O(n)$을 사용한다. 쿼리가 단 한 번이라면 팩토리얼 배열 없이 $O(k)$ 곱셈 + $O(\log p)$ 역원으로도 처리할 수 있다.

---

## 목표 함수

```ts
function binomialModP(n: bigint, k: bigint, p: bigint): bigint
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `n` | 이항계수 위 인자 | $n \geq 0$, bigint |
| `k` | 이항계수 아래 인자 | $k \geq 0$, bigint |
| `p` | 소수 모듈러 | $p \geq 2$, bigint, 소수 |

**반환값**: $\binom{n}{k} \bmod p$ ($0 \leq \text{결과} < p$).

**엣지케이스**:
1. `k < 0n` 또는 `k > n` → `0n` ($k < 0$이나 $k > n$이면 조합 수는 0)
2. `k = 0n` 또는 `k = n` → `1n` ($\binom{n}{0} = \binom{n}{n} = 1$)
3. `n = 5n, k = 2n, p = 3n` → `1n` ($\binom{5}{2} = 10 \equiv 1 \pmod 3$)
4. `n = 7n, k = 3n, p = 5n` → `1n` ($\binom{7}{3} = 35 \equiv 0 \pmod 5$, Lucas: $\binom{1}{1}\binom{2}{3}=1\cdot 0=0$)

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

$\binom{n}{k}$를 직접 계산하면 정수 자체가 매우 커지고($n = 100, k = 50$이면 $\approx 10^{29}$), $\bmod p$를 취해야 하므로 중간 과정에서 정확도가 문제된다. $n!$을 먼저 모두 곱한 뒤 나누는 방법은 $n! \bmod p = 0$인 경우에 역원이 존재하지 않아 실패한다. "팩토리얼을 $\bmod p$로 유지하면서 역원을 효율적으로 구할 수 없을까?"라는 질문이 출발점이다.

### 어떤 관찰이 돌파구가 되는가

- **핵심 관찰 1 (페르마의 소정리)**: $p$가 소수이고 $\gcd(a, p) = 1$이면 $a^{p-1} \equiv 1 \pmod{p}$이다. 따라서 $a^{-1} \equiv a^{p-2} \pmod{p}$이다. $n < p$이면 $n!$에 $p$의 배수가 없으므로 역원을 fastPower로 구할 수 있다.
- **핵심 관찰 2 (Lucas 정리)**: $n \geq p$이면 $n$을 $p$진수로 표현해 자릿수별 이항계수의 곱으로 분해할 수 있다. 각 자릿수는 $p$ 미만이므로 첫 번째 방법으로 처리된다.
- **핵심 관찰 3**: Lucas 정리에서 $n_i < k_i$인 자릿수가 하나라도 있으면 전체 결과가 $0$이다. 이는 $\binom{n_i}{k_i} = 0$이 되기 때문이다.

### 관찰을 형식화: 상태/구조 정의

$n$을 $p$진수로 전개한다: $n = \sum_i n_i p^i$, $k = \sum_i k_i p^i$ ($0 \leq n_i, k_i < p$). Lucas 정리:

$$\binom{n}{k} \equiv \prod_i \binom{n_i}{k_i} \pmod{p}$$

이 형태여야 하는 이유: $p$ 이상의 큰 $n$에 대해 팩토리얼이 $p$의 배수를 포함해 직접 역원을 구할 수 없다. Lucas 정리는 큰 문제를 각 자릿수의 작은 문제들로 재귀 분해하므로, 각 $n_i < p$ 케이스는 페르마 역원법으로 처리 가능하다.

### 점화식 또는 핵심 연산

**$n < p$인 경우** (페르마 역원법):

$$\binom{n}{k} \equiv n! \cdot (k!)^{p-2} \cdot ((n-k)!)^{p-2} \pmod{p}$$

**$n \geq p$인 경우** (Lucas 정리):

$$\binom{n}{k} \equiv \binom{n \bmod p}{k \bmod p} \cdot \binom{\lfloor n/p \rfloor}{\lfloor k/p \rfloor} \pmod{p}$$

**유도 (Lucas 정리)**: 이항식 $(1 + x)^n$을 $\mathbb{F}_p[x]$에서 전개한다. Frobenius 준동형성 $(A + B)^p \equiv A^p + B^p \pmod{p}$을 적용하면:

$$(1+x)^{n} = (1+x)^{n_0 + n_1 p + \cdots} \equiv (1+x)^{n_0} \cdot ((1+x)^p)^{n_1} \cdots \equiv (1+x)^{n_0}(1+x^p)^{n_1} \cdots \pmod p$$

$x^k$의 계수를 비교하면 $\binom{n}{k} \equiv \prod_i \binom{n_i}{k_i}$가 된다.

**각 항의 의미**: $n_i = n \bmod p$ (최하위 자릿수), $\lfloor n/p \rfloor$ (나머지 자릿수들)이다. $k_i$도 동일하게 정의된다.

### 정당성 — 왜 이것이 옳은가

**페르마 역원 정당성**: $n < p$이면 $1, 2, \ldots, n$ 중 $p$의 배수가 없으므로 $n! \not\equiv 0 \pmod{p}$이다. 따라서 $(k!)^{-1} \equiv (k!)^{p-2} \pmod{p}$가 성립한다.

**Lucas 정리 정당성**: 위 Frobenius 논증으로 $x^k$의 계수 비교를 통해 정확히 $\prod_i \binom{n_i}{k_i}$임이 증명된다.

**까다로운 케이스**: $k > n$이면 결과가 $0$이다. $k_i > n_i$인 자릿수가 하나라도 있으면 $\binom{n_i}{k_i} = 0$이므로 전체 곱이 $0$이 된다. Lucas 재귀에서 이 조건을 자연스럽게 처리하거나, 별도로 조기 종료할 수 있다.

### 구현 디테일과 최적화

- **팩토리얼 전처리**: `fact[0] = 1n`, `for i = 1 to n: fact[i] = fact[i-1] * i % p`로 $O(n)$에 계산한다.
- **쿼리가 단 한 번인 경우**: 배열 없이 $k$번 곱하고 역원 2번으로 처리한다.
- **Lucas 재귀 캐싱**: 동일한 $(n_i, k_i)$ 쌍이 반복되면 메모이제이션이 유효하다.
- **함정**: 팩토리얼 배열을 bigint로 유지해야 한다. $p$가 작으면 $n < p$이더라도 배열이 작다.
- **$p = 2$인 경우**: $\binom{n}{k} \bmod 2$는 Lucas로 처리하되, 각 자릿수 조건이 간단해진다 ($n_i \geq k_i$면 $1$, 아니면 $0$).

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function binomialModP(n, k, p):
    // 엣지케이스
    if k < 0n or k > n: return 0n
    if k == 0n or k == n: return 1n

    if n < p:
        // 페르마 역원법: 팩토리얼 전처리
        fact = [1n]
        // 불변식: fact[i] = i! mod p
        for i = 1n to n:
            fact.push(fact[i-1] * i % p)
        inv_k  = fastPower(fact[k], p - 2n, p)
        inv_nk = fastPower(fact[n-k], p - 2n, p)
        return fact[n] * inv_k % p * inv_nk % p
    else:
        // Lucas 정리: n >= p
        ni = n % p;  ki = k % p
        // 불변식: n = ni + p*(n/p), k = ki + p*(k/p)
        return binomialModP(ni, ki, p) * binomialModP(n / p, k / p, p) % p
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작 binomialModP n,k,p]) --> B{k<0 or k>n?}
    B -- Yes --> C([return 0n])
    B -- No  --> D{k=0 or k=n?}
    D -- Yes --> E([return 1n])
    D -- No  --> F{n < p?}
    F -- Yes --> G["fact[0..n] 전처리\n불변식: fact[i] = i! mod p"]
    G --> H["inv_k = fastPower(fact[k], p-2, p)\ninv_nk = fastPower(fact[n-k], p-2, p)"]
    H --> I([return fact[n]*inv_k*inv_nk mod p])
    F -- No  --> J["ni = n % p,  ki = k % p\n불변식: 0 <= ni,ki < p"]
    J --> K["a = binomialModP(ni, ki, p)\nb = binomialModP(n/p, k/p, p)"]
    K --> L([return a*b mod p])
```

**핵심 불변식**: Lucas 재귀에서 각 호출의 `n` 인자가 이전 호출의 $1/p$ 수준으로 감소하며, 유한 단계 후 $n < p$인 기저 사례에 도달한다.

---

## 관련 알고리즘과 확장

### Kummer의 정리: p-adic 가치

$\binom{n}{k}$에서 소수 $p$가 나누는 횟수(즉, $p$-진 가치 $v_p$)는 $n$과 $k$를 $p$진수로 나타낼 때 $n - k$에서의 올림(carry) 횟수와 같다 (Kummer의 정리). 따라서 Lucas에서 $k_i > n_i$인 자릿수가 있으면 $\binom{n}{k} \equiv 0 \pmod{p}$가 되는 것은 이 "carry"의 발생으로 해석할 수 있다.

### p가 작은 경우의 주의점

$p = 2$이면 Lucas 정리가 다음으로 단순화된다: $\binom{n}{k} \equiv 1 \pmod{2}$ 당면 $k$가 $n$의 비트 부분집합인 경우(AND 조건 $k \& n = k$), 아니면 $0$. 이는 bitwise 연산으로 $O(\log n)$에 처리 가능하다.

### 다중 쿼리 최적화

동일한 $p$에 대해 쿼리가 $Q$번 주어지는 경우, $n < p$이면 팩토리얼 배열을 한 번만 구성하고 역팩토리얼 배열(`inv_fact[i] = (i!)^{p-2} mod p`)도 전처리하면 쿼리당 $O(1)$에 처리할 수 있다. $Q$가 크면 이 방식이 훨씬 효율적이다.
