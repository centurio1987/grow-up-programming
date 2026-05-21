# 부분집합 순회 (Submask Enumeration)

## 함수 인터페이스

```ts
export function enumerateSubmasks(mask: number): number[];
```

## 제약 조건

- $0 \leq \text{mask} \leq 2^{20}$ (정수 비트마스크)

## 문제 상세

정수 비트마스크 $m$ 이 주어질 때, $m$ 의 모든 부분집합(서브마스크)을 열거한다.
즉, $s \subseteq m$ 인 모든 $s$ 를 (비트 단위 포함 관계로) 찾는다.

$s$ 가 $m$ 의 서브마스크라는 것은 $s$ 의 모든 비트가 $m$ 에서도 1로 켜져 있다는 의미이다. 즉,

$$s \,\&\, m = s$$

반환값은 $m$ 의 모든 서브마스크를 **내림차순** 으로 나열한 배열이며, 마지막 원소로 $s = 0$ 도 반드시 포함된다.

부분집합의 개수는 $m$ 의 세팅된 비트 수를 $k$ 라 할 때 $2^k$ 개이다.

## 예시

- $\text{enumerateSubmasks}(0\text{b}1011) = [11, 10, 9, 8, 3, 2, 1, 0]$
- $\text{enumerateSubmasks}(0) = [0]$
