// Geometry for the curved bottom bar: a rounded bar with a notch under the
// selected tab, and a floating circle sitting in that notch.
// All values are in px; y grows downward from the bar's top edge.

export const BAR_HEIGHT = 64;
const BAR_RADIUS = 20;

// Floating circle around the selected icon; its bottom dips CIRCLE_SINK px
// below the bar's top edge.
const CIRCLE_SIZE = 48;
const CIRCLE_SINK = 9;
// The notch is a circular arc around the circle, joined to the top edge by large
// rounded fillets. Its center sits lower than the circle's, so the gap is
// SIDE_GAP at the sides and BOTTOM_GAP at the bottom.
const SIDE_GAP = 4;
const BOTTOM_GAP = 7;
const FILLET = 46;
const MIN_FILLET = 4;
// Flat edge kept between a top corner and the notch when there is room.
const CORNER_GAP = 4;

// On narrow screens the circle and notch shrink (down to MIN_SCALE) so the
// corners next to the first and last tab keep room to stay rounded.
const FULL_SCALE_TAB_WIDTH = 110;
const MIN_SCALE = 0.8;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Height of a quarter-circle corner of radius r, u px in from its side. */
const cornerY = (r, u) => (u < r ? r - Math.sqrt(r ** 2 - (r - u) ** 2) : 0);

/**
 * Builds the bar shape for a bar `width` px wide with `tabCount` tabs.
 * Returns the circle's size and position, and `path(cx)`, the SVG outline of
 * the bar with the notch centered at x = cx.
 */
export function createBarShape(width, tabCount) {
  const scale = clamp(width / tabCount / FULL_SCALE_TAB_WIDTH, MIN_SCALE, 1);
  const size = CIRCLE_SIZE * scale;
  const circleY = CIRCLE_SINK * scale - size / 2; // circle center
  const cy = circleY + (BOTTOM_GAP - SIDE_GAP) * scale; // notch center
  const r = size / 2 + SIDE_GAP * scale; // notch radius
  const maxFillet = FILLET * scale;

  // A fillet circle of radius f sits inside the bar touching both the top edge
  // and the notch; this is how far from the notch center it meets the edge.
  const filletDx = (f) => Math.sqrt((r + f) ** 2 - (f - cy) ** 2);

  // Largest fillet whose curve fits within `space` px of the notch center.
  const fitFillet = (space) => {
    if (space >= filletDx(maxFillet)) return maxFillet;
    return Math.max((space ** 2 - r ** 2 + cy ** 2) / (2 * (r + cy)), MIN_FILLET);
  };

  // Radius of the one circle touching the bar's side, its top edge and the
  // notch. When a full corner doesn't fit, this circle is the corner and the
  // fillet in one rounded lobe.
  const lobeRadius = (space) => {
    const b = 2 * (space + cy + r);
    const c = space ** 2 + cy ** 2 - r ** 2;
    return (b - Math.sqrt(b * b - 4 * c)) / 2;
  };

  // Top corner radius and fillet for a side `space` px from the notch center.
  const side = (space) => {
    const lobe = Math.max(lobeRadius(space), MIN_FILLET);
    if (lobe < BAR_RADIUS) return { corner: lobe, fillet: fitFillet(space - lobe) };
    const gap = Math.min(lobe - BAR_RADIUS, CORNER_GAP);
    return { corner: BAR_RADIUS, fillet: fitFillet(space - BAR_RADIUS - gap) };
  };

  // Depth of the notch at distance d from its center, with fillet f.
  const notchY = (d, f) => {
    const dx = filletDx(f);
    if (d >= dx) return 0;
    if (d >= (dx * r) / (r + f)) return f - Math.sqrt(f ** 2 - (dx - d) ** 2);
    return cy + Math.sqrt(r ** 2 - d ** 2);
  };

  // Sample x positions: fine steps around the steep corners, 1px elsewhere.
  const xs = [];
  for (let x = 0; x < BAR_RADIUS; x += 0.25) xs.push(x);
  for (let x = BAR_RADIUS; x < width - BAR_RADIUS; x += 1) xs.push(x);
  for (let x = width - BAR_RADIUS; x < width; x += 0.25) xs.push(x);
  xs.push(width);

  const path = (cx) => {
    const left = side(cx);
    const right = side(width - cx);
    const topY = (x) => {
      const notch = notchY(Math.abs(x - cx), x < cx ? left.fillet : right.fillet);
      const corner = x < width / 2 ? cornerY(left.corner, x) : cornerY(right.corner, width - x);
      return Math.round(Math.max(notch, corner) * 100) / 100;
    };

    // Top edge, skipping points in the middle of flat runs.
    const ys = xs.map(topY);
    let d = `M0 ${BAR_HEIGHT - BAR_RADIUS}`;
    for (let i = 0; i < xs.length; i++) {
      const flat = i > 0 && i < xs.length - 1 && ys[i] === ys[i - 1] && ys[i] === ys[i + 1];
      if (!flat) d += `L${xs[i]} ${ys[i]}`;
    }

    // Right side, bottom and bottom corners.
    const R = BAR_RADIUS;
    const H = BAR_HEIGHT;
    d += `L${width} ${H - R}Q${width} ${H} ${width - R} ${H}`;
    d += `L${R} ${H}Q0 ${H} 0 ${H - R}Z`;
    return d;
  };

  return { scale, circleSize: size, circleTop: circleY - size / 2, path };
}
