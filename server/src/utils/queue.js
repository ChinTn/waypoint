import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Notification } from '../models/notification.model.js';
import { getIO } from '../socket.js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires this
});

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Create the Queue
export const notificationQueue = new Queue('notificationQueue', { connection });

// 2. Create the Worker (Background Processor)
export const notificationWorker = new Worker(
  'notificationQueue',
  async (job) => {
    const data = job.data;
    console.log(`[BullMQ] Processing notification job: ${job.id}`);

    try {
      // 1. Save to MongoDB
      const notification = await Notification.create({
        recipient: data.recipientId,
        type: data.type,
        message: data.message,
        projectId: data.projectId,
        taskId: data.taskId,
        actor: data.actorId,
      });

      // 2. Populate the actor's name and avatar so the frontend can display them instantly
      const populated = await Notification.findById(notification._id)
          .populate("actor", "fullName avatar")
          .populate("projectId", "name")
          .lean();

      // 3. Emit real-time socket event
      const io = getIO();
      if (io) {
          const roomName = `user_${data.recipientId.toString()}`;
          console.log(`[BullMQ] Emitting to room "${roomName}", type: ${data.type}`);
          io.to(roomName).emit("new_notification", populated);
      }

      console.log(`[BullMQ] Notification created successfully for user ${data.recipientId}`);
      return notification;
    } catch (error) {
      console.error(`[BullMQ] Error processing notification:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  { connection }
);

// Event listeners for monitoring
notificationWorker.on('completed', (job) => {
  console.log(`[BullMQ] Notification Job ${job.id} has completed!`);
});

notificationWorker.on('failed', (job, err) => {
  console.log(`[BullMQ] Notification Job ${job.id} has failed with ${err.message}`);
});

// ==========================================
// EMAIL QUEUE & WORKER
// ==========================================

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
  { connection }
);

emailWorker.on('completed', (job) => {
    const latency = Date.now() - job.timestamp;
    console.log(`[BullMQ] ⏱️ Email Job ${job.id} delivered in ${latency}ms`);
});
emailWorker.on('failed', (job, err) => console.log(`[BullMQ] Email Job ${job.id} failed: ${err.message}`));
