import { display } from "../fonts";

export function NVMark({ size = 24 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: display,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.02em",
        color: "#111827",
        lineHeight: 1,
      }}
    >
      NV
    </span>
  );
}
