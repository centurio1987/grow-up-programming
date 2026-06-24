# Count-Min Sketch

## 한 줄 요약

> `CountMinSketch`는 폭과 깊이를 받아, 스트리밍 데이터에서 각 원소의 등장 횟수를 확률적으로 추정한다.

## 스토리

실시간 광고 플랫폼에서는 매초 수백만 개의 클릭 이벤트가 쏟아진다. 광고주는 "광고 ID별로 이번 초에 클릭이 몇 번 일어났는가?"를 빠르게 알고 싶다. 모든 광고 ID를 딕셔너리에 저장하면 메모리가 감당되지 않는다.

운영팀은 메모리를 고정된 크기로 제한하면서도 "실제 횟수보다 절대 적게 보고하지 않는" 카운터를 원한다. 약간 과대평가하는 것은 괜찮지만, 실제로 100번 클릭된 광고를 98번이라고 보고하면 예산 계산이 망가진다.

광고 ID(문자열)와 클릭 수(정수)를 받아 누적하고, 특정 광고 ID의 추정 횟수를 반환하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class CountMinSketch {
  constructor(width: number, depth: number): void;
  update(item: string, count: number): void;
  estimate(item: string): number;
}
```

- `width` — 카운터 행렬의 열 수 $w$ ($w \geq 1$)
- `depth` — 카운터 행렬의 행 수 $d$ ($d \geq 1$)
- `update(item, count)` — `item`의 카운터를 `count`만큼 증가시킨다. 반환값 없음
- `estimate(item)` — `item`의 추정 등장 횟수를 반환한다. 실제 횟수 이상의 값을 반환해야 한다(과소평가 불가)

## 제약 조건

- $1 \leq \text{width} \leq 10^4$
- $1 \leq \text{depth} \leq 16$
- 스트림 이벤트 수 $n \leq 10^5$
- `count` $\geq 1$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

$d \times w$ 크기의 카운터 행렬 $C$와 $d$개의 독립 해시 함수 $h_1, h_2, \ldots, h_d$를 사용한다.

**update(item, count):** 모든 $j \in [1, d]$에 대해 $C[j][\,h_j(\text{item}) \bmod w\,] \mathrel{+}= \text{count}$

**estimate(item):** $\displaystyle\min_{1 \leq j \leq d} C[j][\,h_j(\text{item}) \bmod w\,]$ 를 반환한다

추정값은 실제 빈도 $f$ 이상이 보장된다(과소평가 불가). 해시 충돌로 인해 과대평가될 수 있다.

`update`를 한 번도 호출하지 않은 문자열에 대해 `estimate`는 `0`을 반환한다.

`width=1, depth=1`이면 모든 원소가 동일한 셀에 쌓이므로 전체 합이 추정값으로 반환된다.

## 예시

```ts
const cms = new CountMinSketch(1000, 5);

cms.update("apple", 3);
cms.update("apple", 2);
cms.estimate("apple");   // >= 5 — 실제 5, 과대평가 가능

cms.update("banana", 10);
cms.estimate("banana");  // >= 10 — 실제 10

cms.estimate("cherry");  // 0 — update 없음, 정확히 0

// 과소평가 불가 검증
const cms2 = new CountMinSketch(2000, 6);
cms2.update("hot", 1);
// 100000번 update 후에도
for (let i = 0; i < 99_999; i++) cms2.update("hot", 1);
cms2.estimate("hot"); // >= 100000
```
