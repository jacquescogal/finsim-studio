"use client";

import React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="grid gap-2">
        <Label htmlFor="topic">Topic</Label>
        <Input id="topic" name="topic" defaultValue="Avoiding suspicious investment messages" required />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="targetAudience">Audience</Label>
          <Select name="targetAudience" defaultValue="older_adult">
            <SelectTrigger id="targetAudience">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youth">Youth learner</SelectItem>
              <SelectItem value="adult">Adult learner</SelectItem>
              <SelectItem value="older_adult">Older adult learner</SelectItem>
              <SelectItem value="general">General audience</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue="introductory">
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="introductory">Introductory</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="durationMinutes">Duration</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" min={5} max={90} defaultValue={20} required />
        </div>
      </div>
      <input type="hidden" name="language" value="en" />
      <div className="grid gap-2">
        <Label htmlFor="sourceTitle">Source title</Label>
        <Input id="sourceTitle" name="sourceTitle" defaultValue="Approved facilitator source" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sourceText">Approved source text</Label>
        <Textarea id="sourceText" className="min-h-56" name="sourceText" required />
      </div>
      {error ? <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="min-h-[44px]" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate storyboard"}
      </Button>
    </form>
  );
}
