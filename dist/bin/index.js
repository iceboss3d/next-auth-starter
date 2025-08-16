#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = __importDefault(require("../src/commands/init"));
const program = new commander_1.Command();
program
    .name("create-next-auth-app")
    .description("Bootstrap a Next.js app with Prisma, NextAuth, shadcn/ui, Tailwind and authentication")
    .argument("<app-name>", "Name of the application")
    .requiredOption("-d, --db <url>", "Database URL for Prisma")
    .action((appName, options) => {
    (0, init_1.default)(appName, options.db).catch((err) => {
        console.error("❌ Something went wrong:", err);
        process.exit(1);
    });
});
program.parse();
