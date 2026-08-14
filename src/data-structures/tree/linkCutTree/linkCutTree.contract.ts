/**
 * `tree/linkCutTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./linkCutTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리를 받는데
 * 이 구조는 **마디 수를 생성자로 받는다.** 축1은 고정된 마디 수 하나에서 돌면 되지만 축3은
 * 크기 사다리를 오르므로, 껍데기가 `reset(n)` 으로 그 크기의 숲을 다시 세우고 버린 숲의
 * 비용을 이어서 센다. 껍데기는 계약의 일부가 아니고 `check-contract.ts` 의 명세↔스텁·정본
 * 대조에도 걸리지 않는다(그 대조가 보는 것은 `<name>.ts` 와 `_reference/<name>.ts` 다).
 *
 * **범위 밖 마디를 관측값으로 만든다.** 계약이 그 자리에 `RangeError` 를 적었는데 하네스는
 * 던진 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 그래서 양쪽을
 * 같은 방식으로 감싸 문자열 하나로 바꾼다 — 무작위 시퀀스는 범위 안에서만 인자를 뽑으므로
 * 이 감싸기가 걸리는 자리는 경계 케이스 하나뿐이다. `RangeError` 가 아닌 예외는 그대로
 * 올려보낸다(스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **n 은 생성자가 고정한 마디 수다.** 다른 T1 계약과 갈리는 자리다 — 저쪽의 n 은 담긴
 * 원소 수라 연산이 늘리고 줄이지만, 여기서는 구조가 사는 동안 바뀌지 않는다. 시나리오가
 * n 을 바꾸는 유일한 길이 `reset` 이고 그것은 준비 작업이라 걸음에 안 들어간다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **세 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface LinkCutTreeContract {
  link(u: number, v: number): boolean;
  cut(u: number, v: number): boolean;
  connected(u: number, v: number): boolean;
}

type Built = LinkCutTreeContract & { __cost?: number };

/** 축1이 도는 마디 수. 무작위 쌍이 실제 간선을 자주 맞도록 좁게 잡는다. */
const NODES = 16;

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe(call: () => boolean): boolean | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 하네스용 껍데기. `reset(n)` 으로 그 크기의 숲을 다시 세운다. */
export class Sized {
  readonly #make: (n: number) => Built;
  #impl: Built;
  #carried = 0;

  constructor(make: (n: number) => Built) {
    this.#make = make;
    this.#impl = make(NODES);
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  reset(n: number): void {
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = this.#make(n);
  }

  link(u: number, v: number): boolean {
    return this.#impl.link(u, v);
  }

  cut(u: number, v: number): boolean {
    return this.#impl.cut(u, v);
  }

  connected(u: number, v: number): boolean {
    return this.#impl.connected(u, v);
  }
}

/**
 * 축1 참조 모델. 간선 집합 하나이고 연결 판정은 매번 밟아 간다 — 축1은 의미만 보므로
 * 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다(`_contract/_fixtures/scanningForest.ts`).
 */
interface Model {
  edges: Set<string>;
}

function edgeKey(u: number, v: number): string {
  return u < v ? `${u}:${v}` : `${v}:${u}`;
}

function inRange(node: number): boolean {
  return Number.isInteger(node) && node >= 0 && node < NODES;
}

function modelReaches(model: Model, from: number, to: number): boolean {
  if (from === to) return true;
  const seen = new Set<number>([from]);
  const pending = [from];
  while (pending.length > 0) {
    const at = pending.pop() as number;
    for (let next = 0; next < NODES; next++) {
      if (!seen.has(next) && model.edges.has(edgeKey(at, next))) {
        if (next === to) return true;
        seen.add(next);
        pending.push(next);
      }
    }
  }
  return false;
}

function modelLink(model: Model, u: number, v: number): boolean | string {
  if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
  if (modelReaches(model, u, v)) return false;
  model.edges.add(edgeKey(u, v));
  return true;
}

function modelCut(model: Model, u: number, v: number): boolean | string {
  if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
  if (u === v) return false;
  const key = edgeKey(u, v);
  if (!model.edges.has(key)) return false;
  model.edges.delete(key);
  return true;
}

function modelConnected(model: Model, u: number, v: number): boolean | string {
  if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
  return modelReaches(model, u, v);
}

function pair(rng: () => number): [number, number] {
  return [Math.floor(rng() * NODES), Math.floor(rng() * NODES)];
}

/** 마디 `0`부터 `n-1`까지를 한 줄로 잇는다. 시나리오의 준비 작업이라 걸음에 안 든다. */
function chain(impl: Sized, n: number): void {
  for (let i = 0; i + 1 < n; i++) impl.link(i, i + 1);
}

export const linkCutTreeContract: ContractSpec<Sized, Model> = {
  name: "LinkCutTree",
  grade: "complexity",
  model: () => ({ edges: new Set<string>() }),

  ops: [
    {
      name: "link",
      arg: (rng) => pair(rng),
      onImpl: (impl, arg) => {
        const [u, v] = arg as [number, number];
        return observe(() => impl.link(u, v));
      },
      onModel: (model, arg) => {
        const [u, v] = arg as [number, number];
        return modelLink(model, u, v);
      },
    },
    {
      name: "cut",
      arg: (rng) => pair(rng),
      onImpl: (impl, arg) => {
        const [u, v] = arg as [number, number];
        return observe(() => impl.cut(u, v));
      },
      onModel: (model, arg) => {
        const [u, v] = arg as [number, number];
        return modelCut(model, u, v);
      },
    },
    {
      name: "connected",
      arg: (rng) => pair(rng),
      onImpl: (impl, arg) => {
        const [u, v] = arg as [number, number];
        return observe(() => impl.connected(u, v));
      },
      onModel: (model, arg) => {
        const [u, v] = arg as [number, number];
        return modelConnected(model, u, v);
      },
    },
  ],

  edges: [
    {
      name: "처음에는 서로 다른 마디가 아무도 연결돼 있지 않다",
      steps: [
        { op: "connected", arg: [0, 1] },
        { op: "connected", arg: [0, 0] },
        { op: "cut", arg: [0, 1] },
        { op: "connected", arg: [0, 1] },
      ],
    },
    {
      // 같은 쌍을 두 번 잇는 자리. 둘째 호출이 상태를 바꾸지 않는다는 것을 뒤의
      // `cut` 한 번으로 갈라놓아 확인한다 — 간선이 두 벌 들어갔다면 못 갈라진다.
      name: "같은 쌍을 두 번 이어도 간선은 하나다",
      steps: [
        { op: "link", arg: [0, 1] },
        { op: "connected", arg: [0, 1] },
        { op: "link", arg: [0, 1] },
        { op: "link", arg: [1, 0] },
        { op: "cut", arg: [0, 1] },
        { op: "connected", arg: [0, 1] },
      ],
    },
    {
      // 사이클을 만들지 않는다는 것이 계약의 내용이다. 세 번째 간선이 거절되고,
      // 거절된 뒤에도 앞의 둘이 그대로 살아 있다.
      name: "사이클을 닫는 간선은 들어가지 않는다",
      steps: [
        { op: "link", arg: [0, 1] },
        { op: "link", arg: [1, 2] },
        { op: "connected", arg: [0, 2] },
        { op: "link", arg: [0, 2] },
        { op: "link", arg: [2, 0] },
        { op: "cut", arg: [0, 1] },
        { op: "connected", arg: [0, 2] },
        { op: "connected", arg: [1, 2] },
      ],
    },
    {
      // 숲에서 간선 하나는 두 마디를 잇는 유일한 길이므로, 빼면 반드시 갈라진다.
      name: "가운데 간선을 빼면 나무가 둘로 갈린다",
      steps: [
        { op: "link", arg: [0, 1] },
        { op: "link", arg: [1, 2] },
        { op: "link", arg: [2, 3] },
        { op: "connected", arg: [0, 3] },
        { op: "cut", arg: [1, 2] },
        { op: "connected", arg: [0, 3] },
        { op: "connected", arg: [0, 1] },
        { op: "connected", arg: [2, 3] },
      ],
    },
    {
      // 붙어 있지 않은 두 마디를 빼려는 호출. 같은 나무 안이라 「연결됐는가」로는
      // 갈리지 않고, 간선이 있는가로만 갈린다.
      name: "같은 나무 안이라도 간선이 없으면 빼지 못한다",
      steps: [
        { op: "link", arg: [0, 1] },
        { op: "link", arg: [1, 2] },
        { op: "cut", arg: [0, 2] },
        { op: "connected", arg: [0, 2] },
        { op: "cut", arg: [1, 2] },
        { op: "connected", arg: [0, 2] },
        { op: "connected", arg: [0, 1] },
      ],
    },
    {
      name: "같은 마디를 두 인자로 주면 잇지도 빼지도 못하고, 연결은 참이다",
      steps: [
        { op: "connected", arg: [3, 3] },
        { op: "link", arg: [3, 3] },
        { op: "cut", arg: [3, 3] },
        { op: "connected", arg: [3, 3] },
        { op: "link", arg: [3, 4] },
        { op: "cut", arg: [4, 4] },
        { op: "connected", arg: [3, 4] },
      ],
    },
    {
      // 갈랐다가 다시 붙이기를 되풀이해도 상태가 새지 않는다. 뿌리를 옮기는 구현이
      // 방향을 흘리면 여기서 갈린다.
      name: "갈랐다 다시 붙여도 정상이다",
      steps: [
        { op: "link", arg: [0, 1] },
        { op: "link", arg: [1, 2] },
        { op: "cut", arg: [0, 1] },
        { op: "link", arg: [0, 2] },
        { op: "connected", arg: [0, 1] },
        { op: "cut", arg: [1, 2] },
        { op: "connected", arg: [0, 2] },
        { op: "connected", arg: [1, 2] },
        { op: "link", arg: [1, 0] },
        { op: "connected", arg: [1, 2] },
      ],
    },
    {
      // 계약의 주입 정책 마지막 줄. 하네스가 던진 것을 값으로 못 보므로 양쪽을 같은
      // 방식으로 감싸 관측값으로 만든다(파일 헤더 참고).
      name: "범위 밖 마디 번호는 세 연산 모두 RangeError 다",
      steps: [
        { op: "connected", arg: [0, NODES] },
        { op: "connected", arg: [-1, 0] },
        { op: "link", arg: [0, NODES] },
        { op: "cut", arg: [NODES, 0] },
        { op: "connected", arg: [0, 1] },
      ],
    },
  ],

  // 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다.
  invariants: [],

  scenarios: [
    {
      covers: ["link"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **한 줄로 잇기.** 균형을 스스로 잡지 않는 탐색 트리를 사슬로 만드는 그 입력이고,
      // 여기서도 담는 모양이 한 줄로 늘어선다.
      //
      // **길을 접는 구현에는 잇는 일 자체가 최선의 입력이다** — 방금 이은 자리가 이미
      // 길의 끝이라 다음 호출이 거기서 시작하고, 연산당 평균이 크기와 무관하게 12.0 으로
      // 고정된다(1024·4096·16384 에서 전부 같다). 적대성은 (계약, 구현) 쌍에 대해
      // 정의된다는 것의 실물이다(불변 사실 57).
      //
      // 무작위가 아니므로 이 행을 **결정적으로** 못 박는 자리이기도 하다. 셋 중
      // `ScanningForest` 를 가른다(연결 판정이 간선을 밟아 가므로 $r = 4.00$).
      //
      // **마지막 걸음이 고리를 닫는 호출이라 `false` 로 끝난다.** 상각 판정이 n 회 측정을
      // 요구하므로(§규약2) 걸음 수를 n 으로 맞추다가 그렇게 됐는데, 그 한 걸음이 사슬
      // 전체를 지나므로 **단일 호출 최대가 4,100 → 16,388 → 65,540 으로 네 배씩 자란다.**
      // 평균은 12.0 으로 고정인 채다 — 거절되는 호출도 상한 안에 있어야 한다는 것과,
      // 그 상한이 `worst` 가 아니라는 것을 한 시나리오가 함께 잰다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) {
          const next = (i + 1) % n;
          ctx.step(() => impl.link(i, next));
        }
      },
    },
    {
      covers: ["link"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위로 잇기.** 정본의 성장이 실제로 로그로 보이는 자리다(23.7 → 26.2 → 28.8,
      // $r$ = 1.11 · 1.10). 위 시나리오는 상수라 계급을 보여 주지 못한다.
      //
      // `UnsplayedForest` 를 가르는 유일한 `link` 시나리오다 — 뿌리를 세우려고 걸어
      // 올라간 길을 고쳐 쓰지 않으므로 깊이가 자란다($r$ = 1.35 · 1.70).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) {
          const [u, v] = [Math.floor(ctx.rng() * n), Math.floor(ctx.rng() * n)];
          ctx.step(() => impl.link(u, v));
        }
      },
    },
    {
      covers: ["connected"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **한 줄로 이어 두고 끝까지 차례로 묻기.** 이 계약이 `worst` 로 적혔다면 걸리는
      // 자리다 — 사슬인 채로 맞는 **첫 호출 하나**가 마디 수에 비례하고(단일 호출 최대가
      // 4,100 → 16,388 → 65,540 으로 정확히 네 배씩 자란다), 길을 접는 일이 곧바로 뒤를
      // 싸게 만들어 **시퀀스 평균은 20.3 → 20.4 → 20.4 로 움직이지 않는다.** 같은 실행이
      // 두 통계에 정반대 판정을 내는 것이 한정자를 `amortized` 로 적은 대가이자 이유다.
      //
      // 셋 중 둘을 가른다 — `ScanningForest`($r = 4.00$)와 `UnsplayedForest`($r = 3.99$).
      // 그리고 **정본의 변이 하나를 잡는 유일한 시나리오다**: 끌어올리기에서 부모를 먼저
      // 돌리는 대신 자신을 두 번 돌리게 바꾸면 답은 그대로인데 여기서 $r = 3.70$ 이 된다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        chain(impl, n);
        for (let i = 0; i < n; i++) ctx.step(() => impl.connected(i, n - 1));
      },
    },
    {
      covers: ["connected"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위 숲에서 무작위 쌍 묻기.** 위 시나리오가 상수인 자리에서 정본의 계급이
      // 보인다(45.1 → 52.8 → 59.9, $r$ = 1.17 · 1.13). 나무가 여럿이라 대부분의 물음이
      // 「아니다」이고, 그 답도 두 뿌리를 찾아야 나온다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) {
          impl.link(Math.floor(ctx.rng() * n), Math.floor(ctx.rng() * n));
        }
        for (let i = 0; i < n; i++) {
          const [u, v] = [Math.floor(ctx.rng() * n), Math.floor(ctx.rng() * n)];
          ctx.step(() => impl.connected(u, v));
        }
      },
    },
    {
      covers: ["cut"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **사슬 한가운데를 끊었다 다시 잇기.** `RelabelingForest` 를 가르는 **유일한**
      // 시나리오다 — 끊긴 쪽을 훑어 번호를 새로 적어야 하고, 반씩 갈리는 자리를
      // 되풀이하면 상각으로 갚을 수 없다($r = 3.99$). 넣기의 「작은 쪽만 다시 적는다」
      // 논증이 빼기로 넘어가지 못하는 자리가 이것이다.
      //
      // 다시 잇는 호출은 걸음에 넣지 않는다. 재려는 것이 빼기의 비용이기 때문이다.
      // 정본은 평균 11.5 로 고정이고 단일 호출 최대가 네 배씩 자란다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        chain(impl, n);
        const middle = n >> 1;
        for (let i = 0; i < n; i++) {
          ctx.step(() => impl.cut(middle, middle + 1));
          impl.link(middle, middle + 1);
        }
      },
    },
    {
      covers: ["cut"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위 숲에서 무작위 쌍 빼기.** 대부분이 간선이 아니라 `false` 로 끝나는데,
      // 그 답도 두 마디를 같은 길에 올려놓아야 나온다. 정본의 계급이 `cut` 행에서
      // 보이는 유일한 자리다(35.8 → 42.3 → 49.9, $r$ = 1.18 · 1.18).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) {
          impl.link(Math.floor(ctx.rng() * n), Math.floor(ctx.rng() * n));
        }
        for (let i = 0; i < n; i++) {
          const [u, v] = [Math.floor(ctx.rng() * n), Math.floor(ctx.rng() * n)];
          ctx.step(() => impl.cut(u, v));
        }
      },
    },
  ],
};
