# MerkleTree (머클 트리)

## 한 줄 요약
> 데이터 블록 배열을 이진 해시 트리로 구성해, 단일 블록의 포함 여부를 O(log n) 증명으로 검증하라.

## 스토리
비트코인 노드는 수천 개의 트랜잭션을 하나의 블록에 담는다. 경량 노드(SPV 노드)는 블록 전체를 다운로드하지 않고도 특정 트랜잭션이 블록에 포함됐는지 검증해야 한다.

이를 가능하게 하는 것이 **머클 트리**다. 각 트랜잭션 데이터의 SHA-256 해시를 리프 노드로 삼고, 두 리프의 해시를 이어붙여 다시 해싱해 부모 노드를 만드는 과정을 루트까지 반복한다. 리프가 홀수 개일 때는 마지막 리프를 복제해 짝수로 맞춘다.

경량 노드는 `O(log n)` 개의 sibling 해시(머클 증명)만으로 특정 트랜잭션이 루트에 기여했는지 재계산해 검증할 수 있다. 이더리움의 상태 트리, 파일 시스템 무결성 검사(ZFS), 분산 데이터베이스 동기화에도 동일한 원리가 사용된다.

## 함수 인터페이스

```ts
export class MerkleTree {
  constructor(blocks: string[])
  rootHash(): string
  getProof(index: number): string[]
  verify(index: number, block: string, proof: string[]): boolean
  update(index: number, newBlock: string): void
}
```

## 제약 조건
- $1 \leq n \leq 10^4$ (블록 수)
- 각 블록 데이터는 임의의 문자열
- 해시 함수: SHA-256 (출력 64자 hex 문자열)
- 홀수 리프: 마지막 리프를 복제해 짝수로 패딩
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 트리 구성
1. 각 블록 `b_i`에 대해 리프 해시 `h_i = SHA256(b_i)` 계산
2. 홀수 개면 `h_{n-1}` 복사해 짝수 맞추기
3. 인접한 두 해시를 이어붙여 `parent = SHA256(left + right)` 계산
4. 1개 노드만 남을 때까지 반복 → 루트

### 머클 증명 (getProof)
- 리프 `i`에서 루트로 올라가며 매 레벨에서 형제(sibling) 노드의 해시를 수집
- 반환 배열 길이: `ceil(log2(n))`

### 검증 (verify)
- `current = SHA256(block)` 시작
- `proof` 배열을 순서대로 순회하며, 인덱스 홀짝에 따라 `SHA256(sibling + current)` 또는 `SHA256(current + sibling)` 계산
- 최종 계산값이 `rootHash()`와 일치하면 true

### 갱신 (update)
- 해당 리프만 재계산하고, 루트 방향 조상 노드만 O(log n)번 재계산

## 예시

```ts
const tree = new MerkleTree(["tx1", "tx2", "tx3", "tx4"]);
console.log(tree.rootHash()); // "a1b2c3..." (64자 hex)

const proof = tree.getProof(0); // ["sibling_hash_1", "sibling_hash_2"]
console.log(tree.verify(0, "tx1", proof)); // true
console.log(tree.verify(0, "FAKE", proof)); // false

tree.update(1, "tx2_modified");
// 루트 해시 변경됨
console.log(tree.verify(1, "tx2_modified", tree.getProof(1))); // true
```
