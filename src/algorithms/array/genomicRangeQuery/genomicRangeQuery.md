# genomicRangeQuery 솔루션 분석 보고서

> 분석 일자: 2026-04-30
> 테스트 결과: 3 pass / 12 fail

---

## 현재 구현

```ts
export function solution(S: string, P: number[], Q: number[]): number[] {
  const result: number[] = [];
  const prefixA: number[] = [];
  const prefixC: number[] = [];
  const prefixG: number[] = [];

  switch (S[0]) {
    case "A": prefixA.push(1); prefixC.push(0); prefixG.push(0); break;
    case "C": prefixC.push(1); prefixA.push(0); prefixG.push(0); break;
    case "G": prefixG.push(1); prefixC.push(0); prefixA.push(0); break;
  }

  for (let i = 0; i < S.length - 1; i++) {
    if (S[i + 1] === "A") {
      prefixA.push(prefixA[i]! + 1);
      prefixC.push(prefixC[i]!);
      prefixG.push(prefixG[i]!);
    } else if (S[i + 1] === "C") {
      prefixC.push(prefixA[i]! + 1);   // ← 버그
      prefixA.push(prefixC[i]!);        // ← 버그
      prefixG.push(prefixG[i]!);
    } else if (S[i + 1] === "G") {
      prefixG.push(prefixA[i]! + 1);   // ← 버그
      prefixA.push(prefixC[i]!);        // ← 버그
      prefixC.push(prefixG[i]!);        // ← 버그
    }
    // T 분기 없음 ← 버그
  }

  for (let j = 0; j < P.length; j++) {
    const start = P[j]!;
    const end = Q[j]!;

    if (prefixA[end]! - prefixA[start - 1]! > 0) {   // ← 버그: start=0 시 [-1]
      result.push(1);
    } else if (prefixC[end]! - prefixC[start - 1]! > 0) {
      result.push(2);
    } else if (prefixG[end]! - prefixG[start - 1]! > 0) {
      result.push(3);
    } else {
      result.push(4);
    }
  }
  return result;
}
```

---

## 1. 접근 방향성

**방향은 올바르다.** prefix sum을 활용하여 구간 내 특정 문자의 존재 여부를 O(1)에 판단하는 접근:

$$\text{count}_c(p, q) = \text{prefix}_c[q] - \text{prefix}_c[p-1]$$

여기서 `prefix_c[i]` = S[0..i]에서 c의 등장 횟수 (inclusive 인덱싱).

이 환원 자체는 문제를 올바르게 모델링한다.

---

## 2. 정확성 분석

### 2-1. 버그: C/G 분기에서 변수 참조 교차 오류

C 분기에서 A/C 변수가 서로 바뀌어 있고, G 분기에서 A/C/G 세 변수가 모두 잘못 참조된다.

```ts
// C 분기 — 현재 (잘못됨)
prefixC.push(prefixA[i]! + 1);  // prefixA[i]를 참조 → 잘못된 값
prefixA.push(prefixC[i]!);       // prefixC[i]를 참조 → 잘못된 값

// C 분기 — 올바름
prefixC.push(prefixC[i]! + 1);
prefixA.push(prefixA[i]!);
```

```ts
// G 분기 — 현재 (잘못됨)
prefixG.push(prefixA[i]! + 1);  // A를 G로 착각
prefixA.push(prefixC[i]!);       // C를 A로 착각
prefixC.push(prefixG[i]!);       // G를 C로 착각

// G 분기 — 올바름
prefixG.push(prefixG[i]! + 1);
prefixA.push(prefixA[i]!);
prefixC.push(prefixC[i]!);
```

S="ACGT" 추적으로 검증:

| i | S[i+1] | prefixA (현재→올바름) | prefixC (현재→올바름) |
|---|--------|----------------------|----------------------|
| 0 | C | [1,**0**] → [1,**1**] | [0,**2**] → [0,**1**] |
| 1 | G | [1,0,**2**] → [1,1,**1**] | [0,2,**0**] → [0,1,**1**] |

### 2-2. 버그: T 분기 없음 — 배열 길이 불일치

T가 등장할 때 아무 것도 push하지 않는다. 결과적으로 배열 길이가 N보다 짧아지고, 이후의 인덱스 참조가 전부 어긋난다.

```ts
// T 분기 필요
else {  // T
  prefixA.push(prefixA[i]!);
  prefixC.push(prefixC[i]!);
  prefixG.push(prefixG[i]!);
}
```

S="TCGA" (T로 시작) 추적:
```
switch(S[0]='T'): 아무 case도 없음 → 세 배열 모두 길이 0
i=0, S[1]='C': C 분기 → 각 배열에 push (but prefixA[0]은 undefined)
...
```

### 2-3. 버그: switch에 T case 없음 — 초기화 누락

`S[0] = 'T'`이면 switch에 해당 case가 없어서 세 배열 모두 빈 채로 루프에 진입한다. 루프 첫 단계(`i=0`)에서 `prefixA[0]!`이 `undefined`가 되어 이후 모든 연산이 `NaN`으로 오염된다.

```ts
// T case 추가 필요
case "T":
  prefixA.push(0);
  prefixC.push(0);
  prefixG.push(0);
  break;
```

### 2-4. 버그: start=0 → prefixA[-1] = undefined

쿼리 구간이 인덱스 0부터 시작할 때(P[K]=0), `start - 1 = -1`이 되어 배열에 `-1` 인덱스로 접근한다. JavaScript에서 `array[-1]`은 `undefined`이므로:

$$\text{prefixA}[\text{end}] - \text{undefined} = \text{NaN}$$

`NaN > 0`은 항상 `false`이므로, A/C/G 체크를 모두 통과하지 못하고 4(T)를 반환한다. 이것이 12개 실패 테스트 대부분이 4를 반환하는 근본 원인이다.

```ts
// 현재 (잘못됨)
prefixA[end]! - prefixA[start - 1]!

// 올바름 (start=0 처리)
prefixA[end]! - (start > 0 ? prefixA[start - 1]! : 0)
```

---

## 3. 최적화 분석

### 현재 복잡도: O(N + M)

방향은 이미 최적이다. 전처리 O(N) + 쿼리 처리 O(M)으로 목표 복잡도에 부합한다. 버그를 수정하면 성능은 충분하다.

### 인덱싱 방식 비교

현재 코드는 **inclusive prefix** (`prefix[i]` = S[0..i]의 누적 횟수)를 사용한다. 이 방식은 `start=0` 경계를 별도로 처리해야 하는 단점이 있다.

`prefix[0] = 0`, `prefix[i+1]` = S[0..i-1]의 누적 횟수인 **exclusive prefix** (길이 N+1)를 쓰면 경계 처리가 불필요해진다:

```ts
// exclusive prefix 방식 — start-1 문제 없음
count = prefixA[end + 1] - prefixA[start]
```

---

## 4. 수정 요약

| 버그 | 위치 | 원인 | 수정 방법 |
|------|------|------|-----------|
| C/G 분기 변수 교차 | 루프 내 C, G 분기 | prefixA/C/G 참조 변수 혼용 | 각 변수가 자기 자신을 참조하도록 수정 |
| T 분기 없음 | 루프 내 T 처리 | else 분기 누락 | T일 때 세 배열 모두 이전 값 복사 push |
| switch T case 없음 | switch(S[0]) | T case 누락 | `case "T"` 추가, 세 배열에 0 push |
| start=0 → [-1] 접근 | 쿼리 루프 | start-1이 음수가 되는 경우 미처리 | `start > 0 ? prefixA[start-1] : 0` |

---

## 반복 2 — 4개 버그 전부 수정 (15 pass / 0 fail)

> 분석 일자: 2026-04-30
> 테스트 결과: 15 pass / 0 fail

### 변경된 구현

```ts
// switch: default 추가 (T case 포함)
default:
  prefixG.push(0); prefixC.push(0); prefixA.push(0); break;

// 루프: C/G 분기 변수 수정 + else(T) 분기 추가
} else if (S[i + 1] === "C") {
  prefixC.push(prefixC[i]! + 1);  // prefixA → prefixC 수정
  prefixA.push(prefixA[i]!);       // prefixC → prefixA 수정
  prefixG.push(prefixG[i]!);
} else if (S[i + 1] === "G") {
  prefixG.push(prefixG[i]! + 1);  // prefixA → prefixG 수정
  prefixA.push(prefixA[i]!);       // prefixC → prefixA 수정
  prefixC.push(prefixC[i]!);       // prefixG → prefixC 수정
} else {                            // T 분기 추가
  prefixG.push(prefixG[i]!);
  prefixA.push(prefixA[i]!);
  prefixC.push(prefixC[i]!);
}

// 쿼리: ?? 0 으로 [-1] undefined 처리
prefixA[end]! - (prefixA[start - 1] ?? 0) > 0
```

### 개선된 점

| 버그 | 반복 1 | 반복 2 |
|------|--------|--------|
| C/G 분기 변수 교차 | ❌ | 각 변수가 자기 자신을 참조 ✅ |
| T 분기 없음 | ❌ | `else` 분기 추가 ✅ |
| switch T case 없음 | ❌ | `default` case 추가 ✅ |
| start=0 → [-1] 접근 | ❌ | `?? 0` nullish coalescing ✅ |

### 분석

**1. 접근 방향성**: 올바르다. inclusive prefix sum으로 구간 내 문자 존재 여부를 O(1) 판단.

**2. 정확성**: 모든 15개 테스트 통과. 경계 케이스(N=1, T로 시작, start=0, 단일 문자 쿼리)를 모두 정확히 처리한다.

**3. 최적화**: O(N + M). 전처리 O(N) + 쿼리 O(M). 성능 테스트(N=100,000, M=50,000, 1000ms 이내) 통과.

**참고**: `?? 0`은 start=0일 때 `prefixA[-1]`이 `undefined`이므로 0을 반환하는 방식으로 동작한다. 이는 "S[0..(-1)]에 A가 0개" 라는 의미와 정확히 일치한다.
