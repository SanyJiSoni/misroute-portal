import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;

      employee_id: string;

      assigned_site: string;

      name: string;
    };
  }
}