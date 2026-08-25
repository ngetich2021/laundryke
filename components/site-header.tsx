import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PwaInstallButton } from "@/components/pwa-install-button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image
            src="/icons/icon-192.png"
            alt="Dr. Wash"
            width={32}
            height={32}
            className="rounded-full"
          />
          Dr. Wash
        </Link>
        <PwaInstallButton />
      </div>
      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <Avatar className="size-8">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
              <AvatarFallback>{session.user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
          </>
        )}
        <form
          action={async () => {
            "use server";
            if (session?.user) {
              await signOut({ redirectTo: "/" });
            } else {
              await signIn("google", { redirectTo: "/dashboard" });
            }
          }}
        >
          <SubmitButton variant={session?.user ? "ghost" : "default"} size="sm">
            {session?.user ? "signout" : "Sign in with Google"}
          </SubmitButton>
        </form>
      </div>
    </header>
  );
}
