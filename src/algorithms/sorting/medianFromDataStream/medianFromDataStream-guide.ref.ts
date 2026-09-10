/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/medianFromDataStream/medianFromDataStream.ts` 는 학습자
 * 스텁이라 절차가 없다. 여기가 그 자리를 채우는 정본이고, 가이드 본문의 코드는 이 파일에서
 * 옮긴다.
 *
 * 절차는 하나다 — 지금까지 들어온 수를 **작은 쪽 절반과 큰 쪽 절반으로 갈라** 두 힙에 담고,
 * 작은 쪽은 최댓값이, 큰 쪽은 최솟값이 꼭대기에 오게 한다. 그 두 꼭대기가 정렬된 수열의
 * 가운데 자리이므로 중앙값은 힙 꼭대기를 읽는 것으로 끝난다.
 *
 * **힙 클래스를 하나만 둔다.** `sign` 이 방향을 정한다 — `+1` 이면 작은 값이 꼭대기(최소
 * 힙), `-1` 이면 큰 값이 꼭대기(최대 힙)다. 두 클래스를 따로 쓰면 견주는 줄이 두 곳으로
 * 갈리고, 「멈춤」이 방향 하나를 바꿔 보이는 자리에서 무엇이 바뀌었는지가 흐려진다.
 *
 * **계수를 세거나 힙 배열을 들여다보는 자리는 여기 두지 않는다.** 그런 사본은
 * `medianFromDataStream-guide.proof.ts` 가 따로 갖는다 — 이 파일은 가이드가 싣는 코드와
 * 글자 그대로 같아야 한다.
 */

/**
 * 이진 힙 하나. 배열로 완전 이진 트리를 담고, 자리 `i` 의 두 자식은 `2i+1`·`2i+2`,
 * 부모는 `(i-1)/2` 의 몫이다.
 */
export class Heap {
  private items: number[] = [];

  /** `+1` 이면 최소 힙, `-1` 이면 최대 힙이다. */
  constructor(private readonly sign: number) {}

  size(): number {
    return this.items.length;
  }

  /** 꼭대기 값. 빈 힙에서는 부르지 않는다. */
  peek(): number {
    return this.items[0] as number;
  }

  push(value: number): void {
    this.items.push(value);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.prior(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  /** 꼭대기를 빼고 돌려준다. 빈 힙에서는 부르지 않는다. */
  pop(): number {
    const top = this.items[0] as number;
    const last = this.items.pop() as number;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let best = i;
        if (left < this.items.length && this.prior(left, best)) best = left;
        if (right < this.items.length && this.prior(right, best)) best = right;
        if (best === i) break;
        this.swap(i, best);
        i = best;
      }
    }
    return top;
  }

  /** 자리 `a` 의 값이 자리 `b` 의 값보다 꼭대기에 가까운가. 방향은 `sign` 이 정한다. */
  private prior(a: number, b: number): boolean {
    return (
      this.sign * ((this.items[a] as number) - (this.items[b] as number)) < 0
    );
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as number;
    this.items[a] = this.items[b] as number;
    this.items[b] = t;
  }
}

/**
 * 스트림으로 들어오는 정수의 중앙값을 언제든 답하는 자료구조.
 *
 * `findMedian` 은 `addNum` 이 한 번은 불린 뒤에만 부른다(문제의 제약).
 */
export class MedianFinder {
  /** 작은 쪽 절반. 최대 힙이라 꼭대기가 그 절반의 최댓값이다. */
  private readonly low = new Heap(-1);
  /** 큰 쪽 절반. 최소 힙이라 꼭대기가 그 절반의 최솟값이다. */
  private readonly high = new Heap(1);

  addNum(num: number): void {
    // ① 값이 어느 쪽에 속하는지 견주지 않고 작은 쪽에 먼저 넣는다.
    this.low.push(num);

    // ② 작은 쪽의 최댓값을 큰 쪽으로 옮긴다 — 두 절반의 경계가 이 줄에서 맞춰진다.
    this.high.push(this.low.pop());

    // ③ 큰 쪽이 더 많아졌으면 최솟값 하나를 작은 쪽으로 도로 옮긴다.
    if (this.high.size() > this.low.size()) {
      this.low.push(this.high.pop());
    }
  }

  findMedian(): number {
    // ④ 개수가 같으면 두 꼭대기의 평균, 다르면 작은 쪽 꼭대기 하나가 답이다.
    if (this.low.size() === this.high.size()) {
      return (this.low.peek() + this.high.peek()) / 2;
    }
    return this.low.peek();
  }
}
