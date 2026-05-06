interface SparkleIconProps {
  size?: number;
  className?: string;
}

export default function SparkleIcon({
  size = 20,
  className = "",
}: SparkleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path
        d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"
        opacity="0.6"
      />
      <path
        d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z"
        opacity="0.4"
      />
    </svg>
  );
}
