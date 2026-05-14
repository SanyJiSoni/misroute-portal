import { withAuth }
from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/portal/:path*",
    "/dashboard/:path*",
    "/workflow/:path*",
    "/upload/:path*",
  ],
};