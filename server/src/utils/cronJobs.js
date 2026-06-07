const cron = require('node-cron');
const borrowModel = require('../models/borrowModel');
const notificationModel = require('../models/notificationModel');

const startCronJobs = () => {

  cron.schedule('0 0 * * *', async () => {
    console.log('[CronJob] Start for check overdue...');
    try {
      const overdueBorrows = await borrowModel.markOverdue();
      
      if (overdueBorrows && overdueBorrows.length > 0) {
        
        for (const borrow of overdueBorrows) {
          await notificationModel.create({
            scope: 'user',
            user_id: borrow.user_id,
            borrow_id: borrow.id,
            book_id: borrow.book_id,
            type: 'overdue',
            title: 'Book is overdue now',
            message: `Your borrow #${borrow.id} for "${borrow.book_title}" is overdue. Please return the book before ${borrow.due_date} to avoid late fees (1.000 VND/day).`
          });
        }
        console.log(`[CronJob] Successfully marked ${overdueBorrows.length} overdue borrows.`);
      } else {
        console.log('[CronJob] No overdue borrows found.');
      }
    } catch (error) {
      console.error('[CronJob] Error occurred while marking overdue borrows:', error);
    }
  });
};

module.exports = startCronJobs;