import { Star, StarHalf } from "lucide-react";

export function StarRating({ rating = 0, size = "md", showValue = false }) {
  const starSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const stars = [1, 2, 3, 4, 5];

  // BƯỚC QUAN TRỌNG: Ép kiểu dữ liệu chuỗi từ SQL thành Số (Number)
  // Nếu dữ liệu bị null/undefined, nó sẽ nhận giá trị mặc định là 0
  const numericRating = Number(rating) || 0;

  return (
    <div className="flex items-center gap-1">
      {stars.map((value) => {
        // Dùng numericRating thay cho rating cũ để tính toán sao cho chuẩn xác
        const isFull = numericRating >= value;
        const isHalf = numericRating >= value - 0.5 && numericRating < value;
        const Icon = isFull ? Star : isHalf ? StarHalf : Star;
        
        // Sửa màu sắc một chút cho sao trống: thêm fill-current nếu muốn sao rỗng đẹp hơn (tùy chọn)
        const colorClass = isFull || isHalf ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-slate-600";

        return (
          <Icon key={value} className={`${starSize} ${colorClass}`} />
        );
      })}
      
      {showValue && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          {/* Dùng numericRating.toFixed để không bao giờ bị lỗi nữa */}
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}