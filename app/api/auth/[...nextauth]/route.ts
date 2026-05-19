import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { pool } from "@/app/lib/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        employee_id: {},
        password: {},
      },

      async authorize(credentials) {
        const result = await pool.query(
          `
          SELECT *
          FROM users
          WHERE employee_id = $1
          `,
          [credentials?.employee_id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const user = result.rows[0];

        if (
          user.password !==
          credentials?.password
        ) {
          return null;
        }

        if (!user.is_active) {
          return null;
        }

        return {
          id: user.id,
          employee_id:
            user.employee_id,
          name: user.full_name,
          role: user.role,
          assigned_site:
            user.assigned_site,
        };
      },
    }),
  ],
session: {
  strategy: "jwt" as const,
},

  callbacks: {
    async jwt({
      token,
      user,
    }: any) {
      if (user) {
        token.role = user.role;

        token.employee_id =
          user.employee_id;

        token.assigned_site =
          user.assigned_site;
      }

      return token;
    },

    async session({
      session,
      token,
    }: any) {
      session.user.role =
        token.role;

      session.user.employee_id =
        token.employee_id;

      session.user.assigned_site =
        token.assigned_site;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};

const handler =
  NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};