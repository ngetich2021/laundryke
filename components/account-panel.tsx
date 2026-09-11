"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { signOutAction, deleteMyAccount } from "@/app/actions/account";
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
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDeleteAccount() {
    startDeleteTransition(() => {
      deleteMyAccount().catch((err) => {
        toast.error(err instanceof Error ? err.message : "Couldn't delete account");
      });
    });
  }

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
          <div className="flex gap-2">
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
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, listings, payments, and all other
              data associated with it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDeleteAccount}>
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
