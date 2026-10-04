import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { BAR_HEIGHT, createBarShape } from "./barShape";

const ICON_SIZE = 24;
const ACTIVE_ICON_SIZE = 26;
// How far the selected tab's label moves up toward the circle.
const LABEL_LIFT = 12;
const SLIDE_MS = 400;

const pop = keyframes`
  0%   { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const reducedMotion = { "@media (prefers-reduced-motion: reduce)": { animation: "none", transition: "none" } };

const easeInOutCubic = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Width of the element in `ref`, kept up to date as it resizes. */
function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**
 * Floating bottom navigation bar whose selected tab is shown in a circle that
 * sits in a curved notch; the notch and circle slide between tabs.
 *
 * `tabs` is a list of `{ label, icon }`, where `icon` is a Phosphor icon
 * component (it must accept `size` and `weight`).
 */
export default function CurvedBottomNav({
  tabs,
  value,
  onChange,
  activeColor = "#5b13b0",
  inactiveColor = "#a1a1aa",
  maxWidth = 480,
}) {
  const navRef = useRef(null);
  const pathRef = useRef(null);
  const circleRef = useRef(null);
  const width = useElementWidth(navRef);
  const shape = useMemo(() => (width > 0 ? createBarShape(width, tabs.length) : null), [width, tabs.length]);

  // Position of the notch in tab units (fractional while sliding). The slide is
  // drawn straight to the DOM so it doesn't re-render React on every frame.
  const posRef = useRef(value);
  const draw = useCallback(
    (pos) => {
      if (!shape) return;
      const cx = ((pos + 0.5) / tabs.length) * width;
      pathRef.current.setAttribute("d", shape.path(cx));
      circleRef.current.style.transform = `translateX(${cx - shape.circleSize / 2}px)`;
    },
    [shape, width, tabs.length],
  );

  // Redraw in place when the size changes.
  useLayoutEffect(() => draw(posRef.current), [draw]);

  // Slide to the newly selected tab.
  useEffect(() => {
    const from = posRef.current;
    if (from === value || prefersReducedMotion()) {
      posRef.current = value;
      draw(value);
      return;
    }
    let start;
    let frame;
    const step = (now) => {
      start ??= now;
      const k = Math.min((now - start) / SLIDE_MS, 1);
      posRef.current = from + (value - from) * easeInOutCubic(k);
      draw(posRef.current);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, draw]);

  const ActiveIcon = tabs[value].icon;

  return (
    <Box
      component="nav"
      aria-label="Main"
      ref={navRef}
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth,
        mx: "auto",
        height: BAR_HEIGHT,
        filter: "drop-shadow(0 6px 16px rgba(60, 20, 100, 0.18))",
      }}
    >
      <Box
        component="svg"
        aria-hidden
        width={width}
        height={BAR_HEIGHT}
        sx={{ position: "absolute", top: 0, left: 0, display: "block" }}
      >
        <path ref={pathRef} fill="#fff" />
      </Box>

      {/* Floating circle; its horizontal position is set by draw() */}
      <Box
        ref={circleRef}
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          top: shape?.circleTop ?? 0,
          width: shape?.circleSize ?? 0,
          height: shape?.circleSize ?? 0,
          visibility: shape ? "visible" : "hidden",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "#fff",
          color: activeColor,
          boxShadow: "0 4px 12px rgba(60, 20, 100, 0.15)",
          pointerEvents: "none",
          willChange: "transform",
        }}
      >
        <Box key={value} sx={{ display: "flex", animation: `${pop} 450ms 150ms ease-out both`, ...reducedMotion }}>
          <ActiveIcon size={Math.round(ACTIVE_ICON_SIZE * (shape?.scale ?? 1))} weight="fill" />
        </Box>
      </Box>

      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => onChange(newValue)}
        sx={{ position: "relative", height: BAR_HEIGHT, bgcolor: "transparent" }}
      >
        {tabs.map(({ label, icon: Icon }, i) => (
          <BottomNavigationAction
            key={label}
            label={label}
            disableRipple
            icon={
              // The selected icon is shown in the circle; keep its space so labels line up.
              <Box
                sx={{
                  display: "flex",
                  visibility: value === i ? "hidden" : "visible",
                  animation: value === i ? "none" : `${fadeIn} 300ms ease-out`,
                  ...reducedMotion,
                }}
              >
                <Icon size={ICON_SIZE} weight="regular" />
              </Box>
            }
            sx={{
              minWidth: 0,
              maxWidth: "none",
              gap: 0.5,
              color: inactiveColor,
              transition: "color 300ms ease",
              "&.Mui-selected": { color: activeColor },
              "& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected": {
                fontSize: 12,
                fontWeight: 600,
                transition: "transform 300ms ease",
                ...reducedMotion,
              },
              "& .MuiBottomNavigationAction-label.Mui-selected": {
                transform: `translateY(-${LABEL_LIFT}px)`,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Box>
  );
}
