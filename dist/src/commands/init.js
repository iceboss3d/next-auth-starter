#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = main;
const execa_1 = require("execa");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function main(appName, dbUrl) {
    if (!appName) {
        console.error("❌ Please provide an app name");
        process.exit(1);
    }
    const projectPath = path_1.default.resolve(process.cwd(), appName);
    console.log(`🚀 Creating Next.js app: ${appName}...`);
    // Step 1. Create Next.js app
    await (0, execa_1.execa)("npx", [
        "create-next-app@latest",
        appName,
        "--typescript",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
    ], { stdio: "inherit" });
    process.chdir(projectPath);
    // Step 2. Install dependencies
    console.log("📦 Installing extra dependencies...");
    await (0, execa_1.execa)("npm", [
        "install",
        "@prisma/client",
        "prisma",
        "next-auth",
        "@auth/prisma-adapter",
        "bcrypt",
        "lucide-react",
        "react-hook-form",
        "zod",
        "@hookform/resolvers",
    ], { stdio: "inherit" });
    console.log("🔧 Installing dev dependencies...");
    await (0, execa_1.execa)("npm", ["install", "--save-dev", "@types/bcrypt"], {
        stdio: "inherit",
    });
    // Step 3. Setup shadcn/ui
    console.log("✨ Setting up shadcn/ui...");
    await (0, execa_1.execa)("npx", ["shadcn@latest", "init"], { stdio: "inherit" });
    await (0, execa_1.execa)("npx", ["shadcn@latest", "add", "form", "button", "input", "label", "card"], { stdio: "inherit" });
    // Step 4. Write .env file
    console.log("🗄️ Initializing Prisma...");
    await (0, execa_1.execa)("npx", ["prisma", "init"], { stdio: "inherit" });
    if (dbUrl) {
        console.log("🔗 Setting up database connection...");
        await fs_extra_1.default.writeFile(".env", `DATABASE_URL=${dbUrl}\nNEXTAUTH_SECRET=changeme\n`);
    }
    // Step 5. Prisma schema
    const schema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  sessions  Session[]
  accounts  Account[]
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? 
  access_token       String? 
  expires_at         Int? 
  token_type         String? 
  scope              String? 
  id_token           String? 
  session_state      String? 

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
`;
    await fs_extra_1.default.outputFile("prisma/schema.prisma", schema);
    console.log("⚙️ Generating Prisma client...");
    await (0, execa_1.execa)("npx", ["prisma", "generate"], { stdio: "inherit" });
    // lib/prisma.ts
    await fs_extra_1.default.ensureDir("src/lib");
    await fs_extra_1.default.writeFile("src/lib/prisma.ts", `import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
`);
    // Step 6. Auth API routes
    await fs_extra_1.default.ensureDir("src/app/api/register");
    await fs_extra_1.default.writeFile("src/app/api/register/route.ts", `
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed } });
  return NextResponse.json({ success: true });
}
  `);
    await fs_extra_1.default.ensureDir("src/app/api/auth/[...nextauth]");
    await fs_extra_1.default.writeFile("src/app/api/auth/[...nextauth]/route.ts", `
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials?.email } });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials!.password, user.password);
        return isValid ? user : null;
      }
    })
  ]
});

export { handler as GET, handler as POST };
  `);
    // Step 7. Auth pages with shadcn + react-hook-form + zod
    await fs_extra_1.default.ensureDir("src/app/auth/login");
    await fs_extra_1.default.writeFile("src/app/auth/login/page.tsx", `
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (!res?.error) router.push("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader><CardTitle>Login</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
  `);
    await fs_extra_1.default.ensureDir("src/app/auth/register");
    await fs_extra_1.default.writeFile("src/app/auth/register/page.tsx", `
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    router.push("/auth/login");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader><CardTitle>Register</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">Register</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
  `);
    await fs_extra_1.default.writeFile("src/app/page.tsx", `
    import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <div className="space-y-4 text-center sm:text-left">
          <h1 className="text-2xl font-bold">Welcome to Your Next.js App!</h1>
          <p className="text-sm/6">
            This project comes with a ready-to-use authentication system using Prisma, bcrypt, react-hook-form, and shadcn/ui components.
          </p>

          <ol className="font-mono list-inside list-decimal text-sm/6 space-y-2">
            <li>
              Visit the <Link href="/auth/register" className="text-blue-600 underline">Register</Link> page to create a new account.
            </li>
            <li>
              Visit the <Link href="/auth/login" className="text-blue-600 underline">Login</Link> page to sign in.
            </li>
            <li>
              Check <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded">src/app/api/auth</code> for API route implementations.
            </li>
            <li>
              Edit authentication forms in <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded">src/app/register/page.tsx</code> and <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded">src/app/login/page.tsx</code>.
            </li>
          </ol>

          <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Next.js Docs
            </Link>
            <Link
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Deploy on Vercel
            </Link>
          </div>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm/6">Built with Next.js, Prisma, NextAuth, and shadcn/ui.</p>
      </footer>
    </div>
  );
}
    `);
    console.log("✅ Project setup complete!");
    console.log(`👉 cd ${appName} && npx prisma migrate dev && npm run dev`);
}
// main().catch((err) => {
//   console.error("❌ Something went wrong:", err);
//   process.exit(1);
// });
