import { Star, StarHalf } from "lucide-react";

export function StarRating({ rating = 0, size = "md", showValue = false }) {
  const starSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((value) => {
        const isFull = rating >= value;
        const isHalf = rating >= value - 0.5 && rating < value;
        const Icon = isFull ? Star : isHalf ? StarHalf : Star;
        const colorClass = isFull || isHalf ? "text-yellow-400" : "text-gray-300 dark:text-slate-600";

        return (
          <Icon key={value} className={`${starSize} ${colorClass}`} />
        );
      })}
      {showValue && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
