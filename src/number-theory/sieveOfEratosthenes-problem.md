# 에라토스테네스의 체 (Sieve of Eratosthenes)

## 함수 인터페이스

```ts
export function sieveOfEratosthenes(n: number): number[];
```

## 제약 조건

- $n$ 은 음이 아닌 정수
- 시간 복잡도 $O(n \log \log n)$
- 알고리즘으로 **에라토스테네스의 체** 를 사용한다

## 문제 상세

$n$ 이하의 모든 소수를 **오름차순** 으로 담은 배열을 반환한다.

소수 정리에 의해 $n$ 이하의 소수는 약 $n / \ln n$ 개 존재한다.

$$\pi(n) \sim \frac{n}{\ln n}$$

엣지 케이스:

- $n < 2$ 이면 빈 배열 `[]` 을 반환한다.

## 예시

```ts
sieveOfEratosthenes(0);    // []
sieveOfEratosthenes(1);    // []
sieveOfEratosthenes(2);    // [2]
sieveOfEratosthenes(10);   // [2, 3, 5, 7]
sieveOfEratosthenes(20);   // [2, 3, 5, 7, 11, 13, 17, 19]
sieveOfEratosthenes(30);   // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```
