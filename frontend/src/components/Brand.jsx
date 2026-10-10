import { Orbit } from "lucide-react";

export function BrandMark({ large = false }) {
  return (
    <span className={`brand-mark${large ? " brand-mark-large" : ""}`} aria-hidden="true">
      <Orbit size={large ? 25 : 19} strokeWidth={1.8} />
    </span>
  );
}

export function BrandName() {
  return (
    <span className="brand-name">
      zenvora<span> AI</span>
    </span>
  );
}
