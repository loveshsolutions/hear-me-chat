import React, { ReactNode } from "react";

interface LayoutFixProps {
  children?: ReactNode;
}

export default function LayoutFix({ children }: LayoutFixProps) {
  return (
    <div
      id="app-root"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        isolation: "isolate"
      }}
    >
      {children}
    </div>
  );
}