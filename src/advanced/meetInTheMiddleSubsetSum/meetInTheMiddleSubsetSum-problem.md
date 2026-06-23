# 부분집합 합 존재 여부

## 한 줄 요약

> 정수 배열과 목표값을 받아, 합이 목표값과 같은 부분집합이 존재하면 `true`, 아니면 `false`를 반환한다.

## 스토리

게임 캐릭터 디자이너 소연은 캐릭터에게 장착할 아이템 조합을 고르고 있다. 각 아이템은 능력치를 더하거나 뺄 수 있으며, 원하는 능력치 총합을 정확히 맞추는 조합이 있는지 확인해야 한다.

아이템은 최대 40개까지 있을 수 있는데, 모든 조합을 일일이 다 확인하면 $2^{40}$가지가 넘어 현실적으로 불가능하다. 소연은 보다 빠른 방법으로 원하는 조합이 존재하는지 알아내려 한다.

아이템을 장착하지 않는 것도 선택지에 포함되므로, 아무것도 장착하지 않았을 때 능력치 합이 0이라면 목표가 0인 경우는 항상 가능하다.

## 함수 인터페이스

```ts
export function meetInTheMiddleSubsetSum(nums: number[], target: number): boolean;
```

- `nums` — 정수 배열 (음수 포함 가능)
- `target` — 찾고자 하는 부분집합 합의 목표값
- 반환 — 합이 `target`인 부분집합이 존재하면 `true`, 없으면 `false`

## 제약 조건

- $0 \leq n \leq 40$ (여기서 $n$은 `nums`의 길이)
- $-10^9 \leq \text{nums}[i] \leq 10^9$
- $-10^{18} \leq \text{target} \leq 10^{18}$
- 공집합(아무 원소도 선택하지 않은 경우)도 부분집합으로 인정한다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

길이 $n$인 정수 배열 `nums`와 목표값 `target`이 주어진다. `nums`의 부분집합 $S$(공집합 포함) 중 다음을 만족하는 $S$가 하나라도 존재하면 `true`, 없으면 `false`를 반환하라.

$$\sum_{x \in S} x = \text{target}$$

- 공집합의 합은 0이므로, `target = 0`이면 항상 `true`를 반환한다.
- `nums`가 빈 배열이면 가능한 부분집합은 공집합뿐이다. `target = 0`이면 `true`, 아니면 `false`.
- 같은 인덱스의 원소를 두 번 사용할 수 없다. 값이 같더라도 서로 다른 인덱스의 원소는 각각 독립적으로 선택한다.

## 예시

```ts
meetInTheMiddleSubsetSum([1, 2, 3], 5);         // true  — {2, 3}의 합 = 5
meetInTheMiddleSubsetSum([1, 2, 3], 7);         // false — 전체 합 6이 최대
meetInTheMiddleSubsetSum([1, 2, 3], 0);         // true  — 공집합의 합 = 0
meetInTheMiddleSubsetSum([-3, -1, 2, 5], 4);   // true  — {-1, 5}의 합 = 4

// 경계 케이스
meetInTheMiddleSubsetSum([], 0);                // true  — 빈 배열에서 공집합 선택
meetInTheMiddleSubsetSum([], 5);                // false — 빈 배열에서 0 외의 합 불가능
meetInTheMiddleSubsetSum([7], 7);               // true  — {7}의 합 = 7
meetInTheMiddleSubsetSum([7], 5);               // false — {7}과 {}만 존재
meetInTheMiddleSubsetSum([-5, 3, 1], -4);      // true  — {-5, 1}의 합 = -4
```
