/**
 * `tree/treap` 계약 스위트(규약2).
 *
 * 계약은 `./treap.ts` 헤더 한 곳이다(규약1). 여기 있는 것은 그것을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`. 적대적 입력이 필수이고
 * 허용치가 ±30% 다.
 *
 * **`expected` 시나리오는 seed 다섯을 돌고 통계는 seed 별 평균의 중앙값이다**
 * (`_contract/judge.ts` 의 `SEEDS`·`statistic`). 그 seed 가 정하는 것은 **시나리오가 만드는
 * 입력**이지 구현 안의 무작위성이 아니다 — 하네스는 구현 내부를 흔들지 못한다. 그래서
 * 적대적 입력(오름차순)처럼 `ctx.rng` 를 쓰지 않는 시나리오는 다섯 seed 가 같은 값을 낸다.
 * **그 시나리오가 이 계약에서 가장 중요한 자리다**(§규약2 「기댓값이 무엇에 대한 것인가」):
 * 계약이 「구현이 만드는 무작위성에 대한 기댓값」을 말하므로, 입력을 고정해 놓고도 기대가
 * 걸려 있는지를 그 자리가 본다.
 *
 * **정본의 우선순위 배분을 역산해 만든 입력은 시나리오로 두지 않는다**(불변 사실 44).
 * 그런 입력은 계약이 아니라 그 구현 하나를 겨누므로, 같은 계약을 지키는 다른 구현을
 * 통과시키지 못한다. B11 이 `tree/multiset` 에서 실제로 그런 입력을 만들었고 넣지 않았다.
 *
 * **이 스위트가 통과시키는 것 중에 계약 위반이 있다 — 그 사실을 여기 적는다**(불변 사실 62).
 * `_contract/_fixtures/splayingSearchTree.ts` 는 여덟 시나리오를 **전부 통과하는데 이 계약을
 * 어긴다.** 사슬인 채로 맞는 첫 조회 하나가 원소 수에 비례하고 그 구현은 결정론적이라 그
 * 값이 곧 기댓값인데, 축3의 `expected` 통계가 **시퀀스 평균**이라 그 하나가 묻힌다. 왜 고칠
 * 수 없는지는 `./treap.ts` 헤더에 있다. **다음 배치가 이 통과를 「계약을 지킨다」로 읽지
 * 않도록** 아래 자기시험(`_contract/runContract.test.ts`)에 이름으로 적어 두었다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표를 그대로 옮긴 표면. */
export interface TreapContract<T> {
  insert(item: T): void;
  delete(item: T): boolean;
  has(item: T): boolean;
  min(): T | null;
  max(): T | null;
  range(low: T, high: T): T[];
  size(): number;
  toArray(): T[];
}

/**
 * 축1 참조 모델. 정렬된 중복 없는 배열이다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 *
 * 같은 정렬 배열이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/sortedArraySet.ts`). 기댓값으로 재도 걸린다 — 무작위 위치에 넣으면
 * 평균 n/2 개가 밀리므로 기대 비용이 그대로 n 에 비례한다.
 */
type Model = number[];

/** 이미 담긴 값을 다시 넣는 일과 없는 값을 지우는 일이 자주 나오도록 좁게 잡는다. */
const DOMAIN = 24;

function insertSorted(model: Model, item: number): void {
  let at = 0;
  while (at < model.length && (model[at] as number) < item) at++;
  if (at < model.length && model[at] === item) return;
  model.splice(at, 0, item);
}

export const treapContract: ContractSpec<TreapContract<number>, Model> = {
  name: "Treap",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "insert",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => {
        impl.insert(arg as number);
      },
      onModel: (model, arg) => {
        insertSorted(model, arg as number);
      },
    },
    {
      name: "delete",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.delete(arg as number),
      onModel: (model, arg) => {
        const at = model.indexOf(arg as number);
        if (at < 0) return false;
        model.splice(at, 1);
        return true;
      },
    },
    {
      name: "has",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => impl.has(arg as number),
      onModel: (model, arg) => model.includes(arg as number),
    },
    {
      name: "min",
      arg: () => undefined,
      onImpl: (impl) => impl.min(),
      onModel: (model) => (model.length === 0 ? null : (model[0] as number)),
    },
    {
      name: "max",
      arg: () => undefined,
      onImpl: (impl) => impl.max(),
      onModel: (model) =>
        model.length === 0 ? null : (model[model.length - 1] as number),
    },
    {
      name: "range",
      arg: (rng) => {
        const low = Math.floor(rng() * DOMAIN);
        return [low, low + Math.floor(rng() * 6)];
      },
      onImpl: (impl, arg) => {
        const [low, high] = arg as [number, number];
        return impl.range(low, high);
      },
      onModel: (model, arg) => {
        const [low, high] = arg as [number, number];
        return model.filter((v) => v >= low && v <= high);
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
    {
      name: "toArray",
      arg: () => undefined,
      onImpl: (impl) => impl.toArray(),
      onModel: (model) => [...model],
    },
  ],

  edges: [
    {
      name: "빈 집합의 조회는 전부 비어 있음을 말하고 상태를 바꾸지 않는다",
      steps: [
        { op: "has", arg: 1 },
        { op: "min" },
        { op: "max" },
        { op: "range", arg: [0, 100] },
        { op: "size" },
        { op: "toArray" },
        { op: "delete", arg: 1 },
        { op: "size" },
      ],
    },
    {
      // 유일성은 `toArray()` 하나로만 읽히므로 불변식이 아니라 축1의 몫이다.
      //
      // **갈랐다 다시 잇는 구현이 이 자리에서 걸린다.** 이미 있는 값을 다시 넣을 때
      // 트리를 세 조각으로 가르고 되잇는 설계가 정당한데, 되이을 때 원소를 흘리거나
      // 한 벌 더 만들면 여기서 드러난다.
      name: "같은 값을 여러 번 넣어도 한 벌만 담긴다",
      steps: [
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 5 },
        { op: "size" },
        { op: "toArray" },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "size" },
      ],
    },
    {
      name: "없는 값을 찾거나 지워도 상태가 그대로다",
      steps: [
        { op: "insert", arg: 2 },
        { op: "insert", arg: 4 },
        { op: "has", arg: 3 },
        { op: "toArray" },
        { op: "delete", arg: 3 },
        { op: "toArray" },
        { op: "size" },
        { op: "delete", arg: 4 },
        { op: "toArray" },
      ],
    },
    {
      name: "넣은 순서와 무관하게 비내림차순으로 늘어놓는다",
      steps: [
        { op: "insert", arg: 9 },
        { op: "insert", arg: 1 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 7 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      // 같은 집합을 서로 다른 차례로 지어도 관측이 같아야 한다. 넣은 차례가 모양을
      // 정하는 구현은 여기서 갈리지 않지만, 차례에 따라 **원소가 달라지는** 구현은
      // 걸린다.
      name: "넣는 차례가 달라도 같은 집합이 된다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 4 },
        { op: "toArray" },
        { op: "delete", arg: 1 },
        { op: "delete", arg: 2 },
        { op: "delete", arg: 3 },
        { op: "delete", arg: 4 },
        { op: "insert", arg: 4 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 1 },
        { op: "toArray" },
        { op: "size" },
      ],
    },
    {
      name: "구간은 양 끝을 포함하고, low > high 면 빈 배열이다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 7 },
        { op: "range", arg: [3, 5] },
        { op: "range", arg: [2, 6] },
        { op: "range", arg: [5, 3] },
        { op: "range", arg: [8, 9] },
      ],
    },
    {
      // 두 자식이 다 있는 자리를 지우는 길과 뿌리를 지우는 길을 함께 짚는다.
      name: "가운데를 지우고 다시 채워도 순서가 어긋나지 않는다",
      steps: [
        { op: "insert", arg: 4 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 6 },
        { op: "insert", arg: 1 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 7 },
        { op: "delete", arg: 4 },
        { op: "toArray" },
        { op: "delete", arg: 2 },
        { op: "insert", arg: 4 },
        { op: "toArray" },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "전부 지웠다가 다시 채워도 정상이다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "delete", arg: 1 },
        { op: "delete", arg: 2 },
        { op: "size" },
        { op: "min" },
        { op: "insert", arg: 8 },
        { op: "min" },
        { op: "max" },
        { op: "toArray" },
      ],
    },
  ],

  // 헤더 불변식 절의 넷. 나란한 둘의 넷과 같다 — 한정자는 비용의 성질이라 상태의 성질을
  // 건드리지 않는다.
  invariants: [
    {
      name: "toArray().length 와 size() 가 같다",
      check: (impl) => {
        const listed = impl.toArray().length;
        const counted = impl.size();
        return listed === counted
          ? null
          : `toArray().length=${listed} 인데 size()=${counted} 다`;
      },
    },
    {
      name: "has 는 toArray 에 그 값이 있는가와 같다",
      check: (impl) => {
        const listed = impl.toArray();
        for (let probe = -1; probe <= DOMAIN; probe++) {
          const said = impl.has(probe);
          const actual = listed.includes(probe);
          if (said !== actual)
            return `has(${probe})=${said} 인데 toArray 에는 ${actual} 다`;
        }
        return null;
      },
    },
    {
      name: "min·max 는 toArray 의 양 끝과 같다",
      check: (impl) => {
        const listed = impl.toArray();
        const low = listed.length === 0 ? null : (listed[0] as number);
        const high =
          listed.length === 0 ? null : (listed[listed.length - 1] as number);
        if (impl.min() !== low)
          return `min()=${impl.min()} 인데 첫 원소는 ${low} 다`;
        if (impl.max() !== high)
          return `max()=${impl.max()} 인데 마지막 원소는 ${high} 다`;
        return null;
      },
    },
    {
      name: "range 는 toArray 를 그 구간으로 자른 것과 같다",
      check: (impl) => {
        const listed = impl.toArray();
        for (let low = 0; low < DOMAIN; low += 5) {
          const high = low + 4;
          const said = impl.range(low, high);
          const actual = listed.filter((v) => v >= low && v <= high);
          if (
            said.length !== actual.length ||
            said.some((v, i) => v !== actual[i])
          )
            return `range(${low}, ${high})=[${said}] 인데 잘라 낸 것은 [${actual}] 다`;
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["insert"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      // **오름차순 넣기. 이 계약에서 가장 중요한 시나리오다.**
      //
      // `ctx.rng` 를 쓰지 않으므로 seed 다섯이 같은 값을 낸다 — 입력이 완전히 고정된
      // 자리에서 기대가 걸려 있는지를 본다. 계약이 「입력 분포에 대한 기댓값」을 말하는
      // 것이었다면 이 시나리오는 성립하지 않는다(입력이 하나뿐이라 분포가 없다).
      // 여기서 통과하려면 구현이 **자기 안에서** 치우침을 없애야 한다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(i));
      },
    },
    {
      covers: ["insert"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      // 무작위 넣기. 정렬 배열 구현이 매번 뒤쪽을 미는 입력이다 — 오름차순에서는
      // 뒤에 붙이기만 하면 되므로 통과한다(불변 사실 57).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n * 4);
          ctx.step(() => impl.insert(value));
        }
      },
    },
    {
      covers: ["has", "min", "max"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순으로 채우고 오름차순으로 조회한다. 균형을 스스로 잡지 않는 트리는
      // 준비 단계에서 이미 사슬이고, 그 상태의 조회가 원소 수에 비례한다.
      //
      // 걸음 하나는 `has`·`min`·`max` 세 호출을 함께 감싼 것이다. 세 행이 같은
      // 내려가기 한 번이라 갈라 잴 이유가 없다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.has(i);
            impl.min();
            impl.max();
          });
        }
      },
    },
    {
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      // 오름차순으로 채우고 오름차순으로 지운다. 늘 최솟값을 빼므로 한쪽으로 치우친
      // 구현이 그 자리에서 드러나고, 정렬 배열은 앞을 빼면서 뒤를 전부 당긴다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.delete(i));
      },
    },
    {
      covers: ["range"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      // `range` 의 상한은 O(log n + k) 다. 값 범위를 n 에 비례해 넓혀 **k 를 상수로
      // 눌러야** 파라미터가 하나만 남는다(§규약2 다변수 상한 규칙).
      run: (impl, n, ctx) => {
        const spread = n * 8;
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * spread));
        for (let i = 0; i < n; i++) {
          const low = Math.floor(ctx.rng() * spread);
          ctx.step(() => impl.range(low, low + 4));
        }
      },
    },
    {
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      // 호출 하나가 원소 수만큼 드는 연산이다. 한정자가 `worst` 라 반복 호출이 성장률을
      // 바꾸지 않으므로 몇 번만 부른다 — `expected` 였다면 seed 다섯 × n 회 측정이라
      // 이 한 줄이 사다리 맨 위에서 13억 걸음이 된다(불변 사실 102 와 같은 자리).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < 4; i++) ctx.step(() => impl.toArray());
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      // 세어 두지 않고 그때그때 훑는 구현이 걸리는 자리다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) ctx.step(() => impl.size());
      },
    },
    {
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      // 오름차순 지우기와 같은 채우기에서 **지우는 차례만 무작위로** 섞는다(`S22`). 그쪽은 늘 최솟값을 지워, 지울
      // 원소 앞자리를 앞에서부터 다시 찾는 설계가 찾을 거리 0 으로 통과한다 — 층마다 머리부터 훑는
      // 건너뛰기 줄(`_contract/_fixtures/levelRuleSkipList.ts` 의 `scanDelete`)이 그 실물이다. 섞으면
      // 지울 원소가 평균 가운데라 그 거리가 담긴 수에 비례한다(불변 사실 233 · 242).
      //
      // 적대적이 아니다 — 차례를 `ctx.rng` 로 뽑아 seed 다섯이 다른 입력을 낸다. 판정 이름은 그쪽과
      // 「(적대적)」 한 마디로 갈린다. 맨 끝에 둔 것은 이 파일을 줄 번호로 가리키는 가이드 인용을 밀지 않으려는 것이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.insert(i);
        const order = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(ctx.rng() * (i + 1));
          [order[i], order[j]] = [order[j] as number, order[i] as number];
        }
        for (const key of order) ctx.step(() => impl.delete(key));
      },
    },
  ],
};
