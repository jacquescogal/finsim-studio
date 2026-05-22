"use client";

import { useState } from "react";
import type { LessonChoice, LessonContent, LessonScene } from "@/lib/lessons/schema";

type Message = { tone: "ok" | "error"; text: string } | null;

export function LessonEditor({ lessonId, initialContent }: { lessonId: string; initialContent: LessonContent }) {
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState<Message>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateScene(index: number, patch: Partial<LessonScene>) {
    setContent((current) => ({
      ...current,
      scenes: current.scenes.map((scene, sceneIndex) => sceneIndex === index ? { ...scene, ...patch } : scene)
    }));
  }

  function updateChoice(sceneIndex: number, choiceIndex: number, patch: Partial<LessonChoice>) {
    setContent((current) => ({
      ...current,
      scenes: current.scenes.map((scene, index) => index === sceneIndex
        ? {
            ...scene,
            choices: scene.choices.map((choice, nestedIndex) => nestedIndex === choiceIndex ? { ...choice, ...patch } : choice)
          }
        : scene)
    }));
  }

  async function save() {
    setIsSaving(true);
    setMessage(null);
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const payload = await response.json();
    setIsSaving(false);
    setMessage(response.ok ? { tone: "ok", text: "Saved." } : { tone: "error", text: payload.error ?? "Unable to save lesson." });
  }

  return (
    <div className="mt-6 space-y-6">
      <label className="grid gap-2">
        <span className="font-medium">Title</span>
        <input className="rounded-md border px-3 py-2" value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} />
      </label>
      <label className="grid gap-2">
        <span className="font-medium">Summary</span>
        <textarea className="rounded-md border px-3 py-2" value={content.summary} onChange={(event) => setContent({ ...content, summary: event.target.value })} />
      </label>
      {content.scenes.map((scene, sceneIndex) => (
        <section key={scene.id} className="rounded-md border p-4">
          <label className="grid gap-2">
            <span className="font-medium">Scene title</span>
            <input className="rounded-md border px-3 py-2" value={scene.title} onChange={(event) => updateScene(sceneIndex, { title: event.target.value })} />
          </label>
          <label className="mt-3 grid gap-2">
            <span className="font-medium">Scene text</span>
            <textarea className="rounded-md border px-3 py-2" value={scene.body} onChange={(event) => updateScene(sceneIndex, { body: event.target.value })} />
          </label>
          <div className="mt-4 grid gap-3">
            {scene.choices.map((choice, choiceIndex) => (
              <div key={choice.id} className="grid gap-2 rounded-md bg-muted p-3">
                <label className="grid gap-1 text-sm">
                  <span>Choice label</span>
                  <input className="rounded-md border px-3 py-2" value={choice.label} onChange={(event) => updateChoice(sceneIndex, choiceIndex, { label: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Feedback</span>
                  <textarea className="rounded-md border px-3 py-2" value={choice.feedback} onChange={(event) => updateChoice(sceneIndex, choiceIndex, { feedback: event.target.value })} />
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}
      <button className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60" onClick={save} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save changes"}
      </button>
      {message ? <p className={message.tone === "ok" ? "text-sm text-muted-foreground" : "text-sm text-red-700"}>{message.text}</p> : null}
    </div>
  );
}
