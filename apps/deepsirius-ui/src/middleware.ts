export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/workboard", "/new", "/u/:path*"],
};
