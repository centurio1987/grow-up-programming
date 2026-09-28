/**
 * 로그 척도 막대 — 패키지 `BarChart`(VT-501)를 감싼 wrapper(KAN-057).
 *
 * 가이드의 규모 수치는 한 그림 안에서 30 부터 9,999,900,000 까지 벌어진다. 선형 척도면 작은 값의
 * 막대가 0 과 구별되지 않는다. `BarChart` 에는 로그 척도가 없어서, 막대 길이는 log10(값 + 1)로
 * 그리고 막대 옆 숫자는 **원래 값**으로 적는다(+1 은 값 0 을 그리기 위해서다).
 * 표를 대신하지 않는다 — 정확한 수는 곁의 표가 진다(guideline 「규모별 수치 = 표 + BarChart」).
 *
 * `BarChart` 의 여백이 고정(`PAD3` 왼쪽 48 · 오른쪽 18px)이라 두 가지를 맞춘다 — 막대 라벨은
 * 48px 안에 드는 짧은 말로(규모 `n` 은 제목에 적는다), 값의 범위는 가장 긴 막대의 1.3 배로 잡아
 * 막대 끝 숫자가 들어갈 자리를 남긴다. 여백을 넓히는 일은 bbangto-ui 승격 때 패키지에서 한다.
 * 막대는 한 가지 색이다 — 범주마다 색을 바꿀 뜻이 없고, 팔레트 색은 흑백에서 흰색이 된다.
 */

import { BarChart } from "@centurio1987/bbangto-ui-visualization";

export interface LogBar {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

export interface LogBarChartProps {
  readonly title: string;
  readonly bars: readonly LogBar[];
  readonly width?: number;
}

const fmt = new Intl.NumberFormat("en-US");
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** 축 눈금 — 로그 축이라 10 의 거듭제곱을 지수로 적는다(`10⁴`). 자릿수를 풀면 눈금끼리 겹친다. */
export function powerLabel(exp: number): string {
  const k = Math.round(exp);
  if (k === 0) return "1";
  return `10${String(k)
    .split("")
    .map((d) => SUP[Number(d)])
    .join("")}`;
}

export function LogBarChart({ title, bars, width = 560 }: LogBarChartProps) {
  const scaled = bars.map((b) => ({
    id: b.id,
    label: b.label,
    value: Math.log10(b.value + 1),
    color: "var(--bbangto-viz-ext-bar-fill)",
  }));
  const original = new Map(
    scaled.map((s, k) => [s.value, (bars[k] as LogBar).value]),
  );
  const height = 40 + bars.length * 32;
  return (
    <BarChart
      title={title}
      orientation="horizontal"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      data={{ items: scaled }}
      domain={[0, Math.max(1, ...scaled.map((s) => s.value)) * 1.3]}
      formatValue={(n) =>
        // 막대 값은 원래 값, 축 눈금은 10 의 지수.
        original.has(n) ? fmt.format(original.get(n) as number) : powerLabel(n)
      }
    />
  );
}
