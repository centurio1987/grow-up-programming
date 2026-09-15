/**
 * `probabilistic/minHash` 정본(규약2).
 *
 * 계약은 `../minHash.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 지키는 구현 **하나**이고 계약이 허용하는
 * 유일한 구현이 아니다.
 *
 * **이 정본은 해시 함수 k 개마다 들어온 원소의 가장 작은 해시 값 하나를 든다(서명).** 두 인스턴스의 닮음은 서명
 * 칸 k 개 중 값이 같은 칸의 몫이다. 해시 함수 하나에서 두 집합의 가장 작은 값이 같을 확률이 자카드 닮음
 * J = |A ∩ B| / |A ∪ B| 라는 것(두 집합의 합집합에서 가장 작은 값을 가진 원소가 교집합에 있을 확률)이 이 기법의
 * 근거다 — 해시 함수가 원소를 고르게 · 서로 독립에 가깝게 줄 세운다는 가정 위에 서 있다.
 *
 * **k 는 계약이 아니라 이 정본의 선택이다.** 헤더의 두 매개변수(닮음 오차 ε · 실패 확률 δ)에서 이렇게 고른다.
 *
 * - k = ⌈ln(2/δ) / (2ε²)⌉. 칸마다 같을 사건이 서로 독립인 확률 J 의 사건이면 호에프딩 부등식으로 몫이 J 에서
 *   ε 넘게 벗어날 확률이 2·e^{−2kε²} ≤ δ 다. **이것은 해시 가정 위의 논증이고**, 실패 몫이 δ 아래라는 것은
 *   실측이다 — `docs/ORD-006-conventions.md` 「A군 닮음 추정」.
 * - 헤더의 상한은 이보다 큰 크기(1/(ε² · δ))를 허용한다. 이 정본은 그 안에 든다(ln(2/δ) ≤ 2/δ).
 * - ε · δ 가 아주 작으면 k 가 언어의 typed array 한도를 넘어 생성자가 언어의 `RangeError` 를 던진다 — 이 정본이
 *   세우지 못하는 매개변수이고 스위트는 그 자리에 가지 않는다(불변 사실 370 과 같은 자리).
 *
 * **해시의 무작위를 인스턴스가 아니라 실행이 뽑는다 — 계약의 결정적 쪽이 요구한다.** 헤더는 같은 실행 안에서 같은
 * 매개변수로 **따로 세운** 두 인스턴스에 같은 집합이 들어가면 닮음이 1 이기를 요구한다. 인스턴스마다 해시를 따로
 * 뽑으면 같은 원소가 두 인스턴스에서 다른 값으로 가 서명이 같지 않다(실행으로 확인 —
 * `src/data-structures/_contract/_fixtures/perInstanceSeedMinHash.ts`). 그래서 줄 둘의 시작값 · 곱수를 이 모듈이
 * 처음 읽힐 때 한 번 뽑고, 해시 함수마다의 섞는 값 둘은 처음 필요해질 때 뽑아 실행이 끝날 때까지 늘려 쓴다
 * (`Math.random`). 해시를 고정하지 않는 이유는 블룸 필터 정본과 같다 — 고정하면 그 해시에 대해 서명이 몰리는 두
 * 집합이 실재하고, 그 두 집합을 미리 고른 호출자에게 실패 확률이 1 이다. 이 정본의 닮음은 **실행마다 다르다** —
 * 주석 · 문서에 절대 수치로 적지 않는다(「무작위를 쓰는 정본과 재현성」 규칙 3).
 *
 * 문자열 하나를 줄 둘로 32비트 값 둘(a, b)로 접는다. 줄은 글자마다 `(h ⊕ c) × M` 을 돌리고(M 은 뽑은 무작위
 * 홀수) 끝에 길이를 섞어 한 번 더 섞는다. 해시 함수 i 의 값은 `finish(finish(a ⊕ X_i) ⊕ b ⊕ Y_i)` 다(X_i · Y_i 는
 * 뽑은 무작위). 서로 다른 두 원소가 두 줄에서 모두 겹치면 어느 해시 함수로도 못 가르지만 그 몫은 2^−64 안팎이다.
 * 이 조합이 원소를 서로 독립에 가깝게 줄 세운다는 것은 **증명이 아니라 실측이다.**
 *
 * **들어온 원소가 없는지를 따로 든다.** 서명 칸의 처음 값 2^32 − 1 은 실제 해시 값과도 겹칠 수 있어, 빈 인스턴스와
 * 모든 칸이 그 값인 인스턴스를 칸만으로 가르지 못한다. 두 쪽이 다 비었으면 1, 한쪽만 비었으면 0 을 돌려준다 — 앞은
 * 헤더의 결정적 문장(같은 집합이면 1)이고, 뒤는 이 정본의 선택이다(계약은 확률 문장으로만 누른다).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"지나간 수"* 다(§규약2 계측 단위) — 줄 하나가 원소 문자열의 글자 하나를
 * 지나갈 때마다 1, 서명 칸 하나에 닿을 때마다 1 이고 읽기와 쓰기를 따로 세지 않는다. `add` 는 글자 수 × 2 + k,
 * `similarity` 는 k(한쪽이라도 비었으면 1)다. 생성자는 k + 1 을 한 번에 더한다 — 축3이 생성자 행을 재지 않는다.
 * 매개변수가 달라 던지는 `similarity` 는 세지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **서명을 `Uint32Array` 에 둔다.** 이 구조는 메모리 직접 사용 목록의 후보가 아니지만(`docs/ORD-006-conventions.md`
 * 「A군 17종 판정」 처분표 끝), 확률 네 구조와 같은 모양으로 상태를 고정 폭 typed array 에 둔다.
 */

// #region guide:core
/** 서명 칸의 처음 값. 어떤 해시 값보다 작지 않다. */
const EMPTY_SLOT = 0xffff_ffff;

/** 줄 둘의 시작값과 곱수. 이 모듈이 처음 읽힐 때 한 번 뽑는다 — 머리말 참고. */
const STARTS = Uint32Array.of(randomWord(), randomWord());
const MULTS = Uint32Array.of(randomWord() | 1, randomWord() | 1);

/** 해시 함수마다의 섞는 값. 처음 필요해질 때 뽑고 실행 내내 늘려 쓴다 — 머리말 참고. */
let mixX = new Uint32Array(0);
let mixY = new Uint32Array(0);

export class MinHash {
  /** 해시 함수 i 에서 들어온 원소의 가장 작은 값. */
  readonly #signature: Uint32Array;
  readonly #epsilon: number;
  readonly #delta: number;
  /** 들어온 원소가 하나라도 있는가. */
  #filled = false;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) {
      throw new RangeError(
        `닮음 오차 ε 는 0 과 1 사이여야 한다 — 받은 값은 ${epsilon} 이다`,
      );
    }
    if (!(delta > 0 && delta < 1)) {
      throw new RangeError(
        `실패 확률 δ 는 0 과 1 사이여야 한다 — 받은 값은 ${delta} 이다`,
      );
    }
    this.#epsilon = epsilon;
    this.#delta = delta;
    const k = Math.ceil(Math.log(2 / delta) / (2 * epsilon * epsilon));
    ensureMixes(k);
    this.#signature = new Uint32Array(k).fill(EMPTY_SLOT);
    this.__cost += k + 1;
  }

  add(item: string): void {
    const a = fold(0, item);
    const b = fold(1, item);
    const signature = this.#signature;
    for (let i = 0; i < signature.length; i++) {
      const value = finish(
        finish(a ^ (mixX[i] as number)) ^ b ^ (mixY[i] as number),
      );
      if (value < (signature[i] as number)) signature[i] = value;
    }
    this.#filled = true;
    this.__cost += item.length * 2 + signature.length;
  }

  similarity(other: MinHash): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta) {
      throw new RangeError(
        `매개변수가 다른 인스턴스는 견주지 않는다 — (${this.#epsilon}, ${this.#delta}) 와 (${other.#epsilon}, ${other.#delta})`,
      );
    }
    if (!this.#filled || !other.#filled) {
      this.__cost += 1;
      return this.#filled === other.#filled ? 1 : 0;
    }
    const mine = this.#signature;
    const theirs = other.#signature;
    let same = 0;
    for (let i = 0; i < mine.length; i++) {
      if (mine[i] === theirs[i]) same++;
    }
    this.__cost += mine.length;
    return same / mine.length;
  }
}

/** 해시 함수 k 개의 섞는 값이 있게 한다. 이미 뽑은 값은 그대로 둔다. */
function ensureMixes(k: number): void {
  if (mixX.length >= k) return;
  const nextX = new Uint32Array(k);
  const nextY = new Uint32Array(k);
  nextX.set(mixX);
  nextY.set(mixY);
  for (let i = mixX.length; i < k; i++) {
    nextX[i] = randomWord();
    nextY[i] = randomWord();
  }
  mixX = nextX;
  mixY = nextY;
}

/** 줄 `line` 으로 문자열을 32비트 값 하나로 접는다. 부호 없는 값을 돌려준다. */
function fold(line: number, item: string): number {
  const mult = MULTS[line] as number;
  let h = STARTS[line] as number;
  for (let i = 0; i < item.length; i++)
    h = Math.imul(h ^ item.charCodeAt(i), mult);
  return finish(h ^ item.length);
}

/** 32비트 무작위 값 하나. */
function randomWord(): number {
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

/**
 * 32비트 값을 한 번 섞는다. 곱셈 두 번 사이마다 위쪽 비트를 아래로 접는다 — murmur3 계열의 마무리 섞기에서
 * 가져온 상수이고 유도한 값이 아니다. 부호 없는 값을 돌려준다.
 */
function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
// #endregion
