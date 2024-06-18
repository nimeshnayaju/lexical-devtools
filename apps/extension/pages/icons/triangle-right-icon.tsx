import { SVGAttributes } from "react";

export default function TriangleRightIcon(props: SVGAttributes<SVGElement>) {
  const { color = "currentColor" } = props;
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 11L6 4L10.5 7.5L6 11Z"
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
