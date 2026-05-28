# extendedEuclidean — 확장 유클리드 호제법 해설

## 성능 목표 예측

| 항목 | 값 |
|------|-----|
| 입력 크기 | 임의의 bigint $a, b$, 실용 범위 $\|a\|, \|b\| \leq 2^{63}$ |
| 시간 복잡도 | $O(\log \min(\|a\|, \|b\|))$ |
| 공간 복잡도 | $O(\log \min(\|a\|, \|b\|))$ (재귀 스택), $O(1)$ (반복문) |

**naive 접근의 한계.** 베주 계수를 구하는 가장 naive한 방법은 $\gcd(a, b) = g$를 먼저 구한 뒤, $ax + by = g$를 정수 범위에서 $x$와 $y$를 브루트포스로 탐색하는 것이다. 그러나 $|x|, |y|$ 값이 최대 $O(\|b\|/g)$, $O(\|a\|/g)$에 달하므로 선형 탐색 자체가 $O(\min(|a|, |b|))$이고 $2^{63}$ 범위에서는 불가능하다.

**목표 복잡도와 근거.** 확장 유클리드 알고리즘은 일반 gcd와 동일한 나머지 연산 횟수를 사용한다. 각 단계에서 베주 계수를 역방향으로 $O(1)$에 복원하므로, 총 복잡도는 $O(\log \min(|a|, |b|))$이다.

**공간 트레이드오프.** 반복문 버전은 $(r, s, t)$ 세 쌍의 상태를 유지하므로 $O(1)$이다. 재귀 버전은 호출 스택 $O(\log \min(|a|, |b|))$를 사용한다.

---

## 목표 함수

```ts
function extendedEuclidean(
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint; y: bigint }
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `a` | 첫 번째 정수 | 임의의 bigint (음수 포함) |
| `b` | 두 번째 정수 | 임의의 bigint (음수 포함) |

**반환값**: $\{ g, x, y \}$ 형태의 객체. $g = \gcd(a, b) \geq 0$이며, $a \cdot x + b \cdot y = g$를 만족한다. 베주 계수 $(x, y)$는 무수히 많지만 이 구현은 특정 하나를 반환한다.

**엣지케이스**:
1. `b = 0n` → `{ g: |a|, x: sign(a), y: 0n }` ($a \cdot \text{sign}(a) + 0 = |a|$)
2. `a = 0n` → `{ g: |b|, x: 0n, y: sign(b) }` ($0 + b \cdot \text{sign}(b) = |b|$)
3. `a = 12n, b = -8n` → `{ g: 4n, x: 1n, y: 1n }` (음수 `b`에 대해서도 올바른 쌍 반환)
4. `a = 1n, b = 1n` → `{ g: 1n, x: 0n, y: 1n }` (또는 `x=1, y=0`)

---

## 핵심 아이디어

**핵심 아이디어**: "gcd 계산의 각 단계를 역방향으로 추적하면 베주 계수를 공짜에 가깝게 얻을 수 있다"

$ax + by = \gcd(a, b)$를 만족하는 정수 $x, y$를 구하는 문제에서, 브루트포스로 $x$를 탐색하면 $O(\|b\|/g)$로 폭발한다. 확장 유클리드 호제법은 유클리드 호제법의 나머지 수열이 항상 초기 입력 $a, b$의 정수 선형 결합임을 불변식으로 유지하며 단계를 진행한다. gcd 계산이 끝나는 순간 마지막 나머지(= gcd)에 대응하는 선형 결합 계수가 곧 베주 계수가 된다.

**풀이 구조**
1. $(r_\text{old}, r) = (a, b)$, $(s_\text{old}, s) = (1, 0)$, $(t_\text{old}, t) = (0, 1)$로 초기화
2. $r \neq 0$인 동안: 몫 $q = \lfloor r_\text{old} / r \rfloor$를 계산하고 $(r, s, t)$ 각 쌍을 $(r - q \cdot r_\text{old},\, s - q \cdot s_\text{old},\, t - q \cdot t_\text{old})$으로 교환 갱신
3. 루프 종료 후 $g = r_\text{old}$, $x = s_\text{old}$, $y = t_\text{old}$
4. $g < 0$이면 부호 반전해 $g \geq 0$ 보장 후 반환

**조건**: 임의의 정수 $a, b$에 적용 가능하다. 음수 입력도 처리할 수 있으며, 반환값 $g = \gcd(a, b) \geq 0$이 항상 보장된다.

**대표 예시**: $\gcd(12, 8)$과 베주 계수 구하기
유클리드 단계: $12 = 1 \cdot 8 + 4$, $8 = 2 \cdot 4 + 0$. 확장 추적: 초기 $r_\text{old}=12,\ r=8$; 1단계 $q=1$로 $r_\text{old}=8,\ r=4$, $s: 0 = 1 - 1 \cdot 0 \to (s_\text{old}=0, s=1)$; 2단계 $q=2$로 $r=0$. 최종 $g=4$, $x = s_\text{old}$, $y = t_\text{old}$. 검증: $12 \cdot x + 8 \cdot y = 4$.

**언제 쓰나**
모듈러 역원이 필요할 때($a^{-1} \bmod m$을 $ax \equiv 1$에서 $x$ 추출), 중국인의 나머지 정리에서 합동식을 합칠 때, 디오판토스 방정식의 특수해를 구할 때 사용한다.

---

### 원형 아이디어와 naive 접근

베주 항등식 $ax + by = g$는 무한히 많은 정수 해를 가진다. 가장 단순한 접근은 $x$를 브루트포스로 시도하며 $(g - ax)$가 $b$로 나누어지는 $x$를 찾는 것이다. 이는 $O(\|b\|/g)$로 폭발한다. "gcd 계산의 부산물로 베주 계수를 공짜에 가깝게 얻을 수 없을까?"라는 질문이 핵심이다.

### 어떤 관찰이 돌파구가 되는가

- **핵심 관찰 1**: 유클리드 호제법의 각 단계 $a = q \cdot b + r$에서, $r = a - q \cdot b$이다. 만약 $a$와 $b$를 이전 베주 계수의 선형 결합으로 표현할 수 있다면, $r$도 초기 입력의 선형 결합으로 자동 표현된다.
- **핵심 관찰 2**: 기저 사례 $\gcd(a, 0) = a$에서 $a = a \cdot 1 + 0 \cdot 0$이므로 $(x, y) = (1, 0)$이 자명하다. 이 기저에서 위로 역추적하면 각 단계의 베주 계수를 $O(1)$에 복원할 수 있다.
- **핵심 관찰 3**: 재귀 호출 결과 $(g, x', y')$이 $b \cdot x' + (a \bmod b) \cdot y' = g$를 만족한다면, $a \bmod b = a - \lfloor a/b \rfloor \cdot b$를 대입해 $a$에 대한 베주 계수를 유도할 수 있다.

### 관찰을 형식화: 상태/구조 정의

상태를 $(r, s, t)$ 세 값으로 정의한다. 여기서:
- $r$은 현재 나머지 (gcd 계산에서의 $a$ 또는 $b$ 역할)
- $s, t$는 $r = s \cdot a_0 + t \cdot b_0$를 만족하는 베주 계수

매 단계에서 $(r_{\text{old}}, r) \to (r, r_{\text{old}} - q \cdot r)$로 전이하며, 계수도 같은 몫 $q = \lfloor r_{\text{old}} / r \rfloor$로 갱신한다:

$$(s_{\text{old}}, s) \to (s, s_{\text{old}} - q \cdot s), \quad (t_{\text{old}}, t) \to (t, t_{\text{old}} - q \cdot t)$$

이 형태여야 하는 이유: 각 나머지가 초기 입력 $a_0, b_0$의 정수 선형 결합으로 표현되는 불변식을 유지해야 마지막에 $g = \gcd$에 해당하는 계수 쌍을 곧바로 읽을 수 있기 때문이다.

### 점화식 또는 핵심 연산

재귀 관계식은 다음과 같다:

$$\text{extGcd}(a, b) = \begin{cases}
  (\|a\|,\; \text{sign}(a),\; 0) & \text{if } b = 0 \\
  \text{let } (g, x', y') = \text{extGcd}(b,\; a \bmod b) \\
  \quad\Rightarrow (g,\; y',\; x' - \lfloor a/b \rfloor \cdot y') & \text{otherwise}
\end{cases}$$

**유도 과정**: $(g, x', y')$이 $b \cdot x' + (a \bmod b) \cdot y' = g$를 만족한다고 하자. $a \bmod b = a - \lfloor a/b \rfloor \cdot b$를 대입하면:

$$b \cdot x' + \bigl(a - \lfloor a/b \rfloor \cdot b\bigr) \cdot y' = g$$
$$a \cdot y' + b \cdot \bigl(x' - \lfloor a/b \rfloor \cdot y'\bigr) = g$$

따라서 $x = y'$, $y = x' - \lfloor a/b \rfloor \cdot y'$로 현재 단계의 베주 계수가 결정된다.

### 정당성 — 왜 이것이 옳은가

**종료 보장**: $b$가 $a \bmod b$로 감소하므로 유한 단계 후 $b = 0$에 도달한다.

**귀납 정당성**: 기저 사례 $b = 0$에서 $a \cdot 1 + 0 \cdot 0 = a = g$이므로 자명하다. 귀납 가정으로 $\text{extGcd}(b, a \bmod b)$의 반환값이 올바르다고 하면, 위 유도로 $(g, y', x' - \lfloor a/b \rfloor \cdot y')$가 $a \cdot x + b \cdot y = g$를 만족함을 보였으므로 귀납이 성립한다.

**까다로운 케이스**: JS bigint의 `%` 연산자는 부호를 피제수에 맞추므로, 음수 입력에서 나머지가 음수가 될 수 있다. 반복문 버전에서는 마지막에 $g < 0$이면 $g, x, y$를 모두 음수로 전환해 $g \geq 0$을 보장한다. 또한 계수 $(x, y)$는 유일하지 않으므로 구현에 따라 다른 쌍이 나올 수 있다.

### 구현 디테일과 최적화

- **반복문 버전 선호**: 재귀 대신 $(r_\text{old}, r)$, $(s_\text{old}, s)$, $(t_\text{old}, t)$ 여섯 변수를 갱신하는 반복문이 스택 안전하고 직관적이다.
- **모듈러 역원 계산**: $\gcd(a, m) = 1$이면 $ax \equiv 1 \pmod{m}$의 해 $x = x_{\text{베주}} \bmod m$으로 역원을 바로 얻는다.
- **함정**: $a = 0$, $b = 0$ 동시인 경우 $g = 0$, $x = y = 0$으로 처리하거나 사전에 예외 처리해야 한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function extendedEuclidean(a, b):
    // 불변식: old_r = old_s*a + old_t*b,  r = s*a + t*b
    old_r = a;  r = b
    old_s = 1n; s = 0n
    old_t = 0n; t = 1n

    while r ≠ 0n:
        q = old_r / r          // 정수 나눗셈 (floor)
        [old_r, r] = [r, old_r - q*r]   // 나머지 갱신 (gcd 불변식 유지)
        [old_s, s] = [s, old_s - q*s]   // s 계수 갱신
        [old_t, t] = [t, old_t - q*t]   // t 계수 갱신

    // g = old_r = gcd(a, b)
    // 결과: old_r*a0 + old_t*b0 = old_r = g (but check sign)
    g = old_r; x = old_s; y = old_t
    if g < 0n:
        g = -g; x = -x; y = -y    // g는 항상 >= 0
    return { g, x, y }
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["old_r=a, r=b\nold_s=1, s=0\nold_t=0, t=1"]
    B --> C{r = 0n?}
    C -- Yes --> D{"old_r < 0?"}
    D -- Yes --> E["g=-old_r, x=-old_s, y=-old_t"]
    D -- No  --> F["g=old_r, x=old_s, y=old_t"]
    E --> G([return {g, x, y}])
    F --> G
    C -- No  --> H["q = old_r / r  (정수)"]
    H --> I["[old_r, r] = [r, old_r - q*r]\n[old_s, s] = [s, old_s - q*s]\n[old_t, t] = [t, old_t - q*t]"]
    I --> C
```

**핵심 불변식**: 루프 매 반복 직전, $\text{old\_r} = \text{old\_s} \cdot a + \text{old\_t} \cdot b$ 이고 $r = s \cdot a + t \cdot b$.

---

## 관련 알고리즘과 응용

### 모듈러 역원 계산

$\gcd(a, m) = 1$이면 확장 유클리드 결과의 $x$ 계수가 바로 $a^{-1} \bmod m$이다:

$$a \cdot x \equiv 1 \pmod{m} \implies x \equiv a^{-1} \pmod{m}$$

단, 반환된 $x$가 음수일 수 있으므로 `((x % m) + m) % m`으로 정규화한다.

### CRT에서의 활용

중국인의 나머지 정리에서 두 합동식을 합칠 때, $m_1/g$의 $\bmod\, m_2/g$ 역원을 확장 유클리드로 구한다. 확장 유클리드가 없으면 CRT 구현이 불가능하다.

### 디오판토스 방정식과 일반해

$ax + by = c$의 정수해는 $g = \gcd(a, b)$가 $c$를 나눌 때만 존재한다. 특수해 $(x_0, y_0)$을 확장 유클리드로 구하면, 일반해는 다음과 같다:

$$x = x_0 \cdot (c/g) + (b/g) t, \quad y = y_0 \cdot (c/g) - (a/g) t \quad (t \in \mathbb{Z})$$

### 계수의 범위

반환되는 베주 계수 $|x| \leq |b/g|$, $|y| \leq |a/g|$임이 알려져 있다. 따라서 bigint 연산에서도 계수 자체는 입력 범위를 크게 벗어나지 않는다.
