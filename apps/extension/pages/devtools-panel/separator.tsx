import { HTMLAttributes } from "react";

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export default function Separator(props: SeparatorProps) {
  const { children, orientation = "horizontal", ...divProps } = props;

  return (
    <div
      data-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      role="separator"
      {...divProps}
    >
      {children}
    </div>
  );
}
