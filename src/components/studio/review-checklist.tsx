"use client";

import { useState } from "react";
import type { StudioLesson } from "@/lib/lessons/repository";

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

  async function toggle(key: keyof ChecklistValues, checked: boolean) {
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
    <section className="rounded-md border p-4">
      <h2 className="font-semibold">Review Checklist</h2>
      <div className="mt-4 grid gap-3">
        {checklistItems.map(([key, label]) => (
          <label key={key} className="flex gap-3 text-sm">
            <input type="checkbox" checked={values[key]} onChange={(event) => toggle(key, event.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
