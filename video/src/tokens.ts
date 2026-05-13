import { Easing } from "remotion";

export const colors = {
  page: "#ffffff",
  rose: "#fff1f2",
  redLine: "rgba(254, 202, 202, 0.7)",
  red500: "#ef4444",
  red600: "#dc2626",
  red700: "#b91c1c",
  red50: "#fef2f2",
  ink: "#111827",
  body: "#202124",
  meta: "#5f6368",
  border: "#e8eaed",
  borderSoft: "#f1f3f4",
  ringSoft: "rgba(17,17,17,0.06)",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray700: "#374151",
  gray900: "#111827",
};

export const ease = {
  enterCrisp: Easing.bezier(0.16, 1, 0.3, 1),
  editorial: Easing.bezier(0.45, 0, 0.55, 1),
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  smoothIn: Easing.bezier(0.22, 1, 0.36, 1),
};
