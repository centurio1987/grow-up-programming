/**
 * `range-query/intervalTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./intervalTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 * **축2가 비어 있지 않은 첫 구조다.** 헤더의 불변식 절에 둘이 적혀 있다.
 *
 * 질의 결과의 **순서는 계약이 약속하지 않는다**(헤더). 그래서 축1은 양쪽을 같은 규칙으로
 * 정렬한 뒤 비교한다 — 정렬하지 않고 비교하면 순회 순서를 처방하게 된다.
 */

import { fixedInput, seededInput } from "../../_contract/expectedRepeat";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface IntervalTreeContract {
  insert(low: number, high: number): void;
  delete(low: number, high: number): boolean;
  stabQuery(point: number): [number, number][];
  overlapQuery(low: number, high: number): [number, number][];
  size(): number;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = [number, number][];

/** 축1·축2 무작위 시퀀스가 도는 값 범위. 좁게 잡아야 겹침이 실제로 일어난다. */
const DOMAIN = 20;
/** 무작위로 만드는 구간의 최대 폭. */
const WIDTH = 4;

/** 저장된 어떤 구간보다도 넓은 범위. 불변식 1이 "전부 되찾는가"를 묻는 데 쓴다. */
const WORLD_LOW = -1_000_000;
const WORLD_HIGH = 1_000_000;

/** 축3 시나리오가 실제로 재는 연산 수. n 과 무관한 상수다(§규약2는 `amortized` 에서만 n 회를 요구한다). */
const PROBES = 200;

/** 순서를 약속하지 않는 결과를 비교 가능한 모양으로 눕힌다. */
function canonical(intervals: readonly [number, number][]): [number, number][] {
  return [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function overlaps(
  stored: readonly [number, number],
  low: number,
  high: number,
): boolean {
  return stored[0] <= high && low <= stored[1];
}

/** 무작위 구간 하나. 폭이 상수라 값 범위를 넓히면 한 점을 덮는 구간 수가 상수로 유지된다. */
function randomInterval(rng: () => number, span: number): [number, number] {
  const low = Math.floor(rng() * (span - WIDTH));
  return [low, low + Math.floor(rng() * WIDTH)];
}

export const intervalTreeContract: ContractSpec<IntervalTreeContract, Model> = {
  name: "IntervalTree",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "insert",
      arg: (rng) => randomInterval(rng, DOMAIN),
      onImpl: (impl, arg) => {
        const [low, high] = arg as [number, number];
        impl.insert(low, high);
      },
      onModel: (model, arg) => {
        model.push([...(arg as [number, number])] as [number, number]);
      },
    },
    {
      name: "delete",
      arg: (rng) => randomInterval(rng, DOMAIN),
      onImpl: (impl, arg) => {
        const [low, high] = arg as [number, number];
        return impl.delete(low, high);
      },
      onModel: (model, arg) => {
        const [low, high] = arg as [number, number];
        const at = model.findIndex(
          ([storedLow, storedHigh]) => storedLow === low && storedHigh === high,
        );
        if (at < 0) return false;
        model.splice(at, 1);
        return true;
      },
    },
    {
      name: "stabQuery",
      arg: (rng) => Math.floor(rng() * (DOMAIN + WIDTH)),
      onImpl: (impl, arg) => canonical(impl.stabQuery(arg as number)),
      onModel: (model, arg) =>
        canonical(
          model.filter((stored) =>
            overlaps(stored, arg as number, arg as number),
          ),
        ),
    },
    {
      name: "overlapQuery",
      arg: (rng) => randomInterval(rng, DOMAIN),
      onImpl: (impl, arg) => {
        const [low, high] = arg as [number, number];
        return canonical(impl.overlapQuery(low, high));
      },
      onModel: (model, arg) => {
        const [low, high] = arg as [number, number];
        return canonical(model.filter((stored) => overlaps(stored, low, high)));
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
  ],

  edges: [
    {
      name: "빈 색인에서 두 질의는 빈 배열이고 delete 는 false 다",
      steps: [
        { op: "stabQuery", arg: 3 },
        { op: "overlapQuery", arg: [0, 10] },
        { op: "delete", arg: [1, 2] },
        { op: "size" },
      ],
    },
    {
      name: "끝점에 닿기만 해도 겹침이다",
      steps: [
        { op: "insert", arg: [1, 5] },
        { op: "insert", arg: [5, 9] },
        { op: "stabQuery", arg: 5 },
        { op: "stabQuery", arg: 1 },
        { op: "stabQuery", arg: 9 },
        { op: "overlapQuery", arg: [5, 5] },
      ],
    },
    {
      name: "한 칸만 비껴가면 겹치지 않는다",
      steps: [
        { op: "insert", arg: [3, 7] },
        { op: "stabQuery", arg: 2 },
        { op: "stabQuery", arg: 8 },
        { op: "overlapQuery", arg: [8, 12] },
        { op: "overlapQuery", arg: [0, 2] },
      ],
    },
    {
      name: "덮인 구간과 덮는 구간이 서로를 찾는다",
      steps: [
        { op: "insert", arg: [0, 20] },
        { op: "insert", arg: [8, 9] },
        { op: "overlapQuery", arg: [8, 9] },
        { op: "overlapQuery", arg: [0, 20] },
        { op: "stabQuery", arg: 8 },
      ],
    },
    {
      name: "같은 구간을 두 번 넣으면 두 벌이고 한 번 지우면 한 벌이 남는다",
      steps: [
        { op: "insert", arg: [4, 6] },
        { op: "insert", arg: [4, 6] },
        { op: "size" },
        { op: "stabQuery", arg: 5 },
        { op: "delete", arg: [4, 6] },
        { op: "size" },
        { op: "stabQuery", arg: 5 },
      ],
    },
    {
      name: "없는 구간을 지우면 false 이고 있던 것은 그대로다",
      steps: [
        { op: "insert", arg: [2, 4] },
        { op: "delete", arg: [2, 5] },
        { op: "delete", arg: [3, 4] },
        { op: "size" },
        { op: "stabQuery", arg: 3 },
      ],
    },
    {
      name: "시작점이 같고 끝점만 다른 구간이 서로를 밀어내지 않는다",
      steps: [
        { op: "insert", arg: [5, 6] },
        { op: "insert", arg: [5, 15] },
        { op: "stabQuery", arg: 12 },
        { op: "delete", arg: [5, 6] },
        { op: "stabQuery", arg: 5 },
        { op: "size" },
      ],
    },
    {
      name: "가장 긴 구간을 지우고 나면 가지치기가 다시 좁아진다",
      steps: [
        { op: "insert", arg: [0, 1] },
        { op: "insert", arg: [1, 18] },
        { op: "insert", arg: [2, 3] },
        { op: "stabQuery", arg: 17 },
        { op: "delete", arg: [1, 18] },
        { op: "stabQuery", arg: 17 },
        { op: "overlapQuery", arg: [0, 3] },
      ],
    },
  ],

  /**
   * 헤더 불변식 절의 둘을 그대로 옮긴 것이다. **이 스위트에서 축2가 처음으로 비어 있지
   * 않다.** 둘 모두 공개 연산만으로 관측되는 **상태의 성질**이고, 각 연산이 국소적으로
   * 옳아 보여도 깨질 수 있다.
   *
   * 건전성(*"돌려준 구간이 실제로 겹친다"*)은 여기 없다. 상태의 성질이 아니라 `overlapQuery`
   * 한 연산의 의미이므로, 축1이 참조 모델과 대조해 잡는 몫이다.
   */
  invariants: [
    {
      name: "저장한 것을 전 범위 질의가 전부 되찾는다",
      check: (impl) => {
        const all = impl.overlapQuery(WORLD_LOW, WORLD_HIGH).length;
        const size = impl.size();
        return all === size ? null : `전 범위 질의 ${all}개 / size ${size}`;
      },
    },
    {
      name: "stabQuery(p) 와 overlapQuery(p, p) 가 갈리지 않는다",
      check: (impl) => {
        for (let point = 0; point <= DOMAIN + WIDTH; point++) {
          const stab = JSON.stringify(canonical(impl.stabQuery(point)));
          const overlap = JSON.stringify(
            canonical(impl.overlapQuery(point, point)),
          );
          if (stab !== overlap) {
            return `p=${point} 에서 stabQuery ${stab} / overlapQuery ${overlap}`;
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    seededInput({
      // 무작위 삽입. 균형을 스스로 잡지 않는 탐색 트리도 여기서는 통과한다 —
      // 무작위 순서로 들어온 키는 그 자체로 대체로 균형 잡힌 트리를 만들기 때문이다.
      covers: ["insert"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const span = 4 * n;
        for (let i = 0; i < n; i++) {
          const [low, high] = randomInterval(ctx.rng, span);
          ctx.step(() => impl.insert(low, high));
        }
      },
    }),
    fixedInput({
      // 시작점이 오름차순. 균형을 스스로 잡지 않는 탐색 트리는 여기서 사슬이 된다.
      // 진단이 지목한 입력이다 — 예약을 시작 시각 순으로 넣는 것이 곧 이 패턴이다.
      covers: ["insert"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const low = i * WIDTH;
          ctx.step(() => impl.insert(low, low + WIDTH - 1));
        }
      },
    }),
    seededInput({
      // 답 수 k 를 상수로 눌러 놓고 n 만 키운다(§규약2 시나리오 규칙 3). 값 범위를 n 에
      // 비례해 넓히므로 한 점을 덮는 구간 수가 n 과 무관하게 1 부근에 머문다.
      // 전부 훑는 구현은 k 와 무관하게 n 에 비례하므로 여기서 걸린다.
      covers: ["stabQuery"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const span = 4 * n;
        for (let i = 0; i < n; i++) {
          const [low, high] = randomInterval(ctx.rng, span);
          impl.insert(low, high);
        }
        for (let i = 0; i < PROBES; i++) {
          const point = Math.floor(ctx.rng() * span);
          ctx.step(() => {
            impl.stabQuery(point);
          });
        }
      },
    }),
    seededInput({
      // 같은 방식으로 k 를 누른 구간 질의. 점 질의와 따로 두는 이유는 두 질의의 가지치기가
      // 갈릴 수 있기 때문이고, 갈리는지 자체는 축2 불변식 2가 본다.
      covers: ["overlapQuery"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const span = 4 * n;
        for (let i = 0; i < n; i++) {
          const [low, high] = randomInterval(ctx.rng, span);
          impl.insert(low, high);
        }
        for (let i = 0; i < PROBES; i++) {
          const low = Math.floor(ctx.rng() * (span - WIDTH));
          ctx.step(() => {
            impl.overlapQuery(low, low + WIDTH);
          });
        }
      },
    }),
    seededInput({
      // 무작위로 채운 뒤 실제로 든 구간을 지운다. 없는 것만 지우면 탐색이 일찍 끝나
      // 삭제 비용을 재지 못한다.
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const span = 4 * n;
        const inserted: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          const interval = randomInterval(ctx.rng, span);
          inserted.push(interval);
          impl.insert(interval[0], interval[1]);
        }
        for (let i = 0; i < PROBES; i++) {
          const at = Math.floor(ctx.rng() * inserted.length);
          const target = inserted[at] ?? [0, 0];
          ctx.step(() => {
            impl.delete(target[0], target[1]);
          });
        }
      },
    }),
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const span = 4 * n;
        for (let i = 0; i < n; i++) {
          const [low, high] = randomInterval(ctx.rng, span);
          impl.insert(low, high);
        }
        for (let i = 0; i < PROBES; i++) {
          ctx.step(() => {
            impl.size();
          });
        }
      },
    },
  ],
};
