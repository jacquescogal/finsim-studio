"use client";

import React, { useState } from "react";
import { z } from "zod";
import { lessonContentSchema, type LessonContent } from "@/lib/lessons/schema";

type Message = { tone: "ok" | "error"; text: string } | null;

function formatContent(content: LessonContent) {
  return JSON.stringify(content, null, 2);
}

function parseLessonJson(jsonText: string) {
  try {
    return lessonContentSchema.parse(JSON.parse(jsonText));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }

    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
      throw new Error(`${path}${issue?.message ?? "Lesson content is invalid."}`);
    }

    throw error;
  }
}

export function LessonEditor({ lessonId, initialContent }: { lessonId: string; initialContent: LessonContent }) {
  const [jsonText, setJsonText] = useState(() => formatContent(initialContent));
  const [message, setMessage] = useState<Message>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    let content: LessonContent;

    try {
      content = parseLessonJson(jsonText);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Lesson content is invalid." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const payload = await response.json();
    setIsSaving(false);

    if (response.ok) {
      setJsonText(formatContent(content));
      setMessage({ tone: "ok", text: "Saved." });
      return;
    }

    setMessage({ tone: "error", text: payload.error ?? "Unable to save lesson." });
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="grid gap-2">
        <span className="font-medium">Lesson JSON</span>
        <textarea
          className="min-h-[620px] rounded-md border bg-background px-3 py-2 font-mono text-sm leading-6"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          spellCheck={false}
        />
      </label>
      <button className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60" onClick={save} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save changes"}
      </button>
      {message ? <p className={message.tone === "ok" ? "text-sm text-muted-foreground" : "text-sm text-red-700"}>{message.text}</p> : null}
    </div>
  );
}
