# Product Requirements Document (PRD)
## ProjectFlow — AI-Powered Project Management System
### v2.0 — Two-Phase Build Strategy

**Version:** 2.0
**Date:** June 2026
**Author:** dev_lox
**Status:** Active

---

## Document Strategy

This PRD is structured around two sequential phases:

- **Phase 1 — Resume-worthy MVP:** A fully deployed, working product covering core project management, real-time collaboration, and file handling. Buildable in ~9 days. Sufficient to discuss confidently in any placement interview.
- **Phase 2 — Advanced engineering:** Layered on top of a working Phase 1. Adds AI, background jobs, document editing, email, caching, testing, and CI/CD. This is what separates the project from "impressive student work" to "production-grade system."

**The rule:** Phase 1 must be deployed and demo-able before Phase 2 begins. A half-finished Phase 2 does not replace a working Phase 1.

---

## 1. Product Overview

ProjectFlow is a full-stack project management web application for small software teams. It gives teams a unified space for tasks, real-time collaboration, file sharing, documentation, and an AI assistant that understands the project's context.

Inspired by Basecamp (for team communication structure) and Notion (for docs flexibility), but purpose-built for developers — lightweight, fast, and not over-engineered.

---

## 2. Problem Statement

Small development teams fragment their work across Jira (tasks), Notion (docs), Slack (communication), and Google Drive (files). Context-switching between these tools is the main bottleneck to shipping fast. There is no tool that is simultaneously lightweight enough for a 3-person team and powerful enough for a 10-person one.

---

## 3. Target Users

**Primary:** Software development teams of 2–10 people, indie developers, and freelancers managing client projects.

**Secondary:** CS students managing group projects; solo developers tracking personal work systematically.

---

## 4. User Personas

### Persona 1 — Raj (Team Lead)
Needs to know who is working on what, what is blocked, and what ships this week — without asking. Currently checks three tools every morning to assemble a status update manually.

### Persona 2 — Sara (Developer)
Needs unambiguous task descriptions with attached files, clear deadlines, and a way to write technical docs that lives next to the task it describes. Would ask an AI chatbot "what is mine today?" rather than triaging a board manually.

### Persona 3 — External Stakeholder (view-only)
Needs passive visibility into project progress. Does not want to join another tool or learn another interface.

---

## 5. Success Metrics

| Metric | Phase 1 Target | Phase 2 Target |
|--------|---------------|----------------|
| Onboarding time | Create project + invite member + first task < 5 min | Same |
| Real-time latency | Board update visible to all members < 500ms | < 200ms |
| Page load | < 3s on 4G | < 2s on 4G |
| AI response | — | First token < 1.5s |
| Uptime | 99% (Render free tier) | 99.5% |
| Cold start | < 60s (UptimeRobot keeps alive) | < 5s (upgraded tier or warm) |

---

## 6. Phase 1 — Resume-worthy MVP

**Scope goal:** A deployed, working application that demonstrates full-stack competence, real-time systems, auth patterns, and database design. Enough to open in an interview and walk through live.

**Estimated build time:** 9 days

### 6.1 Authentication and Users

| ID | Feature | Notes |
|----|---------|-------|
| AUTH-01 | Email + password registration | With email format validation |
| AUTH-02 | JWT login (access + refresh token) | httpOnly cookie for refresh, 15m / 7d expiry |
| AUTH-03 | Token refresh flow | Axios interceptor handles silently |
| AUTH-04 | Logout | Clears Redis key + cookie |
| AUTH-05 | User profile (name, avatar) | Avatar uploaded to Cloudflare R2 |
| AUTH-06 | Google OAuth | Via Passport.js — sign in with Google |

### 6.2 Projects

| ID | Feature | Notes |
|----|---------|-------|
| PROJ-01 | Create / edit / delete project | Name, description, colour |
| PROJ-02 | Invite members via shareable link | No email sending in Phase 1 |
| PROJ-03 | Role-based access: owner / admin / member / viewer | Enforced on every route |
| PROJ-04 | Remove members | Admin+ only |
| PROJ-05 | Project list dashboard | Cards showing name, member count, open tasks |
| PROJ-06 | Project archiving | Soft delete |

### 6.3 Tasks

| ID | Feature | Notes |
|----|---------|-------|
| TASK-01 | Create / edit / delete tasks | Title, description, priority, due date |
| TASK-02 | Kanban board — 4 columns | Todo → In Progress → Review → Done |
| TASK-03 | Drag and drop | Between columns and within columns — @dnd-kit |
| TASK-04 | Assign to members | Multiple assignees |
| TASK-05 | Priority labels | Low / Medium / High / Urgent |
| TASK-06 | Due dates | With visual overdue indicator |
| TASK-07 | Subtasks | Checkbox list inside task detail |
| TASK-08 | Labels / tags | Custom per project |
| TASK-09 | Task comments | Text only in Phase 1 |
| TASK-10 | Task activity log | Every field change recorded |
| TASK-11 | List view | Sortable by date, priority, assignee |
| TASK-12 | File attachments | Upload to Cloudflare R2, shown on task |

### 6.4 Real-time Collaboration

| ID | Feature | Notes |
|----|---------|-------|
| RT-01 | Live kanban board | Cards move/appear/disappear in real-time for all members |
| RT-02 | Presence indicators | Avatars showing who is currently viewing the project |
| RT-03 | In-app notifications | Bell icon with unread count, notification list |
| RT-04 | Real-time notification delivery | New notification appears instantly without refresh |

### 6.5 Deployment (Phase 1)

| Item | Service | Cost |
|------|---------|------|
| Frontend | Vercel | Free |
| Backend | Render | Free (750 hrs/month) |
| Database | MongoDB Atlas M0 | Free (512 MB) |
| File storage | Cloudflare R2 | Free (10 GB) |
| Keep-alive | UptimeRobot | Free (pings every 5 min) |
| Auth (OAuth) | Google Cloud Console | Free |

**Total Phase 1 cost: $0/month**

---

## 7. Phase 2 — Advanced Engineering

**Scope goal:** Transform the working Phase 1 into a production-grade system with background jobs, AI, document editing, email, search, testing, and CI/CD. Each addition is a discrete layer that does not break what already works.

**Prerequisite:** Phase 1 is deployed and working.

**Estimated build time:** 9 additional days

### 7.1 Background Jobs and Email

| ID | Feature | Notes |
|----|---------|-------|
| BG-01 | Redis cache layer | Projects, tasks, user profiles cached with TTL |
| BG-02 | BullMQ job queue | Redis-backed, retry with exponential backoff |
| BG-03 | Email notifications | Resend API — invite, task assigned, deadline approaching |
| BG-04 | Deadline reminder CRON | Runs daily at 9 AM, finds tasks due tomorrow |
| BG-05 | AI embedding queue | Async indexing of tasks/docs after save |

### 7.2 Document Editor

| ID | Feature | Notes |
|----|---------|-------|
| DOC-01 | Rich text editor (Tiptap) | Bold, italic, headings, code blocks, lists, images |
| DOC-02 | Auto-save (debounced 2s) | No manual save needed |
| DOC-03 | Nested pages | Tree structure in sidebar |
| DOC-04 | Collaborative editing | Y.js + Socket.io — multiple users editing simultaneously |
| DOC-05 | Image embed | Upload image to R2, embed in doc |

### 7.3 AI Chatbot

| ID | Feature | Notes |
|----|---------|-------|
| AI-01 | Project-scoped chat | Sidebar panel per project |
| AI-02 | Context retrieval | MongoDB Atlas Full-Text Search pulls relevant tasks/docs |
| AI-03 | Streaming response | Tokens stream via SSE, typewriter effect |
| AI-04 | Conversation memory | Last 6 turns kept in context |
| AI-05 | Rate limiting | 20 requests/user/hour via Redis counter |
| AI-06 | AI response caching | Identical queries cached 5 min in Redis |

**AI provider:** OpenRouter (free models — `meta-llama/llama-3.1-8b-instruct:free`)
**No Pinecone / no paid embeddings** — MongoDB Atlas Search used for context retrieval

### 7.4 Search

| ID | Feature | Notes |
|----|---------|-------|
| SEARCH-01 | Global search | Tasks, docs, members across all user's projects |
| SEARCH-02 | Scoped search | Filter by project, status, assignee, date |
| SEARCH-03 | Atlas Search index | Set up on tasks + docs collections |

### 7.5 Message Board

| ID | Feature | Notes |
|----|---------|-------|
| MSG-01 | Project message threads | Basecamp-style announcements |
| MSG-02 | Thread replies | Nested comments on each thread |
| MSG-03 | @mentions | Triggers in-app + email notification |

### 7.6 Analytics Dashboard

| ID | Feature | Notes |
|----|---------|-------|
| DASH-01 | My Tasks view | All tasks assigned to current user across all projects |
| DASH-02 | Project progress | % tasks completed per project |
| DASH-03 | Activity feed | Chronological log per project |
| DASH-04 | Task stats chart | Recharts — tasks by status, by priority |

### 7.7 Testing and Quality

| ID | Feature | Notes |
|----|---------|-------|
| TEST-01 | API integration tests | Jest + Supertest, mongodb-memory-server |
| TEST-02 | Unit tests | Auth utils, middleware, notification service |
| TEST-03 | Error boundaries | React error boundaries, global Express error handler |
| TEST-04 | Security audit | Helmet, CORS whitelist, rate limiting, input validation review |

### 7.8 CI/CD

| ID | Feature | Notes |
|----|---------|-------|
| CICD-01 | GitHub Actions pipeline | Runs tests on every push to main |
| CICD-02 | Auto-deploy backend | Railway or Render deploy on test pass |
| CICD-03 | Auto-deploy frontend | Vercel auto-deploys on push (already built-in) |

### 7.9 Phase 2 Additional Services

| Item | Service | Cost |
|------|---------|------|
| Cache + queues | Upstash Redis | Free (10k commands/day) |
| Email | Resend | Free (3k/month) |
| AI | OpenRouter | Free (rate-limited free models) |
| Search | MongoDB Atlas Search | Free (included with M0) |

**Total Phase 2 additional cost: $0/month**

---

## 8. Out of Scope (Both Phases)

- Mobile native app
- Billing / subscriptions (Stripe)
- GitHub / Jira integrations
- Time tracking
- Video calls
- Offline / PWA mode
- Gantt chart view

---

## 9. Core User Flows

### Flow 1 — New user creates a project and assigns a task (Phase 1)
1. User registers with email + password → lands on empty dashboard
2. Clicks "New Project" → enters name + colour → project created
3. Copies invite link → sends to teammate → teammate joins as member
4. Creates task → assigns to teammate → sets priority + deadline → places in Todo column
5. Teammate opens the board → sees task appear in real-time (Socket.io)
6. Teammate drags task to "In Progress" → first user sees it move instantly
7. Notification badge updates for both users

### Flow 2 — AI chatbot answers a project question (Phase 2)
1. User opens project → clicks AI chat icon in sidebar
2. Types: "What is overdue in this sprint?"
3. Backend queries MongoDB Atlas Search for tasks matching "overdue" scoped to projectId
4. Prompt built: system instructions + retrieved tasks + conversation history + user message
5. OpenRouter (Llama 3.1 8B free) called with streaming
6. Response streams token-by-token into the chat panel
7. Session saved to MongoDB for next-turn memory

### Flow 3 — Background email on task assignment (Phase 2)
1. User assigns task to teammate
2. Controller saves task → immediately pushes job to BullMQ email queue
3. Returns 200 to client instantly (no blocking)
4. Worker picks up job → calls Resend API → teammate receives email
5. If Resend fails, BullMQ retries 3 times with exponential backoff

---

## 10. Non-Functional Requirements

### Phase 1
| Requirement | Target |
|------------|--------|
| API response time | < 300ms p95 (non-AI) |
| WebSocket event delivery | < 500ms |
| HTTPS | Enforced by Vercel + Render |
| Input validation | Zod on all request bodies |
| Password storage | bcrypt, saltRounds 12 |
| CORS | Whitelist frontend domain only |

### Phase 2 additions
| Requirement | Target |
|------------|--------|
| Cache hit rate | > 60% for repeated project/task reads |
| AI first token | < 1.5s |
| Email delivery | < 30s from trigger event |
| Test coverage | > 60% of API routes have integration tests |
| Rate limiting | Auth: 5 req/min, AI: 20 req/hr, Global: 100 req/15min |

---

## 11. Risks and Mitigations

| Risk | Affects | Impact | Mitigation |
|------|---------|--------|-----------|
| Render cold starts | Phase 1 | Medium | UptimeRobot free pings every 5 min |
| Socket.io complexity | Phase 1 | High | Tackle Day 7–8 with full focus; rooms pattern is well-documented |
| Y.js collab editing | Phase 2 | High | If too complex, ship single-user docs first and add collab in v1.1 |
| OpenRouter free model quality | Phase 2 | Low | Switch to a different free model if responses are poor |
| Scope creep in Phase 1 | Phase 1 | High | Nothing from Phase 2 list enters Phase 1 — hard rule |
| Time — placement interviews July 2026 | Both | High | Phase 1 ships first. Phase 2 is additive, not a blocker |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| JWT | JSON Web Token — signed credential for API authentication |
| RBAC | Role-Based Access Control |
| SSE | Server-Sent Events — server pushes data to client over HTTP |
| CRDT | Conflict-free Replicated Data Type — Y.js uses this for collaborative editing |
| BullMQ | Redis-backed job queue for Node.js |
| RAG | Retrieval-Augmented Generation — pulling relevant data before calling AI |
| Atlas Search | MongoDB's built-in full-text search, free with any Atlas cluster |