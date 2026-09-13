# 덱 — 원소를 옮기지 않고 앞 끝의 칸 번호만 옮긴다

## 파트 1 — 계약에서 동작하는 코드까지

덱이 약속하는 것을 먼저 한 장으로 보고, 그 약속을 가장 단순한 구현들이 어디서 못 지키는지 수치로
확인한 다음, 원소를 옮기지 않는 설계에 이르러 실제로 동작하는 코드를 한 조각씩 만듭니다.

### 전체 컨셉

덱(deque, double-ended queue)은 **한 수열의 앞 끝과 뒤 끝 양쪽에서** 원소를 넣고, 빼고, 볼 수 있는
그릇입니다. 연산은 여덟이고, 넷은 넣고 빼는 일이고 넷은 상태를 바꾸지 않고 읽는 일이에요.

```text
                 앞 끝                              뒤 끝
  pushFront(x) →   [  0    1    2    3  ]   ← pushBack(x)
  popFront()   ←                              → popBack()
  peekFront()      0                   3        peekBack()

  isEmpty()  원소가 하나도 없는가       size()  원소가 몇 개인가
```

덱의 약속은 **어느 끝을 건드리든 비용이 원소 수와 무관하다**는 것입니다. 어려운 자리는 「앞」이에요.
배열은 뒤 끝 칸 하나를 쓰는 데 원소 수와 무관한 비용이 들지만, 앞에 한 칸을 만들려면 이미 든 원소를
전부 한 칸씩 뒤로 옮겨야 합니다. 원소가 1,000 개면 앞에 넣을 때마다 1,000 칸을 옮겨요.

이 글이 만드는 설계는 그 옮기는 일을 **정상 경로에서 없앱니다.** 크기가 정해진 칸 묶음을 잡아 두고,
앞 끝 원소가 몇 번 칸에 있는지를 정수 하나 `head` 로 들고, 들어 있는 원소 수를 정수 하나 `count`
로 듭니다. 앞에 넣는 일은 `head` 를 하나 줄이고 그 칸에 쓰는 일이 되고, 번호가 0 밑으로 내려가면
**마지막 칸 번호로 감습니다**. 이 「감기」가 칸 묶음을 원처럼 이어 붙여 쓰게 해 줘서, 이런 구조를
링 버퍼(ring buffer)라고 부릅니다.

```text
칸 8 개.  pushBack(1) · pushBack(2) · pushFront(0) 을 차례로 부른 뒤

  칸 번호     0   1   2   3   4   5   6   7
  칸 내용     1   2   ·   ·   ·   ·   ·   0
              │                           └ head = 7   앞 끝
              └ 앞 끝에서 한 칸 더 가면 0 번 칸으로 감긴다

  앞 끝부터 읽은 순서   0 → 1 → 2      count = 3
  pushFront(0) 은 원소 1 · 2 를 옮기지 않았다. head 만 0 에서 7 로 바뀌었다
```

**원소를 옮기는 때는 칸이 가득 찼을 때 하나뿐입니다.** 그때 칸 수를 두 배로 늘리고, 앞 끝 원소부터
차례로 새 칸의 0 번부터 옮깁니다. 이 한 번의 호출은 원소 수만큼 칸을 지나가지만, 칸 수가 두 배씩
늘기 때문에 그런 호출은 드물어서 **여러 번 부른 평균**은 원소 수와 무관한 값에 머물러요.

| 연산 묶음 | 한 번 부를 때 지나가는 칸 | 여러 번 부른 평균 |
| --- | --- | --- |
| 넣기 둘 | 보통 1 · 칸이 가득 찬 순간에는 원소 수 + 1 | 원소 수와 무관한 상수 |
| 빼기 둘 | 1 (빈 덱이면 0) | 원소 수와 무관한 상수 |
| 보기 넷 | 1 | 원소 수와 무관한 상수 |

### 시작하기 전에 — 이미 알고 있어야 하는 것

- **배열 칸 하나를 번호로 읽고 쓰는 비용은 배열 길이와 무관합니다.** `a[5]` 를 읽는 데 칸이 8 개든
  8,000 개든 같은 일을 해요.
- **나머지 연산 `%`.** `9 % 8` 은 1 입니다. TypeScript 에서는 **앞 수가 음수면 결과도 음수**라
  `-1 % 8` 이 7 이 아니라 -1 이에요. 이 글은 이 자리에서 한 번 멈춰 값으로 확인합니다.
- **스택과 큐.** 스택은 한쪽 끝만 열려 있고, 큐는 넣는 끝과 빼는 끝이 서로 정해져 있습니다. 덱은 두
  끝을 다 여는 것이라 둘을 합친 모양이에요. 흐릿하면 [`stack` 가이드](../stack/stack-guide.mdx)와
  [`queue` 가이드](../queue/queue-guide.mdx)를 먼저 보세요.
- **칸이 모자라면 두 배로 늘리는 배열.** 뒤에 넣다가 칸이 가득 차면 두 배 크기로 옮겨 담는 동작이
  [`dynamicArray` 가이드](../dynamicArray/dynamicArray-guide.mdx)에 있습니다. 이 글은 같은 동작을
  **앞 끝까지** 넓힙니다.

```text
이 글이 다루는 것          양 끝에서 넣고 빼고 보는 여덟 연산
이 글이 다루지 않는 것     가운데 원소를 번호로 읽는다              → dynamicArray
                          크기를 고정하고 가득 차면 덮어쓴다      → circularBuffer
                          창 안의 최댓값을 함께 답한다            → monotonicQueue
```

- 크기를 고정한 링 버퍼는 [`circularBuffer` 가이드](../circularBuffer/circularBuffer-guide.mdx)가,
  덱 위에 최댓값 질의를 더한 구조는 [`monotonicQueue` 가이드](../monotonicQueue/monotonicQueue-guide.mdx)가
  다룹니다.

### 설계 상세 — 링 버퍼에 이르는 과정

**먼저 계약을 읽습니다.** 자료구조는 문제를 고정하지 않아요 — 무엇을 지켜야 하는지가 이미
[`deque.ts`](./deque.ts) 헤더에 계약으로 적혀 있습니다. 여기서 볼 것은 그 계약이 **무엇을 막는지**와
**조건 하나를 풀면 무엇이 되는지**예요.

```text
계약에 없는 것     가운데 원소를 번호로 읽기 · 값으로 찾기 · 처음부터 끝까지 차례로 읽기
                   └ 이것들을 요구하지 않으니 원소를 한 줄로 붙여 둘 의무도 없다

조건 하나를 풀면
  앞 끝 비용을 원소 수에 비례하게 풀면  → 앞뒤로 읽을 수 있는 배열일 뿐이다
  한쪽 끝을 닫으면                      → 스택이다
  넣는 끝과 빼는 끝을 서로 정해 두면    → 큐다
```

이 글이 끝까지 쓰는 기호는 일곱이에요. 여기서 정하고 뒤에서 뜻을 바꾸지 않습니다.

| 기호 | 무엇인가 | 코드에서 |
| --- | --- | --- |
| `n` | 원소 수. 비용을 잴 때는 같은 `n` 으로 호출 횟수도 정한다 — 넣기만 `n` 번이면 원소가 `n` 개다 | — |
| `c` | 잡아 둔 칸 수 | `this.#slots.length` |
| `head` | 앞 끝 원소가 놓인 칸 번호 | `this.#head` |
| `count` | 지금 들어 있는 원소 수 | `this.#count` |
| `wrap(i)` | 번호 `i` 를 `0` 부터 `c − 1` 사이로 감싼 값 | `this.#wrap(i)` |
| `C(n)` | 크기 `n` 에서 잰 **연산 한 번당 지나간 칸 수의 평균** | 계약 스위트 축3 |
| `r` | 성장률 `C(4n) / C(n)` — `n` 을 네 배로 키웠을 때 연산당 비용이 몇 배가 되는가 | 계약 스위트 축3 |

**자료구조에서는 입력 크기 하나가 비용을 정하지 않습니다.** 어떤 연산이 어떤 순서로 섞여 들어오는가가
정해요. 계약 스위트가 재는 호출 패턴은 넷이고, 이 글도 그 넷으로 구현을 시험합니다.

```text
앞으로만 넣기             pushFront 를 n 번
뒤로 넣고 앞으로 빼기     pushBack 을 n 번 → popFront 를 n 번          큐로 쓸 때의 모양
번갈아 앞뒤로 빼기        pushBack 을 n 번 → popFront · popBack 교대    양 끝을 좁혀 오며 비교할 때의 모양
앞뒤 섞어 넣기            pushFront 와 pushBack 을 무작위로 n 번
```

**가장 단순한 구현부터 세웁시다.** 배열 하나를 두고 뒤는 `push`·`pop`, 앞은 `unshift`·`shift` 를
씁니다. 여덟 연산이 한 줄씩이면 끝나요.

```ts
class OneArray<T> {
  #a: T[] = [];
  pushFront(item: T): void { this.#a.unshift(item); }   // 든 원소 전부가 한 칸씩 뒤로 옮겨진다
  pushBack(item: T): void { this.#a.push(item); }
  popFront(): T | null { return this.#a.length === 0 ? null : (this.#a.shift() as T); }
  popBack(): T | null { return this.#a.length === 0 ? null : (this.#a.pop() as T); }
  // peekFront · peekBack · isEmpty · size 는 칸 하나나 length 를 읽는다
}
```

이 구현을 계약 스위트의 「앞으로만 넣기」 시나리오에 넣고, 정본과 같은 단위(**칸 하나를 지나갈 때마다
1**)로 셉니다.

<!--proof:naive-front-->

```text
앞으로만 n 번 넣기 — 배열 하나(unshift)

n        연산당 칸 수   r = C(4n)/C(n)
1,024          512.50                —
4,096        2,048.50             4.00
16,384       8,192.50             4.00

계약 스위트 판정: 실패 (amortized 상한의 기대 r = 1.00, 허용 ±30%)
```

`n` 을 네 배로 키우니 연산당 비용도 네 배가 됐습니다. 계약은 `n` 과 무관한 상수를 요구하므로 기대하는
`r` 은 1.00 이고, 4.00 은 **연산 한 번이 원소 수에 비례한다**는 뜻이에요. `n = 16,384` 에서 앞에 한 번
넣을 때 평균 8,192.50 칸을 지나갑니다. 계약 스위트가 시간이 아니라 칸 수를 세는 데는 이유가 있어요 —
엔진은 `shift` 를 「시작 위치만 옮기는」 식으로 최적화하기도 해서 시간을 재면 이 구현이 통과할 수
있는데, 언어 명세는 그 최적화를 약속하지 않습니다.

```text
r = 4.00   n 을 네 배로 키우면 연산당 비용도 네 배   → 연산 한 번이 n 에 비례한다
r = 1.00   n 을 네 배로 키워도 연산당 비용이 그대로  → 계약이 요구하는 값
```

**배열에서 원소 수와 무관한 비용이 보장되는 자리는 끝 하나뿐입니다.** 그러면 끝을 둘 만들면 되지
않을까요? 배열 두 개를 등 맞대어 둡니다. `front` 는 앞쪽 원소를 **거꾸로**, `back` 은 뒤쪽 원소를
정순으로 담아요. 앞에 넣는 일은 `front.push` 가 되고, 빼려는 쪽 배열이 비었을 때만 반대쪽 원소를 전부
뒤집어 옮깁니다. 원소 여섯을 뒤로 넣은 뒤 앞뒤를 번갈아 빼 봅시다.

<!--proof:two-arrays-walk-->

```text
호출         front         back            옮긴 원소   돌려준 값   옮긴 원소 누계
시작         []            [1 2 3 4 5 6]           —           —                —
popFront()   [6 5 4 3 2]   []                      6           1                6
popBack()    []            [2 3 4 5]               5           6               11
popFront()   [5 4 3]       []                      4           2               15
popBack()    []            [3 4]                   3           5               18
popFront()   [4]           []                      2           3               20
popBack()    []            []                      1           4               21
```

첫 `popFront()` 에서 `front` 가 비어 있어 `back` 의 여섯을 전부 옮겼습니다. 그러고 나니 `back` 이
비었고, 바로 다음 `popBack()` 이 그 빈 쪽을 찾아서 다섯을 도로 옮겨요. **옮기면 옮긴 쪽이 반드시 비고,
번갈아 빼는 호출은 매번 그 빈 쪽을 찾습니다.** 여섯 번 빼는 데 옮긴 원소가 6 + 5 + 4 + 3 + 2 + 1 =
21 이에요. 여기까지가 준비이고, 이제 비용은 「원소를 몇 번 옮기는가」 하나로 정리됩니다.

```text
배열 두 개의 비용 = 넣기 횟수 + 빼기 횟수 + 옮긴 원소 수
                                          └ 이 항만 원소 수에 비례할 수 있다
```

**그 항이 무엇에 달렸는지 재 봅시다.** 같은 설계를 두 호출 패턴에 넣어 연산당 비용을 셉니다.

<!--proof:two-arrays-patterns-->

```text
n                  뒤로 넣고 앞으로 빼기   번갈아 앞뒤로 빼기
1,024                               1.50               513.50
4,096                               1.50             2,049.50
16,384                              1.50             8,193.50
r = C(4n)/C(n)               1.00 · 1.00          3.99 · 4.00
계약 스위트 판정                    통과                 실패
```

같은 구현이 한 패턴에서는 연산당 1.50 칸으로 통과하고, 다른 패턴에서는 `r` 이 4.00 으로 실패합니다.
뒤로 넣고 앞으로만 빼면 원소 하나가 `back` 에서 `front` 로 **딱 한 번** 옮겨지고 다시 옮겨질 일이
없어요. 번갈아 빼면 같은 원소가 두 배열 사이를 몇 번이고 오갑니다. 관찰은 이것입니다 —
**옮기는 일이 원소 수가 아니라 호출 순서에 묶여 있으면, 어떤 순서가 들어오느냐에 따라 비용이 한
차수 달라진다.**

```text
뒤로 넣고 앞으로 빼기     원소 하나가 옮겨지는 횟수   1 번         → 연산당 상수
번갈아 앞뒤로 빼기        원소 하나가 옮겨지는 횟수   남은 수만큼   → 연산당 원소 수에 비례
```

**그러면 옮기는 일을 호출 순서가 아니라 칸 수에만 묶어 봅니다.** 원소는 제자리에 두고 「앞 끝이 몇 번
칸인가」만 정수로 들고 있으면, 앞에 넣든 앞에서 빼든 그 정수만 바뀌고 원소는 안 옮겨져요. 옮기는
일은 칸이 모자랄 때 하나만 남습니다. 두 끝을 어떻게 들지부터 정해야 하는데, 가장 단순한 후보는
**끝 번호 둘**입니다 — 앞 끝 원소가 있는 칸 `head` 와, 다음 뒤 원소가 들어갈 칸 `tail`.

<!--proof:head-tail-->

```text
칸 8 개의 상태           끝 번호 둘로 들 때   앞 번호와 개수로 들 때
빈 덱                    head 0 · tail 0      head 0 · count 0
pushBack 을 1 번 한 뒤   head 0 · tail 1      head 0 · count 1
pushBack 을 8 번 한 뒤   head 0 · tail 0      head 0 · count 8
```

**끝 번호 둘로는 빈 덱과 가득 찬 덱이 같은 모양입니다.** 칸 8 개에 여덟을 넣으면 `tail` 이 한 바퀴를
돌아 0 으로 오고, 빈 덱도 `head 0 · tail 0` 이에요. 이 두 상태를 가르려면 칸 하나를 늘 비워 두거나
무언가를 더 들어야 합니다. 이 글은 `tail` 대신 **원소 수 `count`** 를 듭니다. 그러면 두 상태가 `count
0` 과 `count 8` 로 갈리고, 뒤 끝 칸 번호는 `head` 와 `count` 로 계산돼요.

```text
빈 덱          head 0 · count 0
가득 찬 덱      head 0 · count 8      ← count 가 두 상태를 가른다
뒤 끝 원소 칸   head 에서 count − 1 칸 뒤    다음 뒤 칸   head 에서 count 칸 뒤
```

이제 개념을 정의합니다. 칸 번호를 칸 수 `c` 로 **감싸는** 함수 `wrap(i)` 는 어떤 정수 `i` 든 `0` 부터
`c − 1` 사이로 보냅니다. 나머지를 두 번 하는 모양인 이유는 값으로 보면 확인돼요.

<!--proof:wrap-->

```text
index   index % 8   ((index % 8) + 8) % 8
-1             -1                       7
-8             -0                       0
0               0                       0
7               7                       7
8               0                       0
9               1                       1
```

`-1` 은 7 로, `8` 은 0 으로, `9` 는 1 로 감깁니다. 나머지를 한 번만 하면 음수가 음수로 남는데, `c` 를
한 번 더해 양수로 만든 뒤 다시 나머지를 하면 음수도 감겨요. 이 함수로 두 정수의 범위와 뒤 끝 칸이 이렇게
정해집니다.

```text
head        0 ≤ head ≤ c − 1        앞에 넣으면 wrap(head − 1), 앞에서 빼면 wrap(head + 1)
count       0 ≤ count ≤ c           넣으면 1 늘고 빼면 1 준다. c 에 이르면 넣기 전에 칸을 늘린다
뒤 끝 칸     wrap(head + count − 1)  count ≥ 1 일 때만 뜻이 있다
다음 뒤 칸   wrap(head + count)      pushBack 이 쓸 칸
앞에서 i 번째 원소   wrap(head + i) 번 칸
```

**상태가 실제로 유지되는지 값으로 확인합시다.** 쉬운 경우는 감기지 않을 때예요 — 칸 번호가 0 부터
차례로 차니 `head` 가 0 에 머뭅니다. 불안한 경우는 둘입니다. 앞에 넣다가 번호가 음수로 내려갈 때, 그리고
**감긴 채로 칸이 가득 차서 늘려야 할 때**예요. 아래는 스물세 번짜리 호출 열에서 그 자리들을 고른 것입니다.

<!--proof:wrap-states-->

```text
순서      호출            칸 배치                            head   count    앞 끝부터 읽은 순서
4 번째    pushBack(1)     1 · · · · · · ·                       0       1                    [1]
5 번째    pushBack(2)     1 2 · · · · · ·                       0       2                  [1 2]
6 번째    pushFront(0)    1 2 · · · · · 0                       7       3                [0 1 2]
9 번째    popFront()      1 2 · · · · · ·                       0       2                  [1 2]
17 번째   pushFront(0)    1 2 3 4 5 6 7 0                       7       8      [0 1 2 3 4 5 6 7]
19 번째   pushFront(-1)   0 1 2 3 4 5 6 7 · · · · · · · -1     15       9   [-1 0 1 2 3 4 5 6 7]
```

4·5 번째는 쉬운 경우라 `head` 가 0 이고 칸 0·1 에 차례로 들어갑니다. 6 번째 `pushFront(0)` 에서 번호
`0 − 1` 이 `wrap` 으로 7 이 되고, 원소 1·2 는 그대로 있는데 앞 끝부터 읽은 순서가 `[0 1 2]` 가 됐어요.
9 번째 `popFront()` 는 `wrap(7 + 1) = 0` 으로 `head` 를 되돌립니다. 17 번째에서 칸 8 개가 감긴 채로
가득 찼고(`head` 7), 19 번째에서 칸을 16 개로 늘렸어요. **늘릴 때 원소를 앞 끝부터 차례로 새 칸 0 번부터
옮기고 `head` 를 0 으로 되돌리기** 때문에, 옮긴 직후 앞에서 `i` 번째 원소가 곧 `i` 번 칸입니다. 옮기는
반복문이 `offset` 을 `0` 부터 `count − 1` 까지 한 번씩 거치므로 어느 원소도 빠지거나 두 번 옮겨지지 않고,
그 뒤에 `head` 가 `wrap(0 − 1) = 15` 로 감겨 새 원소 -1 이 앞 끝에 놓였어요.

```text
19 번째 호출 pushFront(-1) 의 안쪽
  늘리기 전   칸 8 개   1 2 3 4 5 6 7 0     head 7   앞 끝부터 0 1 2 3 4 5 6 7
  옮긴 뒤     칸 16 개  0 1 2 3 4 5 6 7 · · · · · · · ·     head 0
  쓴 뒤       칸 16 개  0 1 2 3 4 5 6 7 · · · · · · · -1    head 15   앞 끝부터 -1 0 1 … 7
```

**마지막으로 칸을 얼마나 늘릴지를 값으로 정합니다.** 한 번에 늘리는 양이 작으면 옮기는 호출이 자주
생기고, 크면 한 번 옮길 때 많이 옮겨요. 규칙 셋을 「뒤로만 `n` 번 넣기」에 넣어 연산당 평균과 한
호출의 최댓값을 셉니다.

<!--proof:grow-policy-->

```text
규칙             n = 1,024   n = 4,096   n = 16,384   r (16,384 / 4,096)   n = 1,024 한 호출 최대
8 칸씩 더한다        64.50      256.50     1,024.50                 3.99                    1,017
64 칸씩 더한다        8.63       32.63       128.63                 3.94                      969
두 배로 늘린다        1.99        2.00         2.00                 1.00                      513
```

**일정한 칸 수를 더하는 규칙은 둘 다 `r` 이 4 에 가깝습니다.** 64 칸씩 더하면 `n = 1,024` 에서는 연산당
8.63 칸이라 괜찮아 보이지만, `n` 이 네 배가 될 때마다 네 배씩 늘어요. 두 배 규칙만 `r` 이 1.00 입니다.
대신 한 호출의 최댓값은 513 칸으로, 칸이 가득 찬 순간의 넣기 한 번이 원소 512 개를 옮기고 한 칸을
씁니다. **평균을 상수로 두는 대가가 가끔 오는 긴 호출 하나이고**, 계약이 넣기의 상한을 여러 번 부른
평균으로 적은 이유가 그것이에요.

```text
두 배 규칙으로 n = 1,024 번 넣을 때 한 호출이 1 칸을 넘은 자리
  9 번째 9 칸 · 17 번째 17 칸 · 33 번째 33 칸 · 65 번째 65 칸 · 129 번째 129 칸 · 257 번째 257 칸 · 513 번째 513 칸
  나머지 1,017 번은 1 칸씩      합 1,017 + 1,023 = 2,040 = 1,024 × 1.99 남짓
```

마지막으로 지금까지 세운 세 설계를 계약 스위트의 적대적 시나리오 셋에 모두 넣습니다. 칸마다 `n =
16,384` 와 `n = 4,096` 의 비율 `r` 과 판정을 적었어요.

<!--proof:designs-rates-->

```text
설계            앞으로만 넣기   뒤로 넣고 앞으로 빼기   번갈아 앞뒤로 빼기
배열 하나           4.00 실패               4.00 실패            4.00 실패
배열 두 개          1.00 통과               1.00 통과            4.00 실패
링 버퍼(정본)       1.00 통과               1.00 통과            1.00 통과
```

```text
링 버퍼 한 벌이 나왔다
  칸 c 개를 잡고, 앞 끝 칸 번호 head 와 원소 수 count 를 든다
  앞에 넣으면 head ← wrap(head − 1), 뒤에 넣으면 wrap(head + count) 에 쓴다
  칸이 가득 차면 두 배로 늘리고 앞 끝부터 0 번 칸에 옮긴 뒤 head ← 0
      └ 배열 하나는 앞에서, 배열 두 개는 번갈아 빼기에서 r = 4.00 이던 것이 셋 다 1.00 이 된다
```

### 수행으로 알아보는 자료구조 — 칸 8 개에서 head 가 감기고 16 칸으로 늘어난다

설계를 세웠으니 이제 **실제로 동작하는 코드**로 옮깁니다. 호출 열 하나를 잡고 끝까지 가되, 조각마다 그
조각만 실행해서 나온 값을 확인하고 넘어가요.

```ts
const d = new Deque<number>();
// T1~T3   빈 덱에서   popFront() · peekBack() · isEmpty()
// T4~T10  pushBack(1) · pushBack(2) · pushFront(0) · peekFront() · peekBack() · popFront() · popBack()
// T11~T18 pushBack(2) … pushBack(7) · pushFront(0) · size()
// T19~T23 pushFront(-1) · peekFront() · peekBack() · popFront() · popBack()
// 마지막 popBack() 은 7 을 돌려준다
```

스물세 번을 왜 이렇게 골랐을까요? **여덟 연산이 전부 한 번 이상 나오고**, 빈 덱에서 `null` 을 돌려주는
자리, 번호가 음수로 내려가 감기는 자리(T6), 번호가 칸 수를 넘어 감기는 자리(T8·T9), 그리고 **감긴 채로
칸이 가득 차서 늘리는 자리(T19)** 가 한 번씩 들어 있어요. 늘리기를 `head` 가 0 이 아닌 상태에서 일으키려고
T17 에서 앞에 하나를 넣어 칸을 채웁니다.

```text
넣기(끝, item):
    count = c 이면 칸을 두 배로 늘린다                                            ① 가득 찼다
        offset 을 0 부터 count − 1 까지: 새 칸[offset] ← 칸[wrap(head + offset)]  ③ 옮긴다
        head ← 0
    앞 끝이면 head ← wrap(head − 1) 에 쓴다
    뒤 끝이면 wrap(head + count) 에 쓴다
    count ← count + 1

빼기(끝):
    count = 0 이면 null 을 돌려준다                                               ② 비었다
    앞 끝이면 head 칸을 읽어 비우고 head ← wrap(head + 1)
    뒤 끝이면 wrap(head + count − 1) 칸을 읽어 비운다
    count ← count − 1

보기(끝):   count = 0 이면 null (②), 아니면 빼기와 같은 칸을 읽기만 한다
isEmpty:    count = 0 인가
size:       count
```

#### 1. 칸 8 개와 정수 둘을 두고 번호를 감싼다

넣기·빼기·보기가 모두 같은 세 가지 상태를 읽고 쓰므로, 그 상태와 감싸는 함수부터 둡니다. 칸은 처음에
8 개를 잡아요.

```ts
const INITIAL_SLOTS = 8;

export class Deque<T> {
  #slots: (T | undefined)[] = new Array(INITIAL_SLOTS);
  #head = 0;
  #count = 0;

  #wrap(index: number): number {
    const total = this.#slots.length;
    return ((index % total) + total) % total;
  }
}
```

만든 직후의 상태와 `#wrap` 이 내는 값은 이렇습니다.

```text
칸 배치   · · · · · · · ·      head 0   count 0
#wrap(-1) = 7    #wrap(8) = 0    #wrap(9) = 1
```

#### 2. pushBack · pushFront — 넣을 칸 번호를 정하고 한 칸에 쓴다

두 연산을 한 벌로 묶는 근거는 **상태 전이가 같기** 때문입니다 — 가득 찼으면 늘리고, 칸 하나에 쓰고,
`count` 를 1 늘려요. 갈리는 것은 쓸 칸 번호를 정하는 줄 하나이고, `pushFront` 만 `head` 를 바꿉니다.

```ts
pushFront(item: T): void {
  if (this.#count === this.#slots.length) this.#grow();  // ① 가득 찼다
  this.#head = this.#wrap(this.#head - 1);                // 앞 끝 번호를 하나 줄여 감싼다
  this.#slots[this.#head] = item;
  this.#count += 1;
}

pushBack(item: T): void {
  if (this.#count === this.#slots.length) this.#grow();  // ① 가득 찼다
  const at = this.#wrap(this.#head + this.#count);        // 뒤 끝 다음 칸
  this.#slots[at] = item;
  this.#count += 1;
}
```

T4~T6 이 이 조각입니다.

<!--proof:push-pair-->

```text
단계   호출           칸 번호 계산      돌려준 값   칸 배치           head   count
T4     pushBack(1)    wrap(0 + 0) = 0           —   1 · · · · · · ·      0       1
T5     pushBack(2)    wrap(0 + 1) = 1           —   1 2 · · · · · ·      0       2
T6     pushFront(0)   wrap(0 - 1) = 7           —   1 2 · · · · · 0      7       3
```

여기서 가장 중요한 줄은 `this.#head = this.#wrap(this.#head - 1);` 이에요. T6 에서 이 줄이 `0 − 1` 을
7 로 감았고, 원소 1·2 는 칸 0·1 에 그대로 있습니다. `pushBack` 은 `head` 를 건드리지 않고 `head +
count` 를 감쌀 뿐이라, 앞 끝이 7 번 칸으로 감긴 뒤에도 다음 뒤 칸은 `wrap(7 + 3) = 2` 로 올바르게
나와요.

#### 멈춤 — 나머지 연산 한 번으로는 음수 번호가 감기지 않는다

`#wrap` 의 식이 길어 보이지 않나요? **`index % total` 한 번이면 감길 것 같습니다.** `9 % 8` 이 1 이니
칸 수를 넘는 번호는 그걸로 충분해요. 그 감각대로 식을 줄여 봅시다.

```ts
#wrap(index: number): number {
  const total = this.#slots.length;
  return index % total; // ← ((index % total) + total) % total 에서 줄였다
}
```

빈 덱에 `pushFront` 를 7 번, 8 번 부르고 세 가지를 읽어 두 코드를 견줍니다.

<!--proof:pause-mod-->

```text
입력                호출          바른 코드   나머지 한 번       판정
pushFront 7 번 뒤   peekFront()           7              7       같다
pushFront 7 번 뒤   peekBack()            1              1       같다
pushFront 7 번 뒤   size()                7              7       같다
pushFront 8 번 뒤   peekFront()           8              8       같다
pushFront 8 번 뒤   peekBack()            1      undefined   어긋난다
pushFront 8 번 뒤   size()                8              8       같다
```

**일곱 번까지는 답이 전부 맞습니다.** 그래서 이 자리가 함정이에요 — 원소를 몇 개만 넣는 테스트는
통과합니다. 여덟 번째에서 `peekBack()` 이 `null` 도 원소도 아닌 `undefined` 를 돌려줘요. 원소들이
어디에 들어갔는지 보면 이유가 확인됩니다.

<!--proof:pause-mod-keys-->

```text
무엇                 값
head 가 거쳐 간 값   -1 -2 -3 -4 -5 -6 -7 -0
칸 0..7 에 든 원소   [0]=8
칸 번호가 아닌 키    -1 -2 -3 -4 -5 -6 -7
slots.length         8
```

TypeScript 에서 `-1 % 8` 은 -1 이라 `head` 가 -1, -2, … 로 내려갔고, `slots[-1]` 에 쓴 값은 **배열 칸이
아니라 이름이 `"-1"` 인 속성**으로 들어갔습니다. 칸 0~7 은 그동안 하나도 안 쓰였어요. 그러다 여덟 번째에 `-8 % 8` 이 `-0` 이 되어 칸 0 을 가리키고, 뒤 끝 번호 `head + count − 1 = 0 + 8 − 1`
이 7 이라 아무것도 없는 칸 7 을 읽었습니다. 바른 식은 `c` 를 한 번 더해 양수로 만든 뒤 나머지를 다시
해서, 어떤 음수든 `0` 부터 `c − 1` 사이의 **진짜 칸 번호**로 보내요.

```text
                    나머지 한 번          나머지 두 번
pushFront 1 번째    head -1  (속성)       head 7   (칸)
pushFront 8 번째    head -0  = 칸 0       head 0   (칸)
peekBack            칸 7 → undefined     칸 7 → 1
```

#### 3. popFront · popBack — 끝 칸을 읽어 비우고 개수를 줄인다

두 연산을 묶는 근거는 넣기와 같습니다 — 비었으면 `null`, 아니면 칸 하나를 읽어 비우고 `count` 를 1
줄여요. 앞에서 뺄 때만 `head` 를 한 칸 뒤로 감싸 옮깁니다.

```ts
popFront(): T | null {
  if (this.#count === 0) return null;                     // ② 비었다
  const item = this.#slots[this.#head] as T;
  this.#slots[this.#head] = undefined;
  this.#head = this.#wrap(this.#head + 1);
  this.#count -= 1;
  return item;
}

popBack(): T | null {
  if (this.#count === 0) return null;                     // ② 비었다
  const at = this.#wrap(this.#head + this.#count - 1);
  const item = this.#slots[at] as T;
  this.#slots[at] = undefined;
  this.#count -= 1;
  return item;
}
```

T1 과 T9·T10 이 이 조각입니다. T1 은 빈 덱이라 ② 로 `null` 을 돌려주고 아무것도 안 바꿔요.

<!--proof:pop-pair-->

```text
단계   호출         칸 번호 계산             돌려준 값   칸 배치           head   count
T9     popFront()   head ← wrap(7 + 1) = 0           0   1 2 · · · · · ·      0       2
T10    popBack()    wrap(0 + 2 - 1) = 1              2   1 · · · · · · ·      0       1
```

T9 에서 `head` 가 `wrap(7 + 1) = 0` 으로 감겨 칸 수를 넘는 번호도 제자리로 돌아왔습니다. 꺼낸 칸을
`undefined` 로 비우는 줄은 답에는 영향이 없어요. 그 줄이 없으면 배열이 꺼낸 원소를 계속 참조해서, 원소가
큰 객체일 때 메모리가 회수되지 않습니다.

#### 4. peekFront · peekBack · isEmpty · size — 상태를 바꾸지 않고 읽는다

네 연산을 한 벌로 묶는 근거는 **어느 것도 칸이나 두 정수를 바꾸지 않기** 때문입니다. `peekFront`·
`peekBack` 은 빼기가 읽을 칸을 읽기만 하고, `isEmpty`·`size` 는 `count` 만 봐요.

```ts
peekFront(): T | null {
  if (this.#count === 0) return null;                     // ② 비었다
  return this.#slots[this.#head] as T;
}

peekBack(): T | null {
  if (this.#count === 0) return null;                     // ② 비었다
  return this.#slots[this.#wrap(this.#head + this.#count - 1)] as T;
}

isEmpty(): boolean { return this.#count === 0; }
size(): number { return this.#count; }
```

T2·T3 은 빈 덱, T7·T8 은 감긴 원소 셋, T18 은 가득 찬 여덟입니다.

<!--proof:peek-four-->

```text
단계   호출          칸 번호 계산          돌려준 값   칸 배치           head   count
T2     peekBack()    —                          null   · · · · · · · ·      0       0
T3     isEmpty()     —                          true   · · · · · · · ·      0       0
T7     peekFront()   head = 7                      0   1 2 · · · · · 0      7       3
T8     peekBack()    wrap(7 + 3 - 1) = 1           2   1 2 · · · · · 0      7       3
T18    size()        —                             8   1 2 3 4 5 6 7 0      7       8
```

T8 이 이 묶음에서 눈여겨볼 자리예요. `head` 가 7 이고 `count` 가 3 이라 `7 + 3 − 1 = 9` 인데, 칸은
8 개뿐이니 `wrap(9) = 1` 번 칸의 2 를 읽었습니다. 앞 끝과 뒤 끝이 물리적으로는 칸 7 과 칸 1 에 떨어져
있어도 같은 수열의 두 끝이에요.

#### 5. 칸이 가득 차면 두 배로 늘리고 앞 끝부터 옮긴다

넣기 둘이 부르는 `#grow` 입니다. 옮기는 일이 이 함수 한 곳에만 있어요.

```ts
#grow(): void {
  const grown: (T | undefined)[] = new Array(this.#slots.length * 2);
  for (let offset = 0; offset < this.#count; offset++) {  // ③ 옮긴다
    grown[offset] = this.#slots[this.#wrap(this.#head + offset)];
  }
  this.#slots = grown;
  this.#head = 0;
}
```

T17 에서 칸이 감긴 채로 가득 차고, T19 의 `pushFront(-1)` 이 ① 로 이 함수를 부릅니다.

<!--proof:grow-->

```text
단계   호출            칸 번호 계산           돌려준 값   칸 배치                            head   count
T17    pushFront(0)    wrap(0 - 1) = 7                —   1 2 3 4 5 6 7 0                       7       8
T19    pushFront(-1)   wrap(0 - 1) = 15               —   0 1 2 3 4 5 6 7 · · · · · · · -1     15       9
T20    peekFront()     head = 15                     -1   0 1 2 3 4 5 6 7 · · · · · · · -1     15       9
T21    peekBack()      wrap(15 + 9 - 1) = 7           7   0 1 2 3 4 5 6 7 · · · · · · · -1     15       9
```

T19 에서 원소 여덟이 **앞 끝부터** 새 칸 0~7 에 옮겨졌고, `head` 가 0 으로 되돌아간 다음 `wrap(0 − 1)` 이
이번에는 칸 수 16 으로 감싸져 15 가 됐습니다. T20 이 15 번 칸의 -1 을, T21 이 `wrap(15 + 9 − 1) = 7` 번
칸의 7 을 읽어 앞뒤가 모두 맞아요.

#### 멈춤 — 늘릴 때 같은 칸 번호로 옮기면 감긴 원소의 순서가 어긋난다

새 칸에 옮기는 줄이 `this.#slots[this.#wrap(this.#head + offset)]` 로 복잡합니다. **칸 `i` 의 원소를
새 칸 `i` 에 그대로 옮기면 되지 않을까요?** 배열을 늘리는 흔한 코드가 그 모양이에요. 그 감각대로 바꿔
봅시다.

```ts
for (let offset = 0; offset < this.#count; offset++) {
  grown[offset] = this.#slots[offset]; // ← 앞 끝부터가 아니라 같은 번호로 옮긴다
}
```

**뒤로만 넣어 늘리는 입력에서는 답이 안 틀립니다.** 늘리는 순간 `head` 가 0 이라 앞 끝부터 옮기는 것과
같은 번호로 옮기는 것이 같은 일이기 때문이에요. 전개의 T1~T19 처럼 **감긴 채로 늘리면** 달라집니다.

<!--proof:pause-copy-->

```text
입력             호출          바른 코드   같은 번호로 옮긴 코드       판정
전개 T1~T19      peekFront()          -1                      -1       같다
전개 T1~T19      peekBack()            7                       0   어긋난다
전개 T1~T19      popFront()           -1                      -1       같다
전개 T1~T19      popBack()             7                       0   어긋난다
뒤로만 아홉 번   peekFront()           1                       1       같다
뒤로만 아홉 번   peekBack()            9                       9       같다
뒤로만 아홉 번   popFront()            1                       1       같다
뒤로만 아홉 번   popBack()             9                       9       같다
```

T17 의 칸 배치는 `1 2 3 4 5 6 7 0` 이고 앞 끝이 7 번 칸의 0 이었어요. 같은 번호로 옮기면 새 칸 0~7 이
`1 2 3 4 5 6 7 0` 그대로이고 `head` 는 0 이 되니, 앞 끝부터 읽은 순서가 `1 2 … 7 0` 으로 바뀝니다. 그
위에 -1 을 앞에 넣으면 `-1 1 2 3 4 5 6 7 0` 이라 앞 끝은 맞고 **뒤 끝이 7 이 아니라 0** 이 돼요.

```text
T17 칸 8 개        1 2 3 4 5 6 7 0     head 7     앞 끝부터  0 1 2 3 4 5 6 7
같은 번호로 옮김    1 2 3 4 5 6 7 0 · · ·  head 0     앞 끝부터  1 2 3 4 5 6 7 0   ← 0 이 맨 뒤로 갔다
앞 끝부터 옮김      0 1 2 3 4 5 6 7 · · ·  head 0     앞 끝부터  0 1 2 3 4 5 6 7
```

#### 6. 스물세 번의 호출을 끝까지 실행한다

앞의 다섯 조각을 이어 전개 연산 열을 끝까지 실행하면 아래 스물세 걸음이 나옵니다. 칸 배치와 두 정수가
걸음마다 어떻게 바뀌는지부터 봅니다.

```text
T1~T3    빈 덱에서 빼고 본다          T4~T10   음수와 칸 수를 넘는 번호가 감긴다
T11~T18  감긴 채로 칸 8 개를 채운다    T19~T23  16 칸으로 늘리고 양 끝을 읽고 뺀다
```

<!--viz:walk-->

<!--proof:walk-viz-->

```text
단계   칸 배치                            head   count    앞 끝부터 읽은 순서
T1     · · · · · · · ·                       0       0                     []
T2     · · · · · · · ·                       0       0                     []
T3     · · · · · · · ·                       0       0                     []
T4     1 · · · · · · ·                       0       1                    [1]
T5     1 2 · · · · · ·                       0       2                  [1 2]
T6     1 2 · · · · · 0                       7       3                [0 1 2]
T7     1 2 · · · · · 0                       7       3                [0 1 2]
T8     1 2 · · · · · 0                       7       3                [0 1 2]
T9     1 2 · · · · · ·                       0       2                  [1 2]
T10    1 · · · · · · ·                       0       1                    [1]
T11    1 2 · · · · · ·                       0       2                  [1 2]
T12    1 2 3 · · · · ·                       0       3                [1 2 3]
T13    1 2 3 4 · · · ·                       0       4              [1 2 3 4]
T14    1 2 3 4 5 · · ·                       0       5            [1 2 3 4 5]
T15    1 2 3 4 5 6 · ·                       0       6          [1 2 3 4 5 6]
T16    1 2 3 4 5 6 7 ·                       0       7        [1 2 3 4 5 6 7]
T17    1 2 3 4 5 6 7 0                       7       8      [0 1 2 3 4 5 6 7]
T18    1 2 3 4 5 6 7 0                       7       8      [0 1 2 3 4 5 6 7]
T19    0 1 2 3 4 5 6 7 · · · · · · · -1     15       9   [-1 0 1 2 3 4 5 6 7]
T20    0 1 2 3 4 5 6 7 · · · · · · · -1     15       9   [-1 0 1 2 3 4 5 6 7]
T21    0 1 2 3 4 5 6 7 · · · · · · · -1     15       9   [-1 0 1 2 3 4 5 6 7]
T22    0 1 2 3 4 5 6 7 · · · · · · · ·       0       8      [0 1 2 3 4 5 6 7]
T23    0 1 2 3 4 5 6 · · · · · · · · ·       0       7        [0 1 2 3 4 5 6]
```

같은 걸음마다 조건이 어떻게 판정되고 칸 번호가 어떻게 계산되며 칸을 몇 개 지나갔는지 적으면 아래 표예요.

<!--proof:walk-trace-->

```text
단계   호출            조건                     칸 번호 계산              돌려준 값   비용
T1     popFront()      count 0 → ②              —                              null      0
T2     peekBack()      count 0 → ②              —                              null      1
T3     isEmpty()       —                        —                              true      1
T4     pushBack(1)     count 0 < 칸 8           wrap(0 + 0) = 0                   —      1
T5     pushBack(2)     count 1 < 칸 8           wrap(0 + 1) = 1                   —      1
T6     pushFront(0)    count 2 < 칸 8           wrap(0 - 1) = 7                   —      1
T7     peekFront()     count 3 > 0              head = 7                          0      1
T8     peekBack()      count 3 > 0              wrap(7 + 3 - 1) = 1               2      1
T9     popFront()      count 3 > 0              head ← wrap(7 + 1) = 0            0      1
T10    popBack()       count 2 > 0              wrap(0 + 2 - 1) = 1               2      1
T11    pushBack(2)     count 1 < 칸 8           wrap(0 + 1) = 1                   —      1
T12    pushBack(3)     count 2 < 칸 8           wrap(0 + 2) = 2                   —      1
T13    pushBack(4)     count 3 < 칸 8           wrap(0 + 3) = 3                   —      1
T14    pushBack(5)     count 4 < 칸 8           wrap(0 + 4) = 4                   —      1
T15    pushBack(6)     count 5 < 칸 8           wrap(0 + 5) = 5                   —      1
T16    pushBack(7)     count 6 < 칸 8           wrap(0 + 6) = 6                   —      1
T17    pushFront(0)    count 7 < 칸 8           wrap(0 - 1) = 7                   —      1
T18    size()          —                        —                                 8      1
T19    pushFront(-1)   count 8 = 칸 8 → ① ③×8   wrap(0 - 1) = 15                  —      9
T20    peekFront()     count 9 > 0              head = 15                        -1      1
T21    peekBack()      count 9 > 0              wrap(15 + 9 - 1) = 7              7      1
T22    popFront()      count 9 > 0              head ← wrap(15 + 1) = 0          -1      1
T23    popBack()       count 8 > 0              wrap(0 + 8 - 1) = 7               7      1
```

**라벨 셋이 모두 실행됐습니다.**

<!--proof:walk-branches-->

```text
라벨   무엇        실행된 걸음
①      가득 찼다   T19
②      비었다      T1 · T2
③      옮긴다      T19 안에서 8 번
```

<!--result:walk=7-->

비용 칸을 보면 스물세 걸음 중 1 이 아닌 곳이 둘이에요. T1 은 빈 덱의 `popFront()` 가 칸을 읽기 전에
돌려주므로 0 이고, T19 는 원소 여덟을 옮기고 한 칸을 써서 9 입니다. T2 의 `peekBack()` 이 같은 빈
덱인데 1 인 것은 정본이 보기 연산의 비용을 비었는지 확인하기 **전에** 세기 때문이에요. T22 에서
`head` 가 `wrap(15 + 1) = 0` 으로 감겨 칸 16 개에서도 칸 수를 넘는 번호가 제자리로 돌아왔고, T23 의
마지막 `popBack()` 이 7 을 돌려줍니다.

#### 7. 전체 코드

조각을 하나로 잇습니다. 아래는 정본 [`_reference/deque.ts`](./_reference/deque.ts) 의 구간을
**추출한 것**이라 손으로 옮기지 않았어요. 앞의 조각에 없던 것은 두 줄짜리 주석들과 `INITIAL_SLOTS` 에
붙은 설명뿐입니다. 정본이 비용을 세려고 두는 `__cost` 줄은 추출할 때 걷혀서 여기 없어요.

```ts guide-core=src/data-structures/linear/deque/_reference/deque.ts
/** 처음 잡는 칸 수. 2의 거듭제곱일 필요는 없다 — 나머지 연산으로 감싸기 때문이다. */
const INITIAL_SLOTS = 8;

export class Deque<T> {
  #slots: (T | undefined)[] = new Array(INITIAL_SLOTS);
  /** 앞 끝 원소가 놓인 칸. 비어 있을 때는 다음 `pushBack` 이 쓸 칸이다. */
  #head = 0;
  #count = 0;

  pushFront(item: T): void {
    if (this.#count === this.#slots.length) this.#grow();
    this.#head = this.#wrap(this.#head - 1);
    this.#slots[this.#head] = item;
    this.#count += 1;
  }

  pushBack(item: T): void {
    if (this.#count === this.#slots.length) this.#grow();
    const at = this.#wrap(this.#head + this.#count);
    this.#slots[at] = item;
    this.#count += 1;
  }

  popFront(): T | null {
    if (this.#count === 0) return null;
    const item = this.#slots[this.#head] as T;
    this.#slots[this.#head] = undefined;
    this.#head = this.#wrap(this.#head + 1);
    this.#count -= 1;
    return item;
  }

  popBack(): T | null {
    if (this.#count === 0) return null;
    const at = this.#wrap(this.#head + this.#count - 1);
    const item = this.#slots[at] as T;
    this.#slots[at] = undefined;
    this.#count -= 1;
    return item;
  }

  peekFront(): T | null {
    if (this.#count === 0) return null;
    return this.#slots[this.#head] as T;
  }

  peekBack(): T | null {
    if (this.#count === 0) return null;
    return this.#slots[this.#wrap(this.#head + this.#count - 1)] as T;
  }

  isEmpty(): boolean {
    return this.#count === 0;
  }

  size(): number {
    return this.#count;
  }

  /**
   * 논리 위치를 칸 번호로 감싼다. 음수도 받으므로 `pushFront` 가 따로 분기하지 않는다.
   */
  #wrap(index: number): number {
    const total = this.#slots.length;
    return ((index % total) + total) % total;
  }

  /**
   * 칸을 두 배로 늘리고 원소를 **앞에서부터 차례로** 새 칸에 옮긴다.
   *
   * 옮기고 나서 `#head` 를 0으로 되돌리는 것이 중요하다. 감긴 상태를 그대로 두고 칸만
   * 늘리면 앞 끝과 뒤 끝 사이에 빈 칸이 끼어 순서가 어긋난다.
   */
  #grow(): void {
    const grown: (T | undefined)[] = new Array(this.#slots.length * 2);
    for (let offset = 0; offset < this.#count; offset++) {
      grown[offset] = this.#slots[this.#wrap(this.#head + offset)];
    }
    this.#slots = grown;
    this.#head = 0;
  }
}
```

```text
const d = new Deque<number>()
d.popFront()        → null
d.pushBack(1); d.pushFront(0)
d.peekFront()       → 0        d.peekBack()   → 1
d.size()            → 2        d.isEmpty()    → false
```

### 알아 두면 좋은 개념 — 기하급수적 용량 증가

파트 1 이 값으로 보인 것이 하나 있습니다. 칸이 모자랄 때 **일정한 수를 더하면** 연산당 비용이 `n` 에
비례했고(`r` 이 4 에 가까웠어요), **일정한 배수를 곱하면** 연산당 비용이 상수에 머물렀습니다. 크기를
늘릴 때 곱하기로 늘리는 이 규칙을 **기하급수적 용량 증가**(geometric resizing)라고 합니다.

| 늘리는 규칙 | 뒤로만 `n` 번 넣을 때 옮기는 원소 | `n = 16,384` 연산당 칸 수 |
| --- | --- | --- |
| 8 칸씩 더한다 | `n` 의 제곱에 비례 | 1,024.50 |
| 64 칸씩 더한다 | `n` 의 제곱에 비례 | 128.63 |
| 두 배로 늘린다 | `2n` 을 넘지 않는다 | 2.00 |

```text
두 배 규칙이 옮기는 원소를 늘린 순서대로 적으면
  8 + 16 + 32 + … + (마지막으로 늘릴 때의 원소 수)
  └ 뒤 항 하나가 앞 항을 전부 더한 것보다 크다. 그래서 합이 마지막 항의 두 배를 못 넘는다
```

같은 이름을 다시 만나는 자리가 있어요. [`dynamicArray` 가이드](../dynamicArray/dynamicArray-guide.mdx)의
뒤에 넣기가 같은 규칙으로 평균 상수를 얻고, 해시 테이블이 원소가 늘면 칸 수를 배수로 늘려 다시 나눠
담는 것도 같은 규칙입니다. 배수가 2 가 아니어도(1.5 같은 값이어도) 1 보다 크기만 하면 합이 `n` 의 상수
배에 머문다는 결론은 그대로예요.

## 파트 2 — 적용 조건 · 보장 · 비용

파트 1 에서 만든 것을 따져 봅니다. 어떤 요구에 이 구조를 쓰는지, 옮긴 원소 수의 식이 어떻게 닫히는지,
무엇이 매 호출 뒤에 참으로 남는지, 그리고 비용과 그 보장이 무엇인지 순서로 봅니다.

### 이 구조가 최적의 선택인 경우

#### 최적인 요구의 모양

주어가 문제가 아니라 **연산**입니다. 셋이 함께 맞을 때예요.

- **양 끝의 넣기와 빼기가 함께 필요하고 가운데는 안 봅니다.** 한쪽 끝만 쓰면 스택이나 배열 하나로
  충분하고, 가운데를 번호로 읽어야 하면 이 계약 밖입니다.
- **어느 끝에서 뺄지를 미리 알 수 없습니다.** 뒤로 넣고 앞으로만 빼는 것이 확실하면 배열 두 개도
  연산당 1.50 칸으로 통과했어요. 번갈아 빼는 호출이 섞일 수 있을 때 링 버퍼가 필요합니다.
- **여러 번 부른 평균이 중요하고, 가끔 오는 긴 호출 한 번을 감당할 수 있습니다.** 호출 한 번의 최대
  지연에 상한을 약속해야 하는 자리라면 칸을 늘리는 순간이 문제가 됩니다.

```text
세 조건이 코드의 모양을 정한다
  양 끝을 함께 쓴다  → head 하나를 앞뒤로 감싸 옮긴다
  빼는 끝을 모른다   → 옮기는 일을 호출 순서에서 떼어 칸 수에 묶는다
  평균이 중요하다    → 칸이 가득 찬 순간의 넣기 한 번은 원소 수만큼 옮긴다
```

#### 이 구조를 떠올리게 하는 연산 조합

독자가 다음에 만나는 것은 자기 코드의 요구예요. 요구를 **연산과 호출 횟수로 옮겨** 적어 보면 덱이
필요한지가 정해집니다.

```text
창이 한 칸 옮겨질 때마다 만료된 앞 후보를 버리고, 새 값보다 작은 뒤 후보를 버리고, 새 값을 넣고, 최댓값을 읽는다
  → popFront · popBack · pushBack · peekFront
  → 원소 하나가 한 번 들어오고 많아야 한 번 나간다. 스트림 길이 L 이면 넣기 L 번 · 빼기 L 번 이하 · 읽기 L 번
  → 네 연산이 모두 계약에 있고 각각 원소 수와 무관하므로 전체가 L 에 비례한다

간선 가중치가 0 이면 앞에, 1 이면 뒤에 넣고 앞에서 꺼내며 최단 거리를 정한다
  → pushFront · pushBack · popFront
  → 정점 V 개 · 간선 E 개면 넣기 E 번 이하 · 빼기 E 번 이하

양 끝에서 하나씩 꺼내 서로 견주며 안쪽으로 좁힌다
  → popFront · popBack 을 번갈아 길이의 절반만큼
  → 배열 두 개가 r = 4.00 으로 실패한 바로 그 호출 순서다
```

첫째가 [`monotonicQueue` 가이드](../monotonicQueue/monotonicQueue-guide.mdx)의 창 최댓값이고, 둘째가
[`zeroOneBfs` 가이드](../../../algorithms/graph/zeroOneBfs/zeroOneBfs-guide.md)의 0-1 BFS 입니다. **옮긴
연산이 계약에 없으면 그 요구는 덱의 사례가 아닙니다.** 창의 중앙값처럼 가운데 원소를 번호로 읽어야 하는
요구가 섞이면, 연산 목록에 이 계약에 없는 것이 생기므로 다른 구조를 찾아야 해요.

#### 실제로 쓰이는 곳

- **러스트 표준 라이브러리의 `VecDeque`** — 문서 첫 문장이 이 글의 설계를 그대로 적습니다. *"A
  double-ended queue implemented with a growable ring buffer."* 늘릴 수 있는 링 버퍼로 만든 덱이에요.
  ([`std::collections::VecDeque`](https://doc.rust-lang.org/std/collections/struct.VecDeque.html),
  조회 2026-09-13)
- **자바 표준 라이브러리의 `ArrayDeque`** — *"Resizable-array implementation of the Deque interface.
  Array deques have no capacity restrictions; they grow as necessary to support usage."* 그리고 비용의
  종류까지 적어 뒀어요. *"Most ArrayDeque operations run in amortized constant time."* 여러 번 부른 평균이
  상수라는, 이 글의 계약과 같은 한정자입니다.
  ([`java.util.ArrayDeque`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html),
  조회 2026-09-13)
- **CPython 의 `collections.deque`** — 링 버퍼가 아니라 **고정 길이 블록의 이중 연결 리스트**를 고른
  자리입니다. 소스 주석이 이유를 적었어요. *"Data for deque objects is stored in a doubly-linked list of
  fixed length blocks. This assures that appends or pops never move any other data elements besides the
  one being appended or popped."* 블록 길이는 `#define BLOCKLEN 64` 입니다. 칸을 늘리는 순간의 긴 호출을
  없애는 쪽을 택한 것이고, 그 대가를 아래 대조가 잽니다.
  ([`Modules/_collectionsmodule.c`](https://github.com/python/cpython/blob/main/Modules/_collectionsmodule.c),
  조회 2026-09-13)

```text
세 자리가 고른 것
  러스트 · 자바   링 버퍼        칸이 가득 차면 늘리고 옮긴다    → 평균 상수, 가끔 긴 호출
  CPython        블록 연결 리스트  원소를 안 옮긴다              → 호출마다 상수, 블록 링크를 따로 잡는다
```

#### 경쟁 설계와의 대조

같은 계약을 지키는 **다른 설계**가 있어요 — **이중 연결 리스트**입니다. 원소마다 노드 하나를 만들고 노드가
앞 노드와 뒤 노드를 가리킵니다. 칸을 미리 잡지 않으니 옮기는 일이 아예 없고, 호출 한 번이 지나가는 칸이
**늘 상수**예요. 링 버퍼에는 없는 약속입니다.

두 설계를 같은 입력에 넣어 정본과 같은 단위로 셌습니다. 입력은 계약 스위트의 큐 패턴과 같은 모양으로,
뒤로 `n = 1,024` 번 넣고 앞으로 1,024 번 뺐어요. 연결 리스트의 칸은 노드의 필드 하나(값 · 앞 링크 ·
뒤 링크)입니다. 전개의 스물세 번짜리 호출 열을 쓰지 않은 이유는 하나예요 — 칸을 한 번만 늘려서 두 설계가
갈리는 값이 한 자릿수로 붙어 나오고, `n` 이 커질 때 어떻게 벌어지는지가 안 보입니다.

| 설계 | 한 호출이 지나간 칸의 최댓값 | 전체 지나간 칸 | 가장 많이 잡고 있던 칸 | 다 비운 뒤 잡고 있는 칸 |
| --- | --- | --- | --- | --- |
| 링 버퍼 (이 가이드) | 513 | **3,064** | **1,024** | 1,024 |
| 이중 연결 리스트 | **4** | 7,166 | 3,072 | **0** |

**어느 축을 보느냐로 순서가 뒤집힙니다.** 한 호출의 최댓값은 연결 리스트가 4 칸으로 링 버퍼의 513 칸보다
128 배 적어요. 전체 지나간 칸은 링 버퍼가 3,064 칸으로 연결 리스트의 7,166 칸보다 적고, 가장 많이 잡고
있던 칸도 1,024 대 3,072 로 링 버퍼가 적습니다. 원소마다 필드 셋을 잡는 비용이 칸 하나에 원소 하나를
담는 비용보다 크기 때문이에요. 반대로 **다 비운 뒤에는** 링 버퍼가 늘린 칸 1,024 개를 그대로 잡고 있고
연결 리스트는 0 칸입니다.

```text
축을 넷으로 갈라 적으면
                              링 버퍼     이중 연결 리스트
  한 호출이 지나간 칸 최댓값    513         4              ← 연결 리스트가 적다
  전체 지나간 칸               3,064       7,166          ← 링 버퍼가 적다
  가장 많이 잡고 있던 칸        1,024       3,072          ← 링 버퍼가 적다
  다 비운 뒤 잡고 있는 칸       1,024       0              ← 연결 리스트가 적다
```

**우열이 반대가 되는 조건이 분명합니다.** 호출 한 번의 지연에 상한을 약속해야 하거나(실시간 처리 ·
오디오 버퍼 채우기), 크게 불어났다가 거의 비는 일이 되풀이되면 연결 리스트 쪽이에요. 전체 작업량과 잡는
메모리가 중요하고 긴 호출 한 번을 감당할 수 있으면 링 버퍼입니다. CPython 이 원소 하나가 아니라 64 칸짜리
블록을 노드로 쓰는 것은 두 설계 사이에서 필드 셋의 비용을 줄이려는 절충이에요.

### 수식 정의와 유도

파트 1 은 `n = 1,024` 와 `n = 16,384` 에서 두 배 규칙의 연산당 비용이 2.00 근처라는 것을 셌습니다. 그
값이 모든 `n` 에서 상수에 머무는지는 식으로 확인해야 합니다.

```text
정의   뒤로만 n 번 넣을 때 늘린 횟수 t 와 옮긴 원소 수 M(n) 을 적는다
  ↓
검산   작은 n 에 넣어 손으로 센다
  ↓
유도   M(n) 의 닫힌 형태와 상한을 푼다
  ↓
계수   그 식에 큰 n 을 넣어 수치를 낸다
```

**정의부터 합니다.** 칸은 8 개로 시작하고 넣기 직전에 $\text{count} = c$ 이면 $c$ 를 두 배로 늘리며,
그때 원소 $\text{count}$ 개를 옮깁니다. $k$ 번째로 늘리는 순간의 칸 수는 $8 \cdot 2^{k}$ 이고
($k = 0, 1, 2, \dots$), 그 순간 옮기는 원소도 $8 \cdot 2^{k}$ 개예요. 뒤로만 $n$ 번 넣는 동안 늘리는
횟수를 $t$ 라 하면 $M(n)$ 은 옮긴 원소의 합입니다.

$$M(n) = \sum_{k=0}^{t-1} 8 \cdot 2^{k}, \qquad t = \#\{\, k \ge 0 : 8 \cdot 2^{k} \le n - 1 \,\}$$

| 기호 | 뜻 | 범위 |
| --- | --- | --- |
| $k$ | 몇 번째로 늘리는가. 0 부터 센다 | $0 \le k \le t-1$ |
| $t$ | 뒤로만 $n$ 번 넣는 동안 늘린 횟수 | $n \le 8$ 이면 $0$ |
| $M(n)$ | 그동안 옮긴 원소 수의 합 | $0 \le M(n)$ |

늘리는 순간이 $8 \cdot 2^{k} \le n - 1$ 로 적힌 이유는 **넣기 직전의 원소 수**가 칸 수와 같아야 늘리기
때문이에요. $n$ 번째 넣기 직전의 원소 수가 $n - 1$ 이니, 그 이하인 칸 수에서만 늘림이 일어납니다.

```text
n = 17 을 뒤로만 넣는다   칸 8 → 16 → 32

  9 번째 넣기 직전   count 8 = 칸 8    늘린다   옮긴 원소 8    k = 0
  17 번째 넣기 직전  count 16 = 칸 16  늘린다   옮긴 원소 16   k = 1
  t = 2   M(17) = 8 + 16 = 24
```

**검산은 정의를 그대로 옮긴 코드로도 합니다.** 식의 $t$ 는 코드에서 `grows`, $M(n)$ 은 `moved` 이에요.

```ts
function moved(n: number): { grows: number; moved: number } {
  let slots = 8;
  let grows = 0;
  let total = 0;
  for (let count = 0; count < n; count++) {
    if (count === slots) {
      total += count;
      slots *= 2;
      grows += 1;
    }
  }
  return { grows, moved: total };
}

moved(17); // { grows: 2, moved: 24 }
```

**이제 닫힌 형태를 유도합니다.** 합의 각 항이 앞 항의 두 배인 등비수열이라, 합에 2 를 곱해 자신과 빼면
가운데 항이 전부 지워져요.

```text
    M = 8·2⁰ + 8·2¹ + … + 8·2^(t−1)
   2M =        8·2¹ + … + 8·2^(t−1) + 8·2^t
2M − M =                               8·2^t − 8·2⁰
```

$$M(n) = 8\,(2^{t} - 1)$$

**상한은 마지막으로 늘린 순간에서 나옵니다.** $t \ge 1$ 이면 마지막 늘림은 $k = t - 1$ 이고, 정의에 따라
그 칸 수가 $n - 1$ 이하예요.

```text
8·2^(t−1) ≤ n − 1                     마지막 늘림의 칸 수
8·2^t     ≤ 2(n − 1)                  양변에 2 를 곱했다
M(n) = 8·2^t − 8 ≤ 2(n − 1) − 8 < 2n  닫힌 형태에 둘째 줄을 넣었다
```

등호는 $n - 1$ 이 정확히 $8 \cdot 2^{t-1}$ 일 때, 곧 **칸이 막 가득 찬 뒤 한 번 더 넣었을 때** 성립해요.
그러니 뒤로만 $n$ 번 넣는 전체 비용은 쓰기 $n$ 칸에 옮기기 $M(n)$ 칸을 더한 $n + M(n) < 3n$ 이고, 연산당
평균은 3 을 넘지 않습니다.

**일정한 칸 수 $a$ 를 더하는 규칙은 같은 방식으로 제곱이 됩니다.** 늘리는 순간의 칸 수가
$8, 8 + a, 8 + 2a, \dots$ 로 등차수열이 되고, 그 항 수가 $n / a$ 에 가까워서 합이 $n^{2} / (2a)$
근처로 가요.

```text
a = 8,  n = 1,024   늘리는 순간의 칸 수   8, 16, 24, …, 1,016   (127 번)
                    옮긴 원소의 합        8 × (1 + 2 + … + 127) = 65,024
                    n² / (2a)            1,048,576 / 16      = 65,536
```

**마지막으로 계수입니다.** 닫힌 형태를 실행 결과와 맞대고 큰 $n$ 을 넣어요.

<!--proof:math-check-->

```text
n            t   옮긴 원소 = 8(2^t − 1)   상한 2(n − 1) − 8
9            1                        8                   8
16           1                        8                  22
17           2                       24                  24
1,024        7                    1,016               2,038
1,025        8                    2,040               2,040
1,000,000   17                1,048,568           1,999,990
```

$n = 1,000,000$ 이면 늘린 횟수가 17 번, 옮긴 원소가 1,048,568 개로 상한 1,999,990 의 절반 남짓입니다.
칸이 막 가득 찬 뒤 한 번 더 넣는 자리($n = 9, 17, 1,025$)에서는 옮긴 원소가 상한과
같아지고, 그 바로 앞($n = 16, 1,024$)에서는 상한보다 한참 작아져요. 어느 쪽이든 $2n$ 을 넘지
않으므로 연산당 평균이 상수라는 결론은 모든 $n$ 에서 성립합니다.

### 불변식 — 앞과 뒤는 늘 같은 수열의 두 끝이다

> 호출 하나가 끝날 때마다 덱은 수열 하나이고, `peekFront()` 는 그 수열의 첫 원소를, `peekBack()` 은
> 마지막 원소를 돌려줍니다. 수열이 비었으면 둘 다 `null` 입니다.

```text
수열  [ a₀  a₁  a₂  …  a_(size−1) ]
        │                   └ peekBack · popBack · pushBack 이 여기를 본다
        └ peekFront · popFront · pushFront 가 여기를 본다
```

**계약 헤더는 이 구조의 불변식을 「없다」로 적습니다.** 위 문장이 참이 아니어서가 아니라, 이 문장이
연산들의 의미와 **따로 떨어진 성질이 아니기** 때문이에요. `pushFront(x)` 의 의미가 「직후 `peekFront()`
가 `x`」이고 `popBack()` 의 의미가 「마지막 원소를 제거하고 돌려준다」인데, 이 의미들이 이미 **같은 수열
하나**를 두고 적혀 있습니다. 여덟 연산의 의미가 각각 옳으면 그 밖에 따로 깨질 수 있는 상태 성질이 남지
않아요. 이 문장을 버리면 무엇이 되는지 이름으로 보면 확인됩니다.

```text
앞 끝과 뒤 끝이 서로 다른 수열의 끝이면  → 스택 두 개
넣는 끝과 빼는 끝이 서로 정해져 있으면   → 큐
앞 끝을 보는 비용이 원소 수에 비례하면   → 앞뒤로 읽는 배열
```

이 구현이 그 의미를 지키는 방법은 「앞에서 `i` 번째 원소는 `wrap(head + i)` 번 칸에 있다」라는 대응이에요.
**이 대응은 계약에 적지 않습니다.** 적는 순간 링 버퍼가 처방이 되고, 연결 리스트처럼 같은 계약을 다르게
지키는 구현이 계약 위반이 됩니다. 여기서는 이 구현이 위 문장을 어떻게 지키는지 보이는 데만 씁니다.

**각 연산이 문장을 어떻게 지키는지 전수로 봅시다.** 상태를 바꾸는 갈래가 넷이고, 보기 넷은 상태를 안
바꾸니 직전에 참이면 직후에도 참이에요.

| 갈래 | 하는 일 | 문장이 유지되는 근거 |
| --- | --- | --- |
| 앞에 넣기 | `head ← wrap(head − 1)` 에 쓰고 `count` 를 1 늘린다 | 새 원소가 `wrap(head + 0)` 에 있어 첫 원소이고, 옛 첫 원소는 `wrap(head + 1)` 이라 두 번째가 된다. 뒤 끝 `wrap(head + count − 1)` 은 `head` 가 1 줄고 `count` 가 1 늘어 그대로다 |
| 뒤에 넣기 | `wrap(head + count)` 에 쓰고 `count` 를 1 늘린다 | 새 원소가 `wrap(head + count − 1)` 이 되어 마지막 원소이고, `head` 를 안 건드리니 첫 원소는 그대로다 |
| 앞에서 빼기 | `head` 칸을 읽어 비우고 `head ← wrap(head + 1)`, `count` 를 1 줄인다 | 옛 두 번째 원소가 새 `head` 칸이 되어 첫 원소다. 뒤 끝은 `head` 가 1 늘고 `count` 가 1 줄어 그대로다 |
| 뒤에서 빼기 | `wrap(head + count − 1)` 칸을 읽어 비우고 `count` 를 1 줄인다 | 옛 끝에서 두 번째 원소가 새 뒤 끝이다. `head` 를 안 건드리니 첫 원소는 그대로다 |
| 칸 늘리기 | 앞에서 `i` 번째 원소를 새 칸 `i` 에 옮기고 `head ← 0` | 옮긴 뒤 앞에서 `i` 번째 원소가 `wrap(0 + i) = i` 번 칸에 있어 대응이 그대로다 |
| 빈 덱에서 빼기·보기 | `null` 을 돌려주고 아무것도 안 바꾼다 | 수열이 비었고 두 끝이 `null` 이라는 문장 그대로다 |

**경계 입력에서도 확인합니다.** 빈 덱 · 원소 하나 · 감긴 원소 셋 · 감긴 채로 가득 찬 여덟 · 늘린 뒤 아홉을
시작 상태로 두고, 각각에 `pushFront(100)` · `pushBack(200)` 을 부른 뒤 `popFront()` · `popBack()` 을
부릅니다. 호출마다 정본의 두 끝과 `size()` 를 평범한 배열로 흉내 낸 수열과 대조했고, 하나라도 다르면
실행이 멈추게 해 두었어요. 표는 시작 · 넣은 뒤 · 뺀 뒤의 두 끝(`peekFront · peekBack`)입니다.

<!--proof:invariant-ops-->

```text
시작 상태                  시작 두 끝   앞에 100 · 뒤에 200 을 넣은 뒤   앞뒤에서 하나씩 뺀 뒤
빈 덱                     null · null                        100 · 200             null · null
원소 하나 [7]                   7 · 7                        100 · 200                   7 · 7
감긴 원소 셋 [0 1 2]            0 · 2                        100 · 200                   0 · 2
가득 찬 여덟 [0 1 … 7]          0 · 7                        100 · 200                   0 · 7
늘린 뒤 아홉 [-1 0 … 7]        -1 · 7                        100 · 200                  -1 · 7
```

다섯 줄 모두 넣은 뒤의 두 끝이 `100 · 200` 이고, 뺀 뒤에는 **시작 두 끝으로 그대로 돌아옵니다.** 빈 덱에서
시작한 줄은 원소가 둘뿐이라 넣은 둘이 곧 두 끝이었고, 원소 하나에서 시작한 줄은 시작과 끝에서 두 끝이
**같은 원소** 7 을 가리켜요. 늘린 뒤 아홉에서 시작한 줄은 칸 16 개의 15 번 칸이 앞 끝인 상태에서 넣기가
그 앞 칸 14 로 감겼는데도 두 끝이 수열과 같습니다.

**이제 깨뜨려 봅시다.** 위 표에서 대응을 지키던 줄 가운데 칸 늘리기의 `head ← 0` 을 고릅니다. 다른 곳은
그대로 두고 **`#grow` 의 `this.#head = 0;` 한 줄만** 지워요.

```ts
#grow(): void {
  const grown: (T | undefined)[] = new Array(this.#slots.length * 2);
  for (let offset = 0; offset < this.#count; offset++) {
    grown[offset] = this.#slots[this.#wrap(this.#head + offset)];
  }
  this.#slots = grown;
  // this.#head = 0;   ← 이 줄을 지웠다
}
```

전개의 T1~T19 로 감긴 채로 늘린 뒤와, 뒤로만 아홉 번 넣어 감기지 않은 채로 늘린 뒤를 두 코드로 견줍니다.

<!--proof:mutant-head-->

```text
입력             호출          바른 코드   그 줄을 지운 코드       판정
전개 T1~T19      peekFront()          -1                  -1       같다
전개 T1~T19      peekBack()            7           undefined   어긋난다
전개 T1~T19      popFront()           -1                  -1       같다
전개 T1~T19      popBack()             7           undefined   어긋난다
뒤로만 아홉 번   peekFront()           1                   1       같다
뒤로만 아홉 번   peekBack()            9                   9       같다
뒤로만 아홉 번   popFront()            1                   1       같다
뒤로만 아홉 번   popBack()             9                   9       같다
```

**뒤로만 넣은 입력에서는 네 줄 모두 같습니다.** 늘리는 순간 `head` 가 이미 0 이라 지운 줄이 할 일이 없었기
때문이에요. 감긴 채로 늘린 입력에서는 뒤 끝을 읽는 두 호출이 `7` 대신 `undefined` 를 돌려줍니다. 옮긴
원소는 새 칸 0~7 에 있는데 `head` 가 7 에 남아서, `pushFront(-1)` 이 `wrap(7 − 1) = 6` 번 칸의 원소 6 을
-1 로 덮어썼고, 뒤 끝 번호 `wrap(6 + 9 − 1) = 14` 가 빈 칸을 가리켰어요.

```text
늘린 직후         0 1 2 3 4 5 6 7 · · · · · · · ·    head 가 0 이어야 하는데 7 에 남았다
pushFront(-1)    0 1 2 3 4 5 -1 7 · · · · · · · ·   wrap(7 − 1) = 6 번 칸의 6 을 덮어썼다
peekBack()       wrap(6 + 9 − 1) = 14 번 칸          → undefined     바른 코드는 7
```

### 비용 계산

#### 비용을 세는 과정

비용의 단위는 **칸 하나를 지나갈 때마다 1** 이고, 읽기와 쓰기를 따로 세지 않습니다. 전개의 걸음 표에
그 값이 걸음마다 적혀 있어요. T4·T5·T6 이 넣기 한 번에 1, T7·T8 이 보기 한 번에 1, T9·T10 이 빼기 한
번에 1 이었고, T19 는 원소 여덟을 옮기고 한 칸을 써서 9 였습니다. 묶음별로 모으면 이렇습니다.

<!--proof:cost-by-group-->

```text
묶음   호출 수   비용 합   1 이 아닌 걸음
넣기        11        19   T19=9
빼기         5         4   T1=0
보기         7         7   전부 1
합          23        30   —
```

그러니 한 호출의 비용은 **넣기라면 1 에 그 호출이 옮긴 원소 수를 더한 값**이고, 빼기와 보기는 1 이하예요.
옮기는 일은 `#grow` 에만 있고 `#grow` 는 넣기에서만 불리므로, 여러 호출의 합은 이렇게 적힙니다.

```text
여러 호출의 비용 합 = (넣기 횟수) + (빼기 횟수 중 빈 덱이 아니었던 것) + (보기 횟수) + (옮긴 원소 수)
                                                                               └ 이 항만 원소 수에 비례할 수 있다
전개의 스물세 걸음   넣기 11 + 빼기 4 + 보기 7 + 옮김 8 = 30        T1 의 빈 덱 popFront 는 0
```

옮긴 원소 수가 넣기 횟수와 어떤 관계인지가 「수식 정의와 유도」의 $M(n) < 2n$ 이에요. 넣기를 $n$ 번 하는
어떤 호출 열이든 칸 수는 넣기로만 늘고 빼기로 줄지 않으므로, 옮긴 원소 수의 합이 뒤로만 $n$ 번 넣을 때의
$M(n)$ 을 넘지 않습니다. 추가로 잡는 메모리는 칸 $c$ 개이고, 칸을 한 번이라도 늘렸다면 $c$ 는 지금까지 가장 많이
들어 있던 원소 수의 두 배 미만이에요.

#### 케이스별 비용과 그 경계

**케이스**(어떤 호출인가)와 **경계**(어떤 종류의 값인가)는 다른 축입니다. 넣기 묶음을 두 축으로 가르면
이렇습니다.

| | 상한 `O` | 타이트 `Θ` |
| --- | --- | --- |
| **칸이 남은 넣기 한 번** | `O(1)` | `Θ(1)` — 정확히 1 칸 |
| **칸이 가득 찬 순간의 넣기 한 번** | `O(n)` | `Θ(n)` — 정확히 원소 수 + 1 칸 |
| **넣기 `n` 번의 평균** (어떤 호출 순서든) | `O(1)` | `Θ(1)` — 1 이상 3 미만 |

빼기 묶음과 보기 묶음은 이 구현에서 케이스가 갈리지 않아요. 칸을 줄이지 않으므로 빼기는 늘 1 칸(빈 덱이면
0)이고, 보기도 늘 1 칸입니다.

**한정자는 집필자가 고르는 값이 아니라 계약 헤더에 연산마다 적혀 있습니다.** 넣기 둘과 빼기 둘은
`amortized`, 보기 넷은 `worst` 예요. 넣기가 `amortized` 인 이유는 위 표의 가운데 줄입니다 — 칸을 늘리는
구현을 계약이 막지 않으려면 호출 한 번이 상수를 넘는 것을 허용해야 해요. **빼기도 `amortized` 인 것은 이
구현이 필요로 해서가 아닙니다.** 원소가 크게 줄면 칸을 줄이는 구현도 계약을 지킬 수 있게 남겨 둔
자리이고, 그런 구현의 빼기는 칸을 줄이는 순간 원소 수만큼 옮겨요. 보기 넷은 어떤 정당한 구현도 칸 하나나
개수 하나를 읽으면 되니 가장 강한 `worst` 로 적혀 있습니다.

```text
세 한정자는 한 줄로 서지 않는다
  worst        호출 한 번마다 그 상한                         → 나머지 둘을 함의한다
  amortized    어떤 호출 순서든 n 번의 합을 n 으로 나눈 값      → 난수와 무관한 최악의 평균
  expected     난수에 대한 평균                                → amortized 와 서로를 함의하지 않는다
```

**보장의 종류를 밝힙니다.** 이 구현에는 난수가 하나도 없어요. 그래서 `amortized` 는 기댓값이 아니라
**어떤 호출 순서를 넣어도 성립하는 합의 상한**입니다 — 입력 분포에 대한 가정도, 구현이 만드는 무작위성도
없습니다. 넣기와 빼기를 섞어 호출하는 열에서도 같은 상한이 성립해요.

```text
호출 m 번 · 그중 넣기 p 번
  총비용 ≤ m + M(p)          호출마다 1 칸 이하 + 옮긴 원소
         < m + 2p            M(p) < 2p
         ≤ 3m                p ≤ m
```

계약 스위트 축3 이 정본에 대해 내는 값 전부입니다. 시나리오마다 세 크기에서 잰 연산당 비용과 이웃한 두
크기의 비율 $r$ 이에요.

<!--proof:growth-rate-->

```text
시나리오가 부르는 연산            한정자      n = 1,024   n = 4,096   n = 16,384             r   판정
pushFront·pushBack                amortized        1.99        2.00         2.00   1.00 · 1.00   통과
pushFront                         amortized        1.99        2.00         2.00   1.00 · 1.00   통과
pushBack·popFront                 amortized        1.50        1.50         1.50   1.00 · 1.00   통과
popFront·popBack                  amortized        1.00        1.00         1.00   1.00 · 1.00   통과
peekFront·peekBack·isEmpty·size   worst            4.00        4.00         4.00   1.00 · 1.00   통과
```

다섯 시나리오 모두 $r$ 이 1.00 입니다. `n` 을 네 배로 키워도 연산당 비용이 그대로라는 뜻이고, 계약이
요구하는 값과 같아요. 넣기 시나리오의 1.99·2.00 은 $n + M(n)$ 을 $n$ 으로 나눈 값이고, 보기 시나리오의
4.00 은 한 걸음에 보기 넷을 부르기 때문입니다. 시간이 아니라 지나간 칸을 세므로, 이 판정은 이 기계의 속도가
아니라 구현의 작업량을 잽니다.

#### 최악을 만드는 입력

**적대적 입력은 하나로 부족합니다.** 최악은 계약이 아니라 **구현**에 대해 정해지기 때문이에요. 파트 1 의
세 설계를 각자의 최악 입력 셋에 모두 넣어 `n = 4,096` 에서 셉니다.

<!--proof:worst-inputs-->

```text
입력 (n = 4,096)             설계            연산당 평균   한 호출 최대
앞으로만 넣기                배열 하나          2,048.50          4,096
앞으로만 넣기                배열 두 개             1.00              1
앞으로만 넣기                링 버퍼(정본)          2.00          2,049
번갈아 앞뒤로 빼기           배열 하나          1,025.00          4,096
번갈아 앞뒤로 빼기           배열 두 개         2,049.50          4,097
번갈아 앞뒤로 빼기           링 버퍼(정본)          1.00              1
칸이 찬 순간 한 번 더 넣기   배열 하나              1.00              1
칸이 찬 순간 한 번 더 넣기   배열 두 개             1.00              1
칸이 찬 순간 한 번 더 넣기   링 버퍼(정본)      4,097.00          4,097
```

같은 입력이 설계마다 최선도 되고 최악도 됩니다. 「앞으로만 넣기」는 배열 하나에 연산당 2,048.50 칸이지만
배열 두 개에는 1.00 칸이에요. 「번갈아 앞뒤로 빼기」는 배열 두 개에 2,049.50 칸이고 링 버퍼에는 1.00
칸입니다. **본문에 실린 링 버퍼의 최악은 칸이 막 가득 찬 순간의 넣기 한 번**이고, `n = 4,096` 이면 원소
4,096 개를 옮기고 한 칸을 써서 4,097 칸이에요. 원소 수가 $8 \cdot 2^{k}$ 인 순간마다 이 호출을 만들 수
있습니다.

```ts
const d = new Deque<number>();
for (let i = 0; i < 4096; i++) d.pushBack(i); // 칸 4,096 개가 가득 찬다
d.pushBack(4096);                            // 이 한 번이 원소 4,096 개를 옮긴다
```

그래도 평균은 상수에 머물러요 — 그 4,097 칸짜리 호출에 이르기까지 넣기 4,096 번이 필요했고, 그동안
옮긴 원소가 $M(4,096) = 8\,(2^{9} - 1) = 4,088$ 개였습니다. 「앞으로만 넣기」 줄의 링 버퍼 최댓값이
2,049 인 것은 그 시나리오가 원소 4,096 개까지만 넣어서 마지막 늘림이 원소 2,048 개일 때였기 때문이에요.
**다른 정당한 구현에는 다른 입력이 최악입니다** — 칸을 줄이는 링 버퍼라면 칸을 줄이는 경계에서 넣고 빼기를
번갈아 하는 입력이, 이중 연결 리스트라면 최악이 따로 없고 원소마다 잡는 필드 셋이 비용입니다.

### 스스로 점검하기

여기까지 다룬 것을 한 줄로 정리하면 이렇습니다. 원소는 제자리에 두고 앞 끝의 칸 번호와 원소 수만 들면,
넣기와 빼기가 번호를 칸 수로 감싸 옮기는 일이 되고, 원소를 옮기는 일은 칸이 가득 찬 순간의 두 배 늘리기
하나로 모여 그 합이 넣기 횟수의 두 배를 못 넘습니다.

```text
칸 c 개 · head · count 를 둔다
   → 앞에 넣으면 head ← wrap(head − 1) 에 쓰고, 뒤에 넣으면 wrap(head + count) 에 쓴다
   → 앞에서 빼면 head 칸을 비우고 head ← wrap(head + 1), 뒤에서 빼면 wrap(head + count − 1) 칸을 비운다
   → 칸이 가득 차면 두 배로 늘리고 앞 끝부터 0 번 칸에 옮긴 뒤 head ← 0
       └ 넣기·빼기 여러 번의 평균은 3 미만, 가득 찬 순간의 넣기 한 번만 원소 수 + 1
```

먼저 답이 붙는 문제 하나입니다. 전개가 T23 에서 끝난 상태(칸 16 개, `head` 0, `count` 7)에서
`pushFront(-2)` 를 한 번 더 부르면 `head` 는 몇이 되고, 그 호출의 비용은 얼마일까요?

```text
T23 뒤    칸 16 개   0 1 2 3 4 5 6 · · · · · · · · ·    head 0   count 7
그다음    pushFront(-2)   → head ?   비용 ?
```

<!--check:next-->
`count` 가 7 이고 칸이 16 개라 늘리지 않습니다. `head` 는 `wrap(0 − 1)` 인데 이번에는 칸 수가 16 이라
**15** 가 되고, 한 칸만 쓰므로 비용은 **1** 이에요.

<!--proof:check-next-->

```text
pushFront(-2)   count 7 < 칸 16   wrap(0 - 1) = 15   비용 1
칸 배치  0 1 2 3 4 5 6 · · · · · · · · -2
head 15  count 8  앞 끝부터 [-2 0 1 2 3 4 5 6]
```

T6 에서 같은 `wrap(0 − 1)` 이 7 이었던 것과 비교해 보세요. 식은 같고 칸 수 `c` 만 8 에서 16 으로 바뀌어
결과가 달라졌습니다. T19 에서 한 번 늘린 뒤로는 앞 끝이 감기는 번호가 15 예요.
<!--/check-->

```text
아래 셋은 답을 싣지 않았습니다. 막히면 이 절들을 다시 보세요
  1 → 「수행으로 알아보는 자료구조」의 T17 · T19     2 → 「멈춤 — 나머지 연산 한 번으로는 …」
  3 → 경쟁 설계와의 대조
```

- T17 에서 칸이 가득 찼을 때 `head` 가 7 이 아니라 3 이었다고 합시다. T19 의 `#grow` 가 끝난 직후 16 칸의
  배치를 직접 그려 보세요. 옮기는 반복문이 `offset` 마다 어느 칸을 읽는지부터 적으면 됩니다.
- `pushFront` 만 여덟 번 부른 뒤 `peekBack()` 이 `undefined` 를 냈습니다. 나머지를 한 번만 하는 식을 그대로
  두고 `pushBack` 만 여덟 번 부르면 어떻게 되나요? 답이 틀리는지, 틀린다면 몇 번째 호출에서인지 값으로
  확인해 보세요.
- 원소를 크게 넣었다가 거의 다 빼는 일을 되풀이하는 프로그램이 있습니다. 이 가이드의 링 버퍼에 **칸을
  줄이는 규칙**을 더한다면, 원소 수가 칸 수의 절반이 될 때 줄이는 규칙과 4 분의 1 이 될 때 줄이는 규칙 중
  어느 쪽이 「넣기 한 번 · 빼기 한 번」을 경계에서 번갈아 할 때 연산당 비용이 상수에 머물까요?
