# Bloom Filter 해설

## 성능 목표 예측

| 제약 항목 | 값 |
|-----------|-----|
| 비트 배열 크기 $m$ | $\leq 10^6$ |
| 해시 함수 개수 $k$ | $\leq 16$ |
| 삽입 원소 수 $n$ | $\leq 10^5$ |

**naive 접근의 문제점**: 집합 멤버십을 정확히 판단하려면 해시 테이블이나 정렬 배열을 사용해야 하며, 원소당 최소 수십 바이트가 필요하다. $n = 10^5$개의 문자열을 저장하면 수 MB의 공간이 필요하다. 집합의 근사적 멤버십만 필요한 상황(스팸 필터, 캐시 프리필터 등)에서 이 공간은 낭비다.

**목표 복잡도**: 연산당 $O(k)$. $k$가 상수이므로 실효적으로 $O(1)$이다. $k \leq 16$이므로 어떤 입력 크기에서도 16번의 해시 계산만으로 결론을 낸다.

**공간 복잡도**: $O(m)$ 비트. $m = 10^6$ 비트는 약 125KB로, 원소를 직접 저장하는 방식 대비 10~100배 이상 절약된다. 트레이드오프는 거짓 양성(false positive)의 허용이다.

---

## 목표 함수

```ts
class BloomFilter {
  constructor(size: number, hashCount: number): BloomFilter
  add(item: string): void
  has(item: string): boolean
}
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `size` | 비트 배열 크기 $m$ | $1 \leq m \leq 10^6$ |
| `hashCount` | 해시 함수 개수 $k$ | $1 \leq k \leq 16$ |
| `item` | 집합에 추가하거나 조회할 문자열 원소 | 임의 문자열 |

**반환값**: `has`는 원소가 집합에 있을 가능성을 나타내는 불리언이다. `true`라도 실제로 없을 수 있다(false positive). `false`라면 확실히 없다(no false negative).

**엣지케이스**:
1. 동일한 원소를 `add`한 뒤 `has` 호출 → 반드시 `true` (no false negative 보장).
2. 추가하지 않은 원소를 `has` 조회 → 비트가 우연히 모두 1이면 `true` 반환 가능 (false positive).
3. 같은 `item`을 여러 번 `add` → 동일한 비트 위치를 반복 설정할 뿐이므로 상태 변화 없음. 안전하다.
4. 비트 배열이 거의 꽉 찬 경우 ($n \gg m/k$) → 대부분의 비트가 1이 되어 false positive 확률이 1에 수렴한다.
5. $k = 1$인 경우 → 단일 해시 비트 필터. 충돌 확률이 높아 false positive가 많다.

---

## 핵심 아이디어

**핵심 아이디어**: "원소 자체를 저장하지 않고, 여러 해시 함수로 남긴 '흔적'만으로 멤버십을 판단한다."

집합에 원소가 있는지 확인하고 싶지만, 원소를 직접 저장하기엔 메모리가 너무 아깝거나 부족한 상황이 있다. 블룸 필터는 원소 대신 비트 배열에 해시 흔적만 남겨 공간을 수십~수백 배 줄인다. 대신 "있다"는 답은 틀릴 수 있지만(거짓 양성), "없다"는 답은 절대 틀리지 않는다.

**풀이 구조**
1. 크기 $m$의 비트 배열과 $k$개의 독립 해시 함수를 준비한다
2. 원소 추가 시: $k$개 해시 위치를 모두 1로 설정한다
3. 원소 조회 시: $k$개 해시 위치가 모두 1이면 "있을 가능성 있음", 하나라도 0이면 "확실히 없음"

**조건**: 거짓 양성(false positive)은 허용하지만 거짓 음성(false negative)은 절대 허용할 수 없는 상황, 그리고 메모리가 매우 제한적인 환경

**대표 예시**: 스팸 필터 / 캐시 프리필터
수백만 개의 URL이나 이메일 주소를 "이미 처리했는가?" 판단할 때, 전체 목록을 메모리에 올리는 대신 블룸 필터로 125KB 안에 처리한다. "없다"는 확신이 있으면 바로 통과시키고, "있을 수도 있다"는 경우에만 정밀 검사를 수행한다.

**언제 쓰나**
정확한 집합 멤버십 대신 "확실히 없음"만 보장해도 충분한 게이트키퍼 용도로, 빠른 사전 필터링이 필요할 때 사용한다. DB 조회 전 불필요한 디스크 접근을 줄이거나, 네트워크 패킷 중복 감지 등에 유용하다.

---

### 원형 아이디어와 naive 접근

가장 단순한 집합 표현은 `Set<string>`이다. 이는 원소 하나당 수십 바이트가 필요하고, 메모리 접근 패턴도 랜덤이다. 집합을 사용하기 전에 "이 원소가 있을 리 없다"를 빠르게 필터링하는 게이트키퍼가 있다면 전체 시스템 성능이 향상된다. 그 게이트키퍼가 약간의 false positive를 허용하더라도 괜찮다면, 정밀도를 희생해 공간을 절약할 수 있다.

**폭발 지점**: 원소를 저장하지 않으면서 멤버십을 판단하는 것이 가능한가? 불가능하다 — 단, 100% 정확도를 요구하지 않는다면 가능하다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: 원소 자체를 저장하지 않아도, 원소의 "지문(fingerprint)"을 기록하면 멤버십을 확인할 수 있다. 지문이 충돌(collision)하면 false positive가 발생하지만, 이는 허용 가능하다.
- **관찰 2**: 단일 해시는 충돌 확률이 $1/m$으로 높다. 여러 독립 해시 함수를 모두 만족해야 한다는 조건으로 충돌 확률을 $O((1/m)^k)$ 수준으로 낮출 수 있다.
- **관찰 3**: 비트 하나에 여러 원소의 해시 결과가 겹쳐 쌓이므로 삭제는 불가능하다. 삭제를 지원하려면 카운팅 Bloom Filter가 필요하다.

### 관찰을 형식화: 상태/구조 정의

크기 $m$의 비트 배열 $B$와 $k$개의 독립 해시 함수 $h_1, \ldots, h_k$를 정의한다.

$$B \in \{0, 1\}^m, \quad h_j : \Sigma^* \to [0, m)$$

이 형태여야 하는 근거: 각 비트 위치는 "어떤 원소가 이 위치를 점유했는가"를 기억한다. 비트 배열은 합집합(OR) 연산만 지원하므로 false negative가 발생하지 않는다. 여러 해시를 AND 조건으로 결합하면 false positive 확률을 독립적으로 줄일 수 있다.

### 점화식 또는 핵심 연산

**추가 연산**:
$$\text{add}(x) \triangleq \forall j \in [1, k], \; B[h_j(x) \bmod m] \leftarrow 1$$

**조회 연산**:
$$\text{has}(x) \triangleq \bigwedge_{j=1}^{k} (B[h_j(x) \bmod m] = 1)$$

**false positive 확률** ($n$개 원소 추가 후):

각 비트가 1이 될 확률: $1 - (1 - 1/m)^{kn} \approx 1 - e^{-kn/m}$

임의 원소 $y \notin S$에 대해 $\text{has}(y) = \text{true}$일 확률:

$$p \approx \left(1 - e^{-kn/m}\right)^k$$

이를 최소화하는 최적 $k$:

$$k^* = \frac{m}{n} \ln 2 \approx 0.693 \cdot \frac{m}{n}$$

### 정당성 — 왜 이것이 옳은가

**no false negative 증명**: 원소 $x$를 `add`하면 $B[h_j(x) \bmod m] = 1$이 모든 $j$에 대해 성립한다. 비트는 한번 1이 되면 절대 0으로 되돌아가지 않는다(추가만 가능, 삭제 불가). 따라서 이후 `has(x)` 호출 시 모든 $k$개 비트가 1임이 보장되어 `true`를 반환한다.

**false positive 발생 조건**: 원소 $y$를 추가하지 않았더라도, $y$의 $k$개 해시 위치가 모두 다른 원소들에 의해 1로 설정되어 있으면 `has(y) = true`가 된다. 이것이 false positive다.

**까다로운 케이스**: $m$이 매우 작거나 $n$이 매우 크면 대부분의 비트가 1이 되어 필터가 무용지물이 된다. 이 경우 $p \to 1$이다. 실전에서는 목표 false positive 확률 $p^*$와 예상 원소 수 $n$으로부터 $m = -n \ln p^* / (\ln 2)^2$, $k = (m/n) \ln 2$를 계산하여 구성해야 한다.

### 구현 디테일과 최적화

**비트 배열 관리**: $m$비트를 $\lceil m/32 \rceil$개의 32비트 정수(또는 TypedArray)로 관리한다.
```
setBit(pos):  arr[pos >>> 5] |=  (1 << (pos & 31))
testBit(pos): arr[pos >>> 5] &   (1 << (pos & 31))
```

**해시 함수 구성**: 두 기반 해시값 $h_1, h_2$로 $k$개를 생성하는 double hashing(Kirsch-Mitzenmacher 2008):
$$h_i(x) = (h_1(x) + i \cdot h_2(x)) \bmod m, \quad i = 0, 1, \ldots, k-1$$
이 기법은 두 번의 해시 계산으로 $k$개의 독립 해시를 근사한다.

**함정**: $h_2(x) \bmod m = 0$이 되면 모든 해시값이 동일해진다. $h_2$를 $m$과 서로소인 값으로 강제하거나 $m$을 소수로 설정하면 회피할 수 있다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
class BloomFilter(m, k):
    bits = Uint32Array of length ⌈m/32⌉, initialized to 0
    // 불변식: add된 원소 x에 대해 bits[h_j(x) mod m] = 1, ∀j ∈ [0, k)
    //         즉, 추가된 모든 원소의 k개 비트는 영구적으로 1 상태를 유지한다

add(item):
    h1 = hash1(item)              // 기반 해시 1
    h2 = hash2(item)              // 기반 해시 2
    for i in 0 .. k-1:
        pos = (h1 + i * h2) mod m  // 불변식: 0 ≤ pos < m
        setBit(bits, pos)           // 해당 비트를 1로 설정

has(item) → boolean:
    h1 = hash1(item)
    h2 = hash2(item)
    for i in 0 .. k-1:
        pos = (h1 + i * h2) mod m
        if testBit(bits, pos) == 0:
            return false            // 하나라도 0 → 확실히 없음
    return true                     // 모두 1 → 있을 가능성 있음 (FP 가능)
```

### Activity Diagram

```mermaid
flowchart TD
    A([add: item]) --> B["h1=hash1(item), h2=hash2(item), i=0"]
    B --> C{i < k?}
    C -- No --> D([done, 모든 k개 비트 설정 완료])
    C -- Yes --> E["pos = (h1 + i×h2) mod m"]
    E --> F["setBit(bits, pos)"]
    F --> G["i++"]
    G --> C

    H([has: item]) --> I["h1=hash1(item), h2=hash2(item), i=0"]
    I --> J{i < k?}
    J -- No --> K([return true, false positive 가능])
    J -- Yes --> L["pos = (h1 + i×h2) mod m"]
    L --> M{testBit(bits, pos) == 0?}
    M -- Yes → 확실히 없음 --> N([return false])
    M -- No → 이 비트는 1 --> O["i++"]
    O --> J
```

**핵심 불변식**: `add(x)` 이후 `bits[h_j(x) mod m] = 1`이 모든 $j \in [0, k)$에 대해 영구히 성립하므로 false negative는 절대 발생하지 않는다.
