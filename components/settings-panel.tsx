"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfile } from "@/app/actions/account";

export function SettingsPanel({
  name,
  phone,
  locationDescription,
}: {
  name: string;
  phone: string;
  locationDescription: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, phone, locationDescription },
  });

  async function onSubmit(data: ProfileInput) {
    const result = await updateProfile(data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Couldn't save changes");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0712345678"
                  {...register("phone")}
                />
                <FieldDescription>
                  This is your contact number — required before you can post a listing.
                </FieldDescription>
                <FieldError errors={[errors.phone]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="locationDescription">Shop location</FieldLabel>
                <Textarea
                  id="locationDescription"
                  rows={2}
                  placeholder="e.g. TEMU PLAZA, FLOOR 5, 8:00AM-5:00PM"
                  {...register("locationDescription")}
                />
                <FieldError errors={[errors.locationDescription]} />
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
