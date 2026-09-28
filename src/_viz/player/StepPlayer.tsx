/**
 * 걸음 재생 패널 — 가이드 본문 중간에서 알고리즘을 한 걸음씩 넘겨 보인다(KAN-057 검토 지적 6).
 *
 * 생김새와 규칙은 claude-design 프로젝트 `610d30fc…` 의 「Step Player」 시안(의뢰서 2 의 답)이다.
 * 위에서 아래로 다섯 부분 — ① 머리와 걸음 배지 줄 ② 무대 ③ 걸음 설명(배지 · 제목 · 계산 알약 ·
 * 한두 문장) ④ 남는 변수 ⑤ 조작부. 무대는 알고리즘이 쌓는 **구조 전체**를 그리고 걸음마다 칸의
 * 상태만 바꾼다. 강조는 이번 걸음의 읽음과 새로 씀 둘뿐이고, 새로 쓴 칸은 다음 걸음에 끝남으로
 * 내려간다. 걸음 사이 전환은 즉시 교체다(애니메이션 없음).
 *
 * 무대 갈래는 `STAGES` 에 등록한다. 지금은 「층」 하나다 — 트리 · 그래프 · 힙 · 2 차원 표는 시안
 * 4절의 원칙을 따라 KAN-058 에서 더한다.
 *
 * 무대 높이는 첫 걸음 전에 모든 걸음의 무대 크기 중 가장 큰 것으로 고정한다(시안 규칙 5).
 */

import { VisualizationStyleGuideProvider } from "@centurio1987/bbangto-ui-visualization";
import { useEffect, useMemo, useState } from "react";
import { algoVizStyleGuide } from "../../../design/viz/algo.viz";
import { CellStage, cellStageSize, type StageRow } from "../patterns/CellStage";
import {
  type LevelsOptions,
  type LevelsStep,
  levelsCalc,
  levelsColumns,
  levelsStage,
  levelsVars,
} from "./levelsStage";
import { PLAYER_CSS } from "./playerStyle";

/** 걸음 하나에 공통으로 붙는 것. `title` 은 `T3 1 층 칸 0 만들기` 처럼 걸음 번호로 연다. */
export interface PlayerStepBase {
  readonly title: string;
  /** 한두 문장 설명. */
  readonly text: string;
}

export interface StageKind<S> {
  rows(step: S, opts: LevelsOptions): StageRow[];
  columns(step: S): number;
  calc(step: S, opts: LevelsOptions): { expr: string; result: string } | null;
  vars(step: S): string | null;
}

const levels: StageKind<LevelsStep> = {
  rows: levelsStage,
  columns: levelsColumns,
  calc: levelsCalc,
  vars: levelsVars,
};

export const STAGES = { levels } as const;
export type StageName = keyof typeof STAGES;

/** `.sim.ts` 가 내보내는 패널 하나. `player: "stage"` 가 이 패널을 고른다. */
export interface PlayerSpec extends LevelsOptions {
  readonly player: "stage";
  readonly stage: StageName;
  readonly title: string;
  readonly sub?: string;
  readonly result?: string;
  readonly steps: readonly (PlayerStepBase & LevelsStep)[];
}

export const isPlayerSpec = (spec: unknown): spec is PlayerSpec =>
  typeof spec === "object" &&
  spec !== null &&
  (spec as { player?: unknown }).player === "stage";

/** 제목 머리의 걸음 번호와 나머지를 가른다. */
export function splitTitle(title: string): { id: string; rest: string } {
  const m = /^(T\d+)\s*(.*)$/.exec(title.trim());
  return m ? { id: m[1] as string, rest: m[2] ?? "" } : { id: "", rest: title };
}

/** 정적 그림과 패널이 같은 무대를 쓰도록 걸음마다 줄을 만든다. */
export function playerFrames(spec: PlayerSpec) {
  const kind = STAGES[spec.stage];
  return spec.steps.map((s) => {
    const { id, rest } = splitTitle(s.title);
    return {
      id,
      title: rest,
      text: s.text,
      rows: kind.rows(s, spec),
      columns: kind.columns(s),
      calc: kind.calc(s, spec),
      vars: kind.vars(s),
    };
  });
}

const PLAY_MS = 1200;

function useDark(): boolean {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(
    () => typeof matchMedia === "function" && matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(query);
    const on = () => setDark(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return dark;
}

export function StepPlayer(spec: PlayerSpec) {
  const frames = useMemo(() => playerFrames(spec), [spec]);
  const columns = frames[0]?.columns ?? 0;
  const size = useMemo(
    () =>
      cellStageSize(
        frames.map((f) => f.rows),
        columns,
      ),
    [frames, columns],
  );
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const dark = useDark();
  const last = frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (at >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setAt((n) => Math.min(last, n + 1)), PLAY_MS);
    return () => clearTimeout(t);
  }, [playing, at, last]);

  const go = (n: number) => {
    setPlaying(false);
    setAt(Math.max(0, Math.min(last, n)));
  };
  const cur = frames[at];
  if (!cur) return null;
  const first = frames[0]?.id ?? "";
  const lastId = frames[last]?.id ?? "";

  return (
    <section
      className="gs-player"
      aria-label={spec.title}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 패널에 포커스가 있을 때 ← → 로 걸음을 넘긴다(시안 조작 규칙)
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(at - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(at + 1);
        }
      }}
    >
      <style>{PLAYER_CSS}</style>
      <div className="gs-player-head">
        <div className="gs-player-title">
          <b>{spec.title}</b>
          <span>
            {spec.sub ?? `${first}–${lastId} · ${frames.length} 걸음`}
          </span>
        </div>
        <div className="gs-player-badges">
          {frames.map((f, n) => (
            <button
              key={f.id}
              type="button"
              className="gs-player-badge"
              data-state={n < at ? "done" : n === at ? "current" : "todo"}
              aria-current={n === at ? "step" : undefined}
              onClick={() => go(n)}
            >
              {f.id}
            </button>
          ))}
        </div>
      </div>
      <div
        className="gs-player-stage"
        style={{ height: `${size.height + 16}px` }}
      >
        <VisualizationStyleGuideProvider
          styleGuide={algoVizStyleGuide}
          foundationKey={dark ? "dark" : "light"}
        >
          <div style={{ width: `${size.width}px` }}>
            <CellStage
              title={`${cur.id} ${cur.title}`}
              rows={cur.rows}
              columns={columns}
            />
          </div>
        </VisualizationStyleGuideProvider>
      </div>
      <div className="gs-player-desc" aria-live="polite">
        <div className="gs-player-desc-head">
          <span className="gs-player-desc-id">{cur.id}</span>
          <span className="gs-player-desc-title">{cur.title}</span>
          {cur.calc ? (
            <span className="gs-player-pill">
              {cur.calc.expr}
              <b>{cur.calc.result}</b>
            </span>
          ) : null}
        </div>
        <p>{cur.text}</p>
      </div>
      <div className="gs-player-vars">
        남는 변수
        {cur.vars ? (
          <span>{cur.vars}</span>
        ) : (
          <em>없음 — 필요한 값이 모두 무대에 있습니다</em>
        )}
      </div>
      <div className="gs-player-ctrl">
        <button
          type="button"
          title="처음으로"
          aria-label="처음으로"
          disabled={at === 0}
          onClick={() => go(0)}
        >
          ⏮
        </button>
        <button
          type="button"
          title="이전"
          aria-label="이전 걸음"
          disabled={at === 0}
          onClick={() => go(at - 1)}
        >
          ◀
        </button>
        <button
          type="button"
          className="gs-player-play"
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (at >= last) setAt(0);
              setPlaying(true);
            }
          }}
        >
          {playing ? "❚❚ 멈춤" : "▶ 재생"}
        </button>
        <button
          type="button"
          title="다음"
          aria-label="다음 걸음"
          disabled={at === last}
          onClick={() => go(at + 1)}
        >
          ▶
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={at}
          aria-label="걸음"
          onChange={(e) => go(Number(e.currentTarget.value))}
        />
        <span className="gs-player-count">
          {at + 1} / {frames.length}
        </span>
      </div>
    </section>
  );
}
