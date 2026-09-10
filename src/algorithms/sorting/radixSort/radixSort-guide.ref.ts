/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/radixSort/radixSort.ts` 는 학습자가 채우는 자리라 가이드가 그
 * 파일을 인용하지 않는다. 여기 있는 것이 가이드가 가르치는 절차 — **자릿수 정렬**(LSD radix
 * sort)이다. 값을 `BASE` 진법의 자리 여럿으로 보고, **자리 하나를 키로 하는 안정 계수 정렬**을
 * **낮은 자리부터** 최댓값의 자릿수만큼 되풀이한다.
 *
 * 계약은 원본 문제와 같다 — 오름차순으로 정렬한 **새 배열**을 돌려주고 입력 `A` 는 바꾸지
 * 않는다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **변이는 이 소스에서 기계로 만든다**(`tools/check-proof.ts` 의 `loadMutant`). 배치 반복의
 * 머리줄이 변이 대상이라 모양을 바꿀 때 `radixSort-guide.proof.ts` 의 정규식도 함께 봐야
 * 한다 — 안 맞으면 변이가 0 줄이나 2 줄에 맞아 그 자리에서 실패한다.
 */

/**
 * 자리 하나가 담는 값의 가짓수. 값을 256 진법으로 본다 — 자리 하나가 한 바이트다.
 * 이 값이 커지면 바퀴 수가 줄고 `count` 의 칸 수가 는다.
 */
const BASE = 256;

/** `A` 를 오름차순으로 정렬한 **새 배열**을 돌려준다. `A` 자체는 바뀌지 않는다. */
export function radixSort(A: number[]): number[] {
  let src = [...A];
  let dst = new Array<number>(A.length).fill(0);

  // ① 최댓값이 바퀴 수를 정한다. 값이 큰 만큼만 자리를 본다.
  let max = 0;
  for (const x of src) if (x > max) max = x;

  // ② 자리를 낮은 쪽부터 하나씩 올린다. `place` 가 지금 보는 자리의 크기다.
  for (let place = 1; Math.floor(max / place) > 0; place *= BASE) {
    // ③ 이 자리의 값마다 몇 개인지 센다. 여기에 두 값을 견주는 자리가 없다.
    const count = new Array<number>(BASE).fill(0);
    for (const x of src) {
      const dig = Math.floor(x / place) % BASE;
      count[dig] = (count[dig] as number) + 1;
    }

    // ④ 누적합으로 덮는다. `count[dig]` 가 「자리 값이 `dig` 이하인 원소의 개수」가 된다.
    for (let dig = 1; dig < BASE; dig++) {
      count[dig] = (count[dig] as number) + (count[dig - 1] as number);
    }

    // ⑤ 뒤에서 앞으로 읽으며 놓는다. 이 방향이라야 같은 자리 값의 순서가 유지된다.
    for (let i = src.length - 1; i >= 0; i--) {
      const x = src[i] as number;
      const dig = Math.floor(x / place) % BASE;
      count[dig] = (count[dig] as number) - 1;
      dst[count[dig] as number] = x;
    }

    // ⑥ 두 배열의 역할을 맞바꾼다. 다음 바퀴가 방금 쓴 쪽을 읽는다.
    [src, dst] = [dst, src];
  }

  return src;
}
