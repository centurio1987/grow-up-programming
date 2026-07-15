// E3 자기검증용 스크래치 — 가이드 본문에 실을 코드를 그대로 옮겨 실행 검증한다.

// ── 원형(brute force) ─────────────────────────────────────────────
function bruteNextGreater(arr: number[]): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (arr[j]! > arr[i]!) {
        result[i] = j;
        break;
      }
    }
  }
  return result;
}

// ── 개선: 단조 스택으로 nextGreater만 ───────────────────────────
function stackNextGreater(arr: number[]): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  for (let j = 0; j < n; j++) {
    while (stack.length > 0 && arr[stack[stack.length - 1]!]! < arr[j]!) {
      result[stack.pop()!] = j;
    }
    stack.push(j);
  }
  return result;
}

// ── 최종: 세 메서드를 갖춘 MonotonicStack 클래스 ──────────────────
class MonotonicStack {
  nextGreater(arr: number[]): number[] {
    const n = arr.length;
    const result = new Array<number>(n).fill(-1);
    const stack: number[] = []; // 인덱스 저장, 값 기준 단조 감소(비증가)

    for (let j = 0; j < n; j++) {
      while (stack.length > 0 && arr[stack[stack.length - 1]!]! < arr[j]!) {
        const i = stack.pop()!;
        result[i] = j;
      }
      stack.push(j);
    }
    return result;
  }

  prevGreater(arr: number[]): number[] {
    const n = arr.length;
    const result = new Array<number>(n).fill(-1);
    const stack: number[] = []; // 인덱스 저장, 값 기준 단조 감소(비증가)

    for (let i = 0; i < n; i++) {
      while (stack.length > 0 && arr[stack[stack.length - 1]!]! <= arr[i]!) {
        stack.pop();
      }
      result[i] = stack.length > 0 ? stack[stack.length - 1]! : -1;
      stack.push(i);
    }
    return result;
  }

  nextSmaller(arr: number[]): number[] {
    const n = arr.length;
    const result = new Array<number>(n).fill(-1);
    const stack: number[] = []; // 인덱스 저장, 값 기준 단조 증가(비감소)

    for (let j = 0; j < n; j++) {
      while (stack.length > 0 && arr[stack[stack.length - 1]!]! > arr[j]!) {
        const i = stack.pop()!;
        result[i] = j;
      }
      stack.push(j);
    }
    return result;
  }
}

// ── 함정 데모: pop 조건을 `<` 대신 `<=`로 잘못 쓰면? (D6 근거) ──────
function buggyNextGreaterNonStrict(arr: number[]): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  for (let j = 0; j < n; j++) {
    while (stack.length > 0 && arr[stack[stack.length - 1]!]! <= arr[j]!) {
      // 잘못: <= 는 "같아도 pop" → 동일값을 "더 크다"로 오판
      const i = stack.pop()!;
      result[i] = j;
    }
    stack.push(j);
  }
  return result;
}

const ms = new MonotonicStack();

console.log("=== 대표 예시: arr = [2, 1, 2, 4, 3] ===");
console.log("nextGreater:", JSON.stringify(ms.nextGreater([2, 1, 2, 4, 3])));
console.log("prevGreater:", JSON.stringify(ms.prevGreater([2, 1, 2, 4, 3])));
console.log("brute vs stack nextGreater 일치:",
  JSON.stringify(bruteNextGreater([2, 1, 2, 4, 3])) === JSON.stringify(stackNextGreater([2, 1, 2, 4, 3])));

console.log("\n=== nextSmaller 예시: arr = [3, 1, 2, 4, 0] ===");
console.log("nextSmaller:", JSON.stringify(ms.nextSmaller([3, 1, 2, 4, 0])));

console.log("\n=== 주식 시나리오: arr = [73,74,75,71,69,72,76,73] ===");
console.log("nextGreater:", JSON.stringify(ms.nextGreater([73, 74, 75, 71, 69, 72, 76, 73])));

console.log("\n=== 엣지 케이스 ===");
console.log("빈 배열 nextGreater([]):", JSON.stringify(ms.nextGreater([])));
console.log("단일 원소 nextGreater([5]):", JSON.stringify(ms.nextGreater([5])));
console.log("동일값 nextGreater([4,4,4]):", JSON.stringify(ms.nextGreater([4, 4, 4])));
console.log("동일값 prevGreater([4,4,4]):", JSON.stringify(ms.prevGreater([4, 4, 4])));
console.log("음수 포함 nextGreater([-1,-3,-2,0]):", JSON.stringify(ms.nextGreater([-1, -3, -2, 0])));

console.log("\n=== 함정 데모: <= 로 pop하면 (arr = [2,1,2,4,3]) ===");
console.log("정상(strict <):", JSON.stringify(ms.nextGreater([2, 1, 2, 4, 3])));
console.log("버그(non-strict <=):", JSON.stringify(buggyNextGreaterNonStrict([2, 1, 2, 4, 3])));

// ── 함정 데모 2: prevGreater에서 pop 조건을 <=가 아니라 <로 잘못 쓰면? ──
function buggyPrevGreaterStrict(arr: number[]): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && arr[stack[stack.length - 1]!]! < arr[i]!) {
      // 잘못: < 는 "같으면 안 pop" → 동일값을 "이전 더 큰 원소"로 오판
      stack.pop();
    }
    result[i] = stack.length > 0 ? stack[stack.length - 1]! : -1;
    stack.push(i);
  }
  return result;
}
console.log("\n=== 함정 데모: prevGreater에서 <로 pop하면 (arr = [4,4,4]) ===");
console.log("정상(<=):", JSON.stringify(ms.prevGreater([4, 4, 4])));
console.log("버그(<):", JSON.stringify(buggyPrevGreaterStrict([4, 4, 4])));

console.log("\n=== 교차검증: 무작위 100개, brute vs stack(nextGreater) ===");
function bruteGeneric(arr: number[], cmp: "greater" | "smaller"): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (cmp === "greater" ? arr[j]! > arr[i]! : arr[j]! < arr[i]!) {
        result[i] = j;
        break;
      }
    }
  }
  return result;
}
function brutePrevGreater(arr: number[]): number[] {
  const n = arr.length;
  const result = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (arr[j]! > arr[i]!) {
        result[i] = j;
        break;
      }
    }
  }
  return result;
}

let mismatches = 0;
for (let t = 0; t < 100; t++) {
  const len = Math.floor(Math.random() * 12);
  const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 7) - 3);
  const ng1 = JSON.stringify(ms.nextGreater(arr));
  const ng2 = JSON.stringify(bruteGeneric(arr, "greater"));
  const pg1 = JSON.stringify(ms.prevGreater(arr));
  const pg2 = JSON.stringify(brutePrevGreater(arr));
  const ns1 = JSON.stringify(ms.nextSmaller(arr));
  const ns2 = JSON.stringify(bruteGeneric(arr, "smaller"));
  if (ng1 !== ng2 || pg1 !== pg2 || ns1 !== ns2) {
    mismatches++;
    console.log("MISMATCH", arr, { ng1, ng2, pg1, pg2, ns1, ns2 });
  }
}
console.log(`무작위 100케이스 중 불일치: ${mismatches}건`);
