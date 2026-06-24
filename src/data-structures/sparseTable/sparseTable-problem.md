# SparseTable (희소 테이블)

## 한 줄 요약
> 불변 배열에서 구간 최솟값/최댓값/GCD 등 멱등 연산을 O(n log n) 전처리 후 O(1) 상수 시간에 질의하는 정적 자료구조.

## 스토리

글로벌 CDN 회사는 수백만 개의 DNS 캐시 레코드를 관리한다. 각 레코드에는 TTL(Time To Live, 초 단위) 값이 있으며, 인덱스 [l, r] 범위의 레코드 중 TTL이 가장 짧은 레코드를 빠르게 찾아야 만료 스캔을 효율적으로 수행할 수 있다.

문제는 이 질의가 초당 수십만 번 발생한다는 것이다. 단순 순회는 O(n)이라 병목이 되고, 세그먼트 트리는 O(log n)이지만 DNS 레코드는 한 번 등록되면 변하지 않으므로 업데이트 비용을 낼 필요가 없다. 정적 배열 + 읽기 전용 질의 시나리오에서는 희소 테이블이 O(1) 질의로 세그먼트 트리를 앞선다.

희소 테이블은 "2의 거듭제곱 길이"로 정의된 구간들을 미리 계산해 두고, 임의 구간 [l, r]을 두 개의 겹치는 2의 거듭제곱 구간으로 덮는다. 멱등 연산(min, max, gcd 등)은 겹치는 부분을 중복 계산해도 결과가 변하지 않으므로, 두 구간의 merge 결과를 즉시 반환할 수 있다.

## 함수 인터페이스

```ts
export class SparseTable {
  // 전처리: O(n log n), 공간: O(n log n)
  constructor(arr: number[], merge: (a: number, b: number) => number): void

  // [l, r] 구간 연산 결과, O(1)
  // merge는 멱등(idempotent) 연산이어야 함 — min, max, gcd
  query(l: number, r: number): number
}
```

## 제약 조건

- $1 \leq n \leq 10^6$
- $0 \leq l \leq r < n$
- merge 함수는 **결합법칙(associativity)** + **멱등성(idempotency)** 을 모두 만족해야 한다
  - 멱등성: `f(f(x, y), y) = f(x, y)` (같은 원소를 두 번 포함해도 결과 불변)
  - 구간 합은 멱등이 아니므로 O(1) 질의 불가
- 배열은 생성 후 변경되지 않는다 (정적 배열)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 전처리 테이블 구성

`table[k][i]`를 "인덱스 i에서 시작하는 길이 2^k인 구간의 merge 결과"로 정의한다.

```
table[0][i] = arr[i]          // 길이 1 구간 = 원소 자체
table[k][i] = merge(
  table[k-1][i],              // [i, i + 2^(k-1) - 1]
  table[k-1][i + 2^(k-1)]    // [i + 2^(k-1), i + 2^k - 1]
)
```

이를 반복적(bottom-up)으로 채우면 O(n log n)에 완성된다.

### O(1) 구간 질의

구간 [l, r]의 길이 len = r - l + 1에 대해, `k = ⌊log₂(len)⌋`을 구한다. 그러면 길이 2^k인 두 구간으로 [l, r] 전체를 덮을 수 있다.

```
k = floor(log2(r - l + 1))
result = merge(
  table[k][l],              // [l, l + 2^k - 1]
  table[k][r - 2^k + 1]    // [r - 2^k + 1, r]
)
```

두 구간은 겹칠 수 있지만, 멱등 연산이므로 중복된 원소가 결과에 영향을 주지 않는다. 따라서 항상 O(1)에 올바른 결과를 반환한다.

## 예시

```ts
// DNS TTL 만료 스캔
const ttls = [300, 60, 3600, 120, 900, 1800, 30];
const st = new SparseTable(ttls, Math.min);

st.query(0, 6); // 30  — 전체 중 최소 TTL
st.query(0, 2); // 60  — min(300, 60, 3600)
st.query(3, 5); // 120 — min(120, 900, 1800)
st.query(4, 6); // 30  — min(900, 1800, 30)

// 구간 최댓값
const peaks = new SparseTable(ttls, Math.max);
peaks.query(0, 6); // 3600
peaks.query(3, 5); // 1800

// GCD
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const nums = [12, 8, 6, 4];
const stGcd = new SparseTable(nums, gcd);
stGcd.query(0, 3); // 2 — gcd(12, 8, 6, 4)
stGcd.query(0, 1); // 4 — gcd(12, 8)
```
