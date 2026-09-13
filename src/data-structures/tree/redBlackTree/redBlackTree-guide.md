# 레드블랙 트리 — 노드에 색 하나를 붙여 높이를 원소 수의 로그 안에 묶는다

## 파트 1 — 계약에서 동작하는 코드까지

레드블랙 트리가 지키는 계약을 먼저 한 장으로 보고, 그 계약을 가장 단순한 구현들이 어느 입력에서 못 지키는지
수치로 확인한 다음, 색 규칙으로 높이를 묶는 설계에 이르러 실제로 동작하는 코드를 한 조각씩 만듭니다.

### 전체 컨셉

이 글이 다루는 계약은 **정렬 집합**입니다. 같은 값을 두 벌 담지 않고, 담긴 값을 비교 순서로 유지하며,
넣기 · 지우기 · 찾기 · 양 끝 읽기 · 구간 읽기를 해 줘요. 연산은 생성자까지 아홉입니다.

```text
  insert(x)          x 를 담는다. 이미 있으면 아무것도 안 바뀐다
  delete(x)          x 를 지우고 true. 없으면 false
  has(x)             x 가 담겨 있는가
  min() · max()      가장 작은 값 · 가장 큰 값. 비었으면 null
  range(low, high)   low 이상 high 이하의 값을 오름차순으로
  size()             몇 개인가
  toArray()          전부를 오름차순으로
```

이 계약에서 특별한 것은 비용의 약속이 **호출 하나하나**에 걸린다는 점입니다. 넣기 1,000 번의 평균이 원소
수의 로그면 되는 것이 아니라, **어느 한 번도** 로그를 넘으면 안 돼요.

이 글이 만드는 설계는 **이진 탐색 트리**에서 출발합니다. 노드마다 값 하나와 왼쪽 자식 · 오른쪽 자식을 두고,
왼쪽 아래에는 더 작은 값, 오른쪽 아래에는 더 큰 값만 두는 트리예요. 찾기는 뿌리에서 비교 결과를 따라 한쪽으로
내려가는 일이라, 비용이 **트리의 높이**(뿌리에서 가장 먼 노드까지 지나는 노드 수)로 정해집니다.

```text
값 1~7 을 담은 이진 탐색 트리 두 개. 둘 다 규칙은 지켰다

  넣은 순서 4 2 6 1 3 5 7           넣은 순서 1 2 3 4 5 6 7
          4                        1
      2       6                      2
    1   3   5   7                      3
                                         4        ← 오른쪽으로만 이어져
  높이 3                                   5         높이가 원소 수와 같다
                                             6
                                               7
                                   높이 7
```

같은 값을 담아도 넣은 순서에 따라 높이가 3 도 되고 7 도 됩니다. 이 설계는 노드마다 **색 하나**(빨강 또는
검정)를 붙이고, 넣고 지울 때마다 색을 고치거나 노드 몇 개의 자리를 바꿔 **높이가 원소 수의 로그를 넘지 않게**
유지해요. 원소가 100 만 개여도 뿌리에서 가장 먼 노드까지 40 개를 넘게 지나지 않습니다.

| 연산 묶음 | 한 번 부를 때 지나가는 노드 |
| --- | --- |
| 찾기 · 양 끝 읽기 | 높이 이하 |
| 넣기 · 지우기 | 내려가는 높이 + 색을 고치며 올라오는 높이 + 자리 바꾸기 몇 번 |
| 구간 읽기 | 경계 두 개를 따라 내려가는 높이 두 번 + 돌려주는 원소 수 |
| 개수 · 전부 읽기 | 개수는 1, 전부 읽기는 원소 수 |

### 시작하기 전에 — 이미 알고 있어야 하는 것

- **이진 탐색 트리.** 노드마다 왼쪽 부분트리의 값은 모두 더 작고 오른쪽 부분트리의 값은 모두 더 큽니다. 찾기와
  넣기가 뿌리에서 비교를 따라 내려가는 일이에요. 흐릿하면 [`binarySearchTree` 가이드](../binarySearchTree/binarySearchTree-guide.mdx)를
  먼저 보세요.
- **중위 순회.** 왼쪽 부분트리 → 노드 → 오른쪽 부분트리 순서로 읽으면 이진 탐색 트리의 값이 오름차순으로
  나옵니다. `toArray` 와 `range` 가 이 순서를 씁니다.

```text
      4
    2   6          중위 순회   (1 2 3) 4 (5 6 7)   → 1 2 3 4 5 6 7
   1 3 5 7                     └ 왼쪽 부분트리 전부가 4 보다 먼저, 오른쪽 전부가 4 보다 나중
```

- **로그.** `log₂ n` 은 `n` 을 몇 번 반으로 나눠야 1 이 되는가입니다. `log₂ 1,024 = 10` 이고, 원소 수가 네 배가
  되면 로그는 2 만 늘어요.

```text
이 글이 다루는 것          중복 없는 정렬 집합의 아홉 연산을 호출마다 로그 안에
이 글이 다루지 않는 것     같은 값을 여러 벌 담기                   → multiset
                          k 번째 원소 읽기 · 순위                   → orderStatisticTree
                          호출을 모아 평균만 로그로 지키기           → splayTree
```

### 설계 상세 — 레드블랙 트리에 이르는 과정

**먼저 계약을 읽습니다.** 자료구조는 문제를 고정하지 않아요 — 무엇을 지켜야 하는지가 이미
[`redBlackTree.ts`](./redBlackTree.ts) 헤더에 계약으로 적혀 있습니다. 여기서 볼 것은 그 계약이 **무엇을
막는지**와 **조건 하나를 풀면 무엇이 되는지**예요.

```text
계약에 없는 것     같은 값 여러 벌 · k 번째 원소 · 저장 공간의 조건 · 색이나 회전이라는 말
                   └ 계약은 「호출마다 로그」만 요구한다. 색은 이 글이 고른 방법이지 계약의 문장이 아니다

조건 하나를 풀면
  순서를 버리면                             → 해시 집합
  같은 값을 여러 벌 허용하면                → 다중집합
  넣기 · 지우기가 원소 수에 비례해도 되면   → 정렬 배열
  호출을 모아 평균만 로그면 되면            → 스플레이 트리
  난수에 대한 평균만 로그면 되면            → 트립
```

이 글이 끝까지 쓰는 기호는 여섯이에요. 여기서 정하고 뒤에서 뜻을 바꾸지 않습니다.

| 기호 | 무엇인가 | 코드에서 |
| --- | --- | --- |
| `n` | 담긴 원소 수 | `this.#count` |
| `k` | `range` 가 돌려주는 원소 수 | `out.length` |
| `h` | 높이 — 뿌리에서 가장 먼 노드까지 지나는 노드 수. 빈 트리는 0 | — |
| `b` | 검은 높이 — 뿌리에서 빈 자리까지 내려가는 길에서 만나는 검은 노드 수(빈 자리는 세지 않는다) | — |
| `C(n)` | 크기 `n` 에서 잰 **호출 한 번 비용의 최댓값** | 계약 스위트 축3 |
| `r` | 성장률 `C(4n) / C(n)` — `n` 을 네 배로 키웠을 때 호출 한 번의 최댓값이 몇 배가 되는가 | 계약 스위트 축3 |

비용의 단위는 **노드 하나를 지나갈 때마다 1** 이고, 색을 바꾸는 일과 자리를 바꾸는 일도 지나간 노드로 셉니다.
트리 모양은 두 가지로 적어요. 괄호 표기 `20B(10B 40R(30B 90B))` 는 값 뒤의 `B` 가 검정 · `R` 이 빨강이고,
괄호 안이 왼쪽 자식 · 오른쪽 자식이며, `·` 은 빈 자리입니다. 깊이 그림은 깊이마다 한 줄이고, 한 칸이 중위 순서의
한 자리라 왼쪽에 있는 값이 늘 더 작아요. `-` 는 그 깊이에 노드가 없는 칸입니다.

```text
괄호 표기   20B(10B 40R(30B 90B))

깊이 그림   깊이 1   -    20B  -    -    -
            깊이 2   10B  -    -    40R  -
            깊이 3   -    -    30B  -    90B
```

**자료구조에서는 입력 크기 하나가 비용을 정하지 않습니다.** 어떤 연산이 어떤 순서로 섞여 들어오는가가 정해요.
계약 스위트가 재는 호출 패턴은 일곱이고, 이 글은 그중 넷으로 구현을 시험합니다.

```text
오름차순 넣기               insert(0) … insert(n − 1)                        적대적
무작위 넣기                 넓은 범위의 무작위 값을 n 번 넣는다
순차 조회                   오름차순으로 채운 뒤 has(i) · min() · max() 를 i = 0 … n − 1   적대적
오름차순 지우기             오름차순으로 채운 뒤 delete(0) … delete(n − 1)     적대적
(나머지 셋)                 range 를 n 번 · toArray 를 4 번 · size 를 n 번
```

**가장 단순한 구현부터 세웁시다.** 계약을 모르고 같은 요구를 받으면 답이 셋 나옵니다. 셋 다 저장소에 결함
구현으로 들어 있고, **셋 다 답은 옳아요** — 계약 스위트의 동작 검사와 불변식 검사를 전부 통과합니다.

```text
정렬 배열                 값을 오름차순 배열에 두고, 넣을 자리를 이진 탐색으로 찾아 뒤를 한 칸씩 옮긴다
균형 없는 트리            이진 탐색 트리에 빈 자리까지 내려가 붙이기만 한다
조회가 고쳐 쓰는 트리     찾을 때마다 찾은 노드를 뿌리로 끌어올린다(스플레이)
```

셋과 이 글의 정본을 네 패턴에 넣고 계약 스위트와 같은 방식으로 셉니다. 칸마다 `n = 4,096` 에서 `n = 16,384`
로 갈 때의 `r` 과 판정이에요. 이 계약의 상한이 로그라 기대하는 `r` 은 1.17 근처이고, 허용 폭은 ±30% 입니다.

<!--proof:naive-rates-->

```text
설계                    오름차순 넣기   무작위 넣기   순차 조회   오름차순 지우기
정렬 배열                   1.17 통과     3.99 실패   1.13 통과         3.99 실패
균형 없는 트리              4.00 실패     1.14 통과   4.00 실패         1.00 통과
조회가 고쳐 쓰는 트리       1.00 통과     1.02 통과   4.00 실패         4.00 실패
정본                        1.19 통과     1.20 통과   1.18 통과         1.17 통과
```

**셋이 서로 다른 칸에서 실패합니다.** 정렬 배열은 무작위 넣기와 지우기에서, 균형 없는 트리는 오름차순 넣기와
순차 조회에서, 조회가 고쳐 쓰는 트리는 순차 조회와 지우기에서 `r` 이 4 에 가까워요. 칸 하나의 값이 어떻게
나왔는지 호출 한 번의 최댓값으로 보면 이렇습니다.

<!--proof:naive-stats-->

```text
시나리오        설계                    n = 1,024   n = 4,096   n = 16,384
오름차순 넣기   정렬 배열                   10.00       12.00        14.00
오름차순 넣기   균형 없는 트리           1,023.00    4,095.00    16,383.00
오름차순 넣기   조회가 고쳐 쓰는 트리        2.00        2.00         2.00
오름차순 넣기   정본                        26.00       32.00        38.00
무작위 넣기     정렬 배열                  829.00    3,575.00    14,261.00
무작위 넣기     균형 없는 트리              25.00       29.00        33.00
무작위 넣기     조회가 고쳐 쓰는 트리       36.00       53.00        54.00
무작위 넣기     정본                        17.00       20.00        24.00
순차 조회       정렬 배열                   13.00       15.00        17.00
순차 조회       균형 없는 트리           2,049.00    8,193.00    32,769.00
순차 조회       조회가 고쳐 쓰는 트리    1,540.00    6,148.00    24,580.00
순차 조회       정본                        45.00       55.00        65.00
```

오름차순 넣기에서 균형 없는 트리의 최댓값은 `n − 1` 입니다 — 새 값이 늘 가장 커서 오른쪽으로만 붙고, 트리가
한 줄이 됐어요. 정렬 배열은 같은 입력에서 늘 맨 뒤에 붙이니 옮길 것이 없어 통과합니다. 조회가 고쳐 쓰는 트리는
넣기 두 줄을 다 통과하는데, 순차 조회의 **첫 조회 한 번**이 한 줄이 된 트리의 끝까지 내려가 1,540 · 6,148 ·
24,580 이 됐어요. 그 뒤 조회들은 트리가 끌어올리기로 납작해져 작아지지만, 계약 스위트는 호출 한 번의 최댓값을
보므로 그 한 번이 그대로 판정에 들어갑니다.

```text
실패의 원인이 셋 다 다르다
  정렬 배열                원소를 자리로 늘어놓아, 가운데에 넣으면 뒤를 전부 옮긴다
  균형 없는 트리           트리의 높이를 아무도 안 보아, 넣는 순서가 높이를 정한다
  조회가 고쳐 쓰는 트리    높이를 고치기는 하는데 한 호출 안에서 끝내지 않는다
```

**원인을 좁혀 봅시다.** 트리는 가운데에 넣어도 옮길 것이 없으니 정렬 배열의 원인은 피합니다. 남는 문제는
높이예요. 균형 없는 트리에 1 부터 7 까지 오름차순으로 넣으면 이렇게 됩니다.

<!--proof:chain-seven-->

```text
깊이 1   1  -  -  -  -  -  -
깊이 2   -  2  -  -  -  -  -
깊이 3   -  -  3  -  -  -  -
깊이 4   -  -  -  4  -  -  -
깊이 5   -  -  -  -  5  -  -
깊이 6   -  -  -  -  -  6  -
깊이 7   -  -  -  -  -  -  7

넣기마다 지나간 노드   1 · 1 · 2 · 3 · 4 · 5 · 6   합 22   높이 7
```

넣기마다 지나간 노드가 1 · 1 · 2 · 3 · 4 · 5 · 6 으로 하나씩 늘었어요. `k` 번째 넣기가 앞의 `k − 1` 개를 전부
지나갔기 때문입니다. 여기까지가 준비이고, 이제 비용은 「트리의 높이가 얼마인가」 하나로 정리돼요 — 찾기 · 넣기 ·
지우기 모두 뿌리에서 한쪽으로 내려가므로 높이만큼 지나갑니다.

```text
찾기 · 넣기 · 지우기 한 번의 비용  ≤  높이 h  (+ 고치는 일)
        └ 고치는 일이 없는 균형 없는 트리에서 h 는 넣는 순서가 정한다
```

**높이가 무엇에 달렸는지 두 경우를 재 봅시다.** 같은 일곱 값을 두 순서로 균형 없는 트리에 넣습니다.

<!--proof:two-orders-->

```text
넣은 순서                  넣기마다 지나간 노드        합   높이
오름차순 1 2 3 4 5 6 7     1 · 1 · 2 · 3 · 4 · 5 · 6   22      7
가운데부터 4 2 6 1 3 5 7   1 · 1 · 1 · 2 · 2 · 2 · 2   11      3
```

같은 값인데 넣기 합이 22 와 11, 높이가 7 과 3 입니다. 가운데부터 넣은 순서는 넣을 때마다 좌우가 번갈아 채워져
깊이 3 에서 멈췄어요. 관찰은 이것입니다 — **값은 같아도 모양이 비용을 정하고, 모양은 넣는 순서가 정한다.**
순서는 호출하는 쪽이 고르므로, 비용을 순서에서 떼어 내려면 트리가 **넣고 지우는 도중에 스스로 모양을 고쳐야**
해요.

```text
오름차순 1 2 3 4 5 6 7        오른쪽 자식만 이어져 높이 7
가운데부터 4 2 6 1 3 5 7      넣을 때마다 빈 쪽이 채워져 높이 3 = ⌈log₂ 8⌉
```

**가장 단순한 고치기부터 시험합니다.** 넣거나 지울 때마다 트리 전체를 **가장 낮은 모양**(가운데 값을 뿌리로 삼는
완전 균형 트리)으로 다시 세우면 높이는 늘 가장 낮습니다. 다시 세우는 일이 노드 전부를 지나간다고 두고 세면
이렇게 돼요.

<!--proof:rebuild-rates-->

```text
시나리오        n = 1,024   n = 4,096   n = 16,384      r   판정
오름차순 넣기    1,034.00    4,108.00    16,398.00   3.99   실패
무작위 넣기        922.00    3,648.00    14,460.00   3.96   실패
순차 조회           33.00       39.00        45.00   1.15   통과
```

순차 조회는 통과합니다 — 높이가 늘 가장 낮으니까요. 대신 넣기 두 줄이 `r = 3.99 · 3.96` 으로 실패해요. 모양을
**통째로** 고치면 고치는 일 자체가 원소 수에 비례합니다. 그러니 필요한 것은 **완벽한 모양이 아니라 높이의
상한**이고, 그 상한을 넣기 한 번이 고치는 노드 몇 개로 유지하는 방법입니다.

```text
완전 균형으로 다시 세우기    높이 ⌈log₂(n+1)⌉   고치는 일 n        → 넣기가 원소 수에 비례한다
필요한 것                    높이 ≤ 로그의 상수 배   고치는 일 ≤ 높이 → 넣기가 로그 안에 든다
```

**이제 개념을 정의합니다.** 노드마다 색 하나를 붙이고 세 규칙을 지킵니다.

```text
뿌리 규칙    뿌리는 검다
빨강 규칙    빨간 노드의 자식은 검다                       빨강이 부모 · 자식으로 연달아 오지 않는다
검정 규칙    어느 노드에서 빈 자리까지 내려가든, 만나는 검은 노드 수가 같다
```

1 부터 7 까지 오름차순으로 이 글의 정본에 넣으면 넣기마다 이런 일이 일어납니다. 갈래 칸의 번호는 뒤의 전개에서
코드와 맞춰 쓰는 이름이고, 여기서는 「한 일」 칸을 읽으면 돼요.

<!--proof:ascending-fixes-->

```text
호출        갈래   한 일                                          넣은 뒤 모양              높이
insert(1)   —      —                                              1B                           1
insert(2)   —      —                                              1B(· 2R)                     2
insert(3)   ④      2 검게 · 조부모 1 빨갛게, 1 을 왼쪽으로 회전   2B(1R 3R)                    2
insert(4)   ②      부모 3 · 삼촌 1 검게, 조부모 2 빨갛게          2B(1B 3B(· 4R))              3
insert(5)   ④      4 검게 · 조부모 3 빨갛게, 3 을 왼쪽으로 회전   2B(1B 4B(3R 5R))             3
insert(6)   ②      부모 5 · 삼촌 3 검게, 조부모 4 빨갛게          2B(1B 4R(3B 5B(· 6R)))       4
insert(7)   ④      6 검게 · 조부모 5 빨갛게, 5 를 왼쪽으로 회전   2B(1B 4R(3B 6B(5R 7R)))      4
```

일곱 번을 넣은 트리에서 뿌리부터 빈 자리까지의 길을 전부 셉니다.

<!--proof:black-paths-->

```text
깊이 1   -   2B  -   -   -   -   -
깊이 2   1B  -   -   4R  -   -   -
깊이 3   -   -   3B  -   -   6B  -
깊이 4   -   -   -   -   5R  -   7R

뿌리에서 빈 자리까지   지나는 노드   그중 검은 노드
2B → 1B                          2                2
2B → 1B                          2                2
2B → 4R → 3B                     3                2
2B → 4R → 3B                     3                2
2B → 4R → 6B → 5R                4                2
2B → 4R → 6B → 5R                4                2
2B → 4R → 6B → 7R                4                2
2B → 4R → 6B → 7R                4                2
```

길이 여덟이고 **검은 노드는 모든 길에서 2 개**입니다 — 검정 규칙이에요. 가장 긴 길은 `2B → 4R → 6B → 5R` 로
노드 4 개인데, 그중 빨강이 둘이고 각 빨강 바로 위가 검정입니다. 빨강 규칙 때문에 빨강 하나마다 그 위에 검정이
하나씩 있어야 하니 **빨강이 검정보다 많을 수 없고**, 그래서 가장 긴 길의 노드 수 4 가 검은 노드 수 2 의 두 배를
넘지 않아요. 가장 짧은 길 `2B → 1B` 는 검정만 둘입니다.

```text
검은 높이 b = 2
  가장 짧은 길   2B → 1B              노드 2 = b         검정만
  가장 긴 길     2B → 4R → 6B → 5R    노드 4 = 2b        빨강과 검정이 번갈아
  → 어느 길이든 노드 수가 b 이상 2b 이하다. 높이 h ≤ 2b
```

**상태가 넣기에서 유지되는지 값으로 확인합시다.** 새 노드는 **빨갛게** 넣습니다. 빨간 노드는 검은 노드 수에
안 들어가므로 검정 규칙이 넣는 순간 저절로 지켜져요. 깨질 수 있는 것은 빨강 규칙 하나뿐입니다.

- **쉬운 경우 — 부모가 검다.** `insert(2)` 가 그랬어요. 부모 1 이 검어 빨강이 연달아 오지 않으니 고칠 것이
  없습니다.
- **불안한 경우 — 부모가 빨갛다.** 부모의 형제(삼촌)의 색으로 갈립니다. 삼촌이 **빨가면** 부모와 삼촌을 검게,
  조부모를 빨갛게 바꿔요(`insert(4)` · `insert(6)`). 조부모 아래 두 길에서 검정이 하나씩 늘고 조부모에서 하나 줄어
  검은 수가 그대로이고, 대신 조부모가 빨개졌으니 **같은 물음을 두 층 위에서 다시** 묻습니다. 삼촌이 **검으면**
  부모를 조부모 자리로 올리는 회전 한 번(안쪽 자식이면 두 번)으로 끝나요(`insert(3)` · `insert(5)` · `insert(7)`).

```text
insert(4) 직전  2B(1R 3R)       4 를 3 의 오른쪽에 빨갛게 붙이면 3R → 4R 가 연달아 빨갛다
                삼촌 1 이 빨갛다  → 부모 3 · 삼촌 1 검게, 조부모 2 빨갛게   → 2R(1B 3B(· 4R))
                2 가 뿌리라        → 뿌리 규칙으로 다시 검게                  → 2B(1B 3B(· 4R))

insert(5) 직전  2B(1B 3B(· 4R))  5 를 4 의 오른쪽에 붙이면 4R → 5R
                삼촌(3 의 왼쪽)이 빈 자리 = 검정 → 4 검게 · 3 빨갛게, 3 을 왼쪽으로 회전 → 2B(1B 4B(3R 5R))
```

**왜 이 고치기가 끝나는지를 코드의 반복 조건으로 말합니다.** 반복은 「지금 노드의 부모가 빨갛다」인 동안만 이어져요.
삼촌이 빨간 갈래는 물음을 두 층 위로 옮기므로 높이의 절반 번을 넘게 반복할 수 없고, 삼촌이 검은 갈래는 회전 뒤 올라온
노드를 검게 칠해 반복 조건을 거짓으로 만듭니다. 뿌리에 이르면 뿌리의 부모가 검은 빈 자리라 역시 멈춰요.

```text
반복 조건         node 의 부모가 빨갛다
② 삼촌이 빨갛다   node ← 조부모(두 층 위)     반복은 높이의 절반 번 이하
④ 삼촌이 검다     올라온 노드를 검게 칠한다   반복 조건이 거짓이 되어 끝
뿌리에 이르면     부모가 감시 노드(검정)      끝
```

**마지막으로 결론을 값으로 냅니다.** 두 순서로 여러 크기를 넣어 높이를 재고, 로그 상한과 균형 없는 트리의 높이를
나란히 적었어요.

<!--proof:heights-->

```text
n        정본 · 오름차순   정본 · 무작위   2·log₂(n+1)   균형 없는 트리 · 오름차순   균형 없는 트리 · 무작위
15                     6               5          8.00                          15                         7
255                   14              10         16.00                         255                        18
4,095                 22              15         24.00                       4,095                        27
65,535                30              19         32.00                      65,535                        42
```

정본의 높이는 오름차순이든 무작위든 **네 크기 모두 `2·log₂(n+1)` 이하**입니다. `n = 65,535` 에서 오름차순으로 넣어도
30 이고, 같은 입력의 균형 없는 트리는 65,535 예요. 무작위로 넣으면 균형 없는 트리도 42 에 머물지만, 그 값은 입력이
뒤섞여 있어서 얻은 것이지 트리가 지킨 것이 아닙니다.

```text
레드블랙 트리 한 벌이 나왔다
  노드마다 색 하나. 뿌리 규칙 · 빨강 규칙 · 검정 규칙을 지킨다   → 높이 h ≤ 2b ≤ 2·log₂(n+1)
  새 노드는 빨갛게 넣는다                                      → 깨질 수 있는 것은 빨강 규칙 하나
  부모가 빨가면 삼촌 색으로 갈린다                              → 빨강이면 색만 옮기고 위로, 검정이면 회전하고 끝
      └ 균형 없는 트리의 오름차순 넣기 r = 4.00 이 네 패턴 모두 1.2 근처가 된다
```

### 수행으로 알아보는 자료구조 — 넣기 여섯과 지우기 둘로 고치기의 일곱 갈래를 모두 지난다

설계를 세웠으니 이제 **실제로 동작하는 코드**로 옮깁니다. 호출 열 하나를 잡고 끝까지 가되, 조각마다 그 조각만
실행해서 나온 값을 확인하고 넘어가요.

```ts
const t = new RedBlackTree<number>();                   // T1
// T2        max()                                        빈 트리
// T3~T8     insert(10) · insert(90) · insert(20) · insert(30) · insert(40) · insert(50)
// T9        insert(30)                                   이미 있는 값
// T10~T13   has(40) · has(35) · range(25, 55) · range(50, 20)
// T14~T16   delete(20) · delete(10) · delete(35)
// T17~T20   min() · max() · size() · toArray()           마지막이 [30, 40, 50, 90] 을 돌려준다
```

스무 번을 왜 이렇게 골랐을까요? **아홉 연산이 전부 한 번 이상 나오고**, 넣은 뒤 고치기의 세 갈래와 지운 뒤
고치기의 네 갈래가 **모두** 들어 있어요. 넣기 여섯과 지우기 둘은 값 10 · 20 · … · 90 에서 넣기와 지우기 조합을
실행해 보며 일곱 갈래를 다 지나는 가장 짧은 열을 찾아 고른 것입니다. 나머지는 빈 트리에서 읽기(T2), 이미 있는
값(T9), 없는 값(T11 · T16), 뒤집힌 구간(T13)을 한 번씩 넣으려고 끼웠어요.

```text
insert(x):
    뿌리에서 비교를 따라 빈 자리까지 내려간다
        같은 값을 만나면 끝                                         ① 이미 있다
    빈 자리에 빨간 노드를 붙이고 #fixInsert
#fixInsert(node):   부모가 빨간 동안
    삼촌이 빨갛다  → 부모 · 삼촌 검게, 조부모 빨갛게, node ← 조부모   ② 색을 옮긴다
    삼촌이 검다    → node 가 안쪽 자식이면 부모를 회전                ③ 먼저 한 번 회전
                     부모 검게, 조부모 빨갛게, 조부모를 회전          ④ 회전하고 끝
    뿌리를 검게

delete(x):
    x 를 찾는다. 없으면 false                                        ⑤ 없다
    자식이 하나 이하  → 그 자식이 자리를 잇는다                        ⑥
    자식이 둘         → 오른쪽 부분트리의 최솟값이 자리와 색을 잇는다    ⑦
    빠진 노드가 검었으면 #fixDelete(자리를 이은 노드)
#fixDelete(node):   node 가 뿌리가 아니고 검은 동안
    형제가 빨갛다          → 형제 검게, 부모 빨갛게, 부모를 회전        ⑧ 먼저 한 번 회전
    형제의 두 자식이 검다  → 형제 빨갛게, node ← 부모                  ⑨ 물음을 위로
    먼 조카가 검다         → 가까운 조카 검게, 형제 빨갛게, 형제를 회전 ⑩ 먼저 한 번 회전
    먼 조카가 빨갛다       → 형제에 부모 색, 부모 · 먼 조카 검게, 부모를 회전하고 끝   ⑪
    node 를 검게

has · min · max:     뿌리에서 한쪽으로 내려간다. 비었으면 min · max 는 null   ⑫ 비었다
range(low, high):    low > high 면 빈 배열                                     ⑬
                     아니면 구간에 들 수 있는 쪽으로만 중위 순회
size:                세어 둔 수        toArray: 중위 순회
```

#### 1. 감시 노드 하나와 constructor — 빈 자리를 null 이 아닌 노드로 둔다

모든 연산이 노드의 모양과 빈 자리를 다루므로, 노드 타입과 생성자(`constructor`)부터 둡니다. 이 구현은 잎 바깥의
빈 자리를 `null` 로 두지 않고 **검은 노드 하나**(감시 노드 `#nil`)로 겸하게 해요. 지운 뒤 고치기가 「빈 자리의
부모」를 물어야 하는데 `null` 에는 부모를 적을 곳이 없기 때문입니다.

```ts
type Color = "red" | "black";

interface Node<T> {
  value: T;
  color: Color;
  left: Node<T>;
  right: Node<T>;
  parent: Node<T>;
}

export class RedBlackTree<T> {
  readonly #nil: Node<T>;
  #root: Node<T>;
  #count = 0;
  readonly #compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.#compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const nil = { value: undefined as unknown as T, color: "black" } as Node<T>;
    nil.left = nil;
    nil.right = nil;
    nil.parent = nil;
    this.#nil = nil;
    this.#root = nil;
  }
}
```

T1 직후의 상태는 이렇습니다.

```text
#root = #nil      #nil.color = "black"      #nil.left = #nil.right = #nil.parent = #nil      #count = 0
빈 자리인지는 값이 아니라 참조로 가른다   at === this.#nil
```

감시 노드인지를 `at === this.#nil` 로 가르므로, 호출자가 `undefined` 를 원소로 넣어도 빈 자리와 헷갈리지
않아요. 감시 노드는 인스턴스마다 하나씩 만들어져 트리 둘이 나눠 쓰지 않습니다.

#### 2. has · min · max — 뿌리에서 한쪽으로 내려간다

세 연산을 한 벌로 묶는 근거는 **셋 다 트리를 바꾸지 않고 뿌리에서 한쪽으로 한 번 내려가는 일**이기 때문입니다.
`has` 는 비교 결과를 따라, `min` 은 늘 왼쪽으로, `max` 는 늘 오른쪽으로 내려가요.

```ts
has(item: T): boolean {
  return this.#find(item) !== this.#nil;
}

min(): T | null {
  if (this.#root === this.#nil) return null;          // ⑫ 비었다
  return this.#leftmost(this.#root).value;
}

max(): T | null {
  if (this.#root === this.#nil) return null;          // ⑫ 비었다
  let at = this.#root;
  while (at.right !== this.#nil) at = at.right;
  return at.value;
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
  while (at.left !== this.#nil) at = at.left;
  return at;
}
```

T2 · T10 · T11 · T17 · T18 이 이 조각입니다.

<!--proof:find-steps-->

```text
단계   호출      갈래   지나간 노드   돌려준 값
T2     max()     ⑫                0        null
T10    has(40)   —                2        true
T11    has(35)   —                3       false
T17    min()     —                2          30
T18    max()     —                2          90
```

T10 은 뿌리 20 에서 오른쪽으로 한 칸 가서 40 을 찾아 노드 2 개를 지나갔고, T11 은 20 → 40 → 30 을 지나 30 의
오른쪽이 빈 자리라 `false` 를 돌려줬어요. 어느 쪽이든 지나간 노드가 그때의 높이 4 를 넘지 않습니다.

#### 3. insert — 빈 자리까지 내려가 빨간 노드를 붙인다

넣기는 두 부분입니다. 여기서는 앞 절반 — 붙일 자리를 찾아 빨간 노드를 거는 일 — 만 보고, 고치기는 다음 벌에서
봐요. 앞 절반은 찾기와 같은 내려가기에 부모를 기억하는 일 하나가 더해진 것입니다.

```ts
insert(item: T): void {
  let parent = this.#nil;
  let at = this.#root;
  while (at !== this.#nil) {
    parent = at;
    const cmp = this.#compare(item, at.value);
    if (cmp === 0) return;                            // ① 이미 있다
    at = cmp < 0 ? at.left : at.right;
  }

  const node: Node<T> = { value: item, color: "red", left: this.#nil, right: this.#nil, parent };
  if (parent === this.#nil) this.#root = node;
  else if (this.#compare(item, parent.value) < 0) parent.left = node;
  else parent.right = node;

  this.#count += 1;
  this.#fixInsert(node);
}
```

T3 · T4 는 고칠 것이 없는 넣기이고, T9 는 이미 있는 값입니다.

<!--proof:insert-steps-->

```text
단계   호출         갈래   지나간 노드   넣은 뒤 모양
T3     insert(10)   —                0   10B
T4     insert(90)   —                1   10B(· 90R)
T9     insert(30)   ①                3   20B(10B 40R(30B 90B(50R ·)))
```

T3 은 뿌리가 빈 자리라 내려가지 않고 붙였고(비용 0), `#fixInsert` 에서 부모인 감시 노드가 검어 반복 없이 뿌리만 검게
칠했어요. T4 는 10 을 지나 오른쪽에 빨갛게 붙였는데 부모 10 이 검어 고칠 것이 없습니다. T9 는 20 → 40 → 30 에서
같은 값을 만나 ① 로 끝났고, 트리는 한 글자도 안 바뀌었어요.

#### 4. #fixInsert 와 회전 — 삼촌의 색으로 갈래를 고른다

고치기는 **회전**을 씁니다. 회전은 부모 · 자식 한 쌍의 위아래를 바꾸되 중위 순서는 그대로 두는 일이에요.
왼쪽 회전은 `pivot` 의 오른쪽 자식을 `pivot` 자리로 올리고, 그 자식의 왼쪽 부분트리를 `pivot` 의 오른쪽으로
옮깁니다. 오른쪽 회전은 좌우를 바꾼 같은 코드예요.

```ts
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

#fixInsert(start: Node<T>): void {
  let node = start;
  while (node.parent.color === "red") {
    const parent = node.parent;
    const grand = parent.parent;
    const parentIsLeft = parent === grand.left;
    const uncle = parentIsLeft ? grand.right : grand.left;

    if (uncle.color === "red") {                      // ② 색을 옮긴다
      parent.color = "black";
      uncle.color = "black";
      grand.color = "red";
      node = grand;
      continue;
    }

    let at = node;
    if (parentIsLeft ? at === parent.right : at === parent.left) {
      at = parent;                                    // ③ 먼저 한 번 회전
      if (parentIsLeft) this.#rotateLeft(at);
      else this.#rotateRight(at);
    }
    at.parent.color = "black";                        // ④ 회전하고 끝
    at.parent.parent.color = "red";
    if (parentIsLeft) this.#rotateRight(at.parent.parent);
    else this.#rotateLeft(at.parent.parent);
    node = at;
  }
  this.#root.color = "black";
}
```

T5~T8 이 이 조각입니다. 반복 한 번이 한 줄이고, 호출마다 마지막 줄에 호출 전 · 뒤 모양을 적었어요.

<!--proof:fix-steps-->

```text
단계   호출         갈래   한 일 · 호출 전 모양 → 뒤 모양
T5     insert(20)   ③      부모 90 을 오른쪽으로 회전
—      —            ④      20 검게 · 조부모 10 빨갛게, 10 을 왼쪽으로 회전
—      —            —      10B(· 90R)  →  20B(10R 90R)
T6     insert(30)   ②      부모 90 · 삼촌 10 검게, 조부모 20 빨갛게
—      —            —      20B(10R 90R)  →  20B(10B 90B(30R ·))
T7     insert(40)   ③      부모 30 을 왼쪽으로 회전
—      —            ④      40 검게 · 조부모 90 빨갛게, 90 을 오른쪽으로 회전
—      —            —      20B(10B 90B(30R ·))  →  20B(10B 40B(30R 90R))
T8     insert(50)   ②      부모 90 · 삼촌 30 검게, 조부모 40 빨갛게
—      —            —      20B(10B 40B(30R 90R))  →  20B(10B 40R(30B 90B(50R ·)))
```

여기서 가장 중요한 줄은 `node = grand;` 와 그 뒤의 `continue` 예요. ② 는 문제를 해결하지 않고 **두 층 위로
옮기기만** 합니다. T6 에서 20 이 빨개졌지만 20 이 뿌리라 부모(감시 노드)가 검어 반복이 끝났고, 마지막 줄이 뿌리를
다시 검게 칠했어요. T8 에서는 40 이 빨개졌고 그 부모 20 이 검어 멈췄습니다. 반대로 ④ 는 회전 뒤 올라온 노드를 검게
칠하므로 **다시 반복하지 않아요.** T5 와 T7 이 ③ → ④ 로 회전 두 번에 끝났습니다.

```text
T5 insert(20) 의 안쪽      10B(· 90R) 에 20 을 90 의 왼쪽에 붙인다   → 10B(· 90R(20R ·))
  ③ 20 이 안쪽 자식이다    부모 90 을 오른쪽으로 회전               → 10B(· 20R(· 90R))
  ④ 20 검게 · 10 빨갛게    조부모 10 을 왼쪽으로 회전               → 20B(10R 90R)
```

#### 멈춤 — 새 노드를 검게 넣으면 고칠 일이 없어 보인다

빨갛게 넣으니 빨강이 연달아 오고, 그것을 고치느라 코드 절반이 들었습니다. **처음부터 검게 넣으면 빨강 규칙이 깨질
일이 없으니 고치기가 필요 없지 않을까요?** 그 감각대로 한 줄을 바꿔 봅시다.

```ts
color: "black", // ← "red" 에서 바꿨다
```

**넣기만 하는 입력에서는 답이 안 틀립니다.** 붙이는 자리는 색과 무관하게 이진 탐색 트리의 규칙대로 정해지니까요.
그래서 테스트가 통과하는 자리입니다. 대신 모양과 비용을 같이 봅니다.

<!--proof:pause-black-->

```text
입력               무엇                      빨갛게 넣는 코드   검게 넣는 코드       판정
1~7 오름차순       toArray() 길이                           7                7       같다
—                  높이                                     4                7   어긋난다
—                  넣기 전체가 지나간 노드                 23               21   어긋난다
1~63 오름차순      toArray() 길이                          63               63       같다
—                  높이                                    10               63   어긋난다
—                  넣기 전체가 지나간 노드                591            1,953   어긋난다
1~1,023 오름차순   toArray() 길이                       1,023            1,023       같다
—                  높이                                    18            1,023   어긋난다
—                  넣기 전체가 지나간 노드             17,887          522,753   어긋난다
```

`toArray()` 는 세 크기 모두 같은데, 높이가 7 · 63 · 1,023 으로 **원소 수와 같아졌어요.** 원소 7 개에서는 오히려
검게 넣는 쪽이 21 로 적게 지나갔지만, 1,023 개에서는 522,753 대 17,887 입니다. 1 부터 7 까지의 모양을 보면
이유가 확인돼요.

<!--proof:pause-black-shape-->

```text
깊이 1   1B  -   -   -   -   -   -
깊이 2   -   2B  -   -   -   -   -
깊이 3   -   -   3B  -   -   -   -
깊이 4   -   -   -   4B  -   -   -
깊이 5   -   -   -   -   5B  -   -
깊이 6   -   -   -   -   -   6B  -
깊이 7   -   -   -   -   -   -   7B

넣은 뒤 모양 1B(· 2B(· 3B(· 4B(· 5B(· 6B(· 7B))))))   높이 7
```

검게 넣은 노드는 새 길에 검정을 하나 더하므로 **검정 규칙을 깨고**, 부모가 빨간 적이 없으니 `#fixInsert` 의 반복이
한 번도 안 일어납니다. 고치기가 아무것도 안 하는 트리는 균형 없는 트리와 같아요. 빨갛게 넣는 이유는 규칙 둘 중
**트리 전체에 걸린 검정 규칙을 넣는 순간 지키고**, 부모 · 자식 사이에만 걸린 빨강 규칙만 넣은 자리 근처에서 고치려는
것입니다.

```text
                   검게 넣는다                    빨갛게 넣는다
깨지는 규칙        검정 규칙 (모든 길을 봐야 안다)    빨강 규칙 (부모 · 자식만 보면 안다)
고칠 범위          트리 전체                        넣은 노드에서 뿌리까지의 한 길
이 코드가 한 일    아무것도 안 고쳤다 → 높이 = n     한 길에서 색과 회전으로 고쳤다 → 높이 ≤ 2·log₂(n+1)
```

#### 5. delete — 자리를 비우고 빈 자리를 채울 노드를 정한다

지우기도 두 부분입니다. 앞 절반은 이진 탐색 트리의 지우기와 같아요 — 자식이 하나 이하면 그 자식이 자리를 잇고,
둘이면 오른쪽 부분트리의 최솟값(바로 다음 값)이 자리를 잇습니다. 그 노드는 **지운 노드의 색까지** 물려받아서,
실제로 트리에서 빠지는 색은 자리를 옮긴 노드의 원래 색이에요.

```ts
delete(item: T): boolean {
  const target = this.#find(item);
  if (target === this.#nil) return false;             // ⑤ 없다

  let removed = target;
  let removedColor = removed.color;
  let orphan: Node<T>;

  if (target.left === this.#nil) {                    // ⑥ 자식이 하나 이하
    orphan = target.right;
    this.#replace(target, target.right);
  } else if (target.right === this.#nil) {
    orphan = target.left;
    this.#replace(target, target.left);
  } else {                                            // ⑦ 자식이 둘
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

  this.#count -= 1;
  if (removedColor === "black") this.#fixDelete(orphan);
  return true;
}

#replace(target: Node<T>, replacement: Node<T>): void {
  if (target.parent === this.#nil) this.#root = replacement;
  else if (target === target.parent.left) target.parent.left = replacement;
  else target.parent.right = replacement;
  replacement.parent = target.parent;
}
```

T14~T16 이 이 조각이고, 표의 마지막 칸은 뒤처리까지 끝난 모양입니다.

<!--proof:delete-steps-->

```text
단계   호출         갈래   한 일                                     돌려준 값   지운 뒤 모양
T14    delete(20)   ⑦      오른쪽 최솟값 30 이 20 의 자리를 잇는다        true   30B(10B 50R(40B 90B))
T15    delete(10)   ⑥      10 을 떼어 내고 그 자리를 비운다               true   50B(30B(· 40R) 90B)
T16    delete(35)   ⑤      35 가 없다                                    false   50B(30B(· 40R) 90B)
```

T14 에서 20 은 자식이 둘이라 오른쪽 부분트리 `40R(30B 90B(50R ·))` 의 최솟값 30 이 자리와 색을 이었어요. 빠진 색은
30 의 원래 색인 **검정**이라 뒤처리로 넘어갑니다. T15 의 10 은 자식이 없어 자리가 비었고, 10 이 검어 역시 뒤처리로
갑니다. T16 은 35 가 없어 ⑤ 로 끝났어요.

여기서 가장 중요한 줄은 `if (removedColor === "black") this.#fixDelete(orphan);` 입니다. 빨간 노드가 빠지면 어느 길의
검은 수도 안 바뀌어 고칠 것이 없어요. 검은 노드가 빠지면 그 노드를 지나던 길들만 검정이 하나 모자라게 됩니다.
`orphan` 이 감시 노드여도 `#replace` 가 그 `parent` 를 적어 두므로, 뒤처리가 「빈 자리의 부모」를 물을 수 있어요.

```text
T14 delete(20) 직전   20B(10B 40R(30B 90B(50R ·)))
  30 이 20 자리로      30B(10B 40R(· 90B(50R ·)))       30 이 있던 자리(40 의 왼쪽)가 비었다
  빠진 색 = 검정       뿌리에서 40 의 왼쪽 빈 자리까지 검은 노드 1, 90 쪽으로 가는 길은 2   → 하나 모자라다
```

#### 6. #fixDelete — 형제와 조카의 색으로 모자란 검정을 메운다

뒤처리는 「이 노드 아래 길들이 검정 하나가 모자라다」라는 물음을 들고 시작합니다. 노드가 빨가면 그 노드를 검게 칠하는
것으로 메우고 끝나요(반복 뒤의 `node.color = "black"`). 검으면 형제 쪽을 봅니다.

```ts
#fixDelete(start: Node<T>): void {
  let node = start;
  while (node !== this.#root && node.color === "black") {
    const isLeft = node === node.parent.left;
    let sibling = isLeft ? node.parent.right : node.parent.left;

    if (sibling.color === "red") {                    // ⑧ 먼저 한 번 회전
      sibling.color = "black";
      node.parent.color = "red";
      if (isLeft) this.#rotateLeft(node.parent);
      else this.#rotateRight(node.parent);
      sibling = isLeft ? node.parent.right : node.parent.left;
    }

    const near = isLeft ? sibling.left : sibling.right;
    const far = isLeft ? sibling.right : sibling.left;

    if (near.color === "black" && far.color === "black") {
      sibling.color = "red";                          // ⑨ 물음을 위로
      node = node.parent;
      continue;
    }

    if (far.color === "black") {                      // ⑩ 먼저 한 번 회전
      near.color = "black";
      sibling.color = "red";
      if (isLeft) this.#rotateRight(sibling);
      else this.#rotateLeft(sibling);
      sibling = isLeft ? node.parent.right : node.parent.left;
    }

    sibling.color = node.parent.color;                // ⑪ 회전하고 끝
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
```

T14 와 T15 가 이 조각이고, 반복 안의 갈래 하나가 한 줄입니다.

<!--proof:fixdelete-steps-->

```text
단계   호출         갈래   한 일
T14    delete(20)   ⑩      가까운 조카 50 검게 · 형제 90 빨갛게, 90 을 오른쪽으로 회전
—      —            ⑪      형제 50 에 부모 색, 부모 40 을 왼쪽으로 회전하고 끝
T15    delete(10)   ⑧      형제 50 검게 · 부모 30 빨갛게, 30 을 왼쪽으로 회전
—      —            ⑨      형제 40 빨갛게, 물음이 30 으로
```

T14 는 ⑩ → ⑪ 로 회전 두 번에 끝났어요. 형제 90 의 먼 조카(90 의 오른쪽)가 빈 자리라 검고 가까운 조카 50 이 빨개서,
먼저 90 을 회전해 50 을 형제 자리로 올리고(⑩), 다음 회전으로 40 의 왼쪽 길에 검정 하나를 보탰습니다(⑪). T15 는
형제 50 이 빨개 먼저 회전하고(⑧), 새 형제 40 의 두 자식이 빈 자리라 형제를 빨갛게 칠해 물음을 부모 30 으로 옮겼어요(⑨).
30 은 ⑧ 에서 빨개졌으므로 반복 조건이 거짓이 되고, 마지막 줄이 30 을 검게 칠해 메웠습니다.

```text
T15 delete(10) 직전   30B(10B 50R(40B 90B))       10 이 빠진 왼쪽 길의 검정이 하나 모자라다
  ⑧ 형제 50 이 빨갛다   50 검게 · 30 빨갛게, 30 을 왼쪽으로 회전   → 50B(30R(· 40B) 90B)
  ⑨ 새 형제 40 의 두 자식이 검다   40 빨갛게, node ← 30         → 50B(30R(· 40R) 90B)
  30 이 빨가서 반복을 나와 검게 칠한다                          → 50B(30B(· 40R) 90B)
```

⑧ 은 **메우는 갈래가 아니라 준비**입니다. 아래 세 갈래는 형제의 자식 색을 보고 고르는데, 형제가 빨가면 그 자식은 빨강
규칙 때문에 반드시 검어 고를 정보가 없어요. 그래서 회전 한 번으로 형제를 검은 노드로 바꿔 두고 나머지 갈래로 갑니다.

#### 7. range · size · toArray — 중위 순서로 모은다

세 연산을 한 벌로 묶는 근거는 **셋 다 트리를 바꾸지 않고 담긴 값을 오름차순으로 내놓는 일**이기 때문입니다.
`toArray` 는 전부를, `range` 는 구간에 들 수 있는 쪽으로만 가는 중위 순회를 하고, `size` 는 세어 둔 수를 읽어요.

```ts
range(low: T, high: T): T[] {
  const out: T[] = [];
  if (this.#compare(low, high) > 0) return out;       // ⑬ low > high
  this.#collect(this.#root, low, high, out);
  return out;
}

size(): number {
  return this.#count;
}

toArray(): T[] {
  const out: T[] = [];
  this.#inOrder(this.#root, out);
  return out;
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
```

T12 · T13 · T19 · T20 이 이 조각입니다.

<!--proof:order-steps-->

```text
단계   호출            갈래   지나간 노드       돌려준 값
T12    range(25, 55)   —                5      [30 40 50]
T13    range(50, 20)   ⑬                0              []
T19    size()          —                1               4
T20    toArray()       —                4   [30 40 50 90]
```

T12 의 `range(25, 55)` 는 노드 6 개 중 5 개를 지나갔어요. 뿌리 20 은 25 보다 작아 왼쪽 부분트리 `10B` 를 통째로
건너뛰었습니다(`vsLow > 0` 이 거짓). 90 은 55 보다 커서 오른쪽을 건너뛰고 왼쪽 50 만 봤고요. T13 은 `low > high` 라
노드를 하나도 안 지나갔습니다.

```text
T12 range(25, 55) 가 지나간 노드
  20   25 보다 작다   왼쪽을 건너뛰고 오른쪽으로   담지 않는다
  40   구간 안        왼쪽 · 담기 · 오른쪽         담는다
  30   구간 안        자식이 빈 자리               담는다
  90   55 보다 크다   왼쪽으로만                   담지 않는다
  50   구간 안        자식이 빈 자리               담는다
  → [30 40 50] · 지나간 노드 5
```

#### 8. 스무 번의 호출을 끝까지 실행한다

앞의 일곱 조각을 이어 전개 연산 열을 끝까지 실행하면 아래 스무 걸음이 나옵니다. 트리 모양이 걸음마다 어떻게
바뀌는지부터 봅니다.

```text
T1 · T2    빈 트리를 만들고 읽는다         T3~T9     넣고, 고치기의 세 갈래를 지난다
T10~T13    찾고 구간을 읽는다              T14~T16   지우고, 뒤처리의 네 갈래를 지난다
T17~T20    양 끝 · 개수 · 전부를 읽는다
```

<!--viz:walk-->

<!--proof:walk-viz-->

```text
단계   호출 뒤 모양                   size   높이
T1     ·                                 0      0
T2     ·                                 0      0
T3     10B                               1      1
T4     10B(· 90R)                        2      2
T5     20B(10R 90R)                      3      2
T6     20B(10B 90B(30R ·))               4      3
T7     20B(10B 40B(30R 90R))             5      3
T8     20B(10B 40R(30B 90B(50R ·)))      6      4
T9     20B(10B 40R(30B 90B(50R ·)))      6      4
T10    20B(10B 40R(30B 90B(50R ·)))      6      4
T11    20B(10B 40R(30B 90B(50R ·)))      6      4
T12    20B(10B 40R(30B 90B(50R ·)))      6      4
T13    20B(10B 40R(30B 90B(50R ·)))      6      4
T14    30B(10B 50R(40B 90B))             5      3
T15    50B(30B(· 40R) 90B)               4      3
T16    50B(30B(· 40R) 90B)               4      3
T17    50B(30B(· 40R) 90B)               4      3
T18    50B(30B(· 40R) 90B)               4      3
T19    50B(30B(· 40R) 90B)               4      3
T20    50B(30B(· 40R) 90B)               4      3
```

같은 걸음마다 거친 갈래와 지나간 노드, 돌려준 값을 적으면 아래 표예요.

<!--proof:walk-trace-->

```text
단계   호출                         갈래    지나간 노드       돌려준 값
T1     new RedBlackTree<number>()   —                 0               —
T2     max()                        ⑫                 0            null
T3     insert(10)                   —                 0               —
T4     insert(90)                   —                 1               —
T5     insert(20)                   ③ ④               5               —
T6     insert(30)                   ②                 3               —
T7     insert(40)                   ③ ④               6               —
T8     insert(50)                   ②                 4               —
T9     insert(30)                   ①                 3               —
T10    has(40)                      —                 2            true
T11    has(35)                      —                 3           false
T12    range(25, 55)                —                 5      [30 40 50]
T13    range(50, 20)                ⑬                 0              []
T14    delete(20)                   ⑦ ⑩ ⑪             8            true
T15    delete(10)                   ⑥ ⑧ ⑨             5            true
T16    delete(35)                   ⑤                 3           false
T17    min()                        —                 2              30
T18    max()                        —                 2              90
T19    size()                       —                 1               4
T20    toArray()                    —                 4   [30 40 50 90]
```

**라벨 열셋이 모두 실행됐습니다.**

<!--proof:walk-branches-->

```text
라벨   무엇                                          실행된 걸음
①      이미 있는 값이다                              T9
②      삼촌이 빨갛다 — 색을 옮긴다                   T6 · T8
③      삼촌이 검고 안쪽 자식이다 — 먼저 한 번 회전   T5 · T7
④      삼촌이 검다 — 조부모를 회전하고 끝            T5 · T7
⑤      지울 값이 없다                                T16
⑥      자식이 하나 이하다                            T15
⑦      자식이 둘이다 — 오른쪽 최솟값이 잇는다        T14
⑧      형제가 빨갛다 — 먼저 한 번 회전               T15
⑨      형제의 두 자식이 검다 — 물음을 위로           T15
⑩      먼 조카가 검다 — 형제를 먼저 회전             T14
⑪      먼 조카가 빨갛다 — 부모를 회전하고 끝         T14
⑫      비었다                                        T2
⑬      low > high                                    T13
```

<!--result:walk=[30,40,50,90]-->

높이는 T8 에서 가장 높은 4 였고 지우기 뒤 3 으로 내려왔어요. 가장 비용이 큰 걸음은 T14 의 8 입니다 — 뿌리 20 을 찾는 1, 오른쪽
부분트리에서 최솟값 30 을 찾는 2(40 · 30), 자리 바꾸기 2, 뒤처리 반복 1, 회전 2 가 더해진 값이에요. T20 의 마지막
`toArray()` 가 `[30, 40, 50, 90]` 을 돌려줍니다.

#### 9. 전체 코드

조각을 하나로 잇습니다. 아래는 정본 [`_reference/redBlackTree.ts`](./_reference/redBlackTree.ts) 의 구간을
**추출한 것**이라 손으로 옮기지 않았어요. 앞의 조각에 없던 것은 `#rotateRight` 와 주석들이고, 조각에서 한 줄로
줄여 적었던 반복문 몇 개가 원래 모양으로 돌아와 있습니다. 정본이 비용을 세려고 두는 `__cost` 줄은 추출할 때
걷혀서 여기 없어요.

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
  #count = 0;
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

    this.#count += 1;
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

    this.#count -= 1;
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

  size(): number {
    return this.#count;
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

```text
const t = new RedBlackTree<number>()
t.insert(3); t.insert(1); t.insert(2)
t.toArray()          → [1, 2, 3]       t.range(2, 9)    → [2, 3]
t.delete(2)          → true            t.has(2)         → false
t.min() · t.max()    → 1 · 3           t.size()         → 2
```

## 파트 2 — 적용 조건 · 보장 · 비용

파트 1 에서 만든 것을 따져 봅니다. 어떤 요구에 이 구조를 쓰는지, 높이의 상한이 어떤 식으로 닫히는지, 무엇이 매 호출
뒤에 참으로 남는지, 그리고 비용과 그 보장이 무엇인지 순서로 봅니다.

### 이 구조가 최적의 선택인 경우

#### 최적인 요구의 모양

주어가 문제가 아니라 **연산**입니다. 셋이 함께 맞을 때예요.

- **갱신과 순서를 쓰는 조회가 섞여 들어옵니다.** 넣기 · 지우기가 있고, 동시에 양 끝 · 구간 · 오름차순 전부를 읽어요.
  갱신만 있고 순서를 안 쓰면 해시 집합이 더 적게 일하고, 한꺼번에 담은 뒤 읽기만 하면 정렬 배열 한 번이면 됩니다.
- **같은 값을 두 벌 담지 않습니다.** 여러 벌이 필요하면 다중집합의 계약이에요.
- **호출 한 번의 비용에 상한이 필요합니다.** 평균만 로그면 되는 자리라면 스플레이 트리처럼 모아서 적게 일하는 설계가
  있고, 그쪽이 전체 비용이 더 적은 입력이 있어요.

```text
세 조건이 코드의 모양을 정한다
  갱신과 순서 조회가 섞인다   → 원소를 자리로 늘어놓지 않고 이진 탐색 트리의 연결로 둔다
  같은 값은 한 벌             → 내려가다 같은 값을 만나면 넣지 않는다
  호출마다 상한               → 고치는 일을 넣기 · 지우기 한 번 안에서 끝낸다
```

#### 이 구조를 떠올리게 하는 연산 조합

독자가 다음에 만나는 것은 자기 코드의 요구예요. 요구를 **연산과 호출 횟수로 옮겨** 적어 보면 이 계약이 맞는지가
정해집니다.

```text
알림을 걸고 취소하며, 가장 이른 알림과 앞으로 한 시간 안의 알림을 본다 (알림 시각이 서로 다를 때)
  → insert · delete · min · range
  → 알림 m 개 · 확인 q 번이면 insert m 번 · delete m 번 이하 · min 과 range 가 q 번
  → 네 연산이 모두 계약에 있고 호출마다 로그(range 는 로그 + 돌려주는 수)라, 응답 한 번의 지연에도 상한이 걸린다

행이 들어오고 지워지는 표에 정렬 색인을 두고, 값 구간 질의를 받는다 (색인 값이 유일할 때)
  → insert · delete · range
  → 행 n 개 · 질의 q 번이면 전체가 n·log n + q·(log n + k)

점수대별로 참가자를 잘라 보고, 점수가 바뀌면 옛 점수를 지우고 새 점수를 넣는다
  → delete · insert · range · min · max
```

**옮긴 연산이 계약에 없으면 그 요구는 이 구조의 사례가 아닙니다.** 둘을 짚어 둡니다. 「상위 10 명을 뽑는다」는
k 번째 원소나 한 원소의 다음 값을 읽는 연산이 필요한데 계약에 없어요 — `toArray()` 는 전부를 돌려주므로 원소 수에
비례합니다. 그리고 셋째 요구에서 **같은 점수가 둘 이상이면** 한 벌만 담는 이 계약으로는 참가자를 잃어요. 값이
유일하다는 조건이 요구에 있는지를 먼저 확인해야 합니다.

#### 실제로 쓰이는 곳

- **자바 표준 라이브러리의 `TreeMap`** — 문서 첫 문장이 구조를 적었습니다. *"A Red-Black tree based NavigableMap
  implementation."* 그리고 보장의 종류까지 적어 뒀어요. *"This implementation provides guaranteed log(n) time cost
  for the containsKey, get, put and remove operations."* 평균이 아니라 보장이라는 말이 이 글의 계약과 같은 한정자입니다.
  ([`java.util.TreeMap`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html),
  조회 2026-09-13)
- **리눅스 커널의 `lib/rbtree.c`** — 커널 문서가 이 구조를 고른 이유를 비교로 적었어요. *"Red-black trees are similar
  to AVL trees, but provide faster real-time bounded worst case performance for insertion and deletion (at most two
  rotations and three rotations, respectively, to balance the tree), with slightly slower (but still O(log n)) lookup
  time."* 전개의 T5 · T7 이 넣기 한 번에 회전 두 번, T14 가 지우기 한 번에 회전 두 번이었어요. 같은 문서가 쓰이는
  자리로 입출력 스케줄러의 요청 추적, 고해상도 타이머, 가상 메모리 영역을 들었습니다.
  ([`Documentation/core-api/rbtree.rst`](https://github.com/torvalds/linux/blob/master/Documentation/core-api/rbtree.rst),
  조회 2026-09-13)
- **리눅스 CFS 스케줄러** — *"CFS maintains a time-ordered rbtree, where all runnable tasks are sorted by the
  p->se.vruntime key. CFS picks the "leftmost" task from this tree and sticks to it."* 가장 왼쪽 값을 읽는 것이
  `min` 이에요. 다만 실행 시간이 같은 작업이 여럿일 수 있어 **같은 키를 여러 벌 담는** 쓰임이고, 연산으로 옮기면
  이 글의 계약보다 다중집합에 가깝습니다.
  ([`Documentation/scheduler/sched-design-CFS.rst`](https://github.com/torvalds/linux/blob/master/Documentation/scheduler/sched-design-CFS.rst),
  조회 2026-09-13)

```text
세 자리가 고른 것
  자바 TreeMap   정렬 맵(키가 유일)   호출마다 log n 을 보장한다고 문서에 적었다
  커널 rbtree    범용 부품            넣기 회전 ≤ 2 · 지우기 회전 ≤ 3 을 이유로 들었다
  CFS            실행 시간 순서       같은 키를 여러 벌 담는다 → 다중집합 쪽 쓰임
```

#### 경쟁 설계와의 대조

같은 연산과 같은 로그 상한을 두고 **한정자만 다른 설계**가 있어요 — **스플레이 트리**입니다. 조회한 노드를 뿌리로
끌어올려, 호출을 모아 평균 내면 로그를 지키지만 호출 한 번이 로그를 넘는 것을 허용해요. 이 저장소의
[`splayTree` 정본](../splayTree/_reference/splayTree.ts)을 그대로 쓰고, 두 정본의 비용 단위가 같습니다(노드 하나를
지나갈 때마다 1).

입력은 계약 스위트의 순차 조회와 같은 모양으로, 0 부터 1,023 까지 `n = 1,024` 개를 오름차순으로 넣고 0 부터 차례로
`has` 를 불렀어요. 전개의 스무 번 호출을 쓰지 않은 이유는 하나예요 — 원소가 여섯뿐이라 두 설계의 높이가 한두 칸
차이로 붙어 나오고, `n` 이 커질 때 어떻게 벌어지는지가 안 보입니다.

| 설계 | 넣기 한 번의 최댓값 | 넣기 전체 | 조회 한 번의 최댓값 | 조회 전체 |
| --- | --- | --- | --- | --- |
| 레드블랙 트리 (이 가이드) | 26 | 17,908 | **18** | 9,743 |
| 스플레이 트리 | **2** | **2,047** | 1,536 | **8,108** |

**어느 축을 보느냐로 순서가 뒤집힙니다.** 전체 비용은 스플레이 트리가 넣기 2,047 · 조회 8,108 로 레드블랙 트리의
17,908 · 9,743 보다 적어요. 오름차순으로 넣으면 스플레이 트리는 방금 넣은 최댓값이 뿌리에 있어 새 값을 그 오른쪽에
붙이기만 하고, 순서대로 조회하면 첫 조회 뒤로는 다음 값이 뿌리 가까이 올라와 있어 조회 한 번에 평균 8 개 남짓을 지나갑니다. 반대로 **조회 한 번의 최댓값**은 레드블랙 트리가
18 이고 스플레이 트리가 1,536 이에요. 한 줄로 이어진 트리의 끝을 찾는 첫 조회가 그 값입니다.

```text
축을 넷으로 갈라 적으면
                          레드블랙 트리   스플레이 트리
  넣기 한 번의 최댓값     26              2          ← 스플레이 트리가 적다
  넣기 전체               17,908          2,047      ← 스플레이 트리가 적다
  조회 한 번의 최댓값     18              1,536      ← 레드블랙 트리가 적다
  조회 전체               9,743           8,108      ← 스플레이 트리가 적다
```

**이 가이드의 설계는 전체 비용 세 축에서 더 많습니다.** 레드블랙 트리가 내주는 것은 전체 작업량이고, 얻는 것은 호출 한
번의 상한이에요. **우열이 반대가 되는 조건이 분명합니다.** 같은 값을 연달아 찾거나 순서대로 찾는 접근이 많고 한
번의 지연이 문제가 안 되는 일괄 처리라면 스플레이 트리 쪽이고, 응답 한 번마다 지연 상한을 약속해야 하거나 입력
순서를 호출하는 쪽이 정할 수 있어 느린 한 번을 일부러 만들 수 있는 자리라면 레드블랙 트리입니다. 조회가 트리를
고쳐 쓰므로 스플레이 트리는 읽기만 하는 호출도 트리를 바꾼다는 점도 함께 따져야 해요.

### 수식 정의와 유도

파트 1 은 크기 넷에서 높이가 `2·log₂(n+1)` 을 넘지 않는 것을 셌습니다. 그 상한이 **모든** `n` 에서, 어떤 순서로 넣고
지워도 성립하는지는 식으로 확인해야 해요.

```text
정의   노드마다 검은 높이 b(x) 를 둔다
  ↓
검산   작은 트리에서 b(x) 와 부분트리 크기를 손으로 센다
  ↓
유도   「부분트리 크기 ≥ 2^b(x) − 1」 을 귀납으로 닫고, h ≤ 2b 와 합친다
  ↓
계수   n = 1,048,575 를 넣어 수치를 낸다
```

**정의부터 합니다.** 노드 $x$ 의 검은 높이 $b(x)$ 는 $x$ 에서 빈 자리까지 내려가는 길에서 만나는 검은 노드 수이고,
$x$ 가 검으면 $x$ 도 셉니다. 검정 규칙 때문에 어느 길로 내려가든 같은 값이에요. 빈 자리의 $b$ 는 0 입니다. 트리의
검은 높이는 뿌리의 것 $b = b(\text{root})$ 이고, $s(x)$ 는 $x$ 를 뿌리로 하는 부분트리의 노드 수예요.

| 기호 | 뜻 | 범위 |
| --- | --- | --- |
| $b(x)$ | $x$ 에서 빈 자리까지의 검은 노드 수($x$ 포함, 빈 자리 제외) | $0 \le b(x)$ |
| $s(x)$ | $x$ 를 뿌리로 하는 부분트리의 노드 수 | $0 \le s(x) \le n$ |
| $h$ | 트리 높이 | $0 \le h \le n$ |

**검산은 전개 T8 의 트리로 합니다.** `20B(10B 40R(30B 90B(50R ·)))` 에서 몇 노드를 셉니다.

```text
x      색   b(x)   s(x)   2^b(x) − 1   s(x) ≥ 2^b(x) − 1 ?
50     R    0      1      0            1 ≥ 0
90     B    1      2      1            2 ≥ 1
30     B    1      1      1            1 ≥ 1
40     R    1      4      1            4 ≥ 1
20     B    2      6      3            6 ≥ 3
```

같은 계산을 코드로 옮기면 이렇습니다. 식의 $b(x)$ 는 `black`, $s(x)$ 는 `size` 예요.

```ts
function check(x: Node): { black: number; size: number } {
  if (x === nil) return { black: 0, size: 0 };
  const left = check(x.left);
  const right = check(x.right);
  const black = left.black + (x.color === "black" ? 1 : 0); // 검정 규칙이라 left.black === right.black
  const size = left.size + right.size + 1;
  if (size < 2 ** black - 1) throw new Error("식이 틀렸다");
  return { black, size };
}
```

**이제 유도합니다.** 먼저 $s(x) \ge 2^{b(x)} - 1$ 을 부분트리의 높이에 대한 귀납으로 보입니다.

```text
기저   x 가 빈 자리                              s(x) = 0,  b(x) = 0,  2^0 − 1 = 0                  0 ≥ 0 이 성립한다
단계   x 가 노드, 두 자식 c 에서 식이 성립한다   자식의 b(c) 는 x 가 검으면 b(x) − 1, 빨가면 b(x)   어느 쪽이든 b(c) ≥ b(x) − 1
```

단계를 식으로 적으면 이렇습니다.

$$s(x) = s(c_{\text{left}}) + s(c_{\text{right}}) + 1 \ \ge\ 2\,(2^{b(x)-1} - 1) + 1 = 2^{b(x)} - 1$$

```text
s(x) = s(왼쪽 자식) + s(오른쪽 자식) + 1
     ≥ (2^b(왼쪽) − 1) + (2^b(오른쪽) − 1) + 1        두 자식에 귀납 가정을 넣었다
     ≥ (2^(b(x)−1) − 1) + (2^(b(x)−1) − 1) + 1        b(c) ≥ b(x) − 1 이고, 2^t 는 t 가 크면 크다
     = 2^b(x) − 1
```

다음은 $h \le 2b$ 입니다. 뿌리에서 가장 먼 노드까지의 길을 봐요. 뿌리 규칙으로 길의 첫 노드가 검고, 빨강 규칙으로
그 길의 빨간 노드마다 **바로 위 노드가 검으며**, 서로 다른 빨간 노드의 바로 위 노드는 서로 다릅니다. 그러니 빨간
노드 수가 검은 노드 수 $b$ 를 넘지 못하고, 길 전체가 $2b$ 이하예요.

```text
전개 T8 의 가장 긴 길   20B → 40R → 90B → 50R
  빨강 40 의 바로 위 20B · 빨강 50 의 바로 위 90B        빨강 2 ≤ 검정 2
  노드 4 = 빨강 2 + 검정 2 ≤ 2 × 2 = 2b
```

두 결과를 합칩니다.

$$n = s(\text{root}) \ \ge\ 2^{b} - 1 \ \ge\ 2^{h/2} - 1 \quad\Longrightarrow\quad h \ \le\ 2\,\log_2(n+1)$$

```text
n ≥ 2^b − 1                      위의 귀납에 x = 뿌리를 넣었다
2^b − 1 ≥ 2^(h/2) − 1            h ≤ 2b 라서 b ≥ h/2
n + 1 ≥ 2^(h/2)                  양변에 1 을 더했다
h ≤ 2·log₂(n+1)                  양변에 log₂ 를 취하고 2 를 곱했다
```

**마지막으로 계수입니다.** 식을 실행 결과와 맞대고 큰 $n$ 을 넣어요.

<!--proof:math-check-->

```text
트리                           n    b   2^b − 1    h   2b   2·log₂(n+1)
오름차순 1~7                   7    2         3    4    4          6.00
전개 T8                        6    2         3    4    4          5.61
오름차순 1~1,023           1,023    9       511   18   18         20.00
오름차순 1~1,048,575   1,048,575   19   524,287   38   38         40.00
```

$n = 1,048,575$ 개를 오름차순으로 넣으면 검은 높이가 19 이고 높이가 38 이라, 상한 40.00 안에 듭니다. 네 줄 모두
$n \ge 2^b - 1$ 과 $h \le 2b$ 가 성립해요. 원소가 100 만 개를 넘어도 찾기 한 번이 지나가는 노드는 40 개를 넘지 않고,
식은 넣고 지운 순서를 한 번도 쓰지 않았으므로 어떤 호출 열 뒤에도 같은 상한이 성립합니다.

### 불변식 — size · has · min · max · range 가 toArray 와 같은 집합을 말한다

> 호출 하나가 끝날 때마다 네 가지가 참입니다. `toArray()` 의 길이가 `size()` 와 같고, 어떤 값 `x` 든 `has(x)` 는
> `x` 가 `toArray()` 에 있는가와 같으며, 비어 있지 않으면 `min()` · `max()` 가 `toArray()` 의 첫 값 · 끝 값과 같고,
> `range(low, high)` 는 `toArray()` 에서 그 구간의 값만 남긴 것과 같습니다.

```text
toArray()   [ a₀  a₁  a₂  …  a_(n−1) ]
               │              └ max()
               └ min()          size() = n       has(x) = x 가 이 안에 있는가
range(low, high) = 이 배열에서 low ≤ a ≤ high 인 것만
```

**계약 헤더는 불변식을 넷으로 적고, 넷 다 같은 이유로 둡니다 — 같은 사실을 읽는 길이 둘이기 때문이에요.**
원소 수를 `size()` 도 말하고 `toArray()` 의 길이도 말합니다. 구현이 두 길을 따로 유지할 수 있고, 따로 유지하는 순간
갈릴 수 있어요. 넷을 버리면 무엇이 되는지 이름으로 보면 확인됩니다.

```text
size() 와 toArray() 길이가 달라도 되면     → 세어 둔 수와 담긴 수가 다른 그릇
has 와 toArray 가 달라도 되면              → 찾기와 목록이 서로 다른 집합
min · max 가 양 끝과 달라도 되면           → 양 끝을 따로 들고 갱신을 빠뜨린 그릇
range 가 잘라 낸 것과 달라도 되면          → 구간 읽기가 목록과 다른 순서나 원소를 내는 그릇
```

**정렬되어 있다는 것과 유일하다는 것은 불변식이 아닙니다.** 둘 다 `toArray()` 하나로만 읽혀 견줄 상대가 없고, 그것은
계약 스위트가 참조 모델과 결과를 대조하는 동작 검사의 몫이에요. **색 규칙과 높이도 불변식이 아닙니다.** 계약에 적는
순간 색을 안 쓰는 정당한 구현이 전부 계약 위반이 되고, 높이가 원소 수에 비례하게 된 구현은 성장률 검사가 잡습니다.

```text
불변식이 아닌 것           왜                                              누가 잡는가
정렬되어 있다 · 유일하다   toArray() 하나로만 읽혀 견줄 상대가 없다        동작 검사가 참조 모델과 대조한다
색 규칙 · 높이             계약에 적으면 색을 안 쓰는 구현이 위반이 된다   성장률 검사가 잡는다
```

이 구현이 네 문장을 지키는 방법은 「이진 탐색 트리의 순서 — 왼쪽 부분트리 < 노드 < 오른쪽 부분트리」 하나예요.
`toArray` · `range` · `min` · `max` · `has` 가 모두 이 순서를 따라 읽으므로, 순서가 지켜지고 `#count` 가 노드 수와
같으면 네 길이 같은 집합을 말합니다. 색은 이 순서와 무관하게 높이만 정해요.

**각 연산이 순서와 개수를 어떻게 지키는지 전수로 봅시다.** 상태를 바꾸는 일은 넣기 · 지우기 · 색 바꾸기 · 회전
넷이고, 나머지는 읽기만 해요.

| 갈래 | 하는 일 | 순서와 개수가 유지되는 근거 |
| --- | --- | --- |
| 넣기 | 비교를 따라 내려간 빈 자리에 붙이고 `#count` 를 1 늘린다 | 내려간 길의 모든 노드와 비교해 알맞은 쪽에 붙였으니 순서가 그대로이고, 노드와 개수가 함께 1 늘었다. 이미 있는 값이면 둘 다 안 바뀐다 |
| 지우기 | 자식이 하나 이하면 그 자식이, 둘이면 바로 다음 값이 자리를 잇고 `#count` 를 1 줄인다 | 바로 다음 값은 왼쪽 부분트리 전부보다 크고 오른쪽 나머지보다 작아 그 자리에 놓여도 순서가 그대로다. 노드와 개수가 함께 1 줄었다 |
| 색 바꾸기 | 노드 몇 개의 색만 바꾼다 | 값도 연결도 안 바뀐다 |
| 회전 | 부모 · 자식의 위아래를 바꾸고 가운데 부분트리 하나를 옮긴다 | 중위 순서가 「왼쪽 · 부모 · 가운데 · 자식 · 오른쪽」에서 그대로다. 노드 수도 그대로다 |
| 읽기 다섯 · 생성자 | 트리를 안 바꾼다. 생성자는 빈 트리와 개수 0 을 둔다 | 직전에 참이면 그대로 참이고, 빈 트리에서는 네 문장이 모두 「비었다」로 참이다 |

**경계 입력에서도 확인합니다.** 계약 스위트가 경계로 정해 둔 입력 일곱을 정본으로 실행하고, 호출 하나가 끝날 때마다
계약 스위트의 불변식 검사 함수 넷을 그대로 불렀어요. 하나라도 어기면 실행이 멈추게 해 두었습니다. 표는 각 입력이
끝났을 때의 읽기입니다.

<!--proof:invariant-edges-->

```text
경계 입력   호출 수   끝난 뒤 toArray()   size()   min()   max()
1                 8   []                       0    null    null
2                 8   []                       0    null    null
3                 7   [2]                      1       2       2
4                 8   [1 3 5 7 9]              5       1       9
5                 8   [1 3 5 7]                4       1       7
6                14   [1 3 4 5 6 7]            6       1       7
7                10   [8]                      1       8       8
```

일곱 입력 모두 호출마다 네 문장이 성립했습니다. 첫 입력은 빈 트리에서 읽기와 지우기만 해 끝까지 비었고, 둘째는 5 를
세 번 넣고 한 번 지워 다시 비었어요. 여섯째는 1~7 을 넣고 가운데 4 와 2 를 지운 뒤 4 를 다시 넣은 입력으로, 두 자식이
있는 자리를 지우는 길과 뿌리를 지우는 길을 모두 지납니다.

**이제 깨뜨려 봅시다.** 위 표에서 순서와 개수를 지키던 줄 가운데, 두 자식이 있는 자리를 지울 때 **이어받는 노드에
지운 노드의 왼쪽 부분트리를 다시 거는 줄**을 고릅니다. 다른 곳은 그대로 두고 그 한 줄만 지워요.

```ts
this.#replace(target, removed);
// removed.left = target.left;   ← 이 줄을 지웠다
removed.left.parent = removed;
removed.color = target.color;
```

지우는 자리가 달라지는 입력 셋을 두 코드로 견줍니다.

<!--proof:mutant-left-->

```text
입력                      호출        바른 코드          그 줄을 지운 코드       판정
1~7 을 넣고 7 을 지운다   toArray()   [1 2 3 4 5 6]      [1 2 3 4 5 6]           같다
1~7 을 넣고 7 을 지운다   size()      6                  6                       같다
1~7 을 넣고 7 을 지운다   min()       1                  1                       같다
1~7 을 넣고 4 를 지운다   toArray()   [1 2 3 5 6 7]      [1 2 5 6 7]         어긋난다
1~7 을 넣고 4 를 지운다   size()      6                  6                       같다
1~7 을 넣고 4 를 지운다   min()       1                  1                       같다
전개 T1~T14               toArray()   [10 30 40 50 90]   [30 40 50 90]       어긋난다
전개 T1~T14               size()      5                  5                       같다
전개 T1~T14               min()       10                 30                  어긋난다
```

**자식이 없는 7 을 지운 입력에서는 셋 다 같습니다.** 지운 줄은 두 자식이 있는 자리에서만 실행되기 때문이에요. 4 를
지운 입력에서는 `toArray()` 에서 3 이 사라졌는데 `size()` 는 6 그대로입니다. 1~7 을 넣은 트리 `2B(1B 4R(3B 6B(5R 7R)))`
에서 4 의 오른쪽 최솟값 5 가 자리를 이을 때, 4 의 왼쪽 부분트리 `3B` 를 5 에 걸지 않아 트리에서 떨어져 나갔어요. 전개
T1~T14 에서는 20 의 왼쪽 부분트리 `10B` 가 떨어져 나가 `min()` 까지 30 이 됐습니다. 계약 스위트의 불변식 검사 함수 넷을
두 번째 입력의 결과에 부르면 이렇게 말해요.

<!--proof:mutant-left-invariants-->

```text
불변식   1~7 을 넣고 4 를 지운 뒤
첫째     toArray().length=5 인데 size()=6 다
둘째     지킨다
셋째     지킨다
넷째     지킨다
```

첫째 문장만 어깁니다. 떨어져 나간 3 은 `has(3)` 도 못 찾으므로 둘째 문장의 두 길이 **같은 틀린 답**을 말하고, 양 끝과
구간도 남은 트리 안에서는 서로 맞아요. 세어 둔 개수만 옛 값을 들고 있어서 두 길이 갈렸습니다. 불변식 넷이 서로 다른
결함을 잡는 이유가 이것이에요.

```text
4 를 지운 뒤        바른 코드                    그 줄을 지운 코드
트리               2B(1B 5R(3B 6B(· 7R)))       2B(1B 5R(· 6B(· 7R)))     ← 3B 가 걸리지 않았다
toArray()          [1 2 3 5 6 7]                [1 2 5 6 7]
size()             6                            6                         ← 개수는 노드를 따라가지 않는다
```

### 비용 계산

#### 비용을 세는 과정

비용의 단위는 **노드 하나를 지나갈 때마다 1** 이고, 색을 바꾸는 일과 회전 · 자리 바꾸기도 지나간 노드로 셉니다. 전개의
걸음 표에 그 값이 걸음마다 적혀 있어요. T10 · T11 의 찾기가 2 와 3, T5 · T7 의 넣기가 5 와 6, T14 의 지우기가 8
이었습니다. 연산 묶음별로 모으면 이렇습니다.

<!--proof:cost-by-group-->

```text
묶음                                       호출 수   비용 합   걸음별 비용
생성자                                           1         0   T1=0
내려가서 읽기 (has · min · max)                  5         9   T2=0 · T10=2 · T11=3 · T17=2 · T18=2
넣기                                             7        22   T3=0 · T4=1 · T5=5 · T6=3 · T7=6 · T8=4 · T9=3
지우기                                           3        16   T14=8 · T15=5 · T16=3
순서대로 모으기 (range · size · toArray)         4        10   T12=5 · T13=0 · T19=1 · T20=4
합                                              20        57   —
```

호출 하나의 비용을 부분으로 가르면 이렇게 적힙니다.

```text
찾기 · 양 끝 읽기   내려간 노드                                           높이 이하
넣기               내려간 노드 + 고치기 반복 + 회전                        반복이 물음을 두 층씩 위로 옮겨 높이에 묶이고, 회전은 2 이하
지우기             찾기 + 최솟값 찾기 + 자리 바꾸기 + 뒤처리 반복 + 회전   반복이 한 층씩 위로 가 높이에 묶이고, 자리 바꾸기 2 이하 · 회전 3 이하
구간 읽기          경계를 따라 내려간 노드 + 담은 원소                     경계 두 길이 각각 높이 이하, 담은 원소 k
개수 · 전부 읽기   1 · 노드 전부

T14 delete(20)     찾기 1 + 최솟값 찾기 2 + 자리 바꾸기 2 + 뒤처리 반복 1 + 회전 2 = 8
```

넣기의 고치기 반복이 `h/2` 이하인 것은 ② 가 물음을 두 층씩 위로 옮기기 때문이고, 회전이 2 이하인 것은 ④ 뒤에 반복이
끝나기 때문입니다. 지우기의 뒤처리는 ⑨ 만 물음을 한 층씩 위로 옮기고, ⑧ 은 한 번 뒤 나머지 갈래로 가며, ⑪ 뒤에 끝나요.
그래서 회전이 3 이하입니다. 추가로 잡는 메모리는 노드 `n` 개와 감시 노드 하나예요.

#### 케이스별 비용과 그 경계

**케이스**(어떤 호출인가)와 **경계**(어떤 종류의 값인가)는 다른 축입니다. 호출 한 번을 두 축으로 가르면 이렇습니다.

| | 상한 `O` | 타이트 `Θ` |
| --- | --- | --- |
| **찾기 · 넣기 · 지우기 한 번 — 가장 나쁜 트리 모양에서** | `O(log n)` | `Θ(log n)` — 높이가 로그로 자라는 호출 열이 있다(오름차순 넣기) |
| **찾기 한 번 — 뿌리의 값을 찾을 때** | `O(1)` | `Θ(1)` — 노드 1 개 |
| **구간 읽기 한 번** | `O(log n + k)` | `Θ(log n + k)` — 경계 둘을 따라 내려가고 `k` 개를 담는다 |
| **전부 읽기 한 번** | `O(n)` | `Θ(n)` — 노드 전부 |

**한정자는 집필자가 고르는 값이 아니라 계약 헤더에 연산마다 적혀 있습니다.** 아홉 행이 전부 `worst` 예요. 가장 약한
한정자를 적는 것이 규칙인데 여기서 가장 강한 것을 적은 이유는, **배제하려는 계열이 실재하고 그 배제가 계약의 목적**이기
때문입니다. `amortized` 로 적으면 경쟁 설계에서 본 스플레이 트리가 들어오고, `expected` 로 적으면 무작위 우선순위로
균형을 얻는 트립이 들어와요. 둘 다 호출 한 번의 상한을 약속하지 못합니다.

```text
세 한정자는 한 줄로 서지 않는다
  worst        호출 한 번마다 그 상한                         → 나머지 둘을 함의한다
  amortized    어떤 호출 순서든 n 번의 합을 n 으로 나눈 값      → 난수와 무관한 최악의 평균
  expected     난수에 대한 평균                                → amortized 와 서로를 함의하지 않는다
```

**보장의 종류를 밝힙니다.** 이 구현에는 난수가 하나도 없고, 높이 상한 $h \le 2\log_2(n+1)$ 은 수식 절에서 호출 순서를
쓰지 않고 유도했어요. 그래서 `worst` 는 입력 분포에 대한 기댓값도, 여러 호출의 평균도 아니라 **어떤 호출 열의 어느
호출에서도** 성립하는 상한입니다.

```text
높이 상한   h ≤ 2·log₂(n+1)   수식 절의 유도 — 호출 순서를 쓰지 않았다
난수        없다              기댓값으로 볼 것이 없다
평균        쓰지 않았다       호출 한 번에 성립하는 상한이다
```

계약 스위트 축3 이 정본에 대해 내는 값 전부입니다. 이 구조의 검증 등급은 `complexity` 라 세 크기에서 재고, 기대하는
`r` 에서 ±30% 안이면 통과로 봐요. 시나리오마다 호출 한 번의 최댓값을 적었습니다.

<!--proof:growth-rate-->

```text
시나리오가 부르는 연산   적대적   상한       n = 1,024   n = 4,096   n = 16,384             r   판정
insert                   예       O(log n)       26.00       32.00        38.00   1.23 · 1.19   통과
insert                   아니오   O(log n)       17.00       20.00        24.00   1.18 · 1.20   통과
has·min·max              예       O(log n)       45.00       55.00        65.00   1.22 · 1.18   통과
delete                   예       O(log n)       19.00       23.00        27.00   1.21 · 1.17   통과
range                    아니오   O(log n)       20.00       21.00        26.00   1.05 · 1.24   통과
toArray                  아니오   O(n)          912.00    3,636.00    14,446.00   3.99 · 3.97   통과
size                     아니오   O(1)            1.00        1.00         1.00   1.00 · 1.00   통과
```

로그 상한의 다섯 시나리오는 `r` 이 1.05 에서 1.24 사이이고, 기대값은 `n = 1,024 → 4,096` 에서 1.20,
`4,096 → 16,384` 에서 1.17 입니다. 원소 수를 네 배로 키울 때 로그는 2 만 늘기 때문이에요. `toArray` 는 3.99 · 3.97 로
원소 수에 비례하는 상한의 기대값 4.00 근처이고, `size` 는 1.00 입니다. 시간이 아니라 지나간 노드를 세므로, 이 판정은
이 기계의 속도가 아니라 구현의 작업량을 잽니다.

#### 최악을 만드는 입력

**적대적 입력은 하나로 부족합니다.** 최악은 계약이 아니라 **구현**에 대해 정해지기 때문이에요. 파트 1 의 세 설계와
정본을 각자의 최악 입력 넷에 모두 넣어 `n = 4,096` 에서 호출 한 번의 최댓값을 셉니다.

<!--proof:worst-inputs-->

```text
입력 (n = 4,096)                       설계                    호출당 평균   호출 한 번 최대
오름차순 넣기                          정렬 배열                     10.00                12
오름차순 넣기                          균형 없는 트리             2,047.50             4,095
오름차순 넣기                          조회가 고쳐 쓰는 트리          2.00                 2
오름차순 넣기                          정본                          21.50                32
무작위 넣기                            정렬 배열                    813.51             3,598
무작위 넣기                            균형 없는 트리                13.26                25
무작위 넣기                            조회가 고쳐 쓰는 트리         21.34                47
무작위 넣기                            정본                          12.02                21
오름차순으로 채운 뒤 순차 조회         정렬 배열                     12.00                13
오름차순으로 채운 뒤 순차 조회         균형 없는 트리             2,048.50             4,096
오름차순으로 채운 뒤 순차 조회         조회가 고쳐 쓰는 트리          7.97             6,144
오름차순으로 채운 뒤 순차 조회         정본                          11.50                22
오름차순으로 채운 뒤 오름차순 지우기   정렬 배열                  2,059.50             4,109
오름차순으로 채운 뒤 오름차순 지우기   균형 없는 트리                 1.00                 1
오름차순으로 채운 뒤 오름차순 지우기   조회가 고쳐 쓰는 트리          6.25             6,144
오름차순으로 채운 뒤 오름차순 지우기   정본                          12.25                23
```

같은 입력이 설계마다 최선도 되고 최악도 됩니다. 오름차순 넣기는 균형 없는 트리에 4,095 이고 조회가 고쳐 쓰는 트리에는
2 예요. 오름차순으로 채운 뒤 순차 조회는 조회가 고쳐 쓰는 트리에 6,144 인데, 같은 트리의 호출당 평균은 7.97 입니다 —
평균이 작아도 한 번이 큰 설계가 계약 스위트에서 걸리는 모양이에요. **본문에 실린 정본은 네 입력 모두에서 호출 한 번이
32 를 넘지 않았고**, 가장 큰 32 가 오름차순 넣기에서 나왔습니다.

```ts
const t = new RedBlackTree<number>();
for (let i = 0; i < 4096; i++) t.insert(i);   // 오른쪽 끝으로만 붙어, 고치기가 가장 긴 길에서 반복된다
// 이 열의 넣기 한 번 최댓값이 32 — 오른쪽 끝 길을 내려가고, 색을 옮기며 올라온 값이다
```

정본의 최악이 오름차순 넣기인 이유는 새 값이 늘 가장 긴 오른쪽 길의 끝에 붙어, 내려가는 거리와 ② 가 물음을 옮기며
올라오는 거리가 둘 다 그 길이가 되기 때문입니다. 그래도 그 길이가 높이 상한에 묶여 32 에 머물러요. **다른 정당한
구현에는 다른 입력이 최악입니다** — 같은 계약을 지키는 AVL 트리는 높이 차를 1 로 묶어 모양을 고치는 조건이 달라서, 회전이
일어나는 입력도 이 구현과 다릅니다. 커널 문서가 넣기 · 지우기의 회전 수를 두 구조의 차이로 든 것이 그 자리예요.

### 스스로 점검하기

여기까지 다룬 것을 한 줄로 정리하면 이렇습니다. 이진 탐색 트리의 노드에 색 하나를 붙이고 세 규칙을 지키면 높이가
`2·log₂(n+1)` 이하로 묶이고, 새 노드를 빨갛게 넣으면 깨질 수 있는 규칙이 하나로 좁혀져 넣기 한 번이 색 옮기기와 회전
두 번 이하로 고칩니다. 지우기는 모자란 검정 하나를 형제 쪽에서 메우며 회전 세 번 이하로 끝나요.

```text
뿌리 규칙 · 빨강 규칙 · 검정 규칙
   → 높이 h ≤ 2b ≤ 2·log₂(n+1)                         찾기 · 양 끝 읽기가 로그
   → 넣기: 빨갛게 붙이고, 삼촌이 빨가면 색을 옮겨 위로, 검으면 회전 두 번 이하로 끝
   → 지우기: 검정이 빠졌을 때만, 형제와 조카 색으로 메우고 회전 세 번 이하로 끝
       └ 호출 한 번마다 로그 — 전체 비용이 더 적은 설계(스플레이 트리)가 있어도 한 번의 상한은 이쪽만 약속한다
```

먼저 답이 붙는 문제 하나입니다. 전개가 T20 에서 끝난 트리 `50B(30B(· 40R) 90B)` 에 `insert(35)` 를 부르면 어느 갈래를
지나고, 트리는 어떤 모양이 될까요?

```text
T20 뒤    깊이 1   -    -    50B  -
          깊이 2   30B  -    -    90B
          깊이 3   -    40R  -    -
그다음    insert(35)   → 갈래 ?   모양 ?
```

<!--check:insert35-->
35 는 50 의 왼쪽 30 을 지나 40 의 왼쪽에 빨갛게 붙습니다. 부모 40 이 빨갛고 삼촌(30 의 왼쪽)이 빈 자리라 검으며,
35 는 **안쪽 자식**이에요 — 부모 40 은 30 의 오른쪽인데 35 는 40 의 왼쪽이니까요. 그래서 ③ 으로 40 을 먼저 오른쪽으로
회전하고, ④ 로 35 를 검게 · 30 을 빨갛게 칠해 30 을 왼쪽으로 회전합니다.

<!--proof:check-insert35-->

```text
insert(35)   갈래 ③ ④   지나간 노드 6
  ③ 부모 40 을 오른쪽으로 회전
  ④ 35 검게 · 조부모 30 빨갛게, 30 을 왼쪽으로 회전
호출 전  50B(30B(· 40R) 90B)
호출 뒤  50B(35B(30R 40R) 90B)
```

T5 의 `insert(20)` 이 같은 ③ → ④ 였던 것과 견줘 보세요. 거기서는 조부모 10 이 뿌리였고, 여기서는 조부모 30 이 뿌리
50 의 왼쪽 자식이라 회전이 뿌리 아래 왼쪽 부분에서만 일어났습니다. 오른쪽의 90 은 한 번도 지나가지 않았어요.
<!--/check-->

```text
아래 셋은 답을 싣지 않았습니다. 막히면 이 절들을 다시 보세요
  1 → 「수행으로 알아보는 자료구조」의 T6 · T8     2 → 「멈춤 — 새 노드를 검게 넣으면 …」
  3 → 「경쟁 설계와의 대조」와 「최악을 만드는 입력」
```

- T8 의 `insert(50)` 에서 ② 가 조부모 40 을 빨갛게 칠한 뒤 반복이 끝났습니다. 만약 그 순간 40 의 부모가 검은 20 이 아니라
  빨간 노드였다면 반복은 어떻게 이어졌을까요? `node = grand;` 가 가리키는 노드와 다음 반복의 삼촌을 적어 보세요.
- 새 노드를 검게 넣는 코드에서 넣기만 할 때는 답이 안 틀렸습니다. 같은 코드로 1~7 을 넣은 뒤 `delete(4)` 를 부르면
  `#fixDelete` 가 어느 갈래로 들어가는지, 답이 틀리는지 값으로 확인해 보세요.
- 스플레이 트리가 조회 한 번에 1,536 을 쓴 입력에서, 조회 순서를 0 부터가 아니라 1,023 부터 거꾸로 부르면 두 설계의 조회
  한 번 최댓값과 조회 전체가 각각 어떻게 바뀔지 예측하고, `bench-alt` 의 입력을 바꿔 실행해 확인해 보세요.
