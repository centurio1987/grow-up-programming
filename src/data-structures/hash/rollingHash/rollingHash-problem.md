# RollingHash (롤링 해시 / Rabin-Karp)

## 한 줄 요약
> 슬라이딩 윈도우를 O(1)에 이동하며 해시를 재계산하는 기법으로, Rabin-Karp 패턴 매칭 알고리즘을 구현하라.

## 스토리

대규모 코드 호스팅 플랫폼에서 표절 감지 시스템을 구축하고 있다. 수백만 줄의 코드가 있고, 제출된 코드가 다른 제출물에서 복사된 부분이 있는지 확인해야 한다.

단순히 모든 부분 문자열 쌍을 비교하면 O(n²m) 시간이 걸린다. KMP 알고리즘은 단일 패턴 매칭을 O(n)에 처리하지만, 패턴이 수백 개라면 O(k·n)이 필요하다.

**롤링 해시**는 이 문제를 우아하게 해결한다. 텍스트 위를 슬라이딩 윈도우로 스캔할 때, 윈도우가 한 칸 이동할 때마다 해시를 처음부터 계산하지 않고 O(1)에 갱신한다. 패턴의 해시와 윈도우의 해시를 비교하여 같을 때만 문자열 비교를 수행하므로, 평균 O(n+m) 시간으로 패턴을 찾는다. 이것이 **Rabin-Karp 알고리즘**의 핵심이다.

실제로 Git의 `diff` 알고리즘, rsync의 델타 동기화, 대규모 텍스트 검색 시스템에서 이 원리가 활용된다.

## 함수 인터페이스

```ts
export class RollingHash {
  constructor(base: number = 31, mod: number = 1_000_000_007)
  hash(s: string): number                         // O(m)
  search(text: string, pattern: string): number[] // O(n + m) 평균
}
```

## 제약 조건

- 시간 제한: 1초, 메모리 제한: 256 MB
- 문자: ASCII 범위 내 임의 문자
- `search` 결과는 오름차순으로 정렬된 시작 인덱스 배열
- 해시값: `[0, mod)` 범위 내 정수
- 빈 패턴: 빈 배열 반환 허용

## 문제 상세

### 다항식 해시

문자열 `s[0..m-1]`의 해시를 다음과 같이 정의한다:

```
hash(s) = (s[0]*base^(m-1) + s[1]*base^(m-2) + ... + s[m-1]*base^0) mod mod
```

각 문자는 `charCodeAt(i)` 값을 사용한다.

### 롤링 해시 갱신

윈도우 `s[i..i+m-1]`에서 `s[i+1..i+m]`으로 이동할 때:

```
newHash = ((oldHash - s[i] * base^(m-1)) * base + s[i+m]) mod mod
```

`base^(m-1)` 값을 미리 계산해두면 각 이동에 O(1) 시간이 걸린다.

### 해시 충돌 처리

해시 충돌이 발생하면 false positive가 생긴다. 충돌 감지 후 실제 문자열 비교로 검증한다.

## 예시

```ts
const rh = new RollingHash(31, 1_000_000_007);

rh.hash("hello");  // 어떤 정수 (결정적, 같은 입력 → 같은 출력)
rh.hash("hello");  // 위와 동일한 값

rh.search("ababab", "ab");
// [0, 2, 4]  ("ab"가 인덱스 0, 2, 4에서 등장)

rh.search("banana", "ana");
// [1, 3]

rh.search("hello", "xyz");
// []

rh.search("aaaa", "aa");
// [0, 1, 2]  (중첩 포함)
```
