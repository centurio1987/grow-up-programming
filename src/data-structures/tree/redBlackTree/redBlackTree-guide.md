# 레드블랙 트리 — 세 가지 균형 트리와 선택 기준

## 파트 1 — 연산에서 저장 방식으로

### 전체 컨셉

이 글이 다루는 구조는 **원소를 중복 없이 담고 언제나 정렬 순서로 읽을 수 있는 집합**입니다. 30, 10, 20을 넣고 10을 한 번 더 넣으면 담긴 원소는 `{10, 20, 30}` 셋입니다. 여기서 15 이상 30 이하를 물으면 `[20, 30]`이 나오고, 10을 지우면 `[20, 30]`만 남습니다.

```text
insert(30) · insert(10) · insert(20)   담긴 원소 [10, 20, 30]
insert(10)                             이미 있으므로 그대로 [10, 20, 30]
has(20)                                true
min() · max()                          10 · 30
range(15, 30)                          [20, 30]
delete(10)                             true, 이제 [20, 30]
toArray()                              [20, 30]
```

이 순서를 저장하는 방법은 하나가 아닙니다. **2-3 트리**는 노드 하나에 키를 둘까지 담고 모든 잎을 같은 깊이에 둡니다. **AVL 트리**는 이진 탐색 트리의 노드마다 부분트리 높이를 기록하고 두 자식의 높이 차를 1 이하로 유지합니다. **레드블랙 트리**는 이진 탐색 트리의 노드마다 빨강·검정을 붙이고 색 규칙으로 높이를 제한합니다. 세 방법 모두 원소 수가 n일 때 뿌리에서 잎까지의 거리를 `log n`의 상수 배 안에 둡니다.

| 구현 | 높이를 제한하는 방법 | 넣거나 지운 뒤 생기는 작업 |
| --- | --- | --- |
| 2-3 트리 | 모든 잎이 같은 깊이, 높이는 뿌리에서만 변함 | 넘친 노드 나누기, 빈 노드에 키 빌리기·합치기 |
| AVL 트리 | 모든 노드에서 두 자식의 높이 차가 1 이하 | 경로를 되돌아오며 높이 계산, 차가 2인 노드 회전 |
| 레드블랙 트리 | 빨간 노드가 연달아 오지 않고, 경로마다 검은 노드 수가 같음 | 색 바꾸기, 회전은 넣기 2번·지우기 3번 이하 |

정렬 집합의 동작과 저장 방식을 구분하면 세 구현을 비교하기 쉽습니다. 사용자에게 보이는 원소와 순서는 같고, 넣거나 지운 뒤 높이를 다시 맞추는 작업이 다릅니다.

### 시작하기 전에 — 이미 알고 있어야 하는 것

이진 탐색 트리를 알고 있으면 읽을 수 있습니다. 노드의 왼쪽 부분트리에는 더 작은 값만, 오른쪽 부분트리에는 더 큰 값만 있으므로 값을 찾을 때 뿌리부터 비교하며 한쪽으로만 내려갑니다. 왼쪽 부분트리, 노드, 오른쪽 부분트리 순서로 방문하는 **중위 순회**를 하면 값이 오름차순으로 나옵니다. 흐릿하다면 이진 탐색 트리 가이드(`tree/binarySearchTree`)를 먼저 보세요.

```text
      4            중위 순회: 1 2 3 4 5 6 7
    2   6          값 5를 찾을 때: 4보다 크다 → 오른쪽 6, 6보다 작다 → 왼쪽 5
   1 3 5 7         비교한 노드 수 = 내려간 깊이
```

이 글에서 사용할 연산은 여덟 개입니다. 아래 표는 [이 프로젝트의 레드블랙 트리 명세](./redBlackTree.ts)를 요약한 것입니다. n은 담긴 원소 수, k는 `range`가 돌려주는 원소 수입니다.

<!--contract-summary-->

| 연산 | 의미 | 상한 | 한정자 |
| --- | --- | --- | --- |
| `constructor(comparator?)` | 비교 함수를 고정. 이후 바꿀 수 없음 | O(1) | 최악 |
| `insert(item)` | 원소를 담음. 동등한 원소가 이미 있으면 상태가 바뀌지 않음 | O(log n) | 최악 |
| `delete(item)` | 동등한 원소를 지우고 true. 없으면 false, 상태는 그대로 | O(log n) | 최악 |
| `has(item)` | 동등한 원소가 담겨 있으면 true | O(log n) | 최악 |
| `min()` / `max()` | 비교 함수 기준 최솟값·최댓값. 비어 있으면 null | O(log n) | 최악 |
| `range(low, high)` | low 이상 high 이하인 원소를 오름차순 배열로 | O(log n + k) | 최악 |
| `toArray()` | 전체를 오름차순 배열의 사본으로 | O(n) | 최악 |

**최악 시간**이 O(log n)이면 호출 한 번마다 필요한 작업량이 `log n`의 상수 배로 제한됩니다. 여러 호출의 평균이 로그이거나 기댓값이 로그인 구현은 이 조건을 만족하지 못합니다. 이 계약이 요구하는 것이 바로 호출 하나하나의 상한이고, 세 구현이 높이를 제한하는 이유도 그것입니다.

```ts
const s = new RedBlackTree<number>();
s.insert(30); s.insert(10); s.insert(20);
s.insert(10);         // 이미 있으므로 그대로 — {10, 20, 30}
s.has(20);            // true
s.min(); s.max();     // 10, 30
s.range(15, 30);      // [20, 30]
s.delete(10);         // true — 이제 {20, 30}
s.toArray();          // [20, 30]
```

비교 함수는 두 값이 같으면 0을 돌려주고, 같다고 판정된 값은 한 번만 담깁니다. 비교 함수를 주지 않으면 `<`와 `>`로 비교하므로 숫자와 문자열 밖의 값에는 비교 함수가 필요합니다. 빈 집합에서 `min`과 `max`는 `null`을, `low`가 `high`보다 큰 `range`는 빈 배열을 돌려줍니다.

### 설계 상세 — 넣는 순서가 나빠도 높이를 로그로 묶으려면 무엇을 고쳐야 할까

가장 먼저 떠올릴 수 있는 구현은 **정렬된 배열**입니다. 이진 탐색으로 값의 위치는 비교 `log n`번 안에 찾습니다. 문제는 가운데에 넣거나 지울 때입니다. 빈칸을 만들거나 메우려면 그 뒤의 원소를 한 칸씩 옮겨야 합니다.

```text
정렬 배열 [1, 3, 4, 7, 9]에 5 삽입
위치는 이진 탐색으로 찾음 → 9를 뒤로, 7을 뒤로 옮김 → [1, 3, 4, 5, 7, 9]
원소 이동 2회. 맨 앞에 0을 넣으면 5회, 원소가 n개면 최대 n회
```

원소를 옮기지 않으려면 원소끼리 연결하면 됩니다. **이진 탐색 트리**에서는 넣을 자리를 찾아 내려가 새 노드를 매달기만 하면 됩니다. 그런데 이 방법은 넣는 순서에 따라 모양이 크게 달라집니다. 1부터 7까지 오름차순으로 넣으면 새 값이 매번 가장 크므로 오른쪽 자식으로만 이어져 트리가 한 줄이 됩니다.

```text
4 2 6 1 3 5 7 순서로 넣음      1 2 3 4 5 6 7 순서로 넣음
        4                     1
      2   6                     2
     1 3 5 7                      3 … 7
높이 3                        높이 7

한 줄이 된 트리에서 7을 찾으려면 노드 7개를 모두 지납니다. 원소가 n개면 n개
```

그런데 계약이 요구하는 것은 **어떤 순서로 넣어도 호출 한 번이 로그 안에 끝나는 것**입니다. 높이가 입력 순서에 따라 n까지 커지는 설계로는 이 조건을 지킬 수 없습니다. 넣거나 지운 뒤 트리의 모양을 고쳐 높이를 로그로 묶어야 하고, 세 구현은 이 물음에 서로 다른 답을 줍니다.

```text
2-3 트리       노드에 키를 둘까지 담고, 셋이 되면 가운데 키를 부모로 올리며 나눈다. 트리는 뿌리에서만 높아진다.
AVL 트리       노드마다 부분트리 높이를 기록하고, 두 자식의 높이 차가 2가 되면 회전으로 되돌린다.
레드블랙 트리  2-3-4 트리의 노드를 빨간 연결로 풀어 이진 노드로 저장하고, 색 규칙이 깨진 자리만 고친다.
```

같은 1부터 n까지의 오름차순 입력에 세 구현이 실제로 만든 높이입니다.

<!--proof:ascending-heights-->

```text
1부터 n까지 오름차순   균형 없는 트리   2-3 트리   AVL 트리   레드블랙 트리
7                                   7          3          3               4
1,023                           1,023         10         10              18
```

세 구현 모두 트리 전체를 다시 만들지 않습니다. 모양을 고치는 일은 넣거나 지운 자리에서 뿌리까지의 한 경로 위에서만 일어나므로, 고치는 비용도 높이에 비례합니다.

### 수행으로 알아보는 자료구조 — 높이를 고치며 구현하기

세 구현에서 공통으로 확인할 것은 같은 값을 넣고 지웠을 때 담긴 원소가 같은지, 그리고 높이가 로그 안에 머무는지입니다. 먼저 1부터 7까지 오름차순으로 넣고 4, 1, 2를 지워 보겠습니다. 오름차순은 균형 없는 트리를 한 줄로 만드는 입력이라 고치는 코드가 실제로 실행됩니다.

```text
공통 확인: insert 1~7 오름차순 → delete(4) → delete(1) → delete(2) → 남은 원소 [3, 5, 6, 7]
추가 확인: 레드블랙 트리는 넣기 뒤 고치기 세 경우와 지우기 뒤 고치기 네 경우를 모두 지나는 호출 열아홉 번
```

세 구현을 하나씩 만듭니다. 소절 번호의 앞자리가 구현이고 뒷자리가 그 구현 안의 순서입니다. 실수하기 쉬운 자리를 짚는 「짚고 가기」 소절은 그 구현의 소절 사이에 둡니다.

| 구현 | 소절 | 그 구현에서 따로 볼 것 |
| --- | --- | --- |
| 2-3 트리 | 1-1 | 넘친 노드 나누기, 빈 노드에 빌리기·합치기 |
| AVL 트리 | 2-1 | 높이 차가 2가 된 노드의 회전 |
| 레드블랙 트리 | 3-1 · 3-2 · 3-3 · 전체 코드 | 색 규칙 셋, 새 노드를 검게 넣는 실수, 열아홉 호출 실행 |

#### 1-1. 2-3 트리 — 노드에 키를 둘까지 담고 넘치면 나눈다

2-3 트리의 노드는 키를 한 개나 두 개 담습니다. 키가 한 개인 노드는 자식이 둘, 키가 두 개인 노드는 자식이 셋입니다. 키가 `[2 4]`인 노드라면 첫 자식에는 2보다 작은 값, 둘째 자식에는 2와 4 사이의 값, 셋째 자식에는 4보다 큰 값이 있습니다. 이 글에서 `[2 4]([1] [3] [5 6])`은 키가 2, 4인 노드 아래에 세 자식 노드가 있다는 뜻입니다.

```text
          [2 4]
        /   |   \
     [1]   [3]  [5 6]
찾기 5: 4보다 크다 → 셋째 자식 [5 6]에서 찾음
```

**넣기는 항상 잎에서 시작합니다.** 넣을 값이 들어갈 잎까지 내려가 그 잎에 키를 끼웁니다. 잎의 키가 셋이 되면 가운데 키를 부모로 올리고, 남은 두 키를 각각 한 개짜리 노드로 나눕니다. 부모도 키가 셋이 되면 같은 일을 위에서 반복합니다. 뿌리가 나뉘면 새 뿌리가 생기며, 트리의 높이는 이때만 1 늘어납니다. 그래서 모든 잎이 늘 같은 깊이에 있습니다.

```text
부모 [4], 잎 [5 6]에 7을 넣음
잎이 [5 6 7]이 됨 → 가운데 6을 부모로 올림 → 부모 [4 6], 자식 [5]와 [7]
```

1부터 7까지 오름차순으로 넣으면 이렇게 됩니다. `나누기`는 그 호출에서 키가 셋이 된 노드를 나눈 횟수입니다.

<!--proof:two-three-inserts-->

```text
호출        나누기   2-3 트리 모양                    높이
insert(1)        0   [1]                                 1
insert(2)        0   [1 2]                               1
insert(3)        1   [2]([1] [3])                        2
insert(4)        0   [2]([1] [3 4])                      2
insert(5)        1   [2 4]([1] [3] [5])                  2
insert(6)        0   [2 4]([1] [3] [5 6])                2
insert(7)        2   [4]([2]([1] [3]) [6]([5] [7]))      3
```

`insert(3)`에서 잎 `[1 2 3]`이 넘쳐 2가 새 뿌리로 올라갔습니다. `insert(7)`에서는 잎 `[5 6 7]`을 나눠 6을 부모로 올리자 부모가 `[2 4 6]`이 되어 다시 나뉘었고, 4가 새 뿌리가 되었습니다. 오름차순으로 넣었는데도 잎 네 개가 모두 깊이 3에 있습니다.

**지우기는 잎의 키를 없애는 일로 바꿉니다.** 지울 키가 잎이 아닌 노드에 있으면 오른쪽 부분트리의 최솟값을 그 자리로 옮기고, 잎에서 그 최솟값을 지웁니다. 잎이 비면 부모를 사이에 두고 형제에게서 키를 빌리거나 형제와 합칩니다. 합치기로 부모가 비면 같은 일을 위에서 반복하고, 뿌리의 키가 모두 없어지면 그 아래 노드가 새 뿌리가 되어 높이가 1 줄어듭니다.

```text
빌리기: 형제의 키가 둘이면, 부모의 키를 빈 노드로 내리고 형제의 키 하나를 부모로 올린다
합치기: 형제의 키가 하나면, 부모의 키를 내려 형제와 한 노드로 합친다 → 부모의 키가 하나 줄어든다
```

<!--proof:two-three-deletes-->

```text
호출        반환값   빌리기·합치기   2-3 트리 모양          높이
delete(4)     true               2   [2 5]([1] [3] [6 7])      2
delete(1)     true               1   [5]([2 3] [6 7])          2
delete(2)     true               0   [5]([3] [6 7])            2
```

`delete(4)`는 뿌리의 4를 오른쪽 부분트리의 최솟값 5로 바꾸고 잎 `[5]`에서 5를 지웠습니다. 형제 `[7]`의 키가 하나뿐이어서 부모의 6을 내려 `[6 7]`로 합쳤고, 이번에는 6이 빠진 부모 노드가 비었습니다. 그 형제 `[2]`도 키가 하나뿐이어서 뿌리의 5를 내려 `[2 5]`로 합쳤습니다. 뿌리가 비었으므로 `[2 5]`가 새 뿌리가 되어 높이가 3에서 2로 줄었습니다. 아래 코드에서 `insertInto`는 나눈 결과를 부모에게 돌려주고, `fixChild`는 빈 자식을 빌리기나 합치기로 메웁니다.

```ts
type TwoThreeNode<T> = {
  values: T[];
  children: TwoThreeNode<T>[];
};

type Split<T> = {
  promoted: T;
  left: TwoThreeNode<T>;
  right: TwoThreeNode<T>;
};

export class TwoThreeTree<T> {
  private root: TwoThreeNode<T> | null = null;
  private readonly compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    if (this.root === null) {
      this.root = { values: [item], children: [] };
      return;
    }
    const split = this.insertInto(this.root, item);
    if (split !== null) {
      this.root = { values: [split.promoted], children: [split.left, split.right] };
    }
  }

  delete(item: T): boolean {
    const root = this.root;
    if (root === null || !this.removeFrom(root, item)) return false;
    if (root.values.length === 0) {
      this.root = root.children.length === 0 ? null : (root.children[0] as TwoThreeNode<T>);
    }
    return true;
  }

  has(item: T): boolean {
    let at = this.root;
    while (at !== null) {
      const seek = this.seek(at, item);
      if (seek.hit) return true;
      if (at.children.length === 0) return false;
      at = at.children[seek.at] as TwoThreeNode<T>;
    }
    return false;
  }

  min(): T | null {
    let at = this.root;
    if (at === null) return null;
    while (at.children.length > 0) at = at.children[0] as TwoThreeNode<T>;
    return at.values[0] as T;
  }

  max(): T | null {
    let at = this.root;
    if (at === null) return null;
    while (at.children.length > 0) at = at.children[at.children.length - 1] as TwoThreeNode<T>;
    return at.values[at.values.length - 1] as T;
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.root !== null && this.compare(low, high) <= 0) {
      this.collect(this.root, low, high, out);
    }
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    if (this.root !== null) this.inOrder(this.root, out);
    return out;
  }

  private seek(node: TwoThreeNode<T>, item: T): { hit: boolean; at: number } {
    for (let i = 0; i < node.values.length; i++) {
      const cmp = this.compare(item, node.values[i] as T);
      if (cmp === 0) return { hit: true, at: i };
      if (cmp < 0) return { hit: false, at: i };
    }
    return { hit: false, at: node.values.length };
  }

  private insertInto(node: TwoThreeNode<T>, item: T): Split<T> | null {
    const seek = this.seek(node, item);
    if (seek.hit) return null;
    if (node.children.length === 0) {
      node.values.splice(seek.at, 0, item);
    } else {
      const split = this.insertInto(node.children[seek.at] as TwoThreeNode<T>, item);
      if (split === null) return null;
      node.values.splice(seek.at, 0, split.promoted);
      node.children.splice(seek.at, 1, split.left, split.right);
    }
    if (node.values.length <= 2) return null;
    return {
      promoted: node.values[1] as T,
      left: { values: [node.values[0] as T], children: node.children.slice(0, 2) },
      right: { values: [node.values[2] as T], children: node.children.slice(2, 4) },
    };
  }

  private removeFrom(node: TwoThreeNode<T>, item: T): boolean {
    const seek = this.seek(node, item);
    if (node.children.length === 0) {
      if (!seek.hit) return false;
      node.values.splice(seek.at, 1);
      return true;
    }
    if (seek.hit) {
      const right = node.children[seek.at + 1] as TwoThreeNode<T>;
      const successor = this.minValue(right);
      node.values[seek.at] = successor;
      this.removeFrom(right, successor);
      this.fixChild(node, seek.at + 1);
      return true;
    }
    const removed = this.removeFrom(node.children[seek.at] as TwoThreeNode<T>, item);
    if (removed) this.fixChild(node, seek.at);
    return removed;
  }

  private minValue(from: TwoThreeNode<T>): T {
    let at = from;
    while (at.children.length > 0) at = at.children[0] as TwoThreeNode<T>;
    return at.values[0] as T;
  }

  private fixChild(parent: TwoThreeNode<T>, at: number): void {
    const child = parent.children[at] as TwoThreeNode<T>;
    if (child.values.length > 0) return;
    const left = at > 0 ? (parent.children[at - 1] as TwoThreeNode<T>) : null;
    const right = at + 1 < parent.children.length ? (parent.children[at + 1] as TwoThreeNode<T>) : null;

    if (left !== null && left.values.length === 2) {
      child.values.unshift(parent.values[at - 1] as T);
      parent.values[at - 1] = left.values.pop() as T;
      const moved = left.children.pop();
      if (moved !== undefined) child.children.unshift(moved);
      return;
    }
    if (right !== null && right.values.length === 2) {
      child.values.push(parent.values[at] as T);
      parent.values[at] = right.values.shift() as T;
      const moved = right.children.shift();
      if (moved !== undefined) child.children.push(moved);
      return;
    }
    if (left !== null) {
      left.values.push(parent.values[at - 1] as T);
      left.children.push(...child.children);
      parent.values.splice(at - 1, 1);
      parent.children.splice(at, 1);
      return;
    }
    if (right !== null) {
      child.values.push(parent.values[at] as T, ...right.values);
      child.children.push(...right.children);
      parent.values.splice(at, 1);
      parent.children.splice(at + 1, 1);
    }
  }

  private collect(node: TwoThreeNode<T>, low: T, high: T, out: T[]): void {
    const leaf = node.children.length === 0;
    for (let i = 0; i <= node.values.length; i++) {
      if (!leaf) {
        const aboveLow = i === 0 || this.compare(high, node.values[i - 1] as T) > 0;
        const belowHigh = i === node.values.length || this.compare(low, node.values[i] as T) < 0;
        if (aboveLow && belowHigh) this.collect(node.children[i] as TwoThreeNode<T>, low, high, out);
      }
      if (i === node.values.length) break;
      const value = node.values[i] as T;
      if (this.compare(value, low) >= 0 && this.compare(value, high) <= 0) out.push(value);
    }
  }

  private inOrder(node: TwoThreeNode<T>, out: T[]): void {
    const leaf = node.children.length === 0;
    for (let i = 0; i <= node.values.length; i++) {
      if (!leaf) this.inOrder(node.children[i] as TwoThreeNode<T>, out);
      if (i < node.values.length) out.push(node.values[i] as T);
    }
  }
}
```

`fixChild`에서 빌리기의 두 줄은 순서가 중요합니다. 부모의 키를 먼저 빈 노드로 내리고 나서 형제의 키를 부모로 올려야 세 노드의 순서가 유지됩니다. 순서를 바꾸면 형제의 키가 부모와 자식 양쪽에 남습니다.

#### 2-1. AVL 트리 — 두 부분트리의 높이 차를 1 이하로 유지한다

AVL 트리는 노드에 키를 하나만 담는 이진 탐색 트리입니다. 대신 각 노드에 **그 노드를 뿌리로 하는 부분트리의 높이** `height`를 저장하고, 모든 노드에서 왼쪽과 오른쪽 부분트리의 높이 차가 1 이하가 되도록 유지합니다. 넣기와 지우기는 먼저 보통의 이진 탐색 트리처럼 처리한 뒤, 바뀐 자리에서 뿌리로 돌아오는 경로의 노드마다 `height`를 다시 계산하고 높이 차가 2가 된 노드를 **회전**으로 고칩니다.

```text
오른쪽 회전 전        오른쪽 회전 후
      c                   b
     /                   / \
    b                   a   c
   /
  a
중위 순서 a b c는 그대로이고, 높이는 3에서 2로 줄어듭니다.
```

회전은 부모와 자식의 위아래를 바꾸되 중위 순서는 그대로 두는 연산입니다. 높이 차가 2인 노드에서 무거운 쪽 자식이 같은 방향으로 기울었다면 회전 한 번으로 됩니다. 반대로 기울었다면(왼쪽이 무거운데 왼쪽 자식의 오른쪽이 더 높다면) 자식을 먼저 반대 방향으로 회전한 뒤 부모를 회전합니다. 1부터 7까지 오름차순으로 넣으면 이렇게 됩니다.

<!--proof:avl-inserts-->

```text
호출        회전   AVL 트리 모양      뿌리의 높이
insert(1)      0   1                            1
insert(2)      0   1(· 2)                       2
insert(3)      1   2(1 3)                       2
insert(4)      0   2(1 3(· 4))                  3
insert(5)      1   2(1 4(3 5))                  3
insert(6)      1   4(2(1 3) 5(· 6))             3
insert(7)      1   4(2(1 3) 6(5 7))             3
```

`insert(3)`에서 뿌리 1의 오른쪽 높이가 2, 왼쪽이 0이 되어 1을 왼쪽으로 회전했습니다. `insert(6)`에서는 뿌리 2의 오른쪽 부분트리가 높이 3이 되어 뿌리를 왼쪽으로 회전했고, 4가 새 뿌리가 되었습니다. 2-3 트리와 같은 입력에서 최종 높이도 3입니다.

지우기도 같은 방식입니다. 자식이 둘인 노드를 지울 때는 오른쪽 부분트리의 최솟값을 그 노드의 값으로 옮기고, 최솟값이 있던 노드를 떼어 냅니다. 그다음 떼어 낸 자리에서 뿌리까지 돌아오며 높이를 고칩니다. 넣기와 달리 **지우기는 경로의 여러 노드에서 회전이 필요할 수 있습니다.** 한 노드를 회전해 부분트리의 높이가 1 줄면, 그 위 노드에서 새로 높이 차가 2가 될 수 있기 때문입니다. 아래 코드의 `rebalance`가 높이 계산과 회전을 맡고, 넣기·지우기·최솟값 떼기가 모두 되돌아오는 길에 이 함수를 부릅니다.

```ts
type AvlNode<T> = {
  value: T;
  height: number;
  left: AvlNode<T> | null;
  right: AvlNode<T> | null;
};

export class AVLTree<T> {
  private root: AvlNode<T> | null = null;
  private count = 0;
  private readonly compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(item: T): void {
    this.root = this.insertInto(this.root, item);
  }

  delete(item: T): boolean {
    const before = this.count;
    this.root = this.deleteFrom(this.root, item);
    return this.count < before;
  }

  has(item: T): boolean {
    let at = this.root;
    while (at !== null) {
      const cmp = this.compare(item, at.value);
      if (cmp === 0) return true;
      at = cmp < 0 ? at.left : at.right;
    }
    return false;
  }

  min(): T | null {
    let at = this.root;
    if (at === null) return null;
    while (at.left !== null) at = at.left;
    return at.value;
  }

  max(): T | null {
    let at = this.root;
    if (at === null) return null;
    while (at.right !== null) at = at.right;
    return at.value;
  }

  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.compare(low, high) <= 0) this.collect(this.root, low, high, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.inOrder(this.root, out);
    return out;
  }

  private insertInto(node: AvlNode<T> | null, item: T): AvlNode<T> {
    if (node === null) {
      this.count += 1;
      return { value: item, height: 1, left: null, right: null };
    }
    const cmp = this.compare(item, node.value);
    if (cmp === 0) return node;
    if (cmp < 0) node.left = this.insertInto(node.left, item);
    else node.right = this.insertInto(node.right, item);
    return this.rebalance(node);
  }

  private deleteFrom(node: AvlNode<T> | null, item: T): AvlNode<T> | null {
    if (node === null) return null;
    const cmp = this.compare(item, node.value);
    if (cmp < 0) {
      node.left = this.deleteFrom(node.left, item);
    } else if (cmp > 0) {
      node.right = this.deleteFrom(node.right, item);
    } else {
      this.count -= 1;
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;
      const taken = this.detachMin(node.right);
      node.value = taken.min;
      node.right = taken.rest;
    }
    return this.rebalance(node);
  }

  private detachMin(node: AvlNode<T>): { min: T; rest: AvlNode<T> | null } {
    if (node.left === null) return { min: node.value, rest: node.right };
    const taken = this.detachMin(node.left);
    node.left = taken.rest;
    return { min: taken.min, rest: this.rebalance(node) };
  }

  private collect(node: AvlNode<T> | null, low: T, high: T, out: T[]): void {
    if (node === null) return;
    const vsLow = this.compare(node.value, low);
    const vsHigh = this.compare(node.value, high);
    if (vsLow > 0) this.collect(node.left, low, high, out);
    if (vsLow >= 0 && vsHigh <= 0) out.push(node.value);
    if (vsHigh < 0) this.collect(node.right, low, high, out);
  }

  private inOrder(node: AvlNode<T> | null, out: T[]): void {
    if (node === null) return;
    this.inOrder(node.left, out);
    out.push(node.value);
    this.inOrder(node.right, out);
  }

  private heightOf(node: AvlNode<T> | null): number {
    return node === null ? 0 : node.height;
  }

  private refreshHeight(node: AvlNode<T>): void {
    node.height = 1 + Math.max(this.heightOf(node.left), this.heightOf(node.right));
  }

  private rebalance(node: AvlNode<T>): AvlNode<T> {
    this.refreshHeight(node);
    const slant = this.heightOf(node.left) - this.heightOf(node.right);
    if (slant > 1 && node.left !== null) {
      const leftSlant = this.heightOf(node.left.left) - this.heightOf(node.left.right);
      if (leftSlant < 0) node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    if (slant < -1 && node.right !== null) {
      const rightSlant = this.heightOf(node.right.left) - this.heightOf(node.right.right);
      if (rightSlant > 0) node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }
    return node;
  }

  private rotateLeft(pivot: AvlNode<T>): AvlNode<T> {
    const risen = pivot.right;
    if (risen === null) return pivot;
    pivot.right = risen.left;
    risen.left = pivot;
    this.refreshHeight(pivot);
    this.refreshHeight(risen);
    return risen;
  }

  private rotateRight(pivot: AvlNode<T>): AvlNode<T> {
    const risen = pivot.left;
    if (risen === null) return pivot;
    pivot.left = risen.right;
    risen.right = pivot;
    this.refreshHeight(pivot);
    this.refreshHeight(risen);
    return risen;
  }
}
```

회전 함수는 두 노드의 높이를 **아래 노드부터** 다시 계산합니다. 회전 뒤에는 `pivot`이 `risen`의 자식이 되므로, `risen`의 높이는 새로 계산한 `pivot`의 높이를 사용해야 합니다. `count`는 `delete`가 실제로 원소를 지웠는지 알기 위한 값이며, 계약의 연산이 아닙니다.

#### 3-1. 레드블랙 트리 — 2-3-4 트리의 노드를 빨간 연결로 풀어 쓴다

레드블랙 트리도 노드에 키를 하나만 담는 이진 탐색 트리입니다. 노드마다 빨강 또는 검정을 기록하고 다음 세 규칙을 지킵니다.

```text
1. 뿌리는 검은색이다.
2. 빨간 노드의 자식은 검은색이다. 즉 빨간 노드가 부모와 자식으로 연달아 오지 않는다.
3. 어느 노드에서 출발하든, 그 아래 빈 자리까지 내려가는 모든 경로에 검은 노드 수가 같다.
```

이 규칙은 2-3 트리를 조금 넓힌 **2-3-4 트리**에서 나옵니다. 2-3-4 트리는 노드에 키를 셋까지 담고, 2-3 트리처럼 모든 잎이 같은 깊이에 있습니다. 이 노드를 이진 노드로 풀어 쓰면 **검은 노드 하나가 2-3-4 트리 노드 하나**이고, **빨간 노드는 검은 부모와 같은 2-3-4 노드에 들어 있는 키**입니다.

```text
2-3-4 노드 [5 6 7]          →  이진 노드로 풀어 쓰기     6(검정)
                                                       /    \
                                                   5(빨강)  7(빨강)
2-3-4 노드 [2 4]            →  4를 빨간 자식으로       2(검정)
                                                           \
                                                          4(빨강)
```

이렇게 보면 규칙이 자연스럽게 이어집니다. 빨간 노드는 검은 부모의 노드에 속하므로 빨간 노드끼리 연달아 올 이유가 없습니다(규칙 2). 2-3-4 트리의 모든 잎이 같은 깊이라는 사실은, 뿌리에서 빈 자리까지 모든 경로가 같은 수의 검은 노드를 지난다는 규칙 3이 됩니다. 이 프로젝트의 레드블랙 트리에 1부터 7까지 오름차순으로 넣고, 매번 검은 노드와 그 빨간 자식을 한 노드로 묶어 읽어 봅니다. `20B(10B 40R)`처럼 값 뒤의 `B`는 검정, `R`은 빨강이고 `·`는 빈 자리입니다.

<!--proof:rb-as-234-->

```text
호출        레드블랙 트리 모양        검은 노드와 빨간 자식을 묶어 읽은 모양
insert(1)   1B                        [1]
insert(2)   1B(· 2R)                  [1 2]
insert(3)   2B(1R 3R)                 [1 2 3]
insert(4)   2B(1B 3B(· 4R))           [2]([1] [3 4])
insert(5)   2B(1B 4B(3R 5R))          [2]([1] [3 4 5])
insert(6)   2B(1B 4R(3B 5B(· 6R)))    [2 4]([1] [3] [5 6])
insert(7)   2B(1B 4R(3B 6B(5R 7R)))   [2 4]([1] [3] [5 6 7])
```

`insert(7)` 뒤의 레드블랙 트리를 묶어 읽으면 `[2 4]([1] [3] [5 6 7])`입니다. 모든 잎이 깊이 2에 있고, 뿌리에서 빈 자리까지의 모든 경로가 검은 노드를 두 개씩 지납니다. 같은 입력의 2-3 트리 `[4]([2]([1] [3]) [6]([5] [7]))`와 모양이 다른 이유는 2-3-4 노드가 키를 셋까지 담아 늦게 나뉘기 때문입니다.

**새 노드는 빨간색으로 넣습니다.** 2-3-4 트리에서는 새 키가 기존 노드에 들어가므로 새 깊이가 생기지 않습니다. 빨간 노드는 검은 노드 수를 바꾸지 않으므로 규칙 3이 그대로 유지되고, 확인할 것은 부모도 빨간색이어서 규칙 2가 깨졌는지 하나뿐입니다. 부모가 빨갛다면 부모의 형제, 즉 **삼촌**의 색으로 경우가 나뉩니다.

```text
삼촌이 빨갛다   = 키가 셋인 2-3-4 노드에 키가 하나 더 들어가 넘친 상태
                → 부모와 삼촌을 검게, 조부모를 빨갛게 바꾼다. 가운데 키인 조부모가 위 노드로 올라간 것과 같다.
                → 조부모와 그 부모가 다시 연달아 빨갈 수 있으므로 조부모에서 같은 확인을 반복한다.
삼촌이 검다     = 키가 둘인 노드에 키가 들어가 셋이 된 상태
                → 새 키, 부모, 조부모 중 가운데 값이 검은색 위에 오도록 회전하고 색을 바꾼다. 여기서 끝난다.
                → 새 노드가 부모의 안쪽 자식이면, 부모를 먼저 회전해 바깥쪽 자식 모양으로 만든다.
```

#### 짚고 가기 — 레드블랙 트리에 새 노드를 검게 넣으면 고칠 일이 없어 보인다

새 노드를 빨갛게 넣으면 빨간 노드가 연달아 올 수 있어 고치는 코드가 필요했습니다. 처음부터 검게 넣으면 규칙 2가 깨질 일이 없으니 더 간단해 보입니다. 참조 구현의 한 줄만 바꿔 확인해 봅니다.

```ts
color: "black", // 참조 구현은 "red"
```

<!--proof:black-insert-->

```text
넣은 값   무엇                      빨간색으로 넣는 코드   검은색으로 넣는 코드       판정
1~7       toArray()                 1부터 7까지            1부터 7까지                같다
—         높이                      4                      7                      어긋난다
—         넣기 전체가 지나간 노드   37                     35                     어긋난다
1~1,023   toArray()                 1부터 1,023까지        1부터 1,023까지            같다
—         높이                      18                     1,023                  어긋난다
—         넣기 전체가 지나간 노드   19,933                 524,799                어긋난다
```

넣기만 할 때는 `toArray()` 결과가 같습니다. 새 노드를 붙이는 자리는 색과 관계없이 비교로 정해지기 때문입니다. 하지만 높이는 원소 수와 같아졌습니다. 부모가 빨간 경우가 한 번도 생기지 않아 고치는 코드가 실행되지 않았고, 트리가 균형 없는 이진 탐색 트리와 같아졌습니다. 원소가 7개일 때는 고치는 일이 없어 오히려 적은 노드를 지나지만, 1,023개를 넣으면 지나간 노드가 19,933에서 524,799로 늘어납니다.

```text
검게 넣으면   새 노드를 지나는 경로만 검은 노드가 하나 늘어 규칙 3이 깨진다 → 부모의 색만 보는 고치기 코드로는 찾을 수 없다
빨갛게 넣으면 검은 노드 수는 그대로이고 규칙 2만 깨질 수 있다           → 새 노드에서 뿌리 쪽으로 올라가며 고친다
```

#### 3-2. 레드블랙 트리 — 검은 노드가 빠질 때만 고친다

지우기는 먼저 보통의 이진 탐색 트리처럼 처리합니다. 자식이 둘인 노드를 지울 때는 오른쪽 부분트리의 최솟값이 그 자리와 색을 이어받고, 실제로 트리에서 빠지는 것은 최솟값이 있던 노드입니다. 빨간 노드가 빠지면 어느 경로의 검은 노드 수도 바뀌지 않으므로 고칠 것이 없습니다. **검은 노드가 빠지면** 그 자리를 지나는 경로만 검은 노드가 하나 모자랍니다. 2-3-4 트리로 보면 노드 하나가 빈 상태이고, 2-3 트리의 빌리기·합치기와 같은 문제입니다. 모자란 자리의 형제 색을 봅니다.

```text
형제가 빨갛다          → 형제는 부모와 같은 2-3-4 노드의 키다. 부모를 회전해 실제 형제 노드가 옆에 오게 한 뒤 아래 경우로 간다.
형제의 두 자식이 검다   → 형제 노드에 여유 키가 없다. 형제를 빨갛게 바꿔 부모 쪽으로 합친다.
                          부모가 빨가면 부모를 검게 바꾸고 끝낸다. 부모도 검으면 부모에서 같은 확인을 반복한다.
형제의 자식 중 빨간 것이 있다 → 형제 노드에 여유 키가 있다. 회전으로 키 하나를 빌려 오고 끝낸다.
```

빈 자리를 `null`로 두면 "빈 자리의 부모"를 물을 수 없으므로, 아래 참조 구현은 값이 없는 검은 노드 하나(`#nil`)가 모든 빈 자리를 겸하게 합니다. 지운 뒤 고치기가 시작하는 자리가 바로 이 빈 자리일 수 있기 때문입니다.

#### 3-3. 레드블랙 트리 — 열아홉 번 호출로 모든 경우 지나기

이제 참조 구현으로 호출 열아홉 번을 실행합니다. 넣기 뒤 고치기의 세 경우와 지우기 뒤 고치기의 네 경우가 모두 나오도록 넣기와 지우기의 값을 골랐고, 빈 트리 조회·중복 넣기·없는 값 지우기·거꾸로 된 구간도 포함했습니다. 마지막 호출은 `toArray()`이며 **`[30, 40, 50, 90]`을 반환합니다.**
<!--result:walk=[30,40,50,90]-->

<!--viz:walk-->

```ascii
시작: 빈 트리, max() → null
insert(10), insert(90), insert(20) → 20B(10R 90R)
insert(30), insert(40), insert(50) → 20B(10B 40R(30B 90B(50R ·)))
insert(30) → 이미 있으므로 모양이 그대로
has(40) → true, has(35) → false
range(25, 55) → [30, 40, 50], range(50, 20) → []
delete(20) → true, 30B(10B 50R(40B 90B))
delete(10) → true, delete(35) → false, 50B(30B(· 40R) 90B)
min() → 30, max() → 90
toArray() → [30, 40, 50, 90]
```

호출마다 반환값과 호출이 끝난 뒤의 모양입니다.

<!--proof:walk-table-->

```text
단계   호출                         반환값             호출 뒤 모양                   높이
T1     new RedBlackTree<number>()   —                  ·                                 0
T2     max()                        null               ·                                 0
T3     insert(10)                   —                  10B                               1
T4     insert(90)                   —                  10B(· 90R)                        2
T5     insert(20)                   —                  20B(10R 90R)                      2
T6     insert(30)                   —                  20B(10B 90B(30R ·))               3
T7     insert(40)                   —                  20B(10B 40B(30R 90R))             3
T8     insert(50)                   —                  20B(10B 40R(30B 90B(50R ·)))      4
T9     insert(30)                   —                  20B(10B 40R(30B 90B(50R ·)))      4
T10    has(40)                      true               20B(10B 40R(30B 90B(50R ·)))      4
T11    has(35)                      false              20B(10B 40R(30B 90B(50R ·)))      4
T12    range(25, 55)                [30, 40, 50]       20B(10B 40R(30B 90B(50R ·)))      4
T13    range(50, 20)                []                 20B(10B 40R(30B 90B(50R ·)))      4
T14    delete(20)                   true               30B(10B 50R(40B 90B))             3
T15    delete(10)                   true               50B(30B(· 40R) 90B)               3
T16    delete(35)                   false              50B(30B(· 40R) 90B)               3
T17    min()                        30                 50B(30B(· 40R) 90B)               3
T18    max()                        90                 50B(30B(· 40R) 90B)               3
T19    toArray()                    [30, 40, 50, 90]   50B(30B(· 40R) 90B)               3
```

모양을 고친 호출에서 실제로 한 일입니다.

<!--proof:walk-fixes-->

```text
단계   한 일
T5     새 노드가 부모의 안쪽 자식이므로 부모 90을 오른쪽으로 먼저 회전합니다
—      20을 검게, 10을 빨갛게 바꾸고 10을 왼쪽으로 회전합니다
T6     부모 90과 삼촌 10이 모두 빨간색이므로 둘을 검게, 조부모 20을 빨갛게 바꿉니다
—      뿌리 20이 빨간색이 되었으므로 다시 검게 칠합니다
T7     새 노드가 부모의 안쪽 자식이므로 부모 30을 왼쪽으로 먼저 회전합니다
—      40을 검게, 90을 빨갛게 바꾸고 90을 오른쪽으로 회전합니다
T8     부모 90과 삼촌 30이 모두 빨간색이므로 둘을 검게, 조부모 40을 빨갛게 바꿉니다
T9     30이 이미 있으므로 트리를 바꾸지 않습니다
T14    자식이 둘이므로 오른쪽 부분트리의 최솟값 30이 20의 자리와 색을 잇습니다
—      먼 조카가 검은색이고 가까운 조카 50이 빨간색이므로 50을 검게, 형제 90을 빨갛게 바꾸고 형제를 오른쪽으로 회전합니다
—      형제 50이 부모의 색을 받고, 부모 40과 먼 조카를 검게 바꾼 뒤 부모를 왼쪽으로 회전하고 끝냅니다
T15    자식이 없는 10을 떼어 냅니다
—      형제 50이 빨간색이므로 50을 검게, 부모 30을 빨갛게 바꾸고 부모를 왼쪽으로 회전합니다
—      형제 40의 두 자식이 모두 검은색이므로 40을 빨갛게 바꾸고 부모 30에서 다시 확인합니다
—      30이 빨간색이므로 검게 바꾸고 끝냅니다
T16    35가 없으므로 false를 반환합니다
```

T5의 `insert(20)`은 삼촌이 빈 자리 노드여서 검은색이고 20이 부모 90의 안쪽 자식이어서, 90을 먼저 회전한 뒤 10을 회전했습니다. T6의 `insert(30)`은 삼촌 10이 빨간색이라 회전 없이 색만 바꿨고, 빨갛게 바뀐 20이 뿌리여서 다시 검게 칠해졌습니다. T14의 `delete(20)`은 20의 자리를 오른쪽 최솟값 30이 이었고, 30이 있던 자리의 검은 노드가 모자라 형제 쪽에서 빌려 왔습니다. T15의 `delete(10)`은 형제가 빨간색이라 먼저 회전한 뒤 새 형제 40을 빨갛게 바꿔 합쳤고, 부모 30이 빨간색이어서 검게 바꾸고 끝났습니다.

<!--proof:simulation-->

```text
시뮬레이션 19단계: 호출·반환값·모양·설명이 참조 구현 실행과 일치
마지막 반환값: [30, 40, 50, 90]
최종 모양: 50B(30B(· 40R) 90B)
```

#### 레드블랙 트리 전체 코드

`#fixInsert`는 삼촌이 빨간 경우에만 반복하고 회전하는 경우는 반복하지 않습니다. `#fixDelete`는 형제를 빨갛게 바꿔 합치는 경우에만 한 층 위로 올라가고, 나머지 경우는 회전 뒤 끝냅니다. 두 함수 모두 값을 옮기지 않고 색과 연결만 바꿉니다.

```ts guide-core=src/data-structures/tree/redBlackTree/_reference/redBlackTree.ts
type Color = "red" | "black";

/**
 * 트리의 자리 하나.
 *
 * 잎 바깥에도 노드가 있다 — 색이 검고 값이 없는 감시 노드 하나가 그 모든 자리를 겸한다.
 * 그래서 `left`·`right`·`parent` 가 `null` 이 되지 않고, 지우기 뒤처리가 "빈 자리의
 * 부모"를 물을 수 있다.
 */
interface Node<T> {
  value: T;
  color: Color;
  left: Node<T>;
  right: Node<T>;
  parent: Node<T>;
}

export class RedBlackTree<T> {
  /** 잎 바깥의 모든 자리를 겸하는 검은 노드. 값은 읽지 않는다. */
  readonly #nil: Node<T>;
  #root: Node<T>;
  readonly #compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const nil = {
      value: undefined as unknown as T,
      color: "black",
    } as Node<T>;
    nil.left = nil;
    nil.right = nil;
    nil.parent = nil;
    this.#nil = nil;
    this.#root = nil;
  }

  insert(item: T): void {
    let parent = this.#nil;
    let at = this.#root;
    while (at !== this.#nil) {
      parent = at;
      const cmp = this.#compare(item, at.value);
      // 동등한 원소가 이미 있으면 상태를 바꾸지 않는다. 집합이므로 두 벌 담지 않는다.
      if (cmp === 0) return;
      at = cmp < 0 ? at.left : at.right;
    }

    const node: Node<T> = {
      value: item,
      color: "red",
      left: this.#nil,
      right: this.#nil,
      parent,
    };
    if (parent === this.#nil) this.#root = node;
    else if (this.#compare(item, parent.value) < 0) parent.left = node;
    else parent.right = node;

    this.#fixInsert(node);
  }

  delete(item: T): boolean {
    const target = this.#find(item);
    if (target === this.#nil) return false;

    let removed = target;
    let removedColor = removed.color;
    let orphan: Node<T>;

    if (target.left === this.#nil) {
      orphan = target.right;
      this.#replace(target, target.right);
    } else if (target.right === this.#nil) {
      orphan = target.left;
      this.#replace(target, target.left);
    } else {
      // 두 자식이 다 있으면 오른쪽 부분트리의 최솟값이 이 자리를 이어받는다.
      removed = this.#leftmost(target.right);
      removedColor = removed.color;
      orphan = removed.right;
      if (removed.parent === target) {
        orphan.parent = removed;
      } else {
        this.#replace(removed, removed.right);
        removed.right = target.right;
        removed.right.parent = removed;
      }
      this.#replace(target, removed);
      removed.left = target.left;
      removed.left.parent = removed;
      removed.color = target.color;
    }

    // 빨간 자리가 빠지면 경로마다의 검은 수가 그대로다. 검은 자리가 빠졌을 때만 고친다.
    if (removedColor === "black") this.#fixDelete(orphan);
    return true;
  }

  has(item: T): boolean {
    return this.#find(item) !== this.#nil;
  }

  min(): T | null {
    if (this.#root === this.#nil) return null;
    return this.#leftmost(this.#root).value;
  }

  max(): T | null {
    if (this.#root === this.#nil) return null;
    let at = this.#root;
    while (at.right !== this.#nil) {
      at = at.right;
    }
    return at.value;
  }

  /**
   * 구간에 드는 원소만 모은다.
   *
   * 양쪽으로 다 내려가지 않는 것이 상한을 지키는 자리다 — 지금 값이 `low` 이하면 왼쪽에
   * 구간에 드는 것이 없고, `high` 이상이면 오른쪽에 없다. 그래서 걸음 수가 **내려간 길
   * 둘과 담은 원소 수**의 합에 묶인다.
   */
  range(low: T, high: T): T[] {
    const out: T[] = [];
    if (this.#compare(low, high) > 0) return out;
    this.#collect(this.#root, low, high, out);
    return out;
  }

  toArray(): T[] {
    const out: T[] = [];
    this.#inOrder(this.#root, out);
    return out;
  }

  #find(item: T): Node<T> {
    let at = this.#root;
    while (at !== this.#nil) {
      const cmp = this.#compare(item, at.value);
      if (cmp === 0) return at;
      at = cmp < 0 ? at.left : at.right;
    }
    return this.#nil;
  }

  #leftmost(from: Node<T>): Node<T> {
    let at = from;
    while (at.left !== this.#nil) {
      at = at.left;
    }
    return at;
  }

  #collect(node: Node<T>, low: T, high: T, out: T[]): void {
    if (node === this.#nil) return;
    const vsLow = this.#compare(node.value, low);
    const vsHigh = this.#compare(node.value, high);
    if (vsLow > 0) this.#collect(node.left, low, high, out);
    if (vsLow >= 0 && vsHigh <= 0) out.push(node.value);
    if (vsHigh < 0) this.#collect(node.right, low, high, out);
  }

  #inOrder(node: Node<T>, out: T[]): void {
    if (node === this.#nil) return;
    this.#inOrder(node.left, out);
    out.push(node.value);
    this.#inOrder(node.right, out);
  }

  /** `target` 이 있던 자리에 `replacement` 를 건다. 자식은 옮기지 않는다. */
  #replace(target: Node<T>, replacement: Node<T>): void {
    if (target.parent === this.#nil) this.#root = replacement;
    else if (target === target.parent.left) target.parent.left = replacement;
    else target.parent.right = replacement;
    replacement.parent = target.parent;
  }

  #rotateLeft(pivot: Node<T>): void {
    const risen = pivot.right;
    pivot.right = risen.left;
    if (risen.left !== this.#nil) risen.left.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.#nil) this.#root = risen;
    else if (pivot === pivot.parent.left) pivot.parent.left = risen;
    else pivot.parent.right = risen;
    risen.left = pivot;
    pivot.parent = risen;
  }

  #rotateRight(pivot: Node<T>): void {
    const risen = pivot.left;
    pivot.left = risen.right;
    if (risen.right !== this.#nil) risen.right.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.#nil) this.#root = risen;
    else if (pivot === pivot.parent.right) pivot.parent.right = risen;
    else pivot.parent.left = risen;
    risen.right = pivot;
    pivot.parent = risen;
  }

  /**
   * 넣은 뒤 고치기.
   *
   * 새 자리는 빨갛게 넣으므로 경로마다의 검은 수는 그대로이고, 어긋날 수 있는 것은
   * 「빨강이 연달아 오지 않는다」 하나뿐이다. 삼촌이 빨가면 색만 위로 옮기고, 검으면
   * 한두 번 회전하고 끝낸다 — **색을 옮기는 쪽만 반복되고 회전하는 쪽은 반복되지 않는다.**
   */
  #fixInsert(start: Node<T>): void {
    let node = start;
    while (node.parent.color === "red") {
      const parent = node.parent;
      const grand = parent.parent;
      const parentIsLeft = parent === grand.left;
      const uncle = parentIsLeft ? grand.right : grand.left;

      if (uncle.color === "red") {
        parent.color = "black";
        uncle.color = "black";
        grand.color = "red";
        node = grand;
        continue;
      }

      let at = node;
      if (parentIsLeft ? at === parent.right : at === parent.left) {
        at = parent;
        if (parentIsLeft) this.#rotateLeft(at);
        else this.#rotateRight(at);
      }
      at.parent.color = "black";
      at.parent.parent.color = "red";
      if (parentIsLeft) this.#rotateRight(at.parent.parent);
      else this.#rotateLeft(at.parent.parent);
      node = at;
    }
    this.#root.color = "black";
  }

  /**
   * 지운 뒤 고치기.
   *
   * 검은 자리가 빠졌으므로 그 아래 경로 하나가 검은 수를 한 개 덜 갖는다. 형제의 색과
   * 형제 자식들의 색을 보고 **모자란 검정을 위로 옮기거나** 한 번 회전해서 그 자리에서
   * 메운다. 메우면 끝이고, 옮기면 한 층 위에서 같은 물음을 다시 묻는다.
   */
  #fixDelete(start: Node<T>): void {
    let node = start;
    while (node !== this.#root && node.color === "black") {
      const isLeft = node === node.parent.left;
      let sibling = isLeft ? node.parent.right : node.parent.left;

      if (sibling.color === "red") {
        sibling.color = "black";
        node.parent.color = "red";
        if (isLeft) this.#rotateLeft(node.parent);
        else this.#rotateRight(node.parent);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }

      const near = isLeft ? sibling.left : sibling.right;
      const far = isLeft ? sibling.right : sibling.left;

      if (near.color === "black" && far.color === "black") {
        // 형제 쪽에서도 검정을 하나 떼어 위로 올린다. 물음이 한 층 위로 간다.
        sibling.color = "red";
        node = node.parent;
        continue;
      }

      if (far.color === "black") {
        near.color = "black";
        sibling.color = "red";
        if (isLeft) this.#rotateRight(sibling);
        else this.#rotateLeft(sibling);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }

      sibling.color = node.parent.color;
      node.parent.color = "black";
      if (isLeft) {
        sibling.right.color = "black";
        this.#rotateLeft(node.parent);
      } else {
        sibling.left.color = "black";
        this.#rotateRight(node.parent);
      }
      node = this.#root;
    }
    node.color = "black";
  }
}
```

이 코드는 [참조 구현](./_reference/redBlackTree.ts)에서 계측 코드만 제외한 것입니다. 정렬 집합을 구현하는 한 가지 방법이며, 다른 두 구현도 같은 연산 의미와 비용 요구를 만족합니다.

## 파트 2 — 높이 상한, 순서 보존, 비용, 선택 기준

### 수식 정의와 유도

세 구현의 높이 상한은 **높이가 h인 트리가 최소 몇 개의 원소를 담아야 하는가**를 계산해 얻습니다. 원소 수 n이 그 최솟값보다 적으면 그 높이가 될 수 없기 때문입니다. 높이는 뿌리에서 가장 깊은 노드까지 지나는 노드 수로 세고, 빈 트리의 높이는 0입니다.

**2-3 트리**의 가장 적은 원소 수는 모든 노드가 키를 하나씩 담을 때입니다. 모든 잎의 깊이가 같으므로 높이 h인 트리는 완전 이진 트리 모양이 되고, 원소는 `2^h - 1`개입니다. 따라서 `n ≥ 2^h - 1`이고 `h ≤ log₂(n + 1)`입니다.

```text
높이 3이고 키가 모두 하나인 2-3 트리          [4]
                                        [2]       [6]
                                      [1] [3]   [5] [7]      원소 7 = 2^3 - 1
```

**AVL 트리**에서 높이 h인 트리의 최소 원소 수를 `N(h)`라고 합시다. 뿌리 하나와, 높이 차가 1 이하인 두 부분트리가 필요합니다. 원소를 가장 적게 쓰려면 한쪽은 높이 `h - 1`, 다른 쪽은 `h - 2`여야 하므로 `N(h) = N(h - 1) + N(h - 2) + 1`이고, `N(1) = 1`, `N(2) = 2`입니다. 이 수는 피보나치 수처럼 대략 1.618배씩 커지므로 높이는 약 `1.44·log₂ n` 이하입니다.

```text
N(3) = N(2) + N(1) + 1 = 2 + 1 + 1 = 4
N(4) = N(3) + N(2) + 1 = 4 + 2 + 1 = 7
N(5) = N(4) + N(3) + 1 = 7 + 4 + 1 = 12
```

**레드블랙 트리**에서는 뿌리에서 빈 자리까지 지나는 검은 노드 수를 b라고 합시다. 규칙 3에 따라 b는 모든 경로에서 같으므로, 빨간 노드를 모두 부모에 묶어 읽으면 모든 잎이 깊이 b에 있는 트리가 되고 원소는 적어도 `2^b - 1`개입니다. 가장 긴 경로에서도 뿌리는 검고 빨간 노드는 연달아 오지 않으므로 경로의 노드 수 h는 `2b` 이하이고, `b ≥ h / 2`입니다. 따라서 `n ≥ 2^(h/2) - 1`이고 `h ≤ 2·log₂(n + 1)`입니다.

```ts
const twoThreeMin = (h: number) => 2 ** h - 1;
const avlMin = (h: number): number => (h <= 2 ? h : avlMin(h - 1) + avlMin(h - 2) + 1);
const redBlackMin = (h: number) => 2 ** Math.ceil(h / 2) - 1; // 하한
```

<!--proof:min-nodes-->

```text
높이 h    2-3 트리   AVL 트리   레드블랙 트리 (하한)
1                1          1                      1
2                3          2                      1
3                7          4                      3
4               15          7                      3
5               31         12                      7
6               63         20                      7
10           1,023        143                     31
20       1,048,575     17,710                  1,023

원소 1,000,000개일 때 높이 상한 — 2-3 트리 19 · AVL 트리 28 · 레드블랙 트리 38
```

원소가 백만 개일 때 세 구현의 높이는 각각 19, 28, 38을 넘을 수 없습니다. 아래는 원소 1,023개와 65,535개를 실제로 넣어 본 높이입니다.

<!--proof:heights-->

```text
n        넣은 순서   2-3 트리   AVL 트리   레드블랙 트리   log₂(n+1)   2·log₂(n+1)
1,023    오름차순          10         10              18       10.00         20.00
1,023    무작위             8         12              13       10.00         20.00
65,535   오름차순          16         16              30       16.00         32.00
65,535   무작위            13         19              19       16.00         32.00
```

2-3 트리는 `log₂(n+1)` 열을, 레드블랙 트리는 `2·log₂(n+1)` 열을 넘지 않습니다. 오름차순 입력에서 레드블랙 트리의 높이는 `2·log₂(n + 1)`에 가깝고, 무작위 입력에서는 AVL 트리와 비슷합니다. 2-3 트리의 높이는 가장 낮지만 노드마다 키를 둘까지 비교하므로, 높이만으로 비교 횟수를 판단하면 안 됩니다.

### 불변식 — 저장 모양이 달라도 같은 정렬 집합으로 읽는 규칙

세 구현이 같은 결과를 내려면, 트리에 저장한 상태를 정렬 집합으로 읽는 규칙이 연산 뒤에도 유지되어야 합니다. 계약이 요구하는 것은 관측 결과 사이의 관계입니다. `has(x)`는 `x`가 `toArray()`에 있는지와 같고, `min()`과 `max()`는 `toArray()`의 첫 값·마지막 값과 같으며, `range(low, high)`는 `toArray()`에서 그 구간만 남긴 것과 같아야 합니다. 트리의 모양이나 색은 계약에 없으며, 아래 규칙은 각 구현이 그 관계를 지키는 방법입니다.

| 구현 | 저장 상태를 읽는 규칙 | 연산 뒤 확인할 것 |
| --- | --- | --- |
| 2-3 트리 | 노드 안의 키는 오름차순, i번째 자식의 키는 양옆 키 사이 | 나누기·빌리기·합치기 뒤에도 키의 좌우 관계가 같은지, 잎의 깊이가 같은지 |
| AVL 트리 | 왼쪽 부분트리는 더 작고 오른쪽은 더 큼 | 회전 뒤 중위 순서가 같은지, `height`가 실제 높이와 같은지 |
| 레드블랙 트리 | 왼쪽 부분트리는 더 작고 오른쪽은 더 큼 | 회전 뒤 중위 순서가 같은지, 색 규칙 셋이 성립하는지 |

2-3 트리의 나누기는 키 셋 중 가운데를 올리므로 양쪽 노드가 순서를 지키고, 빌리기와 합치기는 부모의 키를 사이에 두고 옮기므로 순서를 지킵니다. AVL 트리와 레드블랙 트리의 회전은 부모와 자식의 위아래만 바꾸고 중위 순서를 바꾸지 않으며, 색 바꾸기는 값과 연결을 건드리지 않습니다. 그래서 세 구현은 저장 모양이 달라도 중위 순회가 같은 오름차순 수열을 냅니다. 1부터 7까지 넣은 뒤 4, 1, 2를 지운 세 트리를 나란히 놓으면 이렇습니다.

<!--proof:three-deletes-->

```text
호출        2-3 트리               AVL 트리           레드블랙 트리
delete(4)   [2 5]([1] [3] [6 7])   5(2(1 3) 6(· 7))   2B(1B 5R(3B 6B(· 7R)))
delete(1)   [5]([2 3] [6 7])       5(2(· 3) 6(· 7))   5B(2B(· 3R) 6B(· 7R))
delete(2)   [5]([3] [6 7])         5(3 6(· 7))        5B(3B 6B(· 7R))
```

세 트리는 같은 값 `[3, 5, 6, 7]`을 담고 있지만 모양은 모두 다릅니다. 이 차이는 계약이 정하지 않은 부분이며, 각 구현이 높이를 제한하는 방법에서 나옵니다. 높이 제한 자체도 계약의 불변식이 아닙니다. 높이 제한이 깨진 구현은 결과가 맞아도 비용 검사에서 실패합니다.

### 비용 계산

#### 비용을 세는 과정

n은 담긴 원소 수, k는 `range`가 돌려주는 원소 수, h는 트리의 높이입니다. 세 구현에서 `has`, `min`, `max`는 뿌리에서 한 경로를 따라 내려가므로 지나는 노드가 h개 이하입니다. 2-3 트리는 노드마다 키를 둘까지 비교하지만 노드당 비교 수가 상수이므로 마찬가지로 O(log n)입니다. `toArray`는 모든 원소를 방문하므로 O(n)입니다.

`range(low, high)`는 구간과 겹치지 않는 부분트리로 내려가지 않습니다. 방문하는 노드는 `low`의 경계를 따라가는 경로, `high`의 경계를 따라가는 경로, 그리고 돌려주는 k개의 원소를 담은 노드입니다. 두 경로가 각각 h 이하이므로 O(log n + k)입니다. T12 `range(25, 55)`는 20의 왼쪽 부분트리를 방문하지 않고 노드 다섯 개만 지나 30, 40, 50을 돌려주었습니다.

```text
T12 range(25, 55)   트리 20B(10B 40R(30B 90B(50R ·)))
20   25보다 작다  → 왼쪽 10은 방문하지 않고 오른쪽 40으로
40   구간 안      → 왼쪽 30과 오른쪽 90을 모두 확인
30   구간 안      → 담음
90   55보다 크다  → 왼쪽 50만 확인, 50을 담음
지나간 노드 20 · 40 · 30 · 90 · 50 = 5
```

넣기와 지우기는 내려가는 비용에 **고치는 비용**이 더해집니다. 레드블랙 트리의 넣기는 삼촌이 빨간 경우에만 반복하고, 한 번 반복할 때 조부모로 두 층 올라가므로 반복 횟수가 높이의 절반을 넘지 않습니다. 지우기에서 반복하는 경우는 형제를 빨갛게 바꿔 합치는 경우뿐이고, 형제가 빨간 경우의 회전은 한 번 뒤 다른 경우로 넘어가며, 빌리는 경우는 회전 두 번 이하로 끝납니다. T5와 T7의 넣기가 회전 두 번, T14의 지우기가 회전 두 번이었습니다.

```text
2-3 트리    넣기: 내려감 + 나누기(경로의 노드마다 최대 한 번)       지우기: 내려감 + 빌리기·합치기(경로의 노드마다 최대 한 번)
AVL 트리    넣기: 내려감 + 돌아오며 높이 계산 + 회전 최대 두 번     지우기: 내려감 + 돌아오며 높이 계산 + 경로의 여러 곳에서 회전
레드블랙    넣기: 내려감 + 색 바꾸기 반복(두 층씩 올라감) + 회전 최대 두 번
            지우기: 내려감 + 합치기 반복(한 층씩 올라감) + 회전 최대 세 번
```

호출 한 번이 모양을 고친 횟수의 최댓값을 실제로 세어 보면 이렇습니다.

<!--proof:fix-counts-->

```text
1부터 4,095까지 섞은 순서로 넣고 다른 순서로 모두 지웠을 때, 호출 한 번의 최댓값
구현            넣기 한 번   지우기 한 번
2-3 트리        나누기 9     빌리기·합치기 9
AVL 트리        회전 2       회전 7
레드블랙 트리   회전 2       회전 3
```

세 구현 모두 고치는 일이 경로의 노드마다 상수 번을 넘지 않으므로 넣기와 지우기가 최악 O(log n)입니다. 차이는 회전 수에 있습니다. AVL 트리는 지우기 한 번에 경로의 여러 노드를 회전할 수 있고, 레드블랙 트리는 회전이 세 번을 넘지 않습니다. 대신 레드블랙 트리는 높이 상한이 더 커서 찾기에서 더 많은 노드를 지날 수 있습니다.

#### 케이스별 비용과 그 경계

| 항목 | 2-3 트리 | AVL 트리 | 레드블랙 트리 |
| --- | --- | --- | --- |
| 높이 상한 | log₂(n+1) | 약 1.44·log₂ n | 2·log₂(n+1) |
| `has`, `min`, `max` | 최악 O(log n) | 최악 O(log n) | 최악 O(log n) |
| `insert`, `delete` | 최악 O(log n) | 최악 O(log n) | 최악 O(log n) |
| `range` | 최악 O(log n + k) | 최악 O(log n + k) | 최악 O(log n + k) |
| `toArray` | 최악 O(n) | 최악 O(n) | 최악 O(n) |
| 모양을 고치는 방법 | 노드 나누기 · 빌리기 · 합치기 | 회전, 지우기에서 여러 번 가능 | 색 바꾸기와 회전, 회전은 넣기 2번 · 지우기 3번 이하 |
| 노드마다 추가로 저장하는 것 | 키 배열과 자식 배열 | 부분트리 높이 | 색, 부모 참조 |
| 저장 공간 | O(n) | O(n) | O(n) |

이 표는 각 구현의 보장입니다. 세 구현 모두 계약이 요구하는 최악 O(log n)을 지키며, 차이는 상한 안의 상수와 노드마다 드는 저장 공간에 있습니다. 앞의 계약 표가 공간을 말하지 않으므로, 노드에 배열 둘을 두는 2-3 트리도 계약을 만족합니다.

#### 최악을 만드는 입력

오류와 큰 비용은 같은 입력에서 발생하지 않을 수 있습니다. 최악의 입력은 계약이 아니라 구현마다 다릅니다. 오름차순 넣기는 균형 없는 트리에는 최악이지만 정렬 배열에는 최선이고, 조회할 때 모양을 바꾸는 스플레이 트리에는 순서대로 조회하는 입력이 최악입니다.

| 확인할 입력 | 확인할 동작 |
| --- | --- |
| 오름차순 넣기 | 새 값이 늘 오른쪽 끝에 붙어도 높이가 로그 안에 머무는지 |
| 오름차순으로 채운 뒤 0부터 순서대로 조회 | 조회가 모양을 바꾸지 않고 호출마다 높이 안에 끝나는지 |
| 잎이 아닌 노드 지우기, 뿌리 지우기, 전부 지웠다가 다시 넣기 | 2-3 트리의 합치기로 높이가 줄어드는 경우와 레드블랙 트리의 빈 자리 노드 처리 |
| 같은 값 반복 넣기, 없는 값 지우기, `low > high` 구간 | 상태를 바꾸지 않아야 하는 경로 |

세 구현에 같은 호출을 보내고, 정렬된 중복 없는 배열로 계산한 결과와 매번 비교할 수 있습니다. 배열은 정답을 확인하기 위한 모델이므로 느려도 괜찮습니다. 본문의 2-3 트리·AVL 트리 코드와 세 참조 구현을 이 모델과 대조하고, 계약의 경계 입력마다 앞 절의 세 관계를 확인했습니다.

<!--proof:implementations-->

```text
다섯 구현(본문의 2-3 트리·AVL 트리 코드와 세 참조 구현): 무작위 호출 20,000번이 참조 모델과 일치
계약의 경계 입력 7개: 호출마다 계약의 불변식 3개 성립
```

결과가 맞는다는 사실만으로 호출 한 번의 비용까지 확인되지는 않습니다. 새 노드를 검게 넣도록 한 줄을 바꾼 코드처럼, 결과는 같지만 높이가 원소 수만큼 커지는 구현도 있습니다. 계약 스위트는 실행 시간 대신 지나간 노드 수를 세고, 원소 수를 네 배로 늘렸을 때 호출 한 번의 최댓값이 몇 배가 되는지를 비율 r로 판정합니다. O(log n)이면 1에 가깝고, O(n)이면 4에 가깝습니다.

<!--proof:scenarios-->

```text
시나리오               상한        2-3 트리    AVL 트리   레드블랙 트리
insert (적대적)        O(log n)   1.18 통과   1.15 통과       1.19 통과
insert                 O(log n)   1.24 통과   1.13 통과       1.20 통과
has·min·max (적대적)   O(log n)   1.17 통과   1.16 통과       1.18 통과
delete (적대적)        O(log n)   1.17 통과   1.17 통과       1.17 통과
range                  O(log n)   1.25 통과   1.13 통과       1.24 통과
toArray                O(n)       3.96 통과   3.97 통과       3.97 통과
```

세 참조 구현 모두 여섯 시나리오를 통과했습니다. 구간 읽기 시나리오는 구간 폭을 좁게 고정해 k를 상수로 두므로 O(log n)으로 판정합니다. 적대적 시나리오는 오름차순 넣기, 순차 조회, 오름차순 지우기처럼 균형을 잡지 않는 트리나 조회할 때 모양을 바꾸는 트리가 한 번의 호출에서 느려지는 입력입니다. 이 수치는 지나간 노드 수의 비율이며 실제 실행 시간이 아닙니다.

### 이 구조가 최적의 선택인 경우

#### 최적인 요구의 모양

넣기와 지우기가 섞이면서 동시에 순서를 이용한 조회(최솟값, 최댓값, 구간, 전체 순서)가 필요하고, **호출 한 번의 지연에 상한이 필요할 때** 이 계약이 맞습니다. 순서가 필요 없다면 해시 집합이, 한 번에 모두 넣은 뒤 읽기만 한다면 정렬 배열이 더 간단합니다. 어떤 구현을 고를지는 별도의 선택입니다.

| 먼저 확인할 요구 | 검토할 구현 | 함께 고려할 비용 |
| --- | --- | --- |
| 모든 잎이 같은 깊이인 구조로 이해하고, 노드가 더 넓은 B-트리로 확장하기 | 2-3 트리 | 노드 안의 키·자식 배열 이동 |
| 찾기가 넣기·지우기보다 훨씬 많아 높이를 가장 낮게 두기 | AVL 트리 | 지우기에서 여러 번 회전 |
| 넣기·지우기가 많고 회전 수를 상수로 제한하기 | 레드블랙 트리 | 색 규칙과 여러 경우의 고치기, 더 큰 높이 상한 |

#### 이 구조를 떠올리게 하는 연산 조합

요구를 연산으로 옮겨 보면 이 계약이 맞는지 판단할 수 있습니다.

```text
알림을 등록·취소하고, 가장 이른 알림과 다음 한 시간 안의 알림을 확인한다 (시각이 서로 다를 때)
  → insert · delete · min · range
정렬 색인에 행을 추가·삭제하고, 값 구간으로 조회한다 (색인 값이 유일할 때)
  → insert · delete · range
```

반대로 같은 값을 여러 개 담아야 하면 다중집합이, k번째 원소나 순위를 구해야 하면 순위 정보를 저장하는 트리가 필요합니다. 「상위 10개」처럼 k번째까지를 읽는 요구는 이 계약의 연산만으로는 원소 수에 비례하는 `toArray()`를 써야 합니다.

#### 실제로 쓰이는 곳

자바 표준 라이브러리의 `TreeMap`은 문서 첫 문장에서 *"A Red-Black tree based NavigableMap implementation."* 이라고 밝히고, *"This implementation provides guaranteed log(n) time cost for the containsKey, get, put and remove operations."* 라고 보장의 종류까지 적었습니다. 평균이 아니라 보장이라는 점이 이 글의 계약과 같습니다. ([`java.util.TreeMap`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html), 조회 2026-09-13)

리눅스 커널 문서는 레드블랙 트리를 고른 이유를 AVL 트리와 비교해 설명합니다. *"Red-black trees are similar to AVL trees, but provide faster real-time bounded worst case performance for insertion and deletion (at most two rotations and three rotations, respectively, to balance the tree), with slightly slower (but still O(log n)) lookup time."* 앞의 회전 수 측정과 같은 내용입니다. ([`Documentation/core-api/rbtree.rst`](https://github.com/torvalds/linux/blob/master/Documentation/core-api/rbtree.rst), 조회 2026-09-13)

```text
커널 문서가 적은 회전 수                 넣기 최대 2번 · 지우기 최대 3번
이 글의 측정(4,095개, 섞은 순서)         넣기 최대 2번 · 지우기 최대 3번
```

리눅스 CFS 스케줄러도 레드블랙 트리를 사용합니다. *"CFS maintains a time-ordered rbtree, where all runnable tasks are sorted by the p->se.vruntime key. CFS picks the "leftmost" task from this tree and sticks to it."* 가장 왼쪽 작업을 고르는 것은 `min`에 해당합니다. 다만 실행 시간이 같은 작업이 여럿일 수 있어 같은 키를 여러 개 담으므로, 연산으로 옮기면 이 글의 정렬 집합보다 다중집합에 가깝습니다. ([`Documentation/scheduler/sched-design-CFS.rst`](https://github.com/torvalds/linux/blob/master/Documentation/scheduler/sched-design-CFS.rst), 조회 2026-09-13)

#### 경쟁 설계와의 대조

호출 한 번의 상한 대신 여러 호출의 합만 작으면 되는 경우에는 스플레이 트리도 후보입니다. 스플레이 트리는 조회할 때 찾은 노드를 뿌리로 올려 여러 호출의 합을 줄이지만, 호출 한 번의 비용은 원소 수에 비례할 수 있으므로 이 글의 계약은 지키지 않습니다. [비용 측정 코드](./redBlackTree-guide.alt.ts)로 0부터 1,023까지 오름차순으로 넣고 0부터 차례로 `has`를 부른 뒤, 두 참조 구현이 지나간 노드 수를 비교했습니다. 두 참조 구현은 노드 하나를 지날 때마다 1을 세므로 같은 단위이며, **실제 실행 시간의 비교는 아닙니다.**

| 측정 항목 | 레드블랙 트리 | 스플레이 트리 |
| --- | --- | --- |
| 넣기 한 번의 최댓값 | 26 | 2 |
| 넣기 전체 | 17,908 | 2,047 |
| 조회 한 번의 최댓값 | 18 | 1,536 |
| 조회 전체 | 9,743 | 8,108 |

이 입력에서 넣기는 한 번의 최댓값과 전체 모두 스플레이 트리가 적고, 조회도 전체는 스플레이 트리가 적습니다. 하지만 조회 한 번의 최댓값은 레드블랙 트리가 18이고 스플레이 트리가 1,536입니다. 한 번의 지연이 중요하지 않은 일괄 처리라면 스플레이 트리도 후보가 되고, 요청마다 응답 시간의 상한이 필요하다면 이 글의 세 구현을 검토합니다.

### 스스로 점검하기

1. 2-3 트리에서 `insert(7)`이 노드를 두 번 나눈 이유는 무엇일까요? **답:** 잎 `[5 6 7]`을 나눠 6을 올리자 부모가 `[2 4 6]`으로 키 셋이 되어 다시 나뉘었습니다. 같은 입력의 레드블랙 트리를 2-3-4 트리로 읽으면 노드가 키를 셋까지 담으므로 `[5 6 7]`이 넘치지 않아 나누지 않습니다.
2. AVL 트리의 `rebalance`에서 무거운 쪽 자식이 반대 방향으로 기울었을 때 자식을 먼저 회전하지 않으면 어떻게 될까요? **답:** 3, 1, 2 순서로 넣으면 뿌리 3의 왼쪽이 무겁고 왼쪽 자식 1은 오른쪽으로 기울어 있습니다. 3만 오른쪽으로 회전하면 `1(· 3(2 ·))`이 되어 높이 차 2가 그대로 남습니다.
3. T6 `insert(30)`에서 조부모 20이 뿌리가 아니라 빨간 부모를 가진 노드였다면 색을 바꾼 뒤 무엇을 다시 확인해야 할까요? **답:** 빨갛게 바뀐 20과 그 부모가 연달아 빨간지 확인해야 합니다. 삼촌이 빨간 경우는 조부모에서 같은 확인을 반복하므로, 그 자리에서 다시 삼촌의 색을 봅니다.
4. 새 노드를 검게 넣으면 `toArray()`는 맞는데 왜 계약을 지키지 못할까요? **답:** 규칙 3이 깨져도 부모의 색만 보는 고치기 코드가 그것을 찾지 못해 트리가 한 줄이 됩니다. 계약은 호출 한 번의 최악 비용을 요구하므로 높이가 원소 수만큼 커지면 위반입니다.
