# next-auth-starter README

# `next-auth-starter`

A CLI tool to quickly bootstrap a **Next.js app** with **Prisma**, **NextAuth**, **shadcn/ui**, **Tailwind CSS**, and **authentication pages** (register/login). Includes form validation with **react-hook-form** and **Zod**.

---

## Features

- Prebuilt **Register** and **Login** pages
- Prisma integration with database migrations
- NextAuth authentication setup
- Bcrypt password hashing
- Validation with react-hook-form + Zod
- UI components from shadcn/ui
- Tailwind CSS styling
- TypeScript ready

---

## Installation

You can use `npx` (no global install required):

```bash
npx create-next-auth-app myapp -d "DATABASE_URL"
```

Or install globally:

```bash
npm install -g next-auth-starter
create-next-auth-app myapp -d "DATABASE_URL"
```

Replace `DATABASE_URL` with your Prisma database URL, e.g.:

```bash
postgres://user:password@localhost:5432/mydb
```

---

## Getting Started

After creating your app:

1. Go into your new app folder:

```bash
cd myapp
```

2. Install dependencies (if not already):

```bash
npm install
# or
yarn
# or
pnpm install
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Authentication Pages

- **Register**: `/auth/register`
- **Login**: `/auth/login`

These pages include prebuilt forms with validation. Check the code in:

- `src/app/auth/register/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/api/auth` for API routes

---

## Project Structure

```
myapp/
├─ src/
│  ├─ app/
│  │  ├─ auth/
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  └─ register/
│  │  │     └─ page.tsx
│  │  └─ page.tsx
│  └─ lib/
│     └─ prisma.ts
├─ prisma/
│  └─ schema.prisma
├─ .env
├─ package.json
└─ README.md
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [NextAuth.js](https://next-auth.js.org)

---

## Deploy on Vercel

Deploy your Next.js app quickly with [Vercel](https://vercel.com/new).
