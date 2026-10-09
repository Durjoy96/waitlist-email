# waitlist-email

A self-hosted waitlist email collection backend built with **Next.js 16** and **MongoDB**. Deploy it once, then collect emails from any website by dropping in a plain HTML `<form>`.

> **Fastest way to get started → `npx create-waitlist-email`**
> The CLI scaffolds a new project on your hosted backend and hands you a ready-to-paste form snippet in seconds. Manual setup is documented below.

---

## How it works

```
Your Website                   This Backend (Vercel)              MongoDB
────────────────────           ────────────────────────           ────────────────
<form action="..."> ──POST──▶  POST /api/collect/:id   ──────▶   emails collection
</form>                        POST /api/projects        ──────▶   projects collection
                               (protected by x-api-key)
```

1. **Deploy this repo** once (Vercel, Railway, any Node host).
2. **Run `npx create-waitlist-email`** to register a named project on your backend.
3. **Paste the returned `<form>` snippet** into any page — HTML, React, Webflow, whatever.
4. Emails land directly in your MongoDB database, namespaced by project.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDurjoy96%2Fwaitlist-email&env=MONGODB_URI,MY_SECRET,BASE_URL&envDescription=See%20the%20README%20for%20what%20each%20variable%20means&project-name=waitlist-email&repository-name=waitlist-email)

Click the button, fill in the three env vars (described below), and you are live.

---

## Manual setup

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier is fine)
- A [Vercel](https://vercel.com) account — or any platform that runs Next.js

### 1. Clone and install

```bash
git clone https://github.com/Durjoy96/waitlist-email.git
cd waitlist-email
npm install
```

### 2. Set environment variables

Create `.env.local` in the project root (never committed — already in `.gitignore`):

```env
# MongoDB connection string from Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Secret key that protects /api/projects
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
MY_SECRET=your-secret-key-here

# Public URL where this backend will be deployed
# Used to build the <form action="..."> snippet returned by /api/projects
BASE_URL=https://your-deployment.vercel.app
```

| Variable      | Required | Purpose                                                      |
| ------------- | -------- | ------------------------------------------------------------ |
| `MONGODB_URI` | ✅       | Connection string to your MongoDB cluster                    |
| `MY_SECRET`   | ✅       | Bearer secret for the `POST /api/projects` endpoint          |
| `BASE_URL`    | ✅       | Used to generate the correct `<form action>` URL in snippets |

### 3. Run locally

```bash
npm run dev
```

The server starts at `http://localhost:3000`. Both API endpoints are immediately available.

### 4. Deploy to Vercel (CLI)

```bash
npx vercel --prod
```

Then add `MONGODB_URI`, `MY_SECRET`, and `BASE_URL` in **Vercel project → Settings → Environment Variables**. Redeploy once after setting them.

---

## Using the CLI (recommended)

The [`create-waitlist-email`](https://www.npmjs.com/package/create-waitlist-email) CLI is the fastest way to deploy your backend and manage projects. Run it from anywhere:

```bash
# Interactive wizard (deploy backend or register project)
npx create-waitlist-email

# Instant project creation using your saved backend (0 prompts)
npx create-waitlist-email my-new-project
```

### What the CLI can do:

1. **Auto-Deploy a Fresh Backend**
   - Asks for your MongoDB connection string.
   - Clones this backend repo, generates a secure `MY_SECRET`, links Vercel, sets environment variables, deploys to production automatically, and sets up your first project.
2. **Connect to an Existing Backend**
   - Asks for your backend's base URL and secret key to create a new project on your already hosted instance.
3. **Remembers Your Backend**
   - Saves your credentials to `~/.waitlist-email/config.json` so you can create future waitlist projects instantly without re-typing URLs or secrets.

---

## React / Next.js integration

For React projects, skip the raw `<form>` and use the official component library instead.

```bash
npm i waitlist-email-react
```

### Drop-in form component

```tsx
import { WaitlistForm } from "waitlist-email-react/react";

export default function MyPage() {
  return (
    <WaitlistForm
      baseUrl="https://your-deployment.vercel.app"
      projectId="my-saas-app"
    />
  );
}
```

Handles submission, loading state, input validation, and feedback messages out of the box - no extra CSS required.

**Styling props:**

```tsx
<WaitlistForm
  baseUrl="https://your-deployment.vercel.app"
  projectId="my-saas-app"
  maxWidth="500px"
  borderRadius="8px"
  buttonColor="#2563eb"
  buttonTextColor="#ffffff"
  buttonLabel="Join waitlist"
  successMessage="You're on the list! 🎉"
/>
```

Full docs & props → [`waitlist-email-react` on npm](https://www.npmjs.com/package/waitlist-email-react) · [GitHub](https://github.com/Durjoy96/waitlist-email-react)

---

## API reference

### `POST /api/collect/:id`

**Public.** Collects an email for the project identified by `:id`. Accepts HTML form submissions and JSON. CORS is open (`*`) so it can be called from any domain.

**HTML form (browser native):**

```html
<form
  action="https://your-deployment.vercel.app/api/collect/my-project"
  method="POST"
>
  <input type="email" name="email" required />
  <button type="submit">Join</button>
</form>
```

**JSON (fetch / XHR):**

```js
await fetch("https://your-deployment.vercel.app/api/collect/my-project", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" }),
});
```

**Responses:**

| Status | Body                               | Meaning                          |
| ------ | ---------------------------------- | -------------------------------- |
| `200`  | `{ "status": "success" }`          | Email stored                     |
| `200`  | `{ "status": "already_exists" }`   | Duplicate — silently ignored     |
| `400`  | `{ "error": "invalid email" }`     | Missing or malformed email       |
| `404`  | `{ "error": "project not found" }` | `:id` does not match any project |

---

### `POST /api/projects`

**Protected.** Creates (or upserts) a project and returns the embed snippet. Requires `MY_SECRET` in the `x-api-key` header.

**Headers:**

```
x-api-key: your-secret-key-here
Content-Type: application/json
```

**Request body:**

```json
{ "name": "My SaaS App" }
```

The `name` is slugified to produce `projectId` (e.g. `"My SaaS App"` → `"my-saas-app"`).

**Response `200`:**

```json
{
  "projectId": "my-saas-app",
  "snippet": "<form action=\"https://your-deployment.vercel.app/api/collect/my-saas-app\" method=\"POST\">\n  <input type=\"email\" name=\"email\" required placeholder=\"you@example.com\" />\n  <button type=\"submit\">Join Waitlist</button>\n</form>"
}
```

**Error responses:**

| Status | Body                           | Meaning                      |
| ------ | ------------------------------ | ---------------------------- |
| `400`  | `{ "error": "name required" }` | Body missing `name` field    |
| `401`  | `{ "error": "unauthorized" }`  | Wrong or missing `x-api-key` |

> The CLI calls this endpoint automatically. You only need to call it directly if you are integrating from a custom script or CI pipeline.

---

## MongoDB data model

Database name: **`waitlist`**

**`projects` collection** — one document per named project:

```json
{
  "projectId": "my-saas-app",
  "name": "My SaaS App",
  "createdAt": "2026-10-09T00:00:00.000Z"
}
```

**`emails` collection** — one document per collected email:

```json
{
  "projectId": "my-saas-app",
  "email": "user@example.com",
  "createdAt": "2026-10-09T00:00:00.000Z"
}
```

Uniqueness is enforced in application code (duplicate check before insert). You can optionally add a unique compound index `{ projectId: 1, email: 1 }` in Atlas for extra safety.

---

## Project structure

```
waitlist-email/
├── app/
│   ├── api/
│   │   ├── collect/[projectId]/route.js   # Public — collects emails
│   │   └── projects/route.js              # Protected — creates projects
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── mongodb.js                         # MongoDB connection singleton
├── .env.local                             # Local env vars (never committed)
└── next.config.ts
```

---

## Tech stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 16 (App Router) |
| Language   | TypeScript / JavaScript |
| Database   | MongoDB Atlas           |
| Styling    | Tailwind CSS v4         |
| Deployment | Vercel                  |

---

## License

MIT
