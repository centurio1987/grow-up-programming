# XOR 연결 리스트 — 배열, 이중 연결 리스트, XOR 연결로 구현하기

## 파트 1 — 뒤에 붙이고 두 방향으로 읽는 세 가지 방법

### 전체 컨셉

일기장에 매일 한 줄씩 적는다고 생각해 봅시다. 새 기록은 항상 맨 뒤에 붙고, 읽을 때는 처음부터 읽기도 하고 최근 것부터 거꾸로 읽기도 합니다. 이 글이 다루는 계약은 이런 수열입니다. **뒤에만 원소를 붙이고, 담긴 전체를 앞에서부터 또는 뒤에서부터 읽고, 원소 수를 알려 줍니다.**

```text
append(10), append(0), append(30)

toArray()          → [10, 0, 30]    앞에서부터 읽기
toArrayReverse()   → [30, 0, 10]    뒤에서부터 읽기
size()             → 3
```

이 네 연산은 여러 방법으로 구현할 수 있습니다. 이 글에서는 세 구현을 직접 만들어 봅니다.

| 구현 | 저장 방법 |
| --- | --- |
| 동적 배열 | 붙인 순서대로 배열 칸에 저장합니다. 칸이 모자라면 더 큰 배열로 복사합니다. |
| 이중 연결 리스트 | 원소마다 노드를 만들고, 노드가 이전 노드와 다음 노드를 따로 참조합니다. |
| XOR 연결 리스트 | 노드가 이전 노드와 다음 노드의 위치를 XOR 한 값 하나만 저장합니다. |

자료구조의 이름은 세 번째 구현에서 왔습니다. 이중 연결 리스트는 노드마다 참조 두 개를 두는데, XOR 연결 리스트는 그 둘을 값 하나로 줄여 메모리를 아끼려고 만든 설계입니다. 다만 TypeScript에서는 메모리 주소를 정수로 다룰 수 없어서, 이 저장소의 TypeScript 구현은 주소 대신 노드 번호(id)와 번호로 노드를 찾는 표를 씁니다. 그 결과 오히려 메모리를 더 쓰게 됩니다. **이 구조의 이득은 메모리 주소를 직접 다룰 때만 생기므로**, 이 글은 XOR 연결 리스트를 주소를 다룰 수 있는 Rust로 한 번 더 구현하고 노드가 실제로 몇 바이트를 요청하는지 잽니다.

```text
연산이 정하는 것: 어떤 순서로 붙이고 읽는가
구현이 정하는 것: 그 순서를 어떻게 저장하고, 두 방향으로 어떻게 따라가는가
```

이 프로젝트의 [연산 명세](./xorLinkedList.ts)는 `append`에 **상각 O(1)**, 두 순회에 **최악 O(n)**, `size`에 **최악 O(1)**을 요구합니다. 상각 O(1)은 붙이기 한 번이 언제나 빠르다는 뜻이 아니라, 빈 수열에서 m번 붙이는 데 드는 총비용이 O(m)이라는 뜻입니다. 순회는 원소 n개를 모두 돌려주므로 어떤 구현에서도 n에 비례합니다.

### 시작하기 전에 — 이미 알고 있어야 하는 것

배열에 값을 추가하는 `push`, 객체가 다른 객체를 참조하는 방식, `Map`에 키와 값을 넣고 찾는 방법을 알고 있으면 읽을 수 있습니다. 세 구현은 같은 사용법을 공유합니다.

```ts
const list = new XorLinkedList();
list.toArray();          // [], 빈 수열
list.append(10);
list.append(0);
list.append(30);
list.toArray();          // [10, 0, 30]
list.toArrayReverse();   // [30, 0, 10]
list.size();             // 3
```

세 번째 구현은 비트 XOR(`^`)을 씁니다. XOR은 두 수를 2진수로 놓고 자리마다 비트가 다르면 1, 같으면 0을 적는 연산입니다. 같은 수를 두 번 XOR 하면 0이 되고, 0과 XOR 하면 그대로이며, 계산 순서를 바꿔도 결과가 같습니다. 그래서 두 값을 섞은 결과에서 한 값을 알면 나머지 값을 되찾을 수 있습니다. 이 성질은 [`singleNumberXor` 가이드](../../../algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md)에서도 쓰입니다.

```text
a = 1 (01), b = 3 (11)
a ^ b       = 01 ^ 11 = 10 = 2
(a ^ b) ^ a = 10 ^ 01 = 11 = 3 → b를 되찾음
(a ^ b) ^ b = 10 ^ 11 = 01 = 1 → a를 되찾음
```

이 글에서 n은 현재 원소 수, m은 호출 횟수입니다. 가운데에 넣거나 빼는 연산, 번호로 원소 하나를 읽는 연산은 이 계약에 없습니다. 그런 연산이 필요하면 [`doublyLinkedList` 가이드](../doublyLinkedList/doublyLinkedList-guide.mdx)나 [`dynamicArray` 가이드](../dynamicArray/dynamicArray-guide.mdx)를 보세요.

Rust 구현은 `Box`, 원시 포인터 `*mut T`, `unsafe` 블록을 씁니다. `Box::new`는 값을 힙에 할당하고, `Box::into_raw`는 그 값의 주소를 원시 포인터로 넘겨줍니다. 원시 포인터는 컴파일러가 가리키는 대상이 살아 있는지 확인하지 않는 주소이므로, 그 주소를 읽고 쓰는 코드는 `unsafe` 블록에 두고 안전 조건을 작성자가 보장합니다.

### 설계 상세 — 이웃 정보를 하나만 저장할 수 있을까

뒤에만 붙이고 전체를 두 방향으로 읽는 일은 배열 하나로 충분합니다. 붙인 순서대로 칸에 적으면 앞에서부터 읽기는 0번 칸부터, 뒤에서부터 읽기는 마지막 칸부터 차례로 읽는 일이 됩니다. 칸이 모자랄 때 두 배 크기로 복사하면 붙이기의 총비용도 원소 수에 비례합니다.

```text
배열 [10, 0, 30]
앞에서부터: 0번 → 1번 → 2번 칸
뒤에서부터: 2번 → 1번 → 0번 칸
```

그런데 원소를 연속된 칸에 두지 않고 노드로 이으려면 사정이 달라집니다. 노드가 다음 노드만 가리키면 앞에서부터는 읽을 수 있지만, 뒤에서부터 읽으려면 이전 노드를 찾을 방법이 없습니다. 그래서 이중 연결 리스트는 노드마다 `prev`와 `next` 두 참조를 둡니다. 또 연결 리스트에서는 **마지막 노드를 따로 기억해야** 붙이기가 빠릅니다. 마지막 노드를 모르면 붙일 때마다 처음부터 끝까지 따라가야 해서, 원소 n개를 붙이는 동안 `0 + 1 + … + (n - 1) = n(n - 1) / 2`번 이동합니다.

**그렇다면 노드마다 두는 이웃 정보 두 개를 하나로 줄일 수는 없을까요?** 노드에 번호를 붙이고, 이전 노드 번호와 다음 노드 번호를 XOR 한 값 하나만 저장해 봅시다. 이웃이 없는 자리는 번호 0으로 적고, 이 0을 `NIL`이라고 부릅니다. 값 10, 20, 30을 붙인 뒤의 상태입니다.

```text
노드 번호(id)      1          2          3
값                 10         20         30
이전 노드 id       0 (NIL)    1          2
다음 노드 id       2          3          0 (NIL)
저장하는 값 x      0 ^ 2 = 2  1 ^ 3 = 2  2 ^ 0 = 2
```

세 노드가 모두 2를 저장합니다. 이 값만 보고는 어느 쪽이 앞인지 알 수 없습니다. 하지만 **직전에 어느 노드에서 왔는지** 알면 다음 노드를 계산할 수 있습니다. 2번 노드의 `x`는 `1 ^ 3`이므로, 1번에서 왔다면 `x ^ 1 = 3`이 다음 노드이고 3번에서 왔다면 `x ^ 3 = 1`이 다음 노드입니다.

```text
동적 배열:         붙인 순서대로 연속 칸에 저장한다.
이중 연결 리스트:  노드마다 이전 노드와 다음 노드를 따로 가리킨다.
XOR 연결 리스트:   이전 id와 다음 id를 XOR 한 값 하나를 두고, 직전 노드로 다음 노드를 계산한다.
```

> 공통 관찰: 두 방향으로 읽으려면 원소마다 앞뒤를 알 방법이 있어야 하고, 그 방법이 저장 비용을 정합니다.

### 수행으로 알아보는 자료구조 — 세 구현을 만들고 XOR 연결을 Rust로 옮기기

#### 1. 동적 배열 — 붙인 순서대로 칸에 둔다

배열 `values` 하나에 붙인 순서대로 값을 넣습니다. `append(value)`는 `values.push(value)`이고, 원소 수는 배열 길이입니다. `toArray()`는 배열을 복사해서 돌려줍니다. 내부 배열을 그대로 돌려주면 호출한 쪽이 반환값을 고칠 때 저장된 수열까지 바뀌기 때문입니다.

| 호출 | values | 반환값 |
| --- | --- | --- |
| 시작 | `[]` | — |
| `append(10)` | `[10]` | — |
| `append(0)` | `[10,0]` | — |
| `append(30)` | `[10,0,30]` | — |
| `toArray()` | `[10,0,30]` | `[10,0,30]` 복사본 |
| `toArrayReverse()` | `[10,0,30]` | `[30,0,10]` |
| `size()` | `[10,0,30]` | 3 |

`toArrayReverse()`는 마지막 칸부터 0번 칸까지 읽어 새 배열에 담습니다. 저장된 배열을 뒤집지 않으므로 호출한 뒤에도 `values`의 순서는 그대로입니다.

JavaScript 배열은 칸이 모자라면 더 큰 공간을 잡고 원소를 복사합니다. 언어 명세는 용량을 얼마나 늘리는지 정하지 않으므로, 이 글은 용량을 두 배씩 늘린다고 두고 셉니다. 이렇게 일정 배수로 늘리면 m번 붙이는 총비용은 O(m)이고, 복사가 일어나는 그 한 번의 호출만 원소 수에 비례합니다.

#### 배열 구현 코드

```ts
export class ArrayList {
  private values: number[] = [];

  append(value: number): void {
    this.values.push(value);
  }

  toArray(): number[] {
    return this.values.slice();
  }

  toArrayReverse(): number[] {
    const out: number[] = [];
    for (let i = this.values.length - 1; i >= 0; i--) {
      out.push(this.values[i] as number);
    }
    return out;
  }

  size(): number {
    return this.values.length;
  }
}
```

#### 2. 이중 연결 리스트 — 노드마다 앞과 뒤를 따로 가리킨다

이번에는 원소마다 노드 `{ value, prev, next }`를 만듭니다. 리스트는 첫 노드 `head`, 마지막 노드 `tail`, 원소 수 `count`를 기억합니다.

```text
head                         tail
 ↓                             ↓
[10]  ←→  [0]  ←→  [30]
prev가 null              next가 null
```

붙이기는 새 노드의 `prev`를 지금의 `tail`로 두고, 기존 `tail`의 `next`를 새 노드로 바꾼 뒤 `tail`을 새 노드로 옮기는 일입니다. 비어 있었다면 `head`도 새 노드를 가리켜야 합니다. 앞에서부터 읽기는 `head`에서 `next`를 따라가고, 뒤에서부터 읽기는 `tail`에서 `prev`를 따라갑니다.

| 호출 | 노드 연결 | head | tail | count |
| --- | --- | --- | --- | --- |
| 시작 | 없음 | null | null | 0 |
| `append(10)` | `[10]` | 노드 10 | 노드 10 | 1 |
| `append(0)` | `[10] ↔ [0]` | 노드 10 | 노드 0 | 2 |
| `append(30)` | `[10] ↔ [0] ↔ [30]` | 노드 10 | 노드 30 | 3 |

첫 붙이기 행을 눈여겨보세요. 빈 리스트에 붙이면 새 노드가 첫 노드이자 마지막 노드이므로 `head`와 `tail`이 같은 노드를 가리킵니다. 값 0도 노드의 값일 뿐이라 읽기가 멈추는 조건과 무관합니다. 읽기는 참조가 `null`일 때 멈춥니다.

#### 이중 연결 리스트 구현 코드

```ts
type Link = { value: number; prev: Link | null; next: Link | null };

export class DoublyLinkedList {
  private head: Link | null = null;
  private tail: Link | null = null;
  private count = 0;

  append(value: number): void {
    const node: Link = { value, prev: this.tail, next: null };
    if (this.tail === null) this.head = node;
    else this.tail.next = node;
    this.tail = node;
    this.count += 1;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (let at = this.head; at !== null; at = at.next) out.push(at.value);
    return out;
  }

  toArrayReverse(): number[] {
    const out: number[] = [];
    for (let at = this.tail; at !== null; at = at.prev) out.push(at.value);
    return out;
  }

  size(): number {
    return this.count;
  }
}
```

`count`를 따로 저장하는 이유는 `size()`마다 노드를 세면 원소 수에 비례하는 시간이 들기 때문입니다.

#### 3. XOR 연결 리스트 — 앞 id와 뒤 id를 XOR 한 값 하나만 둔다

C나 Rust처럼 주소를 정수로 다룰 수 있는 언어에서는 노드 주소 두 개를 XOR 해 저장하며, 이 방식은 4번에서 Rust로 구현합니다. TypeScript에는 주소를 정수로 꺼내는 방법이 없으므로, 이 구현은 노드마다 1부터 차례로 번호 `id`를 붙이고 `Map`에 `id → 노드`를 기록합니다. 노드는 `{ id, value, xorId }`를 저장하고, `xorId`는 이전 노드 id와 다음 노드 id를 XOR 한 값입니다. 리스트는 첫 노드 id `headId`, 마지막 노드 id `tailId`, 원소 수 `count`, 다음에 줄 번호 `nextId`를 기억합니다. 이웃이 없는 자리는 `NIL = 0`입니다.

```text
nodes (Map)   1 → { id: 1, value: 10, xorId: 2 }
              2 → { id: 2, value: 0,  xorId: 2 }
              3 → { id: 3, value: 30, xorId: 2 }
headId = 1, tailId = 3, count = 3, nextId = 4
```

**붙이기에서 바뀌는 노드는 두 개입니다.** 새 노드는 아직 다음 노드가 없으므로 `xorId = 이전 노드 id ^ 0`, 즉 지금의 `tailId`가 됩니다. 기존 마지막 노드는 다음 노드가 `NIL`에서 새 노드로 바뀌므로, 저장된 값에 새 id를 한 번 XOR 합니다. `이전 id ^ 0 ^ 새 id = 이전 id ^ 새 id`가 되어 정의와 맞습니다. 값 10, 20, 30, 40을 차례로 붙이면 이렇게 바뀝니다.

<!--proof:append-states-->

```text
호출         새 id   새 노드의 xorId   기존 마지막 노드의 xorId       headId   tailId
append(10)       1                 0   빈 리스트 — 마지막 노드 없음        1        1
append(20)       2                 1   id 1: 0 ^ 2 = 2                     1        2
append(30)       3                 2   id 2: 1 ^ 3 = 2                     1        3
append(40)       4                 3   id 3: 2 ^ 4 = 6                     1        4
```

마지막 행에서 id 3의 값이 `2 ^ 4 = 6`이 되었습니다. 이전 노드 2와 다음 노드 4를 XOR 한 값입니다.

**읽기는 직전 노드 id `prev`를 들고 이동합니다.** 출발할 때 `prev`는 `NIL`이고, 지금 노드 `curr`의 값을 담은 뒤 `다음 id = xorId ^ prev`를 계산합니다. 그다음 `prev`에 `curr`를 넣고 `curr`를 다음 id로 옮깁니다. 다음 id가 `NIL`이면 끝입니다. 같은 코드를 `headId`에서 출발시키면 앞에서부터, `tailId`에서 출발시키면 뒤에서부터 읽습니다.

```text
prev ← NIL, curr ← 출발 id
curr ≠ NIL인 동안: curr의 값을 담는다 → 다음 ← xorId ^ prev → prev ← curr → curr ← 다음
```

값 10, 20, 30을 붙인 리스트를 두 방향으로 읽은 결과입니다.

<!--proof:two-directions-->

```text
출발         prev   curr   xorId(curr)   다음 = xorId ^ prev      담은 값
앞에서부터      0      1             2   2 ^ 0 = 2                   [10]
앞에서부터      1      2             2   2 ^ 1 = 3                [10 20]
앞에서부터      2      3             2   2 ^ 2 = 0             [10 20 30]
뒤에서부터      0      3             2   2 ^ 0 = 2                   [30]
뒤에서부터      3      2             2   2 ^ 3 = 1                [30 20]
뒤에서부터      2      1             2   2 ^ 2 = 0             [30 20 10]
```

2행과 5행은 같은 id 2 노드의 같은 값 2를 읽었습니다. 앞에서 온 순회는 `prev`가 1이라 3을 얻었고, 뒤에서 온 순회는 `prev`가 3이라 1을 얻었습니다.

```text
id 2의 xorId = 1 ^ 3
앞에서 온 경우   prev = 1 → (1 ^ 3) ^ 1 = 3
뒤에서 온 경우   prev = 3 → (1 ^ 3) ^ 3 = 1
```

아래 시뮬레이션은 빈 리스트를 읽은 뒤 10, 0, 30을 붙이고 두 방향으로 읽습니다. 순회는 노드 하나를 읽을 때마다 한 걸음으로 셉니다. 노드 표의 칸은 `값/xorId`입니다 — `10/x2`는 값이 10이고 `xorId`가 2인 노드입니다. 둘째 값을 0으로 고른 것은 값 0이 `NIL`과 같은 수여도 읽기가 멈추지 않는다는 것을 보이기 위해서입니다. 읽기는 값이 아니라 id를 `NIL`과 비교합니다. 마지막 걸음은 **`[30, 0, 10]`을 반환합니다.**
<!--result:walk=[30,0,10]-->

```text
T1 toArray()   T2 size()   T3~T5 append(10) · append(0) · append(30)   T6 size()
T7~T9 toArray()의 세 걸음   T10~T12 toArrayReverse()의 세 걸음
```

<!--viz:walk-->

<!--proof:walk-viz-->

```text
단계   노드 표 (id 1 · 2 · 3)   headId   tailId   count   prev   curr     담은 값
T1     · · ·                         0        0       0      —      —          []
T2     · · ·                         0        0       0      —      —           —
T3     10/x0 · ·                     1        1       1      —      —           —
T4     10/x2 0/x1 ·                  1        2       2      —      —           —
T5     10/x2 0/x2 30/x2              1        3       3      —      —           —
T6     10/x2 0/x2 30/x2              1        3       3      —      —           —
T7     10/x2 0/x2 30/x2              1        3       3      0      1        [10]
T8     10/x2 0/x2 30/x2              1        3       3      1      2      [10 0]
T9     10/x2 0/x2 30/x2              1        3       3      2      3   [10 0 30]
T10    10/x2 0/x2 30/x2              1        3       3      0      3        [30]
T11    10/x2 0/x2 30/x2              1        3       3      3      2      [30 0]
T12    10/x2 0/x2 30/x2              1        3       3      2      1   [30 0 10]
```

같은 걸음에서 확인한 조건과 계산, 참조 구현이 센 비용은 다음과 같습니다. 비용은 노드를 `Map`에서 찾을 때 1, 새 노드를 만들 때 1입니다.

<!--proof:walk-trace-->

```text
단계   호출               조건                                       계산                               돌려준 값   비용
T1     toArray()          currId 0 = NIL — 읽을 노드가 없다          —                                         []      0
T2     size()             —                                          —                                          0      1
T3     append(10)         tailId 0 = NIL — 빈 수열에 붙인다          id 1 · xorId 0                             —      1
T4     append(0)          tailId 1 ≠ NIL — 마지막 노드 뒤에 잇는다   id 2 · xorId 1 · id 1: 0 ^ 2 = 2           —      2
T5     append(30)         tailId 2 ≠ NIL — 마지막 노드 뒤에 잇는다   id 3 · xorId 2 · id 2: 1 ^ 3 = 2           —      2
T6     size()             —                                          —                                          3      1
T7     toArray()          currId 1 ≠ NIL                             다음 = 2 ^ 0 = 2                           —      1
T8     toArray()          currId 2 ≠ NIL                             다음 = 2 ^ 1 = 3                           —      1
T9     toArray()          currId 3 ≠ NIL · 다음 0 = NIL — 끝         다음 = 2 ^ 2 = 0                   [10 0 30]      1
T10    toArrayReverse()   currId 3 ≠ NIL                             다음 = 2 ^ 0 = 2                           —      1
T11    toArrayReverse()   currId 2 ≠ NIL                             다음 = 2 ^ 3 = 1                           —      1
T12    toArrayReverse()   currId 1 ≠ NIL · 다음 0 = NIL — 끝         다음 = 2 ^ 2 = 0                   [30 0 10]      1
```

#### XOR 연결 리스트 전체 코드

다음은 프로젝트의 참조 구현에서 성능 측정용 카운터를 제외한 코드입니다. `#walk` 하나가 두 방향 읽기를 모두 처리하고, 출발 id만 다릅니다.

```ts guide-core=src/data-structures/linear/xorLinkedList/_reference/xorLinkedList.ts
/** 표의 빈자리를 가리키는 값. 실제 id 는 1부터 나가므로 0 과 겹치지 않는다. */
const NIL = 0;

interface XorNode {
  id: number;
  value: number;
  /** 앞 이웃 id 와 뒤 이웃 id 의 XOR. 어느 한쪽도 이 값만으로는 복원되지 않는다. */
  xorId: number;
}

export class XorLinkedList {
  #nodes = new Map<number, XorNode>();
  #headId = NIL;
  #tailId = NIL;
  #count = 0;
  /** 다음에 나눠 줄 id. 한 번 쓴 값을 다시 쓰지 않는다. */
  #nextId = 1;

  append(value: number): void {
    const id = this.#nextId++;
    // 새 노드의 뒤 이웃은 아직 없다 — 그래서 앞 이웃 id 하나가 그대로 XOR 값이 된다.
    this.#nodes.set(id, { id, value, xorId: this.#tailId });

    if (this.#tailId === NIL) {
      this.#headId = id;
    } else {
      // 옛 꼬리의 뒤 이웃 자리는 NIL 이었다. NIL 을 지우고 새 id 를 넣는 것이 이 XOR 한 번이다.
      const tail = this.#at(this.#tailId);
      tail.xorId ^= id;
    }

    this.#tailId = id;
    this.#count += 1;
  }

  toArray(): number[] {
    return this.#walk(this.#headId);
  }

  toArrayReverse(): number[] {
    return this.#walk(this.#tailId);
  }

  size(): number {
    return this.#count;
  }

  /**
   * 한쪽 끝에서 반대쪽 끝까지 걷는다.
   *
   * **두 방향이 같은 코드다.** 시작점만 다르다. 양쪽 끝 어디서 출발하든 직전에 읽은 노드가
   * 곧 이웃 하나이므로, 저장된 XOR 값에서 나머지 하나가 나온다.
   */
  #walk(startId: number): number[] {
    const values: number[] = [];
    let prevId = NIL;
    let currId = startId;

    while (currId !== NIL) {
      const node = this.#at(currId);
      values.push(node.value);
      const nextId = node.xorId ^ prevId;
      prevId = currId;
      currId = nextId;
    }

    return values;
  }

  #at(id: number): XorNode {
    const node = this.#nodes.get(id);
    if (node === undefined) {
      throw new Error(`표에 없는 id 를 따라갔다: ${id}`);
    }
    return node;
  }
}
```

#### 멈춤 — id를 0부터 주거나 prev를 잘못 갱신하면

XOR 연결 리스트에서 실수하기 쉬운 줄이 두 개 있습니다. 하나는 번호를 배열 인덱스처럼 0부터 주는 것이고, 다른 하나는 읽기 반복문에서 `prev`에 방금 계산한 다음 id를 넣는 것입니다.

```ts
#nextId = 0; // ← 1에서 바꿨다
prevId = nextId; // ← currId에서 바꿨다
```

두 줄을 하나씩 바꾼 참조 구현에 붙이기를 실행하고 읽어 보면 결과가 이렇게 달라집니다.

<!--proof:pitfalls-->

```text
바꾼 줄            붙인 값                    호출               바꾼 코드의 결과                    정본의 결과
#nextId = 0;       append 10                  toArray()          []                                  [10]
#nextId = 0;       append 10 · 0 · 30         toArray()          [0 30]                              [10 0 30]
prevId = nextId;   append 10 · 0 · 30         toArray()          [10 0]                              [10 0 30]
prevId = nextId;   append 10 · 0              toArray()          오류: 표에 없는 id 를 따라갔다: 3   [10 0]
prevId = nextId;   append 10 · 20 · 30 · 40   toArrayReverse()   오류: 표에 없는 id 를 따라갔다: 5   [40 30 20 10]
```

**id를 0부터 주면 첫 노드의 번호가 `NIL`과 같아집니다.** 원소 하나를 붙인 직후에 `headId`와 `tailId`가 0이라 리스트가 빈 것처럼 보이고, 둘째 붙이기도 빈 리스트에 붙이는 경우로 처리되어 `headId`를 덮어씁니다. 그래서 처음 붙인 10을 어느 순회도 읽지 못합니다. `size()`는 붙인 횟수를 세므로 계속 맞게 나와, 개수만 확인하는 테스트는 이 실수를 놓칩니다.

```text
id를 0부터 줄 때
append(10) 뒤    headId 0, tailId 0      → 빈 리스트와 같은 모양
append(0)        tailId 0 = NIL이라 빈 리스트로 처리 → headId를 1로 덮어씀
결과             id 0 노드의 10은 표에 남지만 어느 순회도 가지 않음
```

**`prev`에 다음 id를 넣으면 둘째 걸음부터 `prev`와 `curr`가 같아집니다.** 그러면 `xorId ^ curr`를 계산하게 되는데, `xorId`에는 자기 자신의 id가 섞여 있지 않으므로 이웃이 나오지 않습니다. 원소가 하나일 때는 첫 걸음에서 끝나서 결과가 맞고, 원소가 늘면 짧게 끝나거나 표에 없는 id를 찾다가 오류를 냅니다.

```text
바른 갱신   prev ← curr   다음 걸음: (반대쪽 이웃 ^ curr) ^ curr = 반대쪽 이웃
바꾼 갱신   prev ← 다음   다음 걸음: (두 이웃의 XOR) ^ 자기 id → 이웃이 아님
```

#### 4. Rust XOR 연결 리스트 — 노드 주소를 직접 XOR 한다

앞의 TypeScript XOR 구현은 주소 대신 번호를 쓰고, 번호로 노드를 찾으려고 `Map`을 둡니다. 원소 하나마다 노드 필드 셋과 `Map` 항목 둘이 필요하므로 이중 연결 리스트보다 메모리를 더 씁니다. 이 구조가 아끼려던 메모리는 번호가 아니라 **메모리 주소를 XOR** 해야 생깁니다. Rust 표준 라이브러리에는 포인터의 주소를 정수로 꺼내고, 계산한 정수를 다시 포인터로 바꾸는 함수가 있으므로 같은 구조를 주소로 구현할 수 있습니다.

Rust 노드는 값 `value`와, 이전 노드 주소와 다음 노드 주소를 XOR 한 정수 `xor_addr` 두 필드만 가집니다. 리스트는 첫 노드 포인터 `head`, 마지막 노드 포인터 `tail`, 원소 수 `count`를 기억합니다. 번호로 노드를 찾는 표도, 다음 번호를 세는 카운터도 없습니다.

```text
TypeScript 구현               Rust 구현
노드 id — 1부터 차례로 준다   노드 주소 — Box가 할당한 값
xorId                         xor_addr
NIL = 0                       널 포인터 = 주소 0
headId · tailId               head · tail 포인터
nodes.get(id)로 노드 찾기     포인터가 가리키는 노드를 바로 읽기
```

주소는 실행할 때마다 달라집니다. 아래 예는 노드 A, B, C가 읽기 쉬운 주소 `0x1000`, `0x1010`, `0x1030`에 할당되었다고 가정하고, 이웃이 없는 쪽은 주소 0으로 계산합니다.

<!--proof:rust-nodes-->

```text
노드   주소     값   이전 주소   다음 주소   xor_addr
A      0x1000   10   0x0000      0x1010      0x1010
B      0x1010   20   0x1000      0x1030      0x0030
C      0x1030   30   0x1010      0x0000      0x1010
```

B의 `xor_addr`인 `0x0030`은 A의 주소 `0x1000`과 C의 주소 `0x1030`을 XOR 한 값입니다. 읽기 규칙은 TypeScript 구현과 같습니다. 직전 노드의 주소 `prev`를 들고 `다음 주소 = xor_addr ^ prev`를 계산하며, 다음 주소가 0이면 멈춥니다.

<!--proof:rust-walk-->

```text
출발         prev     curr     xor_addr(curr)   다음 = xor_addr ^ prev        담은 값
앞에서부터   0x0000   0x1000   0x1010           0x1010 ^ 0x0000 = 0x1010         [10]
앞에서부터   0x1000   0x1010   0x0030           0x0030 ^ 0x1000 = 0x1030      [10 20]
앞에서부터   0x1010   0x1030   0x1010           0x1010 ^ 0x1010 = 0x0000   [10 20 30]
뒤에서부터   0x0000   0x1030   0x1010           0x1010 ^ 0x0000 = 0x1010         [30]
뒤에서부터   0x1030   0x1010   0x0030           0x0030 ^ 0x1030 = 0x1000      [30 20]
뒤에서부터   0x1010   0x1000   0x1010           0x1010 ^ 0x1010 = 0x0000   [30 20 10]
```

**붙이기에서는 주소를 정수로 꺼냅니다.** `Box::new`로 노드를 힙에 할당하고 `Box::into_raw`로 주소를 받습니다. 포인터의 `expose_provenance()`는 그 주소를 `usize` 정수로 돌려줍니다. 새 노드의 `xor_addr`에는 기존 마지막 노드의 주소를 넣고, 기존 마지막 노드의 `xor_addr`에는 새 노드의 주소를 한 번 XOR 합니다. TypeScript 구현의 `tail.xorId ^= id`와 같은 계산입니다.

**읽기에서는 계산한 정수를 포인터로 바꿉니다.** `ptr::with_exposed_provenance_mut(next)`가 정수 `next`를 포인터로 바꾸고, 결과가 널 포인터이면 반대쪽 끝을 지난 것이므로 멈춥니다. 노드를 읽는 `unsafe { &*curr }`는 이 주소가 살아 있는 노드라는 것을 작성자가 보장하는 자리입니다. 리스트가 살아 있는 동안 어떤 노드도 해제하지 않으므로, 계산한 주소는 붙인 노드 중 하나이거나 0입니다.

```text
TypeScript 구현의 멈춤       Rust 구현에서
id를 0부터 주는 실수         Box가 준 주소는 널이 아니므로 끝 표시 0과 겹치지 않음
prev에 다음 id를 넣는 실수   이웃이 아닌 주소가 계산됨 — 오류로 멈추지 않고 해제됐거나 없는 메모리를 읽음
```

TypeScript 구현은 잘못 계산한 id를 `Map`에서 찾지 못하면 오류를 던졌습니다. Rust 구현은 계산한 정수를 그대로 포인터로 바꿔 읽으므로, 같은 실수가 오류 메시지 대신 정의되지 않은 동작(undefined behavior)이 됩니다. 메모리를 직접 다루는 이득에는 이 검사를 작성자가 대신 맡는 부담이 따릅니다.

**메모리 해제도 구현이 맡습니다.** 가비지 수집기가 없으므로 리스트를 버릴 때 `Drop`이 앞에서부터 노드를 하나씩 `Box::from_raw`로 받아 해제합니다. 해제한 노드의 `xor_addr`는 읽을 수 없으므로, 다음 주소는 그 노드가 해제되기 전에 계산합니다.

```text
노드를 해제하기 전   node.xor_addr ^ prev로 다음 주소를 계산한다
노드를 해제한 뒤     그 노드의 xor_addr는 더 읽을 수 없다
```

정수로 계산한 주소를 포인터로 쓰는 일에 Rust가 두는 조건과 이 구현이 그 조건을 어떻게 만족하는지는 「TypeScript 의 한계와 대체 언어」에서 다룹니다.

#### Rust 구현 코드

다음은 `rust/structures/src/xor_linked_list.rs`의 구현입니다. 계약의 네 연산을 `append`, `to_array`, `to_array_reverse`, `size`로 옮겼고 값은 정수 `i64`입니다. `cargo test`가 저장소의 계약 test vector를 재생해 TypeScript 정본과 같은 결과를 내는지 확인합니다.

```rust guide-core=rust/structures/src/xor_linked_list.rs
/// 노드 하나. 값과 이웃 주소 두 개를 XOR 한 정수 하나만 둔다.
struct Node {
    value: i64,
    /// 이전 노드 주소 ^ 다음 노드 주소. 이웃이 없는 쪽은 주소 0 으로 센다.
    xor_addr: usize,
}

pub struct XorLinkedList {
    head: *mut Node,
    tail: *mut Node,
    count: usize,
}

impl XorLinkedList {
    pub fn new() -> Self {
        Self {
            head: ptr::null_mut(),
            tail: ptr::null_mut(),
            count: 0,
        }
    }

    pub fn append(&mut self, value: i64) {
        // 새 노드의 다음 노드는 아직 없다 — 기존 마지막 노드의 주소가 그대로 XOR 값이다.
        let xor_addr = self.tail.expose_provenance();
        let node = Box::into_raw(Box::new(Node { value, xor_addr }));
        let addr = node.expose_provenance();

        if self.tail.is_null() {
            self.head = node;
        } else {
            // 기존 마지막 노드의 다음 주소는 0 이었다. 새 주소를 한 번 XOR 하면 0 이 새 주소로 바뀐다.
            // SAFETY: tail 은 이 리스트가 할당하고 아직 해제하지 않은 노드다.
            unsafe { (*self.tail).xor_addr ^= addr };
        }

        self.tail = node;
        self.count += 1;
    }

    pub fn to_array(&self) -> Vec<i64> {
        self.walk(self.head)
    }

    pub fn to_array_reverse(&self) -> Vec<i64> {
        self.walk(self.tail)
    }

    pub fn size(&self) -> usize {
        self.count
    }

    /// 한쪽 끝에서 반대쪽 끝까지 읽는다. 두 방향이 같은 코드이고 출발 노드만 다르다.
    fn walk(&self, start: *mut Node) -> Vec<i64> {
        let mut values = Vec::with_capacity(self.count);
        let mut prev = 0usize;
        let mut curr = start;

        while !curr.is_null() {
            // SAFETY: curr 는 head·tail 이거나 이웃 노드의 xor_addr 에서 계산한 주소이고,
            // 리스트가 살아 있는 동안 어느 노드도 해제하지 않는다.
            let node = unsafe { &*curr };
            values.push(node.value);
            let next = node.xor_addr ^ prev;
            prev = curr.addr();
            curr = ptr::with_exposed_provenance_mut(next);
        }

        values
    }
}

impl Default for XorLinkedList {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for XorLinkedList {
    /// 앞에서부터 읽는 순서대로 노드를 하나씩 해제한다. 다음 주소는 해제하기 전에 계산한다.
    fn drop(&mut self) {
        let mut prev = 0usize;
        let mut curr = self.head;

        while !curr.is_null() {
            // SAFETY: curr 는 `Box::into_raw` 로 만든 노드이고, 이 반복에서 한 번만 되돌린다.
            let node = unsafe { Box::from_raw(curr) };
            let next = node.xor_addr ^ prev;
            prev = curr.addr();
            curr = ptr::with_exposed_provenance_mut(next);
        }
    }
}
```

노드가 실제로 요청하는 메모리는 테스트에서 할당기를 감싸 세었습니다(`rust/structures/tests/xor_linked_list.rs:126`). 비교를 위해 같은 테스트 파일에 노드마다 `prev`와 `next`를 따로 두는 Rust 이중 연결 리스트를 두었습니다.

| 64비트에서 잰 값 | Rust XOR 연결 리스트 | Rust 이중 연결 리스트 |
| --- | --- | --- |
| 노드 하나의 필드 | `value` · `xor_addr` | `value` · `prev` · `next` |
| 붙이기 한 번이 요청한 바이트 | 16 | 24 |
| 붙이기 1,024번이 요청한 할당 횟수와 바이트 | 1,024회 · 16,384 | 1,024회 · 24,576 |

요청한 바이트만 세었고, 할당기가 크기를 올림하거나 관리 정보를 덧붙이는 부분은 세지 않았습니다. TypeScript에서는 XOR 구현이 이중 연결 리스트보다 값 자리를 더 잡았지만, 주소를 직접 XOR 한 Rust 구현에서는 노드가 이중 연결 노드의 3분의 2 크기입니다.

### 불변식 — 저장 모양이 달라도 두 방향이 같은 수열을 읽는다

명세의 불변식은 두 가지입니다. 호출이 끝날 때마다 `size()`는 `toArray()`의 길이와 같고, `toArrayReverse()`는 `toArray()`를 뒤집은 배열과 같아야 합니다. 둘 다 같은 사실을 읽는 방법이 두 가지라서 필요한 규칙입니다. 원소 수를 세어 두는 값과 실제로 따라가며 읽은 원소 수가 갈라지거나, 두 방향 순회가 서로 다른 수열을 읽으면 하나의 수열이라고 할 수 없습니다.

```text
toArray()          [a₀, a₁, …, aₙ₋₁]      길이 = size()
toArrayReverse()   [aₙ₋₁, …, a₁, a₀]      같은 원소를 반대 순서로
```

세 구현은 이 두 규칙을 서로 다른 내부 규칙으로 지킵니다.

**동적 배열:** `values`의 0번부터 마지막 칸까지가 곧 수열입니다. 붙이기는 끝에 한 칸을 더하고, 두 순회는 같은 배열을 반대 방향으로 읽으므로 두 규칙이 항상 참입니다.

```text
values [10, 0, 30] → 앞에서부터 0 · 1 · 2번, 뒤에서부터 2 · 1 · 0번 → 길이 3 = size()
```

**이중 연결 리스트:** 비어 있으면 `head`와 `tail`이 모두 `null`이고 `count`는 0입니다. 비어 있지 않으면 `head.prev`와 `tail.next`가 `null`이고, 이웃한 노드 a와 b에 대해 `a.next === b`이면 `b.prev === a`입니다. 붙이기는 새 노드의 `prev`와 기존 마지막 노드의 `next`를 함께 고치고 `count`를 1 늘리므로 이 조건이 유지됩니다.

```text
[10] ↔ [0] 에 30 붙이기 → 새 노드 30.prev = 노드 0, 노드 0.next = 노드 30, tail = 노드 30, count 3
```

**XOR 연결 리스트:** 노드마다 `xorId = 이전 노드 id ^ 다음 노드 id`이고, 이웃이 없는 쪽은 `NIL`입니다. `headId`와 `tailId`는 양 끝 노드를 가리키고, `count`는 표에 든 노드 수와 같습니다. 붙이기는 새 노드와 기존 마지막 노드의 `xorId`를 모두 정의에 맞게 고칩니다. 이 규칙이 유지되면 어느 끝에서 출발해도 매 걸음 실제 이웃으로 이동하고, 반대쪽 끝을 읽은 직후 다음 id가 `NIL`이 되어 멈춥니다.

```text
id 1: NIL ^ 2 = 2    id 2: 1 ^ 3 = 2    id 3: 2 ^ NIL = 2    headId 1 · tailId 3 · count 3
```

기존 마지막 노드를 고치는 줄에서 XOR 대신 새 id를 그대로 덮어쓰면 규칙이 깨집니다.

```ts
tail.xorId = id; // ← tail.xorId ^= id 에서 바꿨다
```

<!--proof:mutant-overwrite-->

```text
붙인 값               호출               바른 코드    덮어쓴 코드         판정
append 10 · 20        toArray()          [10 20]      [10 20]             같다
append 10 · 20        toArrayReverse()   [20 10]      [20 10]             같다
append 10 · 20        size()             2            2                   같다
append 10 · 20 · 30   toArray()          [10 20 30]   [10 20 20 10]   어긋난다
append 10 · 20 · 30   toArrayReverse()   [30 20 10]   [30 20]         어긋난다
append 10 · 20 · 30   size()             3            3                   같다
```

원소가 둘일 때까지는 결과가 같습니다. 두 번째 붙이기에서 기존 마지막 노드(id 1)의 값이 0이었으므로 `0 ^ 2`와 `2`가 같기 때문입니다. 세 번째 붙이기에서 id 2의 값은 `1 ^ 3 = 2`가 되어야 하는데 3으로 덮어써져 이전 노드 1의 정보가 사라집니다.

```text
                    id 1   id 2   id 3
바른 코드의 xorId      2      2      2
덮어쓴 코드의 xorId    2      3      2    ← id 2에서 이전 노드 1이 지워짐

앞에서 읽기   id 1 → id 2 (3 ^ 1 = 2) → id 2 (3 ^ 2 = 1) → id 1 → 끝   값 10 20 20 10
뒤에서 읽기   id 3 → id 2 (3 ^ 3 = 0) → 끝                              값 30 20
```

앞에서 읽으면 2번 노드에서 1번으로 되돌아가 같은 노드를 두 번 읽고, 뒤에서 읽으면 2번 노드에서 멈춥니다. 명세의 불변식 검사 함수 두 개를 그대로 호출하면 이렇게 보고합니다.

<!--proof:mutant-overwrite-invariants-->

```text
붙인 값               불변식                       덮어쓴 코드에서
append 10 · 20        첫째 — size() 와 순회 길이   지킨다
append 10 · 20        둘째 — 두 방향의 수열        지킨다
append 10 · 20 · 30   첫째 — size() 와 순회 길이   순회 4개 / size 3
append 10 · 20 · 30   둘째 — 두 방향의 수열        앞→뒤 4개 / 뒤→앞 2개
```

### 수식 정의와 유도

원소가 n개인 리스트에서 앞에서부터 i번째 노드의 id를 `id(i)`라고 하고, 양 끝 바깥은 `id(-1) = id(n) = 0`으로 둡니다. 노드가 저장하는 값은 `x(i) = id(i - 1) ^ id(i + 1)`입니다.

앞에서부터 읽을 때 i번째 노드에 도착하면 `prev = id(i - 1)`입니다. 그러면 `x(i) ^ prev = id(i - 1) ^ id(i + 1) ^ id(i - 1) = id(i + 1)`이 되어 다음 노드가 나옵니다. 같은 수를 두 번 XOR 하면 0이 되고 0과의 XOR은 그대로이기 때문입니다. 뒤에서부터 읽을 때는 `prev = id(i + 1)`이므로 같은 계산이 `id(i - 1)`을 줍니다. 마지막 노드에서는 다음 id가 `id(n) = 0`이라 반복이 끝납니다.

```text
x(i)          = id(i − 1) ^ id(i + 1)
앞으로 읽기   prev = id(i − 1) → x(i) ^ prev = id(i + 1)
뒤로 읽기     prev = id(i + 1) → x(i) ^ prev = id(i − 1)
끝            id(−1) = id(n) = 0 = NIL
```

```ts
const ids = [1, 2, 3];
const x = (i: number) => (ids[i - 1] ?? 0) ^ (ids[i + 1] ?? 0);
x(1) ^ ids[0]; // 3: 앞에서 온 경우 다음 노드
x(1) ^ ids[2]; // 1: 뒤에서 온 경우 다음 노드
```

붙이기 규칙도 같은 식에서 나옵니다. 마지막 노드 `id(n - 1)`의 값은 `id(n - 2) ^ 0`이고, 새 노드가 붙으면 `id(n - 2) ^ id(n)`이어야 합니다. 차이는 `0`이 새 id로 바뀐 것뿐이므로 새 id를 한 번 XOR 하면 됩니다. id가 0이면 이 계산이 `NIL`과 구별되지 않으므로 id는 1부터 줍니다.

## 파트 2 — 비용을 따지고 구현을 고르기

### 비용 계산

#### 비용을 세는 과정

**동적 배열**은 칸이 남아 있으면 붙이기 한 번에 칸 하나를 씁니다. 칸이 가득 차면 두 배 크기로 옮기는데, 용량 8에서 시작한다면 복사하는 원소 수는 `8 + 16 + 32 + … + L`이고 합은 2L보다 작습니다. L개를 복사하려면 그 전에 L번 이상 붙였어야 하므로 m번 붙이는 총비용은 O(m)입니다. 두 순회는 원소 n개를 한 번씩 복사합니다.

```text
확장 때 복사량: 8 + 16 + 32 + … + L < 2L
L개까지 채우기 위한 붙이기: 적어도 L회
```

**이중 연결 리스트**는 붙이기마다 노드 하나를 만들고 기존 마지막 노드의 `next` 하나를 고칩니다. 원소 수와 무관하게 일정한 일만 하므로 최악 O(1)입니다. 두 순회는 노드 n개를 한 번씩 방문합니다.

**XOR 연결 리스트**의 참조 구현은 노드를 `Map`에서 찾을 때와 새 노드를 만들 때 비용 1을 셉니다. 걸음 표에서 T3은 빈 리스트에 붙여 새 노드만 만들었으므로 1, T4와 T5는 새 노드와 기존 마지막 노드 찾기로 2입니다. T7~T9와 T10~T12는 노드 하나를 읽을 때마다 1이고, T2와 T6의 `size()`는 1, 빈 리스트를 읽은 T1은 0입니다.

```text
빈 리스트에 붙이기       1    새 노드
원소가 있을 때 붙이기    2    새 노드 + 기존 마지막 노드 찾기
순회 한 번               n    노드마다 Map에서 한 번 찾기
size() 한 번             1

전개의 12걸음   붙이기 1 + 2 + 2, 순회 0 + 3 + 3, size() 1 + 1 → 합 13
```

빈 리스트에서 m번 붙이면 첫 번은 1, 나머지는 2라 합이 `2m - 1`입니다. 이 수치는 `Map`에서 한 번 찾거나 넣는 일을 1로 세는 측정 규칙을 따른 값이며, 엔진이 `Map` 내부 공간을 늘리는 작업은 따로 세지 않았습니다.

#### 케이스별 비용과 그 경계

| 항목 | 동적 배열 | 이중 연결 리스트 | XOR 연결 리스트 |
| --- | --- | --- | --- |
| 뒤에 붙이기 | 상각 O(1) | 최악 O(1) | 최악 O(1) |
| 앞에서부터 · 뒤에서부터 읽기 | 최악 O(n) | 최악 O(n) | 최악 O(n) |
| 원소 수 | 최악 O(1) | 최악 O(1) | 최악 O(1) |
| 큰 작업이 생기는 때 | 칸이 가득 찼을 때의 복사 | 없음 | 없음 |
| 원소 하나에 딸린 저장 | 값 한 칸, 여유 칸 별도 | 값 · 이전 · 다음 참조 | 노드 필드 셋 + `Map` 항목 |

명세가 붙이기를 상각 O(1)로 적은 것은 동적 배열처럼 가끔 복사하는 구현을 허용하기 위해서입니다. 이중 연결 리스트와 XOR 연결 리스트는 그보다 강한 최악 O(1)을 지키지만, 명세가 요구하는 것은 상각입니다. 두 순회는 어떤 구현이든 원소 n개를 돌려주므로 호출 한 번이 n에 비례하고, 여러 호출을 평균 내어 줄일 여지가 없어 최악 O(n)으로 적었습니다.

이 구현들에는 난수가 없습니다. 상각 O(1)은 흔한 입력의 평균이 아니라 어떤 순서로 m번 호출해도 성립하는 총비용의 상한입니다.

#### 최악을 만드는 입력

이 계약에서는 붙이기의 비용이 값에 의존하지 않고, 두 순회와 `size()`에는 인자가 없습니다. 그래서 구현마다 비용이 커지는 입력을 따로 생각해야 합니다.

- **동적 배열에서 칸이 막 가득 찬 순간의 붙이기:** 그 한 번에 원소 수만큼 복사합니다. 총비용은 O(m)이지만 한 호출의 지연은 원소 수에 비례합니다.
- **마지막 노드를 기억하지 않는 연결 리스트에 계속 붙이기:** 붙일 때마다 처음부터 끝까지 이동해 총 `n(n - 1) / 2`번 이동합니다. 명세의 붙이기 상한을 지키지 못합니다.
- **원소를 많이 붙인 뒤 순회:** 모든 구현에서 원소 수만큼 방문합니다. 이것은 결함이 아니라 계약이 허용한 비용입니다.
- **값 0, 음수, 중복값 붙이기와 원소 한두 개에서 읽기:** 값이나 경계 상태로 끝을 잘못 판단하지 않는지 확인합니다. XOR 연결 리스트의 덮어쓰기 실수는 원소 셋부터 나타났습니다.

```text
append 10 → append 20 → append 30 → toArray()     원소 셋에서 XOR 갱신 확인
append 0 → append 0 → toArrayReverse() → size()   값 0과 NIL 구분 확인
```

세 구현의 동작은 단순한 배열을 정답 모델로 두고 확인했습니다. 같은 붙이기를 보내고 매번 `size()`와 두 순회를 비교합니다.

<!--proof:implementations-->

```text
원고의 세 구현 코드와 정본: 각각 배열 모델과 대조해 일치
빈 수열 · 값 0 두 번 · 음수 · 중복 · 무작위 붙이기 20,000회 뒤 size() · toArray() · toArrayReverse()
```

#### TypeScript 의 한계와 대체 언어

이 저장소는 자료구조마다 TypeScript만으로 계약을 지키고 그 구조의 존재 이유까지 확인할 수 있는지 구분해 둡니다. XOR 연결 리스트의 네 연산은 TypeScript로 표현되고 실제로 지켜집니다. Rust 같은 다른 언어가 있어야 표현할 수 있는 조건은 없습니다. 하지만 이 구조가 만들어진 이유인 **메모리 절약**은 TypeScript에서 측정할 수 없습니다.

TypeScript는 객체 하나가 몇 바이트인지, `Map`이 실제로 몇 칸을 잡는지 알려 주지 않습니다. 그래서 원소 하나를 담으려고 잡는 값 자리(숫자 하나 또는 참조 하나)를 소스에서 세었습니다. 객체 헤더, 해시 표의 여유 칸, 정렬을 위한 빈 공간은 세지 않았으므로 아래 수는 **하한**입니다.

```text
원소 하나에 딸린 값 자리

주소를 정수로 다루는 언어의 XOR 노드   값 + (이전 주소 ^ 다음 주소)                = 2
같은 언어의 이중 연결 노드              값 + 이전 + 다음                             = 3
이 저장소의 TypeScript XOR 구현         노드 {id, value, xorId} 3 + Map 키·값 2      = 5
TypeScript 이중 연결 노드               {value, prev, next}                          = 3
```

이론상으로는 3을 2로 줄이려는 구조인데, TypeScript 구현은 번호로 노드를 찾는 표 때문에 5를 씁니다. 세지 않은 부분까지 더하면 차이는 더 커집니다.

**주소를 직접 다루는 Rust로 옮기면 절약이 실제로 생깁니다.** 「4. Rust XOR 연결 리스트」의 구현은 노드 하나에 16바이트를 요청하고, 같은 테스트의 Rust 이중 연결 노드는 24바이트를 요청합니다. 위 표의 2와 3이 8바이트 워드 단위로 그대로 나온 값입니다.

```text
Rust에서 노드 하나가 요청한 바이트 (64비트)

XOR 노드         value 8 + xor_addr 8        = 16
이중 연결 노드   value 8 + prev 8 + next 8   = 24
```

다만 Rust는 정수로 계산한 주소를 포인터로 쓰는 일에 조건을 둡니다. 표준 라이브러리 문서는 포인터가 어느 메모리 할당에서 왔는지(provenance)를 함께 추적하는 규칙을 설명하며, 주소로 비트 연산을 하는 것은 조건부로 허용합니다. *"So you're still able to drop down to the address representation and do whatever clever bit tricks you want as long as you're able to keep around a pointer into the allocation you care about that can "reconstitute" the provenance."* 노드마다 따로 할당하면 XOR 노드에는 두 주소를 섞은 정수만 남고, 다음 노드의 할당을 가리키는 포인터가 없어 이 조건(Strict Provenance)을 만족하지 못합니다. 그래서 이 글의 Rust 구현은 주소를 꺼낼 때 `expose_provenance`로 공개하고, 계산한 정수를 `with_exposed_provenance_mut`로 포인터로 바꾸는 Exposed Provenance 방식을 씁니다. 문서는 이 방식에 대해 *"the semantics of Exposed Provenance are on much less solid footing than Strict Provenance"*, *"Exposed Provenance will not work (well) with tools like Miri and CHERI."*라고 적습니다. ([`std::ptr` 모듈 문서](https://doc.rust-lang.org/std/ptr/index.html), 조회 2026-09-13)

```text
노드마다 따로 할당        다음 노드의 할당을 가리키는 포인터가 없어 Exposed Provenance가 필요함 — 이 글의 구현
노드를 한 덩어리에 할당   덩어리 포인터로 출처를 복원할 수 있지만, 뒤에만 붙이면 이웃이 바로 옆 칸이라 XOR이 필요 없음
```

노드를 한 덩어리에 할당하면 Strict Provenance를 지킬 수 있지만, 이 계약처럼 뒤에만 붙이는 경우 노드가 붙인 순서대로 칸에 놓이므로 이웃의 위치를 저장할 필요가 없어지고 동적 배열과 같은 구조가 됩니다. 노드마다 따로 할당해야 XOR 연결 리스트로서 의미가 있으므로 이 글은 첫 번째 방법을 택했고, 확인한 범위는 `cargo test`의 test vector 재생과 요청 바이트 계측입니다. Miri로는 검사하지 않았습니다.

절약이 실제로 생기는 조건은 셋입니다. 객체를 이동하는 가비지 수집기가 없어야 하고, 주소를 정수로 꺼낼 수 있어야 하며, 계산으로 만든 주소를 유효한 포인터로 쓸 수 있어야 합니다. TypeScript는 앞의 두 조건을 만족하지 못합니다. Rust는 Exposed Provenance를 쓰면 세 조건을 모두 만족하고, C와 어셈블리도 여기에 해당합니다.

### 이 구조가 최적의 선택인 경우

#### 최적인 요구의 모양

뒤에만 붙이고 전체를 두 방향으로 읽으며 가운데를 건드리지 않는다면 이 계약이 요구에 맞습니다. 어느 구현을 고를지는 다음 조건에 따라 달라집니다.

**동적 배열**은 원소 하나에 값 한 칸만 쓰고 연속된 칸을 차례로 읽으므로, TypeScript에서 이 계약만 필요할 때 가장 단순합니다. 대신 칸이 가득 찬 순간의 붙이기 한 번이 원소 수만큼 복사합니다. **이중 연결 리스트**는 붙이기 한 번의 비용이 늘 일정해야 하거나, 이미 만든 노드를 옮기지 않아야 할 때 적합합니다. **XOR 연결 리스트**는 노드마다 이웃 정보 하나를 줄이는 것이 실제 제약이고, 주소를 정수로 다룰 수 있는 언어로 구현할 때만 의미가 있습니다. TypeScript에서는 이중 연결 리스트보다 메모리를 더 쓰므로 이 저장소의 TypeScript 구현은 원리와 그 대가를 확인하는 용도이고, 노드가 실제로 작아지는 것은 Rust 구현에서 16바이트 대 24바이트로 확인했습니다.

#### 이 구조를 떠올리게 하는 연산 조합

측정값을 계속 기록하면서 화면에는 최신순으로, 파일에는 발생순으로 내보내는 요구를 연산으로 옮기면 `append`, `toArrayReverse`, `toArray`입니다. 측정 m번이면 붙이기 m번, 화면을 갱신할 때마다 순회 한 번, 파일로 내보낼 때마다 순회 한 번입니다. 세 연산이 모두 계약에 있습니다.

반면 되돌리기와 다시 하기 기록은 되돌린 뒤 새 작업을 하면 뒤쪽 기록을 버려야 하는데, 그 연산이 이 계약에 없습니다. 또 위의 측정 기록 예는 동적 배열로도 같은 연산이 됩니다. 그래서 연산 조합만으로는 XOR 연결 리스트를 고를 이유가 생기지 않고, **노드당 메모리가 제약이며 주소를 정수로 다루는 언어로 구현한다**는 조건이 함께 있어야 합니다.

#### 실제로 쓰이는 곳

Linux Journal의 「A Memory-Efficient Doubly Linked List」(Prokash Sinha, 2004)는 이 구조를 C로 제안한 글입니다. 첫 문단이 목적을 적었습니다. *"In the quest to make small devices cost effective, manufacturers often need to think about reducing the memory size."* 방법은 *"Pointer difference is captured by using exclusive OR."*입니다. 제품에 들어간 기록이 아니라 제안입니다. ([linuxjournal.com/article/6828](https://www.linuxjournal.com/article/6828), 조회 2026-09-13)

리눅스 커널의 기본 연결 리스트 노드는 참조 두 개를 따로 둡니다. `include/linux/types.h`의 정의가 `struct list_head { struct list_head *next, *prev; };`입니다. 해시 표처럼 머리 노드가 많아 메모리가 문제인 곳에서는 XOR 대신 머리를 포인터 하나로 줄인 `hlist_head`를 두었고, `include/linux/list.h`의 주석이 그 대가를 적었습니다. *"Double linked lists with a single pointer list head. Mostly useful for hash tables where the two pointer list head is too wasteful. You lose the ability to access the tail in O(1)."* ([`types.h`](https://github.com/torvalds/linux/blob/master/include/linux/types.h) · [`list.h`](https://github.com/torvalds/linux/blob/master/include/linux/list.h), 조회 2026-09-13)

```text
Linux Journal 제안   노드마다 이웃 포인터 둘 → XOR 값 하나      C, 작은 기기
리눅스 커널          노드는 포인터 둘 그대로                    해시 표 머리만 포인터 하나로 줄이고 마지막 노드 접근을 포기
```

제품 코드에 XOR 연결 리스트가 도입된 사례는 찾지 못했습니다(조회 2026-09-13).

#### 경쟁 설계와의 대조

[비용 측정 코드](./xorLinkedList-guide.alt.ts)는 세 구현에 값 1,024개를 뒤에 붙이는 같은 연산열을 실행하고, 원소를 담으려고 쓰거나 잡은 값 자리를 셉니다. 동적 배열은 용량 8에서 시작해 가득 차면 두 배로 늘린다고 두었습니다. 단위가 값 자리이므로 실행 시간이나 실제 바이트 수로 해석하면 안 됩니다.

| 측정 항목 | XOR 연결 리스트 | 동적 배열 | 이중 연결 리스트 |
| --- | --- | --- | --- |
| 붙이기 한 번이 쓴 값 자리의 최댓값 | 6 | 513 | 4 |
| 붙이기 1,024번이 쓴 값 자리 | 6,143 | 2,040 | 4,095 |
| 붙인 뒤 잡고 있는 값 자리 | 5,120 | 1,024 | 3,072 |

동적 배열은 513번째 붙이기에서 원소 512개를 새 배열로 옮기고 값 하나를 써서 한 번에 513을 썼습니다. 대신 전체로 쓴 값 자리와 잡고 있는 값 자리는 가장 적습니다. 연결 리스트 두 구현은 붙이기 한 번이 일정하지만 원소마다 여러 칸을 잡습니다. XOR 연결 리스트는 세 항목 모두 이중 연결 리스트보다 많습니다. 원소 하나에 노드 필드 셋과 `Map` 항목 둘을 쓰기 때문입니다. 이 표는 TypeScript 구현을 센 값이며, 주소를 직접 XOR 하는 Rust 구현에서는 붙이기 1,024번이 16,384바이트를 요청해 Rust 이중 연결 리스트의 24,576바이트보다 적습니다.

| 선택할 때 먼저 물을 질문 | 검토할 구현 | 확인할 부담 |
| --- | --- | --- |
| 저장 공간과 전체 작업량이 가장 중요한가? | 동적 배열 | 가득 찬 순간의 복사 |
| 붙이기 한 번의 비용이 늘 일정해야 하는가? | 이중 연결 리스트 | 원소마다 참조 두 개 |
| 노드당 참조 하나를 줄여야 하고 주소를 정수로 다룰 수 있는가? | XOR 연결 리스트 | 이웃 하나를 알아야 이동 가능, 디버깅이 어려움 |

### 스스로 점검하기

1. T4에서 10에 이어 0을 붙였습니다. 이때 `xorId`가 바뀐 노드는 몇 개이고, 각각 어떤 값이 되었나요? 붙인 값이 0이 아니라 20이었다면 달라지는 것이 있을까요?
2. T10~T12는 T7~T9와 같은 노드 표를 읽었지만 결과가 반대입니다. 두 순회에서 달라진 것은 출발 id뿐인데, 왜 같은 `xorId` 값에서 반대 방향의 노드가 계산되나요?
3. `toArrayReverse()`를 `this.toArray().reverse()`로 바꾸면 결과는 같습니다. 그 대신 기존 마지막 노드의 값을 덮어쓰는 실수가 있을 때, 명세의 두 불변식 검사 중 어느 쪽이 그 실수를 더는 발견하지 못하게 될까요?
4. T3에서 TypeScript 구현은 첫 노드에 id 1을 주었습니다. Rust 구현에는 id를 1부터 줘야 한다는 주의가 없는데, 무엇이 끝 표시 0과 겹칠 가능성을 없앴나요? 반대로 `prev`에 다음 주소를 넣는 실수는 Rust 구현에서 TypeScript 구현과 어떻게 다르게 나타나나요?

네 질문을 설명할 수 있다면, 이 계약의 사용법을 넘어 각 구현이 두 방향 읽기를 어떻게 준비하는지, 그리고 그 준비가 저장 비용을 어떻게 정하고 언어에 따라 어떻게 달라지는지 이해한 것입니다.
