import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires this
});

const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// EMAIL QUEUE & WORKER (BullMQ is perfect for emails — they're slow and can retry)
// ==========================================
// NOTE: Notifications NO LONGER go through BullMQ. They are now saved + emitted
// directly in createNotification.js (same pattern as task_updated) because
// Upstash's serverless Redis drops the persistent connection BullMQ workers need.

export const emailQueue = new Queue('emailQueue', { connection });

export const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const data = job.data;
    console.log(`[BullMQ] Processing email job: ${job.name}`);

    try {
      let response;
      if (job.name === 'SEND_INVITE_EMAIL') {
          response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: data.email,
            subject: `You're invited to join ${data.projectName} on Waypoint!`,
            html: `<p>Hello,</p><p>You have been invited to collaborate on the project <strong>${data.projectName}</strong>.</p><p>Click the link below to join:</p><a href="${data.inviteLink}">${data.inviteLink}</a>`
          });
      } else if (job.name === 'SEND_ASSIGNMENT_EMAIL') {
          response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: data.email,
            subject: `New Task Assigned: ${data.taskTitle}`,
            html: `<p>Hello ${data.fullName},</p><p>You have been assigned a new task: <strong>${data.taskTitle}</strong> in the project <strong>${data.projectName}</strong>.</p><p>Priority: <strong>${data.priority}</strong></p>`
          });
      } else if (job.name === 'SEND_DEADLINE_REMINDER') {
          response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: data.email,
            subject: `Action Required: Task "${data.taskTitle}" is due tomorrow!`,
            html: `<p>Hello ${data.fullName},</p><p>This is a friendly reminder that your task <strong>${data.taskTitle}</strong> in the project <strong>${data.projectName}</strong> is due tomorrow.</p>`
          });
      }

      if (response && response.error) {
          throw new Error(response.error.message);
      }

      console.log(`[BullMQ] Email sent successfully for job ${job.name}`);
    } catch (error) {
      console.error(`[BullMQ] Error sending email:`, error);
      throw error;
    }
  },
  { connection, settings: { stalledInterval: 60000 }, drainDelay: 30 }
);

emailWorker.on('completed', (job) => {
    const latency = Date.now() - job.timestamp;
    console.log(`[BullMQ] ⏱️ Email Job ${job.id} delivered in ${latency}ms`);
});
emailWorker.on('failed', (job, err) => console.log(`[BullMQ] Email Job ${job.id} failed: ${err.message}`));
