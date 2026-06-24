# CuckooFilter (뻐꾸기 필터)

## 한 줄 요약
> 삭제가 가능한 확률적 멤버십 필터 — BloomFilter의 한계를 극복한 지문(fingerprint) 기반 자료구조

## 스토리

당신은 대규모 네트워크 방화벽 시스템을 개발하는 엔지니어다. 매초 수백만 개의 패킷이 들어오고, 각 패킷의 발신 IP가 블랙리스트에 있는지 수 마이크로초 이내에 판단해야 한다.

처음에는 BloomFilter를 사용했다. 조회 속도는 완벽했지만 치명적인 문제가 있었다. 특정 IP의 차단을 해제(삭제)해야 할 때 BloomFilter는 항목을 삭제할 수 없었다. 결국 필터를 통째로 재구성해야 했고, 그 사이에 트래픽 처리가 중단되었다.

CuckooFilter는 이 문제를 해결한다. 각 항목의 지문(fingerprint)만 저장하고, 두 개의 후보 버킷 중 하나에 배치한다. 충돌 시 기존 항목을 다른 버킷으로 쫓아내는 방식(뻐꾸기 방식)을 사용하므로, 삭제 시 지문만 지우면 된다. 이제 IP 차단 해제가 O(1)에 처리되고, 방화벽은 끊김 없이 동작한다.

## 함수 인터페이스

```ts
export class CuckooFilter {
  constructor(capacity: number, fingerprintSize: number = 8)
  add(item: string): boolean
  has(item: string): boolean
  delete(item: string): boolean
  size(): number
  loadFactor(): number
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `constructor(capacity, fingerprintSize)` | 최대 항목 수와 지문 비트 크기로 필터 초기화 | - |
| `add(item)` | 항목 삽입. 용량 초과 시 false | `boolean` |
| `has(item)` | 멤버십 확인. false negative 없음 | `boolean` |
| `delete(item)` | 항목 삭제. BloomFilter와의 핵심 차이 | `boolean` |
| `size()` | 현재 저장된 항목 수 | `number` |
| `loadFactor()` | 현재 부하율 (0~1) | `number` |

## 제약 조건

- $n \leq 10^5$ (삽입 항목 수)
- `fingerprintSize`: 4~32 비트
- 시간 제한: 1초, 메모리 제한: 256 MB
- false negative는 허용되지 않는다 (추가한 항목은 반드시 `has`가 `true`)
- false positive는 허용된다 (확률적 자료구조의 특성)

## 문제 상세

### 뻐꾸기 해싱 원리

CuckooFilter는 뻐꾸기 해싱(Cuckoo Hashing)을 기반으로 한다. 항목 `x`에 대해 두 개의 후보 버킷 인덱스를 계산한다:

```
fingerprint(x) = hash(x) & ((1 << fingerprintSize) - 1)
bucket1(x)     = hash(x) % numBuckets
bucket2(x)     = bucket1(x) XOR hash(fingerprint(x)) % numBuckets
```

핵심은 `bucket2 = bucket1 XOR hash(fp)`이다. 이 공식 덕분에 `bucket2`에 있는 항목도 `fp`만 알면 `bucket1`을 계산할 수 있어, 지문만 저장해도 재배치(eviction)가 가능하다.

### 삽입 알고리즘

1. `fingerprint(x)` 계산
2. `bucket1` 또는 `bucket2`에 빈 슬롯이 있으면 삽입
3. 둘 다 가득 차면 무작위로 하나를 선택해 기존 항목을 쫓아내고, 쫓겨난 항목을 재배치
4. 재배치가 최대 횟수(예: 500회)를 초과하면 필터가 가득 찬 것으로 판단하고 `false` 반환

### 삭제 알고리즘

1. `fingerprint(x)` 계산
2. `bucket1`에서 해당 지문을 찾아 제거
3. 없으면 `bucket2`에서 찾아 제거
4. 둘 다 없으면 `false` 반환

삭제가 가능한 이유는 지문이 슬롯에 직접 저장되기 때문이다. BloomFilter는 비트 배열을 공유하므로 하나를 지우면 다른 항목에 영향을 줄 수 있다.

## 예시

```ts
const cf = new CuckooFilter(1000, 8);

// 네트워크 방화벽 블랙리스트
cf.add("192.168.1.100");  // true — 악성 IP 등록
cf.add("10.0.0.1");       // true
cf.add("172.16.0.5");     // true

cf.has("192.168.1.100");  // true — 블랙리스트 확인
cf.has("8.8.8.8");        // false (높은 확률로)

// IP 차단 해제 — BloomFilter로는 불가능!
cf.delete("192.168.1.100");  // true
cf.has("192.168.1.100");     // false — 차단 해제 완료

cf.size();        // 2
cf.loadFactor();  // 0.001 (대략)
```
