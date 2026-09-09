"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Copy, Gift, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { referralOfferSchema, type ReferralOfferInput } from "@/lib/validations";
import { setReferralOffer } from "@/app/actions/referrals";
import {
  REFERRAL_PERCENTAGE_MIN,
  REFERRAL_PERCENTAGE_MAX,
  REFERRAL_FIXED_AMOUNT_MIN_KES,
  REFERRAL_FIXED_AMOUNT_MAX_KES,
} from "@/lib/constants";

type MyReferralOffer = {
  id: string;
  businessName: string;
  referralRewardType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  referralRewardValue: number | null;
  referralDescription: string | null;
  referralClickCount: number;
};

function OfferForm({ listing }: { listing: MyReferralOffer }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState("");

  useEffect(() => {
    setLink(`${window.location.origin}/?ref=${listing.id}`);
  }, [listing.id]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(referralOfferSchema),
    defaultValues: {
      rewardType: listing.referralRewardType ?? "PERCENTAGE",
      value: listing.referralRewardValue ?? undefined,
      description: listing.referralDescription ?? "",
      isActive: !!listing.referralRewardType,
    },
  });

  const rewardType = watch("rewardType");
  const isActive = watch("isActive");
  const bounds =
    rewardType === "PERCENTAGE"
      ? { min: REFERRAL_PERCENTAGE_MIN, max: REFERRAL_PERCENTAGE_MAX, prefix: "", suffix: "%" }
      : { min: REFERRAL_FIXED_AMOUNT_MIN_KES, max: REFERRAL_FIXED_AMOUNT_MAX_KES, prefix: "KES ", suffix: "" };

  function onSubmit(data: ReferralOfferInput) {
    startTransition(async () => {
      const result = await setReferralOffer(listing.id, data);
      if (result?.error) {
        const firstError = Object.values(result.error).flat()[0];
        toast.error(firstError ?? "Something went wrong");
        return;
      }
      toast.success("Referral offer saved");
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(link).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy link")
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="size-4" />
          {listing.businessName}
        </CardTitle>
        <CardDescription>
          Offer customers a reward for referring friends to this shop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor={`active-${listing.id}`}>Referral offer active</FieldLabel>
              <Switch
                id={`active-${listing.id}`}
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </Field>

            {isActive && (
              <>
                <Field>
                  <FieldLabel>Reward type</FieldLabel>
                  <Select
                    items={{ PERCENTAGE: "Percentage off", FIXED_AMOUNT: "Fixed KES amount off" }}
                    value={rewardType}
                    onValueChange={(value) =>
                      setValue("rewardType", value as ReferralOfferInput["rewardType"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed KES amount off</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`value-${listing.id}`}>
                    Reward value ({bounds.prefix}
                    {bounds.min}–{bounds.max}
                    {bounds.suffix})
                  </FieldLabel>
                  <Input
                    id={`value-${listing.id}`}
                    type="number"
                    min={bounds.min}
                    max={bounds.max}
                    {...register("value")}
                  />
                  <FieldError errors={[errors.value]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor={`desc-${listing.id}`}>
                    Custom message (optional)
                  </FieldLabel>
                  <Textarea
                    id={`desc-${listing.id}`}
                    placeholder="e.g. Refer a friend and you both get 10% off your next wash!"
                    {...register("description")}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>

                <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted-foreground">{link}</span>
                    <Button type="button" size="icon-sm" variant="outline" onClick={copyLink}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MousePointerClick className="size-3.5" />
                    {listing.referralClickCount} click{listing.referralClickCount === 1 ? "" : "s"}{" "}
                    so far
                  </p>
                </div>
              </>
            )}

            <Button type="submit" disabled={isPending} className="w-fit">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReferralsPanel({ listings }: { listings: MyReferralOffer[] }) {
  const sorted = useMemo(
    () => [...listings].sort((a, b) => a.businessName.localeCompare(b.businessName)),
    [listings]
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Referral program</h2>
        <p className="text-sm text-muted-foreground">
          Reward customers who bring in friends. Share your link anywhere — new visitors who
          follow it see the offer and can call your shop right away.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">You don&apos;t have any shops yet.</p>
      ) : (
        sorted.map((listing) => <OfferForm key={listing.id} listing={listing} />)
      )}
    </div>
  );
}
