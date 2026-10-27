import { encode } from "uqr";

/** A scannable QR code drawn as one SVG path (no injected HTML). */
export function QrCode({ text, label, size = 200 }: { text: string; label: string; size?: number }) {
  const { data, size: cells } = encode(text, { border: 2, ecc: "M" });
  let d = "";
  data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return (
    <svg
      className="qr"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${cells} ${cells}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      <rect width={cells} height={cells} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
