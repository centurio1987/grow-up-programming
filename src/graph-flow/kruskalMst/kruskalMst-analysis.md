# kruskalMst 솔루션 분석 보고서

## 1. 접근 방향성

**올바름.** Kruskal 알고리즘(간선 정렬 + Union-Find)을 선택한 것은 $O(E \log E)$ 목표 복잡도에 정확히 부합한다. Union-Find에 경로 압축(`path compression`)과 랭크 병합(`union by rank`)을 모두 채택한 구조도 타당하다.

---

## 2. 정확성 분석 — 테스트 결과

```
 10 pass
  2 fail
```

### 실패 케이스

| 테스트 | 기대값 | 실제값 | 원인 |
|--------|--------|--------|------|
| 연결되지 않은 그래프 → -1 | -1 | 5 | 비연결 그래프 판별 로직 없음 |
| 간선 없음에 정점 다수 → -1 | -1 | 0 | 동일 |

### 버그 1 — 비연결 그래프 미처리 (Critical)

```typescript
// 현재 코드 (kruskalMst.ts:42)
return totalWeight;
```

루프 종료 후 `edgesAdded`가 `n - 1`에 미달해도 무조건 `totalWeight`를 반환한다. 비연결 그래프일 때 `-1`을 반환해야 하는 요구사항을 충족하지 못한다.

**수정:**
```typescript
return edgesAdded === n - 1 ? totalWeight : -1;
```

### 버그 2 — 조기 종료 조건이 데드코드 (Secondary)

```typescript
// 현재 코드 (kruskalMst.ts:36)
if (edgesAdded > n - 1) {
  return totalWeight;
}
```

Union-Find의 사이클 방지 로직 때문에 `edgesAdded`는 최대 `n - 1`까지만 증가한다. `edgesAdded > n - 1` 조건은 절대로 참이 되지 않아 이 분기는 데드코드다.

**수정:**
```typescript
if (edgesAdded === n - 1) {
  return totalWeight;
}
```

---

## 3. 최적화 분석

### 3.1 Union by Rank 구현 오류

현재 `union` 함수의 랭크 갱신 로직이 올바르지 않다.

```typescript
// 현재 코드 (kruskalMst.ts:69-75)
if (rank[ru]! > rank[rv]!) {
  parent[rv] = ru;
  rank[ru]!++;          // 오류: rank[ru] > rank[rv]일 때 ru 높이는 증가하지 않음
} else {
  parent[ru] = rv;
  rank[rv]!++;          // 오류: rank[ru] < rank[rv]일 때도 rv 랭크를 증가시킴
}
```

**Union by Rank의 정확한 정의:**

두 컴포넌트를 합칠 때 랭크가 낮은 트리를 높은 트리 아래에 붙이며, 두 트리의 랭크가 같을 때만 합쳐진 트리의 랭크가 1 증가한다.

$$
\text{rank}[r_u] \leftarrow
\begin{cases}
\text{rank}[r_u] + 1 & \text{if } \text{rank}[r_u] = \text{rank}[r_v] \\
\text{rank}[r_u] & \text{otherwise}
\end{cases}
$$

현재 구현은 이 규칙을 위반한다:
- `rank[ru] > rank[rv]`인 경우: `ru`를 루트로 유지하고 `rv`를 아래에 붙이는 것은 옳으나, `rank[ru]`를 1 증가시키는 것은 틀렸다. 더 깊은 트리 위에 낮은 트리를 붙여도 높이는 변하지 않는다.
- `rank[ru] ≤ rank[rv]`인 경우 (else 분기): `rank[ru] < rank[rv]`일 때도 `rank[rv]`를 1 증가시킨다. 이는 틀렸다.

결과적으로 랭크 값이 실제 트리 높이 상한보다 빠르게 증가해 union by rank의 트리 높이 억제 효과가 사라진다. MST 결과 자체는 여전히 정확하지만(어느 트리를 루트로 삼아도 연결 정보는 동일하므로), `find`의 성능 보장($O(\log V)$ 트리 높이)이 깨진다.

**올바른 구현:**
```typescript
function union(u: number, v: number, parent: number[], rank: number[]) {
  const ru = find(u, parent);
  const rv = find(v, parent);
  if (rank[ru]! > rank[rv]!) {
    parent[rv] = ru;
    // rank[ru] 불변: 더 깊은 트리 위에 얕은 트리를 붙여도 높이 상한은 유지됨
  } else if (rank[ru]! < rank[rv]!) {
    parent[ru] = rv;
    // rank[rv] 불변
  } else {
    parent[rv] = ru;
    rank[ru]!++;  // 같은 높이 두 트리를 합칠 때만 1 증가
  }
}
```

### 3.2 핵심 아이디어: Union by Rank 상세

**왜 rank가 필요한가**

Union-Find에서 `find(v)`는 `parent[v]`를 따라 루트까지 올라간다. 최악의 경우 트리가 일직선(`0 → 1 → 2 → ... → n-1`)이면 `find`가 $O(n)$이 된다.

이를 막으려면 **항상 키가 낮은 트리를 키가 큰 트리 아래에 붙여야** 한다. 이것이 union by rank다.

**rank의 정의와 갱신 규칙**

`rank[v]`는 `v`를 루트로 하는 서브트리 높이의 상한(upper bound)이다.

초기 상태: 각 노드가 혼자 있으므로 높이 = 0.
$$\text{rank}[v] = 0 \quad (v = 0, 1, \ldots, n-1)$$

두 루트 $r_u$, $r_v$를 합칠 때 ($r_u \neq r_v$):

$$
\text{rank}[r_u] > \text{rank}[r_v] \Rightarrow
\begin{cases}
\text{parent}[r_v] = r_u & \text{(낮은 트리를 높은 트리 아래로)} \\
\text{rank}[r_u] \text{ 불변} & \text{(높이 상한 변화 없음)}
\end{cases}
$$

$$
\text{rank}[r_u] < \text{rank}[r_v] \Rightarrow
\begin{cases}
\text{parent}[r_u] = r_v \\
\text{rank}[r_v] \text{ 불변}
\end{cases}
$$

$$
\text{rank}[r_u] = \text{rank}[r_v] \Rightarrow
\begin{cases}
\text{parent}[r_v] = r_u & \text{(어느 쪽이든 무방)} \\
\text{rank}[r_u] \mathrel{+}= 1 & \text{(두 트리의 높이가 같으면 합쳐진 트리는 1 높아짐)}
\end{cases}
$$

**랭크가 높이를 제한하는 이유**

`rank[v] = k`인 트리가 만들어지려면 `rank[v] = k-1`인 트리 두 개를 합쳐야 한다. 따라서 `rank = k`인 트리의 노드 수는 $2^k$ 이상이어야 한다.

$$\text{size}(r) \geq 2^{\text{rank}[r]}$$

정점 $n$개에서 $2^k \leq n$이므로 $k \leq \log_2 n$. 따라서 어떤 트리의 랭크도 $\lfloor \log_2 n \rfloor$을 넘지 않는다.

랭크 = 트리 높이 상한이므로, 경로 압축 없이도 `find`는 $O(\log n)$이 보장된다.

**경로 압축과의 결합**

경로 압축과 union by rank를 동시에 사용하면 `find`의 분할상환(amortized) 비용은 $O(\alpha(n))$이 된다. $\alpha$는 역아커만 함수(inverse Ackermann function)로, $n \leq 10^{80000}$ 범위에서 $\alpha(n) \leq 4$이므로 사실상 상수다.

$$
T(\text{find}) = O(\alpha(n)) \approx O(1)
$$

$$
T(\text{전체 Union-Find 연산}) = O(E \cdot \alpha(V)) \approx O(E)
$$

---

## 4. 개선된 내용 요약 및 남은 버그

### 개선 전 vs 개선 후

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 비연결 그래프 반환 | 항상 `totalWeight` 반환 | `edgesAdded === n-1`이면 `totalWeight`, 아니면 `-1` |
| 조기 종료 조건 | `edgesAdded > n - 1` (데드코드) | `edgesAdded === n - 1` |
| Union by Rank | 항상 `rank` 증가 (오류) | 랭크 동일할 때만 1 증가 |

### 남은 버그

현재 구현에는 위에서 설명한 세 가지 문제 외에 추가적인 구조적 버그는 없다. 다음 사항은 선택적 개선이다:

- **`union` 함수 반환값:** 현재 `void`를 반환하고 `main` 루프에서 `find` 비교로 분기를 결정한다. `union`이 `boolean`(병합 성공 여부)을 반환하면 `find` 중복 호출을 제거할 수 있어 코드가 간결해진다.
- **`BigInt` 처리:** 문제 제약 $w \leq 10^9$, $V \leq 10^5$이면 총합이 최대 $10^{14}$로, IEEE 754 `number`의 안전 정수 범위 $2^{53} \approx 9 \times 10^{15}$를 초과하지 않으므로 현재는 문제없다. 제약이 $w \leq 10^{18}$까지 확장되면 `BigInt`가 필요하다.

---

## 5. [2차 분석] Bug 1 수정 이후 상태

### 수정된 내용

**Bug 1 — 비연결 그래프 미처리 → 수정 완료**

루프 종료 후 `edgesAdded !== n - 1` 조건을 명시적으로 검사하는 분기가 추가됐다.

```typescript
// 수정 후 (kruskalMst.ts:42-44)
if (edgesAdded !== n - 1) {
  return -1;
}
return totalWeight;
```

이로써 비연결 그래프에서 올바르게 `-1`을 반환한다.

### 테스트 결과 (2차)

```
 12 pass
  0 fail
```

이전 분석에서 실패하던 두 케이스("연결되지 않은 그래프 → -1", "간선 없음에 정점 다수 → -1")가 모두 통과한다.

### 남은 문제

| 항목 | 위치 | 심각도 | 설명 |
|------|------|--------|------|
| 조기 종료 조건 데드코드 | `kruskalMst.ts:36` | 낮음 | `edgesAdded > n - 1` 조건은 Union-Find 사이클 방지 로직에 의해 절대 참이 되지 않는다. `=== n - 1`로 교체해야 의도가 명확해진다. |
| Union by Rank 랭크 갱신 오류 | `kruskalMst.ts:72-78` | 중간 | `rank[ru] > rank[rv]`일 때 `rank[ru]`를 1 증가시키는 것이 틀렸고, `rank[ru] < rank[rv]`인 else 분기에서도 `rank[rv]`를 1 증가시키는 것이 틀렸다. 랭크가 동일할 때만 합쳐진 쪽의 랭크를 1 증가시켜야 한다. MST 결과 정확도에는 영향 없으나 `find`의 $O(\log V)$ 높이 보장이 깨진다. |

---

## 6. [3차 분석] Bug 2·3 수정 이후 상태

### 수정된 내용

**Bug 2 — 조기 종료 조건 데드코드 → 수정 완료**

`edgesAdded > n - 1`을 `edgesAdded === n - 1`로 교체했다.

```typescript
// 수정 후 (kruskalMst.ts:36)
if (edgesAdded === n - 1) {
  return totalWeight;
}
```

Union-Find 사이클 방지 로직 덕분에 `edgesAdded`는 최대 `n - 1`까지만 증가하므로, `>` 조건은 절대 참이 되지 않는 데드코드였다. `===`으로 교체함으로써 신장 트리 완성 시 즉시 종료하는 의도가 코드에 올바르게 반영됐다.

**Bug 3 — Union by Rank 랭크 갱신 오류 → 수정 완료**

```typescript
// 수정 후 (kruskalMst.ts:72-79)
if (rank[ru]! > rank[rv]!) {
  parent[rv] = ru;
  // rank[ru] 불변: 높은 트리 아래에 낮은 트리를 붙여도 높이 상한은 변하지 않음
} else {
  parent[ru] = rv;
  if (rank[ru]! === rank[rv]!) {
    rank[rv]!++;  // 두 트리의 랭크가 같을 때만 합쳐진 트리의 랭크 1 증가
  }
  // rank[ru] < rank[rv]인 경우: rank[rv] 불변
}
```

세 가지 경우의 갱신 규칙이 모두 올바르게 구현됐다:

| 조건 | root 선택 | 랭크 갱신 |
|------|-----------|-----------|
| $\text{rank}[r_u] > \text{rank}[r_v]$ | $r_u$ | $\text{rank}[r_u]$ 불변 |
| $\text{rank}[r_u] < \text{rank}[r_v]$ | $r_v$ | $\text{rank}[r_v]$ 불변 |
| $\text{rank}[r_u] = \text{rank}[r_v]$ | $r_v$ | $\text{rank}[r_v] \mathrel{+}= 1$ |

이로써 `find`의 $O(\log V)$ 트리 높이 상한이 복구됐다.

### 테스트 결과 (3차)

```
 12 pass
  0 fail
```

### 남은 문제

구조적 버그는 없다. 다음은 선택적 개선 사항이다:

- **`union` 함수 반환값:** 현재 `void`를 반환하고 메인 루프에서 `find` 비교로 분기를 결정한다. `union`이 `boolean`(병합 성공 여부)을 반환하면 `find` 중복 호출을 제거할 수 있어 코드가 간결해진다.
- **`BigInt` 처리:** 현재 제약($w \leq 10^9$, $V \leq 10^5$)에서는 총합이 최대 $10^{14}$로 `number`의 안전 정수 범위($2^{53} \approx 9 \times 10^{15}$)를 초과하지 않으므로 문제없다. 제약이 $w \leq 10^{18}$로 확장될 경우 `BigInt`가 필요하다.

---

## 7. [4차 분석] union 반환값 개선 적용 이후 상태

### 변경된 내용

**선택적 개선 사항 — `union` boolean 반환 → 적용 완료**

이전 분석에서 "선택적 개선 사항"으로 제안된 항목이 구현됐다.

**변경 전:**
```typescript
// 메인 루프에서 find를 별도 호출해 사이클 판별
if (find(u, parent) !== find(v, parent)) {
  union(u, v, parent, rank);   // union 내부에서도 find를 다시 호출 → find 중복 호출
  totalWeight += weight;
  edgesAdded++;
}
```

**변경 후:**
```typescript
// union 한 번으로 사이클 판별 + 병합을 동시에 처리
if (union(u, v, parent, rank)) {
  totalWeight += weight;
  edgesAdded++;
}
```

`union` 함수 내부에도 `ru === rv` 사이클 감지 분기가 추가됐다.

```typescript
function union(...): boolean {
  const ru = find(u, parent);
  const rv = find(v, parent);
  if (ru === rv) return false;   // 사이클 → 병합 생략
  ...
  return true;                   // 병합 성공
}
```

### 효과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `find` 호출 횟수 (간선당) | 4회 (메인 루프 2 + union 내부 2) | 2회 (union 내부 2) |
| 사이클 감지 위치 | 메인 루프 | `union` 내부로 캡슐화 |
| 코드 간결성 | `if find(u) !== find(v) { union(...) }` | `if union(...)` |

경로 압축 덕분에 두 번째 `find`는 사실상 $O(1)$이었으므로 성능 차이는 미미하다. 그러나 `find` 중복 호출 제거로 코드 의도가 명확해지고, 사이클 감지 로직이 `union` 안에 캡슐화돼 책임이 명확히 분리됐다.

### 주의 — 의사코드 주석 불일치

`union` 함수 내부 의사코드 주석(lines 60–67)은 이전 버그가 있던 알고리즘을 그대로 기술하고 있다.

```typescript
/**
 * if(rank[ru] > rank[rv])
 *    parent[rv] = ru
 *    rank[ru]++;      ← 오류: 실제 구현은 rank[ru] 불변
 * else
 *    parent[ru] = rv
 *  rank[rv]++;        ← 오류: 실제 구현은 rank[ru] === rank[rv]일 때만 증가
 *  */
```

실제 실행 코드(lines 74–81)는 올바르지만, 주석이 코드와 불일치하므로 혼란을 줄 수 있다. 주석 갱신이 권고된다.

### 테스트 결과 (4차)

```
 12 pass
  0 fail
```

### 남은 문제

구조적 버그 없음. 위 의사코드 주석 불일치(코드 품질)만 잔존한다.
