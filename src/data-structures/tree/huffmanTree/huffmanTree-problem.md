# HuffmanTree (허프만 트리)

## 한 줄 요약
> 문자 빈도 기반으로 최적 이진 접두사 코드를 생성해 무손실 텍스트 압축을 구현하라.

## 스토리
텍스트 파일을 저장하거나 전송할 때 각 문자를 고정 8비트로 표현하는 것은 낭비다. 영문 텍스트에서 'e'는 12% 이상 등장하지만 'z'는 0.07%에 불과하다.

허프만 코딩은 이 불균형을 이용한다. 빈도가 높은 문자에는 짧은 코드를, 낮은 문자에는 긴 코드를 할당해 평균 코드 길이를 정보 이론적 하한(엔트로피)에 근접하게 만든다. 데이비드 허프만이 1952년 MIT 학생 시절 개발한 이 알고리즘은 ZIP/DEFLATE, JPEG, MP3 등 현대 압축 표준의 핵심 구성 요소로 자리잡고 있다.

최소 힙(우선순위 큐)으로 빈도 기반 이진 트리를 bottom-up으로 구성하면 O(n log n)에 최적 코드를 생성할 수 있다.

## 함수 인터페이스

```ts
export class HuffmanTree {
  constructor(frequencies: Map<string, number>)
  encode(text: string): string
  decode(bits: string): string
  codeTable(): Map<string, string>
  compressionRatio(text: string): number
}
```

## 제약 조건
- $1 \leq |\text{고유 문자 수}| \leq 256$
- $1 \leq |\text{텍스트 길이}| \leq 10^5$
- frequencies의 값은 모두 양의 정수
- encode에 전달되는 텍스트는 frequencies의 문자만 포함
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 트리 구성 (최소 힙 방식)
1. 각 문자를 (빈도, 문자, null 자식)인 리프 노드로 만든다
2. 모든 리프를 최소 힙에 삽입한다 (빈도 기준)
3. 힙에 노드가 2개 이상이면:
   - 최소 빈도 노드 두 개를 꺼낸다
   - 두 노드를 자식으로 갖는 내부 노드(빈도 = 합)를 생성해 힙에 다시 넣는다
4. 힙에 노드가 1개 남으면 → 루트

### 코드 생성
- 루트에서 DFS: 왼쪽으로 이동할 때마다 "0", 오른쪽은 "1" 추가
- 리프에 도달하면 현재 비트열이 해당 문자의 허프만 코드

### 인코딩
- 각 문자를 codeTable로 조회해 이어붙인다

### 디코딩
- 루트에서 시작해 비트 0/1에 따라 왼쪽/오른쪽으로 이동
- 리프에 도달하면 문자 출력 후 루트로 돌아간다

### 압축률
```
ratio = (Σ freq[c] * codeLength[c]) / (텍스트 길이 * 8)
```

## 예시

```ts
const text = "abracadabra";
const freq = new Map([["a", 5], ["b", 2], ["r", 2], ["c", 1], ["d", 1]]);
const tree = new HuffmanTree(freq);

const table = tree.codeTable();
// 예: a→"0", b→"110", r→"111", c→"100", d→"101" (순서는 구현 의존)

const encoded = tree.encode("ab");
const decoded = tree.decode(encoded);
console.log(decoded); // "ab"

console.log(tree.compressionRatio(text)); // < 1.0 (압축됨)
```
