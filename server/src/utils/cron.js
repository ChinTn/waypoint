import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Task } from '../models/tasks.model.js';
import { emailQueue } from './queue.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const cronQueue = new Queue('cronQueue', { connection });

// Initialize the repeatable job
export const setupCronJobs = async () => {
  // Clear existing repeatable jobs to avoid duplicates during restarts
  const repeatableJobs = await cronQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await cronQueue.removeRepeatableByKey(job.key);
  }

  // Run every morning at 8:00 AM server time
  await cronQueue.add('dailyDeadlineCheck', {}, {
    repeat: {
      cron: '0 8 * * *',
    }
  });
  console.log('[BullMQ] ⏰ Daily deadline cron job scheduled for 8:00 AM');
};

export const cronWorker = new Worker(
  'cronQueue',
  async (job) => {
    if (job.name === 'dailyDeadlineCheck') {
      console.log('[BullMQ] ⏰ Running daily deadline check...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find all tasks due exactly tomorrow, that are not DONE
      const tasks = await Task.find({
        dueDate: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: { $nin: ['DONE'] }
      }).populate({
        path: 'assignedTo',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      }).populate('projectId', 'name');

      let emailCount = 0;

      for (const task of tasks) {
        if (!task.projectId) continue;
        
        for (const assignee of task.assignedTo) {
          if (assignee.userId && assignee.userId.email) {
            await emailQueue.add('SEND_DEADLINE_REMINDER', {
              email: assignee.userId.email,
              fullName: assignee.userId.fullName,
              taskTitle: task.title,
              projectName: task.projectId.name
            });
            emailCount++;
          }
        }
      }

      console.log(`[BullMQ] ⏰ Daily deadline check completed! Queued ${emailCount} reminder emails.`);
    }
  },
  { connection }
);
