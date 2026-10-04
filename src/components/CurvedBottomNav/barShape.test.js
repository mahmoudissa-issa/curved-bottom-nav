import { test, expect } from "vitest";
import { BAR_HEIGHT, createBarShape } from "./barShape";

// Top-edge y values of a path, in order.
const topEdge = (d) => [...d.matchAll(/L([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);

test.each([480, 358, 300])("outline stays inside the bar at width %i", (width) => {
  const shape = createBarShape(width, 4);
  for (let tab = 0; tab < 4; tab++) {
    const points = topEdge(shape.path(((tab + 0.5) / 4) * width));
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(BAR_HEIGHT);
    }
  }
});

test.each([480, 358, 300])("outline changes smoothly while sliding at width %i", (width) => {
  const shape = createBarShape(width, 4);
  // Height of the top edge at x, from a path (flat runs are interpolated).
  const heightAt = (points, x) => {
    const i = points.findIndex(([px]) => px >= x);
    const [x1, y1] = points[i];
    if (x1 === x || i === 0) return y1;
    const [x0, y0] = points[i - 1];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  };
  let prev = null;
  for (let cx = width / 8; cx <= (width * 7) / 8; cx += 0.5) {
    const points = topEdge(shape.path(cx));
    if (prev) {
      for (let x = 0; x <= width; x += 1) {
        expect(Math.abs(heightAt(points, x) - heightAt(prev, x))).toBeLessThan(1);
      }
    }
    prev = points;
  }
});

test("circle shrinks on narrow bars", () => {
  expect(createBarShape(480, 4).circleSize).toBe(48);
  expect(createBarShape(300, 4).circleSize).toBeLessThan(48);
});
