import api from "./api";
 
const reviewService = {
  // POST hoặc PUT — backend tự xử lý upsert (đã rate thì update, chưa thì insert)
  submitRating: ({ book_id, rating, comment = "" }) =>
    api.post("/reviews", { book_id, rating, comment }),
 
  // Lấy review của user hiện tại cho 1 cuốn sách
  getMyReview: (book_id) =>
    api.get(`/reviews/my/${book_id}`),
};
 
export default reviewService;
 