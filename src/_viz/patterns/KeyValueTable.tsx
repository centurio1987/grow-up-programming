/**
 * P9 키-값 표(KeyValueTable) — 해시 맵 하나의 내용을 키 줄과 값 줄 두 줄로 그린다(KAN-058
 * `subarraySumEqualsK`). 항목 하나가 한 열이고, 키 칸 바로 아래에 그 키의 값 칸이 선다.
 *
 * 해시 맵은 칸 번호로 읽는 구조가 아니라 **키로 찾는** 구조다. 그래서 열의 순서는 키를 처음 넣은
 * 순서(자바스크립트 `Map` 의 순회 순서)이고, 열 번호에는 뜻이 없다. 그림이 보이는 것은 셋이다 —
 * 지금 어떤 키가 들어 있는가, 키마다 값이 얼마인가, 이번 걸음에 어느 키를 찾았고(읽음) 어느 키를
 * 새로 넣거나 고쳤는가(새로 씀). 찾았는데 없던 키는 칸이 없으므로 ▲ 줄 곁말(`note`)로 적는다.
 *
 * 칸 자리는 `slots` 로 미리 잡는다. 걸음 재생 패널에서 맵이 커져도 무대 높이·너비가 바뀌지 않고,
 * 아직 안 쓴 자리는 점선(아직)으로 남아 앞으로 채울 자리가 보인다(SPEC §13 상태 규칙).
 *
 * 줄은 `CellStage`(P7) 의 줄을 그대로 쓴다 — 칸 모양과 상태 여섯을 새로 만들지 않는다. 배열 무대
 * (`arrayStage` 의 `map`)는 이 줄을 입력 배열 아래에 쌓고, 정적 그림은 `KeyValueTable` 한 장으로 그린다.
 * 값은 계산하지 않는다 — 부르는 쪽이 정본 실행에서 받아 넘긴다.
 */

import type { ReactElement } from "react";
import type { CellState } from "./ArrayStrip";
import { CellStage, type StageRow } from "./CellStage";

export type MapKey = number | string;

/** 해시 맵 한 벌의 내용과 이번 걸음의 읽음·새로 씀. */
export interface KeyValueData {
  /** 키 줄 머리(예: 「seen 키」). */
  readonly keyLabel: string;
  /** 값 줄 머리(예: 「개수」). */
  readonly valueLabel: string;
  /** 항목 전부 — 키를 처음 넣은 순서. */
  readonly entries: readonly (readonly [MapKey, MapKey])[];
  /** 미리 잡는 열 수. 없으면 항목 수다. 항목 수보다 작으면 항목 수를 쓴다. */
  readonly slots?: number;
  /** 이번에 찾아서 있던 키 — ▲ 와 「읽음」. */
  readonly read?: readonly MapKey[];
  /** 이번에 새로 넣거나 값을 고친 키 — 「새로 씀」. */
  readonly write?: readonly MapKey[];
  /** ▲ 줄 곁말 — 찾은 키와 그 결과(「찾는 키 -4 · 없음」). */
  readonly note?: string;
  /**
   * 키마다 값이 둘 이상일 때 값 줄 아래에 더하는 줄 — 칸 번호 `k` 하나에 `sa[k]` 와 `lcp[k]` 가 함께 딸리는
   * 편(첫 편 `kasaiLcp`)이다. 줄마다 읽음 · 새로 씀을 따로 가진다. 없으면 그림이 그대로다.
   */
  readonly extra?: readonly KeyValueExtraRow[];
}

/** 값 줄 아래에 더하는 줄 하나 — 값은 `entries` 와 같은 순서다. */
export interface KeyValueExtraRow {
  /** 줄 머리(예: `lcp[k]`). */
  readonly label: string;
  /** 항목마다의 값 — `entries` 의 순서. `null` 은 아직 쓰지 않은 칸이다. */
  readonly values: readonly (MapKey | null)[];
  /** 이 줄에서 이번에 읽은 키 — 「읽음」. */
  readonly read?: readonly MapKey[];
  /** 이 줄에서 이번에 새로 쓴 키 — 「새로 씀」. */
  readonly write?: readonly MapKey[];
  /** 줄 곁말. */
  readonly side?: string;
}

/** 열 수 — 미리 잡은 자리와 항목 수 중 큰 쪽. */
export const keyValueColumns = (d: KeyValueData): number =>
  Math.max(d.entries.length, d.slots ?? 0);

/** 키 줄 · 값 줄 · ▲ 줄. 무대가 이 셋을 다른 줄 아래에 그대로 쌓는다. */
export function keyValueRows(d: KeyValueData): StageRow[] {
  const cols = keyValueColumns(d);
  const at = (key: MapKey): number =>
    d.entries.findIndex(([k]) => Object.is(k, key));
  const states: Partial<Record<number, CellState>> = {};
  const read = (d.read ?? []).map(at).filter((i) => i >= 0);
  for (const i of read) states[i] = "read";
  for (const i of (d.write ?? []).map(at)) if (i >= 0) states[i] = "focus";
  const pad = <T,>(xs: readonly T[]): (T | null)[] => [
    ...xs,
    ...new Array<null>(Math.max(0, cols - xs.length)).fill(null),
  ];
  // 더하는 줄은 줄마다 제 상태를 가진다. ▲ 는 값 줄과 더한 줄에서 읽은 키의 열 전부에 선다.
  const extraRows: StageRow[] = (d.extra ?? []).map((row) => {
    const rowStates: Partial<Record<number, CellState>> = {};
    for (const i of (row.read ?? []).map(at)) if (i >= 0) rowStates[i] = "read";
    for (const i of (row.write ?? []).map(at))
      if (i >= 0) rowStates[i] = "focus";
    return {
      kind: "cells",
      label: row.label,
      values: pad(row.values),
      states: rowStates,
      ...(row.side === undefined ? {} : { side: row.side }),
    };
  });
  const extraRead = (d.extra ?? []).flatMap((row) =>
    (row.read ?? []).map(at).filter((i) => i >= 0),
  );
  const caret =
    extraRead.length === 0
      ? read
      : [...new Set([...read, ...extraRead])].sort((x, y) => x - y);
  return [
    {
      kind: "cells",
      label: d.keyLabel,
      values: pad(d.entries.map(([k]) => k)),
      states,
      side: `키 ${d.entries.length} 개`,
    },
    {
      kind: "cells",
      label: d.valueLabel,
      values: pad(d.entries.map(([, v]) => v)),
      states,
    },
    ...extraRows,
    { kind: "caret", cells: caret, side: d.note },
  ];
}

export interface KeyValueTableProps extends KeyValueData {
  readonly title: string;
}

/** 정적 그림 한 장 — 해시 맵 하나의 키 줄 · 값 줄 · ▲ 줄. */
export function KeyValueTable({
  title,
  ...data
}: KeyValueTableProps): ReactElement {
  return (
    <CellStage
      title={title}
      rows={keyValueRows(data)}
      columns={keyValueColumns(data)}
    />
  );
}
