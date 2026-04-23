import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

import {
  ensureBootstrapSuperadmin,
  normalizeAdminUsername,
} from "@/lib/admin-users";
import { adminRoles } from "@/lib/admin-role-utils";
import { getPrismaClient } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

function asPassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        username: {
          label: "Usuario",
          type: "text",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },
      async authorize(credentials) {
        const username = normalizeAdminUsername(credentials?.username);
        const password = asPassword(credentials?.password);

        if (!username || password.trim().length < 4) {
          return null;
        }

        await ensureBootstrapSuperadmin();

        const user = await getPrismaClient().adminUser.findUnique({
          where: {
            username,
          },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? "",
          username: user.username ?? username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isAuthenticated = Boolean(auth?.user?.id && auth.user.role);
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith("/admin");
      const isLoginRoute = pathname.startsWith("/login");

      if (isLoginRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      if (isAdminRoute) {
        return isAuthenticated;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (
        session.user &&
        token.sub &&
        typeof token.username === "string" &&
        token.username.trim()
      ) {
        session.user.id = token.sub;
        session.user.name =
          typeof token.name === "string" && token.name.trim()
            ? token.name
            : token.username;
        session.user.email = typeof token.email === "string" ? token.email : "";
        session.user.username = token.username;
        session.user.role =
          typeof token.role === "string" &&
          adminRoles.includes(token.role as (typeof adminRoles)[number])
            ? (token.role as (typeof adminRoles)[number])
            : "GESTOR";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
