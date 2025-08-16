#!/usr/bin/env node
import { Command } from "commander";
import init from "../src/commands/init";

const program = new Command();

program
  .name("create-next-auth-app")
  .description(
    "Bootstrap a Next.js app with Prisma, NextAuth, shadcn/ui, Tailwind and authentication"
  )
  .argument("<app-name>", "Name of the application")
  .requiredOption("-d, --db <url>", "Database URL for Prisma")
  .action((appName, options) => {
    init(appName, options.db).catch((err) => {
      console.error("❌ Something went wrong:", err);
      process.exit(1);
    });
  });

program.parse();
