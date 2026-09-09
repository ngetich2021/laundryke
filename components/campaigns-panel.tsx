"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { campaignTargetSchema } from "@/lib/validations";
import {
  createCampaignTarget,
  updateCampaignTarget,
  deleteCampaignTarget,
  bumpCampaignValue,
  getMyCampaignTargets,
} from "@/app/actions/campaigns";

type CampaignTarget = Awaited<ReturnType<typeof getMyCampaignTargets>>[number];

const METRIC_LABELS: Record<CampaignTarget["metric"], string> = {
  NEW_CLIENTS: "New clients",
  VISITS: "Visits",
  REVENUE_KES: "Revenue (KES)",
  CUSTOM: "Custom (manual)",
};

function toDateInput(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

function CampaignFormDialog({
  listingId,
  editing,
  open,
  onOpenChange,
  onSaved,
}: {
  listingId: string;
  editing: CampaignTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(campaignTargetSchema),
    defaultValues: {
      title: "",
      metric: "NEW_CLIENTS" as const,
      targetValue: undefined,
      startDate: "",
      endDate: "",
    },
  });

  const metric = watch("metric");

  useEffect(() => {
    if (open) {
      reset({
        title: editing?.title ?? "",
        metric: editing?.metric ?? "NEW_CLIENTS",
        targetValue: editing?.targetValue,
        startDate: editing ? toDateInput(editing.startDate) : "",
        endDate: editing ? toDateInput(editing.endDate) : "",
      });
    }
  }, [open, editing, reset]);

  async function onSubmit(data: {
    title: string;
    metric: CampaignTarget["metric"];
    targetValue: number;
    startDate: string;
    endDate: string;
  }) {
    const result = editing
      ? await updateCampaignTarget(editing.id, data)
      : await createCampaignTarget(listingId, data);
    if (result?.error) {
      toast.error(Object.values(result.error).flat()[0] ?? "Something went wrong");
      return;
    }
    toast.success(editing ? "Target updated" : "Target created");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit target" : "New campaign target"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="campaign-title">Title</FieldLabel>
              <Input id="campaign-title" placeholder="e.g. Grow to 50 clients" {...register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel>Metric</FieldLabel>
              <Select
                items={METRIC_LABELS}
                value={metric}
                onValueChange={(value) => setValue("metric", value as CampaignTarget["metric"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="campaign-target">Target value</FieldLabel>
              <Input id="campaign-target" type="number" min={1} {...register("targetValue")} />
              <FieldError errors={[errors.targetValue]} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="campaign-start">Start date</FieldLabel>
                <Input id="campaign-start" type="date" {...register("startDate")} />
                <FieldError errors={[errors.startDate]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="campaign-end">End date</FieldLabel>
                <Input id="campaign-end" type="date" {...register("endDate")} />
                <FieldError errors={[errors.endDate]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignCard({
  target,
  onEdit,
  onDeleted,
  onChanged,
}: {
  target: CampaignTarget;
  onEdit: () => void;
  onDeleted: () => void;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const percent = Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));

  function handleDelete() {
    startTransition(async () => {
      await deleteCampaignTarget(target.id);
      toast.success("Target deleted");
      onDeleted();
    });
  }

  function bump(delta: number) {
    startTransition(async () => {
      await bumpCampaignValue(target.id, delta);
      onChanged();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-sm">{target.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {METRIC_LABELS[target.metric]} · {toDateInput(target.startDate)} to{" "}
            {toDateInput(target.endDate)}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="icon-sm" variant="outline" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Target className="size-4" />
            {target.currentValue} / {target.targetValue}
          </span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {target.metric === "CUSTOM" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bump(1)} disabled={isPending}>
              +1
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bump(-1)}
              disabled={isPending || target.currentValue <= 0}
            >
              -1
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CampaignsPanel({ listingId }: { listingId: string }) {
  const [targets, setTargets] = useState<CampaignTarget[]>([]);
  const [isLoading, startLoading] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignTarget | null>(null);

  function refresh() {
    startLoading(async () => {
      setTargets(await getMyCampaignTargets(listingId));
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(target: CampaignTarget) {
    setEditing(target);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Set goals for your shop and track progress automatically from your logged clients and
          visits.
        </p>
        <Button size="sm" onClick={startCreate}>
          <Plus className="size-4" />
          New target
        </Button>
      </div>

      {isLoading && targets.length === 0 ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : targets.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No campaign targets yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {targets.map((target) => (
            <CampaignCard
              key={target.id}
              target={target}
              onEdit={() => startEdit(target)}
              onDeleted={refresh}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <CampaignFormDialog
        listingId={listingId}
        editing={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />
    </div>
  );
}
