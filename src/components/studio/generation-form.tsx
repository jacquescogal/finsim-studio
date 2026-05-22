"use client";

import React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsGenerating(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/lessons/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: String(form.get("topic") ?? ""),
        targetAudience: String(form.get("targetAudience") ?? ""),
        language: String(form.get("language") ?? "en"),
        difficulty: String(form.get("difficulty") ?? ""),
        durationMinutes: Number(form.get("durationMinutes") ?? 20),
        sourceTitle: String(form.get("sourceTitle") ?? ""),
        sourceText: String(form.get("sourceText") ?? "")
      })
    });

    const payload = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to generate lesson.");
      return;
    }

    if (typeof payload.lessonId !== "string" || payload.lessonId.length === 0) {
      setError("The generated lesson was not returned.");
      return;
    }

    router.push(`/studio/lessons/${payload.lessonId}` as Route);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-5">
      <label className="grid gap-2">
        <span className="font-medium">Topic</span>
        <input className="rounded-md border px-3 py-2" name="topic" defaultValue="Avoiding suspicious investment messages" required />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="font-medium">Audience</span>
          <select className="rounded-md border px-3 py-2" name="targetAudience" defaultValue="older_adult">
            <option value="youth">Youth learner</option>
            <option value="adult">Adult learner</option>
            <option value="older_adult">Older adult learner</option>
            <option value="general">General audience</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="font-medium">Difficulty</span>
          <select className="rounded-md border px-3 py-2" name="difficulty" defaultValue="introductory">
            <option value="introductory">Introductory</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="font-medium">Duration</span>
          <input className="rounded-md border px-3 py-2" name="durationMinutes" type="number" min={5} max={90} defaultValue={20} required />
        </label>
      </div>
      <input type="hidden" name="language" value="en" />
      <label className="grid gap-2">
        <span className="font-medium">Source title</span>
        <input className="rounded-md border px-3 py-2" name="sourceTitle" defaultValue="Approved facilitator source" required />
      </label>
      <label className="grid gap-2">
        <span className="font-medium">Approved source text</span>
        <textarea className="min-h-56 rounded-md border px-3 py-2" name="sourceText" required />
      </label>
      {error ? <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate storyboard"}
      </button>
    </form>
  );
}
