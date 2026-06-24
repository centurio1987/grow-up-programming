# RadixTree (기수 트리 / Patricia Trie)

## 한 줄 요약
> Trie의 공간 최적화 버전으로, 에지에 문자열 전체를 저장해 노드 수를 단어 수에 비례하게 유지하라.

## 스토리
Trie는 완벽하지 않다. "string"이라는 단어 하나를 저장하는 데도 s→t→r→i→n→g 총 6개의 노드가 필요하다. 단어 수가 적지만 단어가 긴 경우, 대부분의 노드가 자식을 하나만 가지는 '일직선 경로'가 된다. 이런 노드들은 메모리 낭비다.

Radix Tree는 이를 해결한다. 자식이 하나뿐인 노드들을 합쳐 에지에 문자열 전체를 저장한다. 노드 수가 저장된 단어 수에 비례해 유지된다. Linux 커널의 IP 라우팅 테이블(`ip_fib_trie`)은 수십만 개의 IP 접두사를 Radix Tree로 관리해 최장 접두사 매칭(LPM)을 고속으로 처리한다.

삽입 시 에지를 분할(split)하고, 삭제 시 노드를 병합(merge)하는 두 가지 핵심 연산이 트리를 항상 압축 상태로 유지한다.

## 함수 인터페이스

```ts
export class RadixTree {
  insert(word: string): void
  search(word: string): boolean
  startsWith(prefix: string): boolean
  delete(word: string): boolean
  wordsWithPrefix(prefix: string): string[]
  size(): number
}
```

## 제약 조건
- $1 \leq$ 단어 길이 $\leq 10^3$
- $n \leq 10^4$ (삽입 단어 수)
- 에지 레이블: 임의 문자열
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 노드 구조
```ts
interface RadixNode {
  children: Map<string, RadixNode>;  // 에지 첫 문자 → 자식 노드
  label: string;                      // 에지 레이블 (이 노드로 오는 에지 문자열)
  isEnd: boolean;
}
```

### insert — 에지 분할(split)
1. 루트에서 현재 단어의 남은 부분과 에지 레이블의 공통 접두사 계산
2. **완전 일치**: 에지 레이블 전체가 소비되면 자식으로 내려감
3. **부분 일치**: 공통 접두사 길이 < 에지 레이블 길이이면 에지를 분할
   - 공통 접두사 위치에 새 노드 삽입
   - 기존 에지 나머지를 새 노드의 자식으로 이동
   - 단어 나머지를 새 노드의 다른 자식으로 추가

### delete — 노드 병합(merge)
- 삭제 후, 자식이 하나이고 `isEnd`가 false인 노드는 자식과 병합

### Trie vs RadixTree 비교
| 항목 | Trie | RadixTree |
|------|------|-----------|
| 에지 레이블 | 단일 문자 | 문자열 |
| 노드 수 | O(전체 문자 수) | O(단어 수) |
| 구현 복잡도 | 낮음 | 중간 |
| 메모리 효율 | 공유 많을 때 좋음 | 공유 적을 때도 좋음 |

## 예시

```ts
const tree = new RadixTree();
// 클래식 Radix Tree 예제 (위키피디아)
["romane", "romanus", "romulus", "rubens", "ruber", "rubicon", "rubicundus"].forEach(w => tree.insert(w));

console.log(tree.search("romane"));   // true
console.log(tree.search("roman"));    // false
console.log(tree.startsWith("rom"));  // true
console.log(tree.wordsWithPrefix("rub").sort());
// ["rubens", "ruber", "rubicon", "rubicundus"]

tree.delete("romane");
console.log(tree.search("romane"));   // false
console.log(tree.search("romanus"));  // true
```
