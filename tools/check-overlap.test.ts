/**
 * `check-overlap.ts` 자기시험.
 *
 * 재는 것은 하나다 — **리프트(편 수 2)와 관례(편 수 60 이상)를 가르는가.** 겹침을 찾는
 * 것만으로는 이 도구가 쓸모가 없다. 111편이 함께 쓰는 문구가 목록에 섞이면 사람이 편 수를
 * 다시 세게 되고, 그 순간 손 대조로 돌아간다.
 *
 * 그래서 시험 표본은 **관례가 실재하는 말뭉치**다. 편 62 개를 만들어 전부에 같은 머리글을
 * 넣고, 그중 둘에만 문단 하나를 겹쳐 둔다. 편이 둘뿐인 표본으로는 이 갈림을 잴 수 없다 —
 * 모든 겹침이 편 수 2 로 나와서 **전부 리프트가 된다.**
 */
import { expect, test } from "bun:test";
import {
  band,
  buildCorpus,
  CONVENTION_GUIDES,
  commonRuns,
  conventions,
  findValue,
  fingerprints,
  guideFreq,
  liftPairs,
  normalize,
  shingleText,
  snapToLines,
  sortPairs,
  substantive,
  valueLifts,
  valueTokens,
  WINDOW,
} from "./check-overlap.ts";

// ── 잣대 ② 창 지문 ────────────────────────────────────────────────────────────

test("같은 18자 창은 어느 편 어느 자리에 있든 같은 지문이다", () => {
  const w = "정점이 V 개면 쌍이 V(V-1)";
  expect(w.length).toBe(WINDOW);
  const alone = fingerprints(w)[0];
  // 굴림에서 빠져나가는 글자를 빼는 계산이 틀리면 앞에 글자를 붙인 쪽이 달라진다.
  const head = "앞말을 붙여도 ";
  const shifted = fingerprints(`${head}${w}`)[head.length];
  expect(alone).toBe(shifted);
  // 창을 벗어난 뒷말은 지문에 영향을 주지 않는다.
  expect(fingerprints(`${w} 뒷말도 붙여 본다`)[0]).toBe(alone);
});

test("한 글자만 달라도 지문이 갈린다", () => {
  const a = fingerprints("정점이 V 개면 쌍이 V(V-1)")[0];
  const b = fingerprints("정점이 V 개면 쌍이 V(V-2)")[0];
  expect(a).not.toBe(b);
});

test("창보다 짧은 글에는 지문이 없다", () => {
  expect(fingerprints("가".repeat(WINDOW)).length).toBe(1);
  expect(fingerprints("가".repeat(WINDOW - 1)).length).toBe(0);
});

test("괘선과 코드만인 창은 안 센다 — 한글이나 숫자가 있어야 한다", () => {
  expect(substantive("─".repeat(WINDOW))).toBe(false);
  expect(substantive("const next = cur.n")).toBe(false);
  expect(substantive("정점이 V 개면 쌍이 V")).toBe(true);
  expect(substantive("287,802 대 287,421")).toBe(true);
});

// ── 잣대 ④ 편 빈도 ───────────────────────────────────────────────────────────

test("편 수 하나가 대역을 정한다 — 2 는 리프트, 60 부터 관례", () => {
  expect(band(1)).toBe("혼자");
  expect(band(2)).toBe("리프트");
  expect(band(3)).toBe("소수");
  expect(band(9)).toBe("소수");
  expect(band(10)).toBe("다수");
  expect(band(CONVENTION_GUIDES - 1)).toBe("다수");
  expect(band(CONVENTION_GUIDES)).toBe("관례");
  expect(band(111)).toBe("관례");
});

test("편 빈도는 등장 횟수가 아니라 편 수다 — `grep -rlF` 와 같다", () => {
  const norms = [
    normalize(
      "a",
      "같은 문장을 한 편에서 두 번 씁니다.\n같은 문장을 한 편에서 두 번 씁니다.",
    ),
    normalize("b", "여기에는 없습니다."),
  ];
  expect(guideFreq("같은 문장을 한 편에서 두 번 씁니다.", norms)).toBe(1);
});

// ── 표본 말뭉치 — 관례가 실재한다 ─────────────────────────────────────────────

/** 62편 전부가 쓰는 머리글. 편 수가 `CONVENTION_GUIDES` 를 넘으므로 **관례**다. */
const TEMPLATE = [
  "## 파트 1 — 아이디어에서 동작하는 코드까지",
  "전체 그림을 먼저 보고, 그 그림을 읽는 데 필요한 것을 확인한 다음, 실제로 동작하는 코드를",
  "한 조각씩 만듭니다. 마지막에는 비용을 세는 과정을 따로 봅니다.",
].join("\n");

/** 두 편에만 있는 문단. **리프트**다. */
const LIFTED = [
  "정점이 100,000 개이므로 쌍만 4,999,950,000 개가 되어 하나씩 재는 것으로는 시작할 수 없습니다.",
  "한 칸 나아간 방법은 정점마다 한 번씩 재는 것입니다. 탐색 한 번이 정점 수에 비례하므로",
  "전체가 정점 수의 제곱이 됩니다.",
].join("\n");

const corpusOf = (extra: Record<number, string> = {}) => {
  const norms = [];
  for (let i = 0; i < 62; i++) {
    const id = String(i).padStart(2, "0");
    const body = [
      TEMPLATE,
      `### ${id} 번 편만의 이야기 — 여기서는 값 ${100000 + i * 7} 을 씁니다.`,
      extra[i] ?? "",
    ]
      .filter((s) => s !== "")
      .join("\n\n");
    norms.push(normalize(`g${id}-guide.md`, body));
  }
  return buildCorpus(norms);
};

test("62편 전부가 쓰는 머리글은 관례로 나오고, 쌍 목록에는 안 들어온다", () => {
  const corpus = corpusOf({ 0: LIFTED, 1: LIFTED });
  const conv = conventions(corpus, 5);
  expect(conv.length).toBeGreaterThan(0);
  expect(conv[0]?.guides).toBe(62);
  expect(conv[0]?.display).toContain("파트 1 — 아이디어에서 동작하는 코드까지");

  const pairs = liftPairs(corpus, 40);
  for (const p of pairs) {
    expect(p.longest?.text ?? "").not.toContain(
      "아이디어에서 동작하는 코드까지",
    );
  }
});

test("둘만 쓰는 문단은 리프트 후보로 나오고 편 수가 2 다", () => {
  const corpus = corpusOf({ 0: LIFTED, 1: LIFTED });
  const pairs = liftPairs(corpus, 40);
  const hit = pairs.find(
    (p) => p.a === "g00-guide.md" && p.b === "g01-guide.md",
  );
  expect(hit).toBeDefined();
  expect(hit?.freq).toBe(2);
  // 잣대 ③ — 최장 공통 구간이 옮겨 온 문단 전체를 덮는다.
  expect(hit?.longest?.chars).toBeGreaterThanOrEqual(LIFTED.length);
  // 잣대 ① — 옮겨 온 문단의 줄이 완전 일치 줄로도 잡힌다.
  expect(hit?.exactLines.length).toBeGreaterThanOrEqual(2);
});

test("한 편이 같은 문단을 두 번 실어도 편 수는 늘지 않는다", () => {
  // 편 수를 「등장 횟수」로 세면 이 편이 셋으로 잡혀 리프트 대역에서 밀려난다 — 겹침이
  // 실재하는데 목록에서 사라지는 쪽이라 화면으로는 안 보인다.
  const corpus = corpusOf({
    0: `${LIFTED}\n\n사이에 다른 말을 넣습니다.\n\n${LIFTED}`,
    1: LIFTED,
  });
  const hit = liftPairs(corpus, 40).find(
    (p) => p.a === "g00-guide.md" && p.b === "g01-guide.md",
  );
  expect(hit).toBeDefined();
  expect(hit?.freq).toBe(2);
});

test("아무 데도 안 옮긴 편끼리는 쌍이 잡히지 않는다", () => {
  const corpus = corpusOf();
  expect(liftPairs(corpus, 40)).toEqual([]);
});

test("최장 구간 하한을 옮겨 온 문단보다 높이면 그 쌍이 빠진다", () => {
  const corpus = corpusOf({ 0: LIFTED, 1: LIFTED });
  expect(liftPairs(corpus, LIFTED.length + 200)).toEqual([]);
});

test("한 편에만 있는 문단은 겹침이 아니다", () => {
  const corpus = corpusOf({ 0: LIFTED });
  expect(liftPairs(corpus, 40)).toEqual([]);
});

test("잣대마다 줄 세우기가 갈린다 — 한 잣대로만 세우면 다른 부채가 화면 밖으로 밀린다", () => {
  const mk = (name: string, chars: number, windows: number, lines: number) => ({
    a: name,
    b: "z",
    exactLines: new Array(lines).fill("줄"),
    windows,
    longest: { text: "", display: "", chars, aLine: 1, bLine: 1 },
    freq: 2,
  });
  // 셋이 서로 다른 차례가 되게 짠다 — 안 그러면 어느 잣대로 세워도 같은 차례가 나와서
  // 이 시험이 아무것도 안 잰다.
  const pairs = [
    mk("긴구간", 300, 10, 1),
    mk("넓은겹침", 50, 900, 5),
    mk("같은줄", 60, 20, 90),
  ];
  expect(sortPairs(pairs, "chars").map((p) => p.a)).toEqual([
    "긴구간",
    "같은줄",
    "넓은겹침",
  ]);
  expect(sortPairs(pairs, "windows").map((p) => p.a)).toEqual([
    "넓은겹침",
    "같은줄",
    "긴구간",
  ]);
  expect(sortPairs(pairs, "lines").map((p) => p.a)).toEqual([
    "같은줄",
    "넓은겹침",
    "긴구간",
  ]);
  // 원본을 갈아엎지 않는다.
  expect(pairs.map((p) => p.a)).toEqual(["긴구간", "넓은겹침", "같은줄"]);
});

test("두 번 훑기가 겹침을 흘리지 않는다 — 통 거르기 없이 센 것과 값이 같다", () => {
  // 통 거르기는 **빠르기 장치**라 결과를 바꾸면 안 된다. 그런데 두 훑기가 통 번호를 다르게
  // 계산하면 **실재하는 겹침이 조용히 빠지고**, 그때 화면은 「겹침 없음」으로 초록이 된다.
  // 그래서 거르기를 안 쓰고 직접 센 값과 맞댄다.
  const shared2 =
    "두 편만 옮겨 적은 문단이 여기 있습니다. 값은 4,999,950,000 개예요.";
  const shared3 =
    "세 편이 함께 쓰는 문장입니다. 비용을 세는 과정을 따로 봅니다.";
  const common = "여섯 편 모두가 쓰는 머리글입니다. 전체 그림을 먼저 봅니다.";
  const norms = [0, 1, 2, 3, 4, 5].map((i) =>
    normalize(
      `g${i}.md`,
      [
        common,
        i < 2 ? shared2 : "",
        i < 3 ? shared3 : "",
        `${i} 번 편만의 문단입니다. 고유한 값 ${900000 + i * 13} 을 씁니다.`,
      ]
        .filter((s) => s !== "")
        .join("\n"),
    ),
  );
  const corpus = buildCorpus(norms);

  const want = new Map<string, number>();
  for (const n of norms) {
    for (let i = 0; i + WINDOW <= n.text.length; i++) {
      const w = n.text.slice(i, i + WINDOW);
      if (!substantive(w) || want.has(w)) continue;
      const count = norms.filter((m) => m.text.includes(w)).length;
      if (count >= 2) want.set(w, count);
    }
  }
  const got = new Map<string, number>();
  for (const info of corpus.shingles.values()) {
    if (info.guides.length < 2) continue;
    got.set(shingleText(corpus, info), info.guides.length);
  }
  const sorted = (m: Map<string, number>) =>
    [...m].sort((a, b) => a[0].localeCompare(b[0]));
  expect(want.size).toBeGreaterThan(20);
  expect(sorted(got)).toEqual(sorted(want));
});

// ── 잣대 ③ 최장 공통 구간 ────────────────────────────────────────────────────

test("나란히 이어지는 창만 한 구간으로 묶고, 같은 구간을 길이만큼 다시 내지 않는다", () => {
  const a = Float64Array.from([1, 2, 3]);
  const b = Float64Array.from([1, 2, 3]);
  const runs = commonRuns(a, b, new Set([1, 2, 3]));
  expect(runs.length).toBe(1);
  expect(runs[0]?.windows).toBe(3);
  expect(runs[0]?.chars).toBe(3 + WINDOW - 1);
});

test("가운데가 어긋나면 구간이 둘로 끊긴다", () => {
  const a = Float64Array.from([1, 2, 9, 3, 4]);
  const b = Float64Array.from([1, 2, 8, 3, 4]);
  const runs = commonRuns(a, b, new Set([1, 2, 3, 4, 8, 9]));
  expect(runs.map((r) => r.windows)).toEqual([2, 2]);
});

test("관례 창은 리프트 두 토막을 이어 붙이지 못한다", () => {
  // `7` 은 62편이 쓰는 창이라 `shared` 에 없다. 그것이 이어 주면 서로 무관한 두 토막이
  // 「구간 하나」로 붙어 나오고, 그 길이는 어떤 실제 겹침보다 길어진다.
  const a = Float64Array.from([1, 2, 7, 3, 4]);
  const b = Float64Array.from([1, 2, 7, 3, 4]);
  const runs = commonRuns(a, b, new Set([1, 2, 3, 4]));
  expect(runs.map((r) => r.windows)).toEqual([2, 2]);
});

test("한 창이 상대 편에서 여러 자리에 나와도 `maxRepeat` 을 넘게 짝짓지 않는다", () => {
  const a = Float64Array.from([1]);
  const b = Float64Array.from(new Array(20).fill(1));
  expect(commonRuns(a, b, new Set([1]), 3).length).toBe(3);
});

// ── 잣대 ① 완전 일치 줄 ──────────────────────────────────────────────────────

test("완전 일치 줄은 창 너비보다 짧거나 한글·숫자가 없으면 안 센다", () => {
  const corpus = buildCorpus([
    normalize(
      "a",
      "| --- | --- |\n짧은 줄\n정점이 100,000 개이므로 쌍만 50 억 개가 됩니다.",
    ),
    normalize(
      "b",
      "| --- | --- |\n짧은 줄\n정점이 100,000 개이므로 쌍만 50 억 개가 됩니다.",
    ),
  ]);
  expect(corpus.lines.has("| --- | --- |")).toBe(false);
  expect(corpus.lines.has("짧은 줄")).toBe(false);
  expect(
    corpus.lines.get("정점이 100,000 개이므로 쌍만 50 억 개가 됩니다.")?.length,
  ).toBe(2);
});

test("한 편에만 있는 것은 색인에 남기지 않는다 — 겹침이 아니다", () => {
  const corpus = corpusOf({ 0: LIFTED, 1: LIFTED });
  for (const info of corpus.shingles.values())
    expect(info.guides.length).toBeGreaterThan(1);
  for (const guides of corpus.lines.values())
    expect(guides.length).toBeGreaterThan(1);
  for (const guides of corpus.values.values())
    expect(guides.length).toBeGreaterThan(1);
  // 표본이 앞선 가드에 먼저 걸려 빈 색인을 재는 것을 막는다.
  expect(corpus.shingles.size).toBeGreaterThan(50);
  expect(corpus.lines.size).toBeGreaterThan(2);
});

// ── 잣대 ④ 를 값에 건 것 ─────────────────────────────────────────────────────

test("수치 토큰은 쉼표를 걷고, 다섯 자리 미만은 안 본다", () => {
  expect(valueTokens("쌍만 4,999,950,000 개")).toEqual(["4999950000"]);
  expect(valueTokens("4999950000")).toEqual(["4999950000"]);
  expect(valueTokens("2026-09-10 에 1,234 번")).toEqual([]);
  expect(valueTokens("정확히 10000 개")).toEqual(["10000"]);
});

test("쉼표 규약이 달라도 같은 값으로 묶여 두 편만 쓰는 수치가 나온다", () => {
  const corpus = buildCorpus([
    normalize("a", "이 편은 4,999,950,000 을 씁니다."),
    normalize("b", "이 편은 4999950000 을 씁니다."),
    normalize("c", "이 편은 아무 수치도 안 씁니다."),
  ]);
  const lifts = valueLifts(corpus);
  expect(lifts.map((l) => l.value)).toEqual(["4999950000"]);
  expect(lifts[0]?.a).toBe("a");
  expect(lifts[0]?.b).toBe("b");
});

test("수치가 몇째 줄인지 되찾는다 — 쉼표가 있는 쪽도", () => {
  const norm = normalize("a", "머리글\n\n값은 4,999,950,000 입니다.");
  expect(findValue(norm, "4999950000")).toBe(3);
});

// ── 정규화 ───────────────────────────────────────────────────────────────────

test("공백을 접고 빈 줄을 버리되 줄 번호는 원본 것을 그대로 가리킨다", () => {
  const n = normalize("a", "머리글\n\n\n   자리맞춤이   넓은   줄   \n끝줄");
  expect(n.text).toBe("머리글\n자리맞춤이 넓은 줄\n끝줄");
  expect(n.lineOf[0]).toBe(1);
  expect(n.lineOf[n.text.indexOf("자리맞춤이")]).toBe(4);
  expect(n.lineOf[n.text.indexOf("끝줄")]).toBe(5);
});

test("화면용으로 넓힌 구간은 줄 경계를 채우되 잰 값은 그대로다", () => {
  const text = "첫 줄입니다\n둘째 줄의 가운데 토막\n셋째 줄입니다";
  const start = text.indexOf("가운데");
  const snapped = snapToLines(text, start, 3);
  expect(snapped.text).toBe("둘째 줄의 가운데 토막");
  expect(text.slice(start, start + 3)).toBe("가운데");
});
