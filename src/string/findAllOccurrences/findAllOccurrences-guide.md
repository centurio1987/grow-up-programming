# findAllOccurrences 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 텍스트 길이 $n$ | $0 \leq n \leq 10^5$ |
| 패턴 길이 $m$ | $0 \leq m \leq 10^5$ |

**naive 접근의 한계:**
텍스트의 각 위치 $i$마다 패턴 전체를 비교하는 브루트포스를 생각해 보자.

```
for i = 0 to n-m:
  if T[i..i+m-1] == P[0..m-1]:
    result.push(i)
```

비교 횟수는 최악 $(n - m + 1) \times m \approx O(nm)$이다.
$n = m = 10^5$이면 $10^{10}$ 연산 → 시간 초과.
또한 불일치 시 텍스트 포인터를 $i+1$로 돌리는 것 자체가 이미 진행한 비교 결과를 버린다.

**목표 복잡도:**

| 항목 | 목표 | 근거 |
|------|------|------|
| 시간 | $O(n + m)$ | 텍스트/패턴 포인터 각각 최대 1회씩 증가 |
| 공간 | $O(m)$ | 실패 함수 배열 |

$n + m \leq 2 \times 10^5$이면 충분히 통과한다.

## 목표 함수

```ts
function findAllOccurrences(text: string, pattern: string): number[]
```

**파라미터 표:**

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `text` | 검색 대상 텍스트 $T$ | $0 \leq n \leq 10^5$ |
| `pattern` | 찾을 패턴 $P$ | $0 \leq m \leq 10^5$ |

**반환값:** $T$ 내에서 $P$가 등장하는 모든 시작 인덱스를 오름차순으로 담은 배열.

**엣지케이스:**

| 케이스 | 반환값 |
|--------|--------|
| `m = 0` (빈 패턴) | `[]` (구현 규약) |
| `m > n` | `[]` (패턴이 텍스트보다 길면 매칭 불가) |
| 텍스트 전체가 패턴 | `[0]` |
| 패턴이 텍스트에 겹쳐 반복 등장 (`text="aaa"`, `pattern="aa"`) | `[0, 1]` |

## 핵심 아이디어

### 원형 아이디어와 naive 접근

가장 단순한 구현: 텍스트의 모든 시작 위치에서 패턴과 한 글자씩 비교한다.

```
result = []
for i = 0 to n-m:
  match = true
  for j = 0 to m-1:
    if T[i+j] != P[j]:
      match = false; break
  if match: result.push(i)
return result
```

불일치가 발생하면 텍스트 포인터를 $i+1$로 되돌린다. 이미 비교한 $T[i+1], T[i+2], \ldots$를 다시 비교하게 되므로 최악 $O(nm)$이다.
예: `text = "aaaa...a"` (n개), `pattern = "aaa...ab"` (m개의 a + b) → 거의 모든 위치에서 끝까지 비교 후 실패.

### 어떤 관찰이 돌파구가 되는가

- **불일치 시 패턴 안에서 이미 매칭된 정보를 버리지 않아도 된다.** $T[i..i+j-1] = P[0..j-1]$인 상태에서 $T[i+j] \neq P[j]$이면, $P[0..j-1]$ 안에서 접두사이자 접미사인 가장 긴 문자열의 길이 $k$를 알면 텍스트 포인터를 $i+k$로 이동할 수 있다(패턴 포인터를 $k$로 이동).
- **이 "접두사이자 접미사인 길이"는 패턴만으로 미리 계산할 수 있다.** 텍스트와 무관하게 $O(m)$ 전처리로 구한다.
- **텍스트 포인터는 절대 뒤로 이동하지 않는다.** 한 방향으로만 진행하므로 총 비교 횟수가 $O(n)$으로 한정된다.

### 관찰을 형식화: 상태/구조 정의

**실패 함수(failure function)** `fail[i]`를 정의한다.

$$\text{fail}[i] = \max \bigl\{ k < i+1 \;\big|\; P[0..k-1] = P[i-k+1..i] \bigr\}$$

즉, $P[0..i]$의 proper prefix이면서 동시에 proper suffix인 문자열의 최대 길이이다.

이 정의가 이 형태여야 하는 이유: 불일치 발생 시 "이미 매칭된 텍스트 부분을 활용해 패턴을 얼마나 당길 수 있는가"를 결정하는 값이 바로 이것이다. 더 긴 공통 접두사-접미사를 사용하면 유효한 매칭 후보를 건너뛰게 된다.

**매칭 상태 변수:**
- 텍스트 포인터 $i$ (0부터 n-1까지 단조 증가)
- 패턴 포인터 $j$ (현재 매칭된 길이, 0 ≤ $j$ ≤ m)

루프 불변식: 루프 시작 시 $T[i-j \ldots i-1] = P[0 \ldots j-1]$이 항상 성립한다.

### 점화식 또는 핵심 연산

**실패 함수 구축:**

$\text{fail}[0] = 0$ (길이 1 문자열의 proper prefix/suffix는 없음).

$i = 1, 2, \ldots, m-1$ 순서로:

$$\text{fail}[i] = \begin{cases} k + 1 & \text{if } P[i] = P[k] \quad (k = \text{fail}[i-1] \text{에서 시작}) \\ \text{fail}[k-1] \text{로 계속 이동하다 일치} & \text{if 중간에서 일치} \\ 0 & \text{if 끝내 불일치} \end{cases}$$

- 각 항의 의미: $k$는 "현재 시도 중인 접두사 길이"이고, 불일치 시 fail을 재귀적으로 적용해 더 짧은 공통 구간을 찾는다.

**KMP 매칭 전이:**

$$j \leftarrow \begin{cases} j + 1 & \text{if } T[i] = P[j] \quad (\text{이후 } i \leftarrow i+1) \\ \text{fail}[j-1] & \text{if } T[i] \neq P[j] \text{ and } j > 0 \\ (\text{그대로, } i \leftarrow i+1) & \text{if } j = 0 \text{ and } T[i] \neq P[0] \end{cases}$$

$j = m$이 되면 매칭: 시작 위치 $i - m$을 기록하고 $j = \text{fail}[j-1]$로 이동.

### 정당성 — 왜 이것이 옳은가

귀납적으로 불변식 "$T[i-j \ldots i-1] = P[0 \ldots j-1]$"이 유지됨을 보인다.

- 기저: $i=0, j=0$이면 빈 구간으로 성립.
- $T[i] = P[j]$일 때 $i, j$ 모두 1 증가 → 불변식이 한 글자 확장되므로 유지.
- $T[i] \neq P[j]$이고 $j > 0$일 때 $j = \text{fail}[j-1]$로 이동. 실패 함수의 정의에 의해 $P[0 \ldots j'-1] = P[j-j' \ldots j-1] = T[i-j' \ldots i-1]$이므로 불변식 유지. $i$는 이동하지 않는다.

텍스트 포인터 $i$는 매 단계 최대 1 증가하고, 패턴 포인터 $j$의 총 증가량 ≤ n이므로 총 감소량도 ≤ n이다. 따라서 전체 루프는 $O(n)$이다.

까다로운 케이스: 패턴이 겹쳐 매칭되는 경우(`"aaa"`에서 `"aa"` 검색). $j = m$ 도달 후 $j = \text{fail}[m-1]$로 이동해 다시 진행하므로, 겹친 매칭도 놓치지 않는다.

### 구현 디테일과 최적화

- **실패 함수 구축 시 while 루프 조건:** `while k > 0 and P[i] != P[k]`에서 `k > 0` 조건이 없으면 `P[0] != P[i]`인 경우 `fail[-1]` 접근으로 무한 루프 또는 오류가 발생한다.
- **매칭 루프에서 j=0 처리:** `j = 0`이고 불일치이면 `fail[-1]`을 참조하는 실수를 하지 않도록, `j > 0` 조건을 먼저 확인한다.
- **겹친 매칭:** `j == m` 처리 후 반드시 `j = fail[j-1]`로 이동해야 이후 매칭을 탐색할 수 있다. `j = 0`으로 초기화하면 겹친 매칭을 놓친다.

## 수도 코드와 Activity Diagram

### 의사코드

```
buildFail(P, m):
  fail = array of length m, all 0
  k = 0                                  // 불변식: P[0..k-1]은 현재 접두사 후보
  for i = 1 to m-1:
    while k > 0 and P[i] != P[k]:
      k = fail[k-1]                      // 짧은 공통 구간으로 후퇴
    if P[i] == P[k]:
      k++
    fail[i] = k                          // 불변식: fail[0..i] 계산 완료
  return fail

kmpSearch(T, P):
  n = len(T), m = len(P)
  if m == 0: return []                   // 빈 패턴 규약
  fail = buildFail(P, m)
  result = []
  j = 0                                  // 불변식: T[i-j..i-1] == P[0..j-1]
  for i = 0 to n-1:
    while j > 0 and T[i] != P[j]:
      j = fail[j-1]                      // 패턴 포인터 후퇴
    if T[i] == P[j]:
      j++                                // 매칭 확장
    if j == m:
      result.push(i - m + 1)            // 시작 위치 기록
      j = fail[j-1]                      // 겹친 매칭 탐색
  return result
```

### Activity Diagram

```mermaid
flowchart TD
    A[m==0? → 빈 배열 반환] --> B[fail 배열 구축 buildFail]
    B --> C[i=0, j=0]
    C --> D{i < n?}
    D -- No --> Z[result 반환]
    D -- Yes --> E{j > 0 AND T[i] != P[j]?}
    E -- Yes --> F[j = fail[j-1]]
    F --> E
    E -- No --> G{T[i] == P[j]?}
    G -- Yes --> H[j++]
    G -- No --> I[i++]
    H --> J{j == m?}
    J -- Yes --> K["result.push(i - m + 1), j = fail[j-1]"]
    K --> L[i++]
    J -- No --> L
    L --> D
    I --> D
```

**핵심 불변식:** 루프 진입 시 $T[i-j \ldots i-1] = P[0 \ldots j-1]$이 항상 성립하며, 텍스트 포인터 $i$는 단조 증가하므로 전체 $O(n)$이 보장된다.
