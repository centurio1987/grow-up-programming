/**
 * ORD-006 B군(KAN-027) WBS 상태 계산기.
 *
 * **claim 상태를 어느 문서에도 적지 않는다.** 병렬 세션이 상태 파일을 함께 고치면 그 파일이
 * 곧 충돌 지점이 되고, 병렬화가 막으려던 것이 상태 관리에서 그대로 돌아온다. 진실은 파일
 * 시스템이다 — 구조의 `_reference/` 가 있으면 그 구조는 끝났다. 이 도구는 그 사실을 유닛
 * 단위로 접어 보여줄 뿐이고 아무것도 쓰지 않는다.
 *
 * 유닛 = 계약 하나 = 배치 하나이고 **산출은 계약 층뿐이다**(가이드는 산출이 아니다 — 2026-09-14 재개, v2 는 KAN-036).
 * 계약이 접힌 자리(B17·B18·B19)에서는 정본 하나에 성격 전환 여럿이 딸리고, 전환은 정본이 선 뒤에만 열린다(B20 → B22·B23).
 *
 * 사용:
 *   bun run tools/ord006-wbs.ts           # 트랙별 상태 + claim 후보
 *   bun run tools/ord006-wbs.ts --json    # 기계용
 *   bun run tools/ord006-wbs.ts --all     # 전 유닛 표
 *
 * 규격 전문은 docs/ORD-006-wbs.md.
 */
import { stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const scanRoot = join(root, "src/data-structures");

type Track = {
  readonly id: string;
  readonly title: string;
  /** 이 트랙이 런북 불변 사실에 쓸 번호 대역. 병렬 세션이 같은 번호를 쓰지 않게 미리 가른다. */
  readonly facts: string;
};

const TRACKS: readonly Track[] = [
  { id: "T1", title: "탐색 트리", facts: "100-119" },
  { id: "T2", title: "우선순위 큐", facts: "120-139 · 250-269 · 300-309" },
  { id: "T3", title: "사전·집합·분리집합", facts: "140-159 · 310-319" },
  { id: "T4", title: "구간 질의·공간", facts: "160-179" },
  { id: "T5", title: "선형·확률·기타", facts: "180-199 · 90-99 · 230-249" },
];

type Unit = {
  readonly id: string;
  readonly track: string;
  /** 계약을 한 줄로. 구조 이름이 아니라 계약 이름을 적는다. */
  readonly contract: string;
  /** 정본 구조 `<category>/<name>`. 이것이 서야 전환이 열린다. */
  readonly canonical: string;
  /** 성격 전환 구조들. 정본과 같은 계약이고 `.contract.ts` 는 정본 것을 그대로 쓴다. */
  readonly transitions: readonly string[];
  /** 이 유닛에만 걸리는 것. 없으면 빈 문자열. */
  readonly note: string;
};

/**
 * B군 42종 중 계약 전환이 남은 36종을 31 유닛으로 접은 것(T5-05 cuckooFilter 1종은 KAN-026 이관).
 *
 * 끝난 5종(avlTree·redBlackTree·twoThreeTree·bTree·bPlusTree = 정렬 집합 `worst` 계약)은
 * 여기에 없다. 유닛 목록이 곧 남은 일이다.
 *
 * 출처는 셋뿐이다 — B17(이진 탐색 트리 아홉 → 계약 다섯) · B18(힙 여덟 → 계약 넷) ·
 * B19(해시 셋 + 흩어진 쌍 여덟). 판정 전문은 docs/ORD-006-conventions.md §규약1.
 * **판정이 끝나지 않은 자리는 유닛 안에 note 로 적는다** — 추정으로 접지 않는다.
 */
const UNITS: readonly Unit[] = [
  // ── T1 탐색 트리 ────────────────────────────────────────────────────────────
  {
    id: "T1-01",
    track: "T1",
    contract: "정렬 집합 · 전 연산 amortized O(log n)",
    canonical: "tree/splayTree",
    transitions: [],
    note: "한정자를 겨누는 시나리오가 필수(§규약1 4단계). fixture 는 splayingSearchTree 재사용 — redBlackTree 계약에서 걸리는 것이 여기서는 통과해야 한다",
  },
  {
    id: "T1-02",
    track: "T1",
    contract: "정렬 집합 · 전 연산 expected O(log n)",
    canonical: "tree/treap",
    transitions: [],
    note: "축3 통계가 seed 별 중앙값이다. B11 이 만들다 뺀 결정론적 우선순위 입력을 시나리오로 쓰지 않는다(불변 사실 44)",
  },
  {
    id: "T1-03",
    track: "T1",
    contract: "정렬 집합 · 조회 worst + 갱신 amortized O(log n)",
    canonical: "tree/scapegoatTree",
    transitions: [],
    note: "한정자가 연산마다 갈리는 첫 계약",
  },
  {
    id: "T1-04",
    track: "T1",
    contract: "정렬 집합 · 상한 없음",
    canonical: "tree/binarySearchTree",
    transitions: [],
    note: "등급이 complexity 가 아니다(불변 사실 56 — 자명한 구현이 전 행을 통과). 재집필과 함께 등급을 확정해 VERIFICATION_GRADES 에 박는다",
  },
  {
    id: "T1-05",
    track: "T1",
    contract: "순위 질의를 가진 정렬 다중집합",
    canonical: "tree/orderStatisticTree",
    transitions: [],
    note: "B11 확정 — multiset 을 담는다(포섭이므로 다른 구조)",
  },
  {
    id: "T1-06",
    track: "T1",
    contract: "수열에서 만드는 트리 (미확정)",
    canonical: "tree/cartesianTree",
    transitions: [],
    note: "불변 구조일 수 있다 — 그렇다면 불변 사실 52 의 넷을 적용한다",
  },
  {
    id: "T1-07",
    track: "T1",
    contract: "동적 트리 · amortized O(log n)",
    canonical: "tree/linkCutTree",
    transitions: [],
    note: "",
  },

  // ── T2 우선순위 큐 ──────────────────────────────────────────────────────────
  {
    id: "T2-01",
    track: "T2",
    contract: "기본 우선순위 큐",
    canonical: "heap/priorityQueue",
    transitions: ["heap/minHeap", "heap/maxHeap", "heap/daryHeap"],
    note: "정본 이름이 임시가 아니다(불변 사실 66 — ADT 이름이라 KAN-031 로 안 넘긴다). 전환 셋은 정본이 선 뒤 서로 병렬",
  },
  {
    id: "T2-02",
    track: "T2",
    contract: "합칠 수 있는 우선순위 큐 (merge)",
    canonical: "heap/leftistHeap",
    transitions: ["heap/binomialHeap"],
    note: "정본 이름은 **임시**다(불변 사실 64) — 구현 이름뿐이라 계약 이름은 KAN-031 이 정한다",
  },
  {
    id: "T2-03",
    track: "T2",
    contract: "상수 시간 넣기·합치기",
    canonical: "heap/pairingHeap",
    transitions: [],
    note: "T2-02 와 상한이 로그 인수 하나 차이라 축3이 못 가른다(불변 사실 53). 한정자로 보이므로 「넣기 n 번 뒤 빼기 한 번」 시나리오가 필수",
  },
  {
    id: "T2-04",
    track: "T2",
    contract: "키 낮추기를 가진 우선순위 큐",
    canonical: "heap/fibonacciHeap",
    transitions: [],
    note: "decreaseKey 상각 O(1) 이 계약. 연산 유무로 갈리므로 축1이 본다",
  },
  {
    id: "T2-05",
    track: "T2",
    contract: "정수 우주 위의 정렬 집합 · O(log log u)",
    canonical: "heap/vanEmdeBoasTree",
    transitions: [],
    note: "**Bound 확장 판정을 동반한다** — n 이 아닌 것이 상한에 들어오는 첫 사례다. 늘리기 전에 겹침부터 본다(불변 사실 53). 판정 결과를 §규약2 에 적는다",
  },

  // ── T3 사전·집합·분리집합 ───────────────────────────────────────────────────
  {
    id: "T3-01",
    track: "T3",
    contract: "사전 (키→값)",
    canonical: "hash/hashMapChaining",
    transitions: ["hash/hashMapOpenAddressing"],
    note: "B15·B19 확정 — 갈리려던 자리가 표현과 적재율이라 계약의 문장이 못 된다. 정본 이름은 **임시**(불변 사실 64)",
  },
  {
    id: "T3-02",
    track: "T3",
    contract: "집합 (합·교·차집합)",
    canonical: "hash/hashSet",
    transitions: [],
    note: "B19 확정 — 사전과 서로 담지 않는다(불변 사실 54). 사전은 get(key): V 를, 집합은 집합 연산을 요구한다",
  },
  {
    id: "T3-03",
    track: "T3",
    contract: "용량 정책을 가진 사전 (LRU)",
    canonical: "hash/lruCache",
    transitions: [],
    note: "용량이 관측 연산을 가지면 계약에 들어온다(불변 사실 67 — circularBuffer 와 같은 자리)",
  },
  {
    id: "T3-04",
    track: "T3",
    contract: "분리 집합",
    canonical: "disjoint-set/unionFind",
    transitions: [],
    note: "**Bound 를 늘리지 않는다**(B19 확정 — 역아커만이 O(1) 구간과 겹쳐 아무것도 배제하지 못한다)",
  },
  {
    id: "T3-05",
    track: "T3",
    contract: "되돌릴 수 있는 분리 집합",
    canonical: "disjoint-set/disjointSetRollback",
    transitions: [],
    note: "B19 확정 — unionFind 와 다르다(되돌리기가 경로 압축을 막는다)",
  },

  // ── T4 구간 질의·공간 ───────────────────────────────────────────────────────
  {
    id: "T4-01",
    track: "T4",
    contract: "앞구간 합",
    canonical: "range-query/fenwickTree",
    transitions: [],
    note: "B19 확정 — segmentTree 와 다르다(반례가 연산 하나)",
  },
  {
    id: "T4-02",
    track: "T4",
    contract: "임의 구간 · 임의 결합",
    canonical: "range-query/segmentTree",
    transitions: [],
    note: "B19 확정 — 셋이 전부 다르다",
  },
  {
    id: "T4-03",
    track: "T4",
    contract: "구간 갱신을 가진 구간 질의",
    canonical: "range-query/segmentTreeLazy",
    transitions: [],
    note: "",
  },
  {
    id: "T4-04",
    track: "T4",
    contract: "옛 버전 접근을 가진 구간 질의",
    canonical: "range-query/persistentSegmentTree",
    transitions: [],
    note: "공간이 대가인 구조 — 불변 사실 67 의 물음을 쓴다(그 제약을 관측하는 연산이 계약에 있는가)",
  },
  {
    id: "T4-05",
    track: "T4",
    contract: "불변 구조 위의 구간 질의",
    canonical: "range-query/sparseTable",
    transitions: [],
    note: "**불변 구조다** — 불변 사실 52 의 넷을 그대로 적용한다(축2 · 인자 없는 질의 · 구성 시점 · 껍데기 팩토리)",
  },
  {
    id: "T4-06",
    track: "T4",
    contract: "다차원 최근접·범위 질의",
    canonical: "spatial/kdTree",
    transitions: [],
    note: "B19 확정 — quadtree 와 다르다",
  },
  {
    id: "T4-07",
    track: "T4",
    contract: "평면 분할 질의",
    canonical: "spatial/quadtree",
    transitions: [],
    note: "",
  },

  // ── T5 선형·확률·기타 ───────────────────────────────────────────────────────
  {
    id: "T5-01",
    track: "T5",
    contract: "고정 용량 수열 (isFull 관측)",
    canonical: "linear/circularBuffer",
    transitions: [],
    note: "**불변 사실 67 의 실물이다** — 시간 상한을 하나도 쓰지 않고 queue 와 갈린다. 「공간이 존재 이유」 13 건의 판정 선례가 된다",
  },
  {
    id: "T5-02",
    track: "T5",
    contract: "편집 지역성을 가진 수열 (미확정)",
    canonical: "linear/gapBuffer",
    transitions: [],
    note: "공간 표시. 존재 이유가 계약의 문장이 되는지부터 본다 — 안 되면 B15 처분(존치 + 성격 전환)",
  },
  {
    id: "T5-03",
    track: "T5",
    contract: "원본 불변 + 조각 목록 (미확정)",
    canonical: "linear/pieceTable",
    transitions: [],
    note: "같음. T5-02 와 같은 계약인지도 함께 본다",
  },
  {
    id: "T5-04",
    track: "T5",
    contract: "정렬 집합 · expected O(log n)",
    canonical: "probabilistic/skipList",
    transitions: [],
    note: "**T1-02(treap)와 계약이 같을 수 있다** — 둘 다 정렬 집합 expected 다. T1-02 가 먼저 서면 이 유닛은 성격 전환이 된다. 두 트랙에 걸친 유일한 자리라 T1-02 완료를 확인하고 착수한다",
  },
  // T5-05 probabilistic/cuckooFilter 「지울 수 있는 근사 소속 집합」 — KAN-026 으로 이관(2026-09-14
  //   유저 결재). bloomFilter 와 한 판정 자리에서 보라는 서술(docs/ORD-006-conventions.md:2285)이
  //   워크트리를 넘는 의존을 만들었다. 뺀 note 의 판정 이력: 「같은계약?」 판정이 유일하게 남은
  //   자리(B19 인계) — bloomFilter 와 갈리는 자리가 지우기인데 bloomFilter 는 A군이라 등급으로
  //   먼저 가른다(불변 사실 56). 전환 전에 판정을 먼저 낸다.
  //   id T5-05 는 비워 둔다 — 다시 매기면 칸반 메모·런북의 T5-06 이후 인용이 어긋난다.
  //   이 주석은 뺀 유닛과 같은 8줄이다 — 아래 유닛을 가리키는 `ord006-wbs.ts` 줄 인용이
  //   밀리지 않게 맞췄다.
  {
    id: "T5-06",
    track: "T5",
    contract: "미확정 — 자료구조인지부터",
    canonical: "tree/huffmanTree",
    transitions: [],
    note: "축밖 표시. 알고리즘 산출물이면 계약이 서지 않는다 — 그 판정 자체가 이 유닛의 산출",
  },
  {
    id: "T5-07",
    track: "T5",
    contract: "증명 검증을 가진 불변 구조",
    canonical: "tree/merkleTree",
    transitions: [],
    note: "**불변 구조다** — 불변 사실 52 의 넷을 적용한다. T4-05 와 같은 처리라 둘 중 뒤에 도는 쪽이 앞의 선례를 쓴다",
  },
  {
    id: "T5-08",
    track: "T5",
    contract: "다중 패턴 동시 매칭",
    canonical: "trie/ahoCorasick",
    transitions: [],
    note: "",
  },
];

type UnitState = "open" | "partial" | "done";

type UnitStatus = {
  readonly unit: Unit;
  readonly state: UnitState;
  readonly canonicalDone: boolean;
  readonly transitionsDone: readonly string[];
  readonly transitionsOpen: readonly string[];
};

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/** 구조가 끝났는가 = `_reference/` 가 있는가. 규약4 (가) 등급은 B군에 없다(C군 1종뿐). */
async function hasReference(structure: string): Promise<boolean> {
  return isDir(join(scanRoot, structure, "_reference"));
}

async function statusOf(unit: Unit): Promise<UnitStatus> {
  const canonicalDone = await hasReference(unit.canonical);
  const done: string[] = [];
  const open: string[] = [];
  for (const t of unit.transitions) {
    if (await hasReference(t)) done.push(t);
    else open.push(t);
  }
  const state: UnitState = !canonicalDone
    ? "open"
    : open.length > 0
      ? "partial"
      : "done";
  return {
    unit,
    state,
    canonicalDone,
    transitionsDone: done,
    transitionsOpen: open,
  };
}

// 유닛에 적힌 경로가 실제 디렉터리와 어긋나면(오타·KAN-031 의 이동) 조용히 `open` 으로 새지
// 않도록 여기서 멈춘다. ord006-inventory.ts 의 판정 표 가드와 같은 규칙이다.
const missing: string[] = [];
for (const unit of UNITS) {
  for (const s of [unit.canonical, ...unit.transitions]) {
    if (!(await isDir(join(scanRoot, s)))) missing.push(`${unit.id}: ${s}`);
  }
}
if (missing.length > 0) {
  console.error(
    `[ord006-wbs] 유닛이 가리키는 구조가 없다 — 경로가 바뀌었으면 UNITS 를 함께 고친다:\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}

const statuses = await Promise.all(UNITS.map(statusOf));
const byTrack = new Map<string, UnitStatus[]>();
for (const s of statuses) {
  const list = byTrack.get(s.unit.track) ?? [];
  list.push(s);
  byTrack.set(s.unit.track, list);
}

/**
 * claim 후보 = 트랙별로 **가장 앞선 미완 유닛 하나**.
 * `partial` 이 `open` 보다 앞이다 — 정본이 선 계약의 전환은 배치가 가볍고, 미완으로 두면
 * 그 계약의 스위트가 정본 하나로만 검증된 채 남는다(B22 가 그 자리를 닫았다).
 */
function claimOf(list: readonly UnitStatus[]): UnitStatus | undefined {
  return (
    list.find((s) => s.state === "partial") ??
    list.find((s) => s.state === "open")
  );
}

/** 한글은 터미널에서 두 칸을 먹는다. String.padEnd 는 한 칸으로 세므로 열이 어긋난다. */
function padDisplay(text: string, width: number): string {
  let cells = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    cells += code >= 0x1100 && code <= 0xffe6 ? 2 : 1;
  }
  return text + " ".repeat(Math.max(0, width - cells));
}

const totalStructures = UNITS.reduce((n, u) => n + 1 + u.transitions.length, 0);
const doneStructures = statuses.reduce(
  (n, s) => n + (s.canonicalDone ? 1 : 0) + s.transitionsDone.length,
  0,
);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        totalUnits: UNITS.length,
        doneUnits: statuses.filter((s) => s.state === "done").length,
        totalStructures,
        doneStructures,
        tracks: TRACKS.map((t) => {
          const list = byTrack.get(t.id) ?? [];
          const claim = claimOf(list);
          return {
            ...t,
            units: list.length,
            done: list.filter((s) => s.state === "done").length,
            claim: claim
              ? {
                  id: claim.unit.id,
                  state: claim.state,
                  canonical: claim.unit.canonical,
                  contract: claim.unit.contract,
                  open:
                    claim.state === "partial"
                      ? claim.transitionsOpen
                      : [claim.unit.canonical],
                  note: claim.unit.note,
                }
              : null,
          };
        }),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(
  `ORD-006 B군 WBS — ${UNITS.length} 유닛 / ${totalStructures} 종  (완료 ${doneStructures}종)\n`,
);

for (const t of TRACKS) {
  const list = byTrack.get(t.id) ?? [];
  const done = list.filter((s) => s.state === "done").length;
  const bar = `${"#".repeat(done)}${".".repeat(list.length - done)}`;
  const claim = claimOf(list);
  const head = `[${t.id}] ${padDisplay(t.title, 22)} ${padDisplay(bar, 9)} ${done}/${list.length}  불변사실 ${t.facts}`;
  if (!claim) {
    console.log(`${head}  -- 트랙 완료`);
    continue;
  }
  const target =
    claim.state === "partial"
      ? `${claim.unit.id} 성격전환 ${claim.transitionsOpen.join(" · ")}`
      : `${claim.unit.id} ${claim.unit.canonical}`;
  console.log(`${head}\n${" ".repeat(9)}claim -> ${target}`);
}

if (process.argv.includes("--all")) {
  console.log("\n전 유닛");
  for (const t of TRACKS) {
    console.log(`\n[${t.id}] ${t.title}`);
    for (const s of byTrack.get(t.id) ?? []) {
      const mark = s.state === "done" ? "x" : s.state === "partial" ? "~" : " ";
      const extra =
        s.unit.transitions.length > 0
          ? ` (+전환 ${s.transitionsDone.length}/${s.unit.transitions.length})`
          : "";
      console.log(`  [${mark}] ${s.unit.id}  ${s.unit.canonical}${extra}`);
      console.log(`        ${s.unit.contract}`);
      if (s.unit.note) console.log(`        ! ${s.unit.note}`);
    }
  }
}

console.log(
  "\n규격: docs/ORD-006-wbs.md  |  배치 진입: docs/ORD-006-runbook.md  |  확정 규약: docs/ORD-006-conventions.md",
);
