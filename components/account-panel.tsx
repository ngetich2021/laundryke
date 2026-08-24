"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction } from "@/app/actions/account";
import { Loader2 } from "lucide-react";

export function AccountPanel({
  name,
  email,
  image,
  role,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  role: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <Avatar className="size-16">
            <AvatarImage src={image ?? undefined} alt={name ?? ""} />
            <AvatarFallback className="text-lg">
              {name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Badge variant="secondary">{role}</Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => signOutAction())}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
