import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const PERMISSIONS_REFRESH_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Google],
  pages: {
    signIn: "/",
  },
  // Renamed after switching from database to JWT sessions — old opaque
  // database session tokens under the previous cookie name are no longer
  // valid JWEs. A distinct name means the server never tries to decode
  // them; browsers holding the stale cookie are just treated as signed out.
  cookies: {
    sessionToken: {
      name: "authjs.session-token.v2",
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }

      const isStale =
        !token.permissionsFetchedAt ||
        Date.now() - token.permissionsFetchedAt > PERMISSIONS_REFRESH_MS;

      if (token.id && (user || isStale)) {
        const fullUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            phone: true,
            customRole: { select: { permissions: { select: { permission: true } } } },
          },
        });
        if (fullUser) {
          token.role = fullUser.role;
          token.phone = fullUser.phone;
          token.permissions = fullUser.customRole?.permissions.map((p) => p.permission) ?? [];
        }
        token.permissionsFetchedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.phone = token.phone;
      session.user.permissions = token.permissions ?? [];

      return session;
    },
  },
  events: {
    // The first Google account ever to sign in becomes the site admin.
    async createUser({ user }) {
      if (!user.id) return;

      const userCount = await prisma.user.count();
      if (userCount === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }

      // Every account is a shop. Create a draft immediately so there's
      // nothing to "post" — the owner just fills it in and it goes live
      // on its own once complete (see the isActive computation in
      // app/actions/listings.ts).
      await prisma.listing.create({
        data: {
          ownerId: user.id,
          businessName: "My Shop",
          description: "Add a description to tell customers what you offer.",
          isActive: false,
        },
      });
    },
  },
});
