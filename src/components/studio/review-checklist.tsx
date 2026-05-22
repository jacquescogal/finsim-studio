"use client";

import { useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { StudioLesson } from "@/lib/lessons/repository";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const checklistItems = [
  ["sourceApproved", "Source material is approved"],
  ["noPersonalizedAdvice", "No personalized advice is present"],
  ["noProductRecommendation", "No product recommendation is present"],
  ["claimsSupported", "Claims are supported by the source"],
  ["audienceAppropriate", "Language is understandable for the target audience"],
  ["disclaimerPresent", "Lesson includes an educational disclaimer"],
  ["respectfulFeedback", "Choices and feedback are respectful"],
  ["publicMetadataAccurate", "Public title, summary, category, and attribution are accurate"],
  ["warningsAcknowledged", "Warnings have been reviewed"]
] as const;

type ChecklistValues = Record<(typeof checklistItems)[number][0], boolean>;

function initialValues(checklist: StudioLesson["reviewChecklist"]): ChecklistValues {
  return {
    sourceApproved: Boolean(checklist?.sourceApproved),
    noPersonalizedAdvice: Boolean(checklist?.noPersonalizedAdvice),
    noProductRecommendation: Boolean(checklist?.noProductRecommendation),
    claimsSupported: Boolean(checklist?.claimsSupported),
    audienceAppropriate: Boolean(checklist?.audienceAppropriate),
    disclaimerPresent: Boolean(checklist?.disclaimerPresent),
    respectfulFeedback: Boolean(checklist?.respectfulFeedback),
    publicMetadataAccurate: Boolean(checklist?.publicMetadataAccurate),
    warningsAcknowledged: Boolean(checklist?.warningsAcknowledged)
  };
}

export function ReviewChecklist({ lessonId, initialChecklist }: { lessonId: string; initialChecklist: StudioLesson["reviewChecklist"] }) {
  const [values, setValues] = useState<ChecklistValues>(() => initialValues(initialChecklist));
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof ChecklistValues, checked: CheckedState) {
    if (checked === "indeterminate") return;
    const next = { ...values, [key]: checked };
    setValues(next);
    setError(null);
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: { [key]: checked } })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "Unable to update checklist.");
    }
  }

  return (
    <Card className="rounded-md shadow-sm">
      <CardHeader className="p-4 pb-0">
        <h2 className="text-base font-semibold tracking-tight">Review Checklist</h2>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {checklistItems.map(([key, label]) => (
          <div key={key} className="flex items-start gap-3">
            <Checkbox id={key} checked={values[key]} onCheckedChange={(checked) => toggle(key, checked)} />
            <Label htmlFor={key} className="leading-5 text-muted-foreground">
              {label}
            </Label>
          </div>
        ))}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
