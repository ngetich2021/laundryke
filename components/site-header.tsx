import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Dr. Wash
      </Link>
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
