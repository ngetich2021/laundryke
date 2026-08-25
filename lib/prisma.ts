import { randomInt } from "node:crypto";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Uppercase, unambiguous IDs are easier to read back over the phone or
// quote in a support ticket than the default mixed-case nanoid.
const ID_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateId(length = 10): string {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  }
  return id;
}

// Every model has a String `id` @default(nanoid(...)) except this one,
// which has no separate id column (its key is @@unique([identifier, token])).
const MODELS_WITHOUT_ID = new Set(["VerificationToken"]);

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        create({ model, args, query }) {
          if (!MODELS_WITHOUT_ID.has(model) && args.data && !("id" in args.data)) {
            args.data = { ...args.data, id: generateId() } as typeof args.data;
          }
          return query(args);
        },
        createMany({ model, args, query }) {
          if (!MODELS_WITHOUT_ID.has(model) && Array.isArray(args.data)) {
            args.data = args.data.map((row) =>
              "id" in row ? row : { ...row, id: generateId() }
            ) as typeof args.data;
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
