# 퀵 정렬 (Quick Sort) 구현

## 문제 상세

정수 배열 `nums`가 주어집니다. 퀵 정렬(Quick Sort) 알고리즘을 사용하여 이 배열을 오름차순으로 정렬하고 반환하세요.

## 함수 인터페이스

```typescript
export function quickSort(nums: number[]): number[]
```

## 제약 조건

- $1 \le \text{nums.length} \le 50,000$
- $-50,000 \le \text{nums[i]} \le 50,000$

## 예시

### 예시 1

- **입력:** `nums = [5, 2, 3, 1]`
- **출력:** `[1, 2, 3, 5]`

### 예시 2

- **입력:** `nums = [5, 1, 1, 2, 0, 0]`
- **출력:** `[0, 0, 1, 1, 2, 5]`
