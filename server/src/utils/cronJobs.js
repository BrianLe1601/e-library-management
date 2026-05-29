const cron = require('node-cron');
const borrowModel = require('../models/borrowModel');
const notificationModel = require('../models/notificationModel');

const startCronJobs = () => {
  // Chạy vào lúc 00:00 mỗi đêm
  cron.schedule('0 0 * * *', async () => {
    console.log('[CronJob] Bắt đầu quét các phiếu mượn quá hạn...');
    try {
      const overdueBorrows = await borrowModel.markOverdue();
      
      if (overdueBorrows && overdueBorrows.length > 0) {
        // Lặp qua từng phiếu mượn bị quá hạn để bắn thông báo
        for (const borrow of overdueBorrows) {
          await notificationModel.create({
            scope: 'user',
            user_id: borrow.user_id,
            borrow_id: borrow.id,
            book_id: borrow.book_id,
            type: 'overdue',
            title: 'Sách quá hạn - Cảnh báo phạt',
            message: `Phiếu mượn #${borrow.id} của bạn đã quá hạn trả sách. Vui lòng hoàn trả ngay để tránh phát sinh thêm phí phạt (1.000đ/ngày).`
          });
        }
        console.log(`[CronJob] Đã cập nhật và gửi cảnh báo cho ${overdueBorrows.length} phiếu mượn quá hạn.`);
      } else {
        console.log('[CronJob] Không có phiếu mượn nào quá hạn hôm nay.');
      }
    } catch (error) {
      console.error('[CronJob] Lỗi khi chạy tác vụ quét quá hạn:', error);
    }
  });
};

module.exports = startCronJobs;