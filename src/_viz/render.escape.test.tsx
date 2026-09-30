import { expect, test } from "bun:test";
import { renderToSvg } from "./render";

test("속성 값 속 < 를 이스케이프해 올바른 XML 을 낸다", async () => {
  const svg = await renderToSvg(
    <svg viewBox="0 0 10 10" aria-label="n < p">
      <text>a &lt; b</text>
    </svg>,
    "esc",
  );
  expect(svg).toContain('aria-label="n &lt; p"');
  expect(svg).not.toMatch(/="[^"]*<[^"]*"/);
});
