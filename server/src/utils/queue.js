import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// FIRE-AND-FORGET EMAIL HELPER
// Previously this used BullMQ (Redis queue → Worker → send email).
// BullMQ's internal polling consumed ~100k Redis commands/day even when idle,
// which is incompatible with Upstash's 500k/month free tier.
// Now we send emails directly using a simple async function — 0 Redis commands.

export const sendEmail = async (type, data) => {
    try {
        let response;

        if (type === 'SEND_INVITE_EMAIL') {
            response = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: data.email,
                subject: `You're invited to join ${data.projectName} on Waypoint!`,
                html: `<p>Hello,</p><p>You have been invited to collaborate on the project <strong>${data.projectName}</strong>.</p><p>Click the link below to join:</p><a href="${data.inviteLink}">${data.inviteLink}</a>`
            });
        } else if (type === 'SEND_ASSIGNMENT_EMAIL') {
            response = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: data.email,
                subject: `New Task Assigned: ${data.taskTitle}`,
                html: `<p>Hello ${data.fullName},</p><p>You have been assigned a new task: <strong>${data.taskTitle}</strong> in the project <strong>${data.projectName}</strong>.</p><p>Priority: <strong>${data.priority}</strong></p>`
            });
        }

        if (response && response.error) {
            throw new Error(response.error.message);
        }

        console.log(`[Email] ✅ ${type} sent successfully to ${data.email}`);
    } catch (error) {
        // Never let email failures crash the main request
        console.error(`[Email] ❌ Failed to send ${type}:`, error.message);
    }
};

// Fire-and-forget wrapper — call this from controllers
// It starts the email send but does NOT await it, so the HTTP response is not blocked
export const sendEmailInBackground = (type, data) => {
    sendEmail(type, data);
};
