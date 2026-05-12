import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { pool } from "../../../lib/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const result = await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
          `,
          [credentials.email]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const user = result.rows[0];

        // TEMP plain password check
        if (user.password !== credentials.password) {
          return null;
        }

        return {
          id: user.employee_id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          site: user.assigned_site,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  session: {
    strategy: "jwt",
  },

  secret: "MISROUTE_SECRET_KEY",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };