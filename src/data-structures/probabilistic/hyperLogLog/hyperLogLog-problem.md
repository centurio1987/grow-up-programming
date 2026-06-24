# HyperLogLog (하이퍼로그로그)

## 한 줄 요약
> 수억 개의 원소 중 유니크 항목 수를 단 수 KB의 메모리로 오차 ~1% 이내에 추정하는 확률적 카운팅 알고리즘

## 스토리

당신은 글로벌 이커머스 플랫폼의 실시간 분석 팀에서 일하고 있다. 매일 수억 건의 상품 클릭 이벤트가 발생하고, 운영팀은 실시간으로 "오늘 이 상품을 본 유니크 방문자 수"를 알고 싶어 한다.

가장 단순한 방법은 방문자 ID를 Set에 넣고 크기를 보는 것이다. 하지만 방문자가 1억 명이라면 ID를 모두 저장하는 데 수십 GB가 필요하다. 상품이 수백만 개라면 수 PB가 된다. 현실적으로 불가능하다.

HyperLogLog는 이 문제를 혁신적으로 해결한다. 방문자 ID를 해시한 뒤, 해시값의 선행 0 비트 개수만 버킷에 기록한다. 수학적으로, 선행 0이 k개인 해시값이 나오려면 평균 2^k개의 원소가 필요하다. 이 관찰을 정밀하게 보정하면, 단 수 KB의 메모리로 수억 개 원소의 유니크 수를 1~2% 오차로 추정할 수 있다. Redis, Google BigQuery, Apache Spark 모두 HyperLogLog를 핵심 기능으로 내장하고 있다.

## 함수 인터페이스

```ts
export class HyperLogLog {
  constructor(precision: number = 10)
  add(item: string): void
  count(): number
  merge(other: HyperLogLog): HyperLogLog
  error(): number
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `constructor(precision)` | 버킷 수 m = 2^precision으로 초기화 (4~16) | - |
| `add(item)` | 원소 추가. 중복 추가는 cardinality에 영향 없음 | `void` |
| `count()` | 추정 cardinality 반환 | `number` |
| `merge(other)` | 두 HLL을 병합한 새 인스턴스 반환 | `HyperLogLog` |
| `error()` | 표준 오차율 1.04/sqrt(m) 반환 | `number` |

## 제약 조건

- `precision`: 4 이상 16 이하 정수
- $n \leq 10^8$ (추가 원소 수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `count()` 결과의 실제 오차는 표준 오차율 내에 있어야 함 (95% 신뢰 구간)
- `merge`는 원본 인스턴스를 변경하지 않아야 한다

## 문제 상세

### 핵심 아이디어: 확률론적 카운팅

해시 함수 h: item → {0, 1}^32를 가정한다. h(x)의 이진 표현에서 선행 0의 개수를 ρ(x)라 한다.

**관찰:** 무작위 이진 문자열에서 선행 0이 k개 이상일 확률은 1/2^k이다. 따라서 n개의 항목 중 최대 선행 0 개수를 R이라 하면, n ≈ 2^R이 성립한다.

**문제:** 하나의 버킷만 쓰면 분산이 너무 크다.

**해결:** m = 2^precision개의 버킷을 두고, 해시값의 앞 p비트로 버킷을 결정한다. 나머지 비트로 ρ를 계산해 버킷에 최댓값으로 갱신한다. m개 버킷의 **조화 평균**으로 최종 cardinality를 추정한다.

### 추정 공식

```
Z = 1 / (합₁≤ⱼ≤ₘ 2^(-M[j]))   ← 버킷 값의 조화 평균의 역수
E = α_m * m² * Z

α_m: 편향 보정 상수
  - m=16: 0.673
  - m=32: 0.697
  - m=64: 0.709
  - m≥128: 0.7213 / (1 + 1.079/m)
```

### 소규모/대규모 보정

- **소규모** (E < 5m/2): 빈 버킷 수 V를 이용해 선형 카운팅으로 보정
  `E = m * ln(m/V)`
- **대규모** (E > 2^32/30): 32비트 해시 충돌 보정
  `E = -2^32 * ln(1 - E/2^32)`

## 예시

```ts
const hll = new HyperLogLog(12); // m = 4096버킷, 오차 ≈ 1.6%

// 1백만 명의 유니크 방문자 시뮬레이션
for (let i = 0; i < 1_000_000; i++) {
  hll.add(`user-${i}`);
}

console.log(hll.count());  // ≈ 1,000,000 (오차 1.6% 이내)
console.log(hll.error());  // ≈ 0.0163 (= 1.04 / sqrt(4096))

// 두 날짜의 방문자를 병합 (교집합 중복 자동 처리)
const hll2 = new HyperLogLog(12);
for (let i = 500_000; i < 1_500_000; i++) {
  hll2.add(`user-${i}`);
}

const merged = hll.merge(hll2);
console.log(merged.count()); // ≈ 1,500,000 (유니크 방문자)
```
