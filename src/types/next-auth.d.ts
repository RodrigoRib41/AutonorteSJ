import { type AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      name: string;
      username: string;
      email: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AdminRole;
    name: string;
    username: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AdminRole;
    username?: string;
  }
}
