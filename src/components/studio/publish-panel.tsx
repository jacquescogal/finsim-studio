"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";

export function PublishPanel({
  lessonId,
  status,
  visibility,
  slug
}: {
  lessonId: string;
  status: string;
  visibility: string;
  slug: string | null;
}) {
  const [selectedVisibility, setSelectedVisibility] = useState<"public" | "unlisted">(visibility === "public" ? "public" : "unlisted");
  const [publishedSlug, setPublishedSlug] = useState(slug);
  const [message, setMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function publish() {
    setMessage(null);
    setIsPublishing(true);
    const response = await fetch(`/api/lessons/${lessonId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: selectedVisibility })
    });
    const payload = await response.json();
    setIsPublishing(false);

    if (!response.ok) {
      setMessage((payload.errors ?? [payload.error ?? "Unable to publish."]).join(" "));
      return;
    }

    setPublishedSlug(payload.slug);
    setMessage("Published.");
  }

  const scenarioHref = publishedSlug ? (`/scenarios/${publishedSlug}` as Route) : null;

  return (
    <section className="rounded-md border p-4">
      <h2 className="font-semibold">Publish</h2>
      <label className="mt-4 grid gap-2 text-sm">
        <span>Visibility</span>
        <select className="rounded-md border px-3 py-2" value={selectedVisibility} onChange={(event) => setSelectedVisibility(event.target.value as "public" | "unlisted")}>
          <option value="public">Public library</option>
          <option value="unlisted">Unlisted link</option>
        </select>
      </label>
      <button className="mt-4 min-h-[44px] w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60" onClick={publish} disabled={isPublishing}>
        {isPublishing ? "Publishing..." : status === "published" ? "Update publish settings" : "Publish lesson"}
      </button>
      {scenarioHref ? <Link className="mt-3 block text-sm underline" href={scenarioHref}>Open public lesson</Link> : null}
      {message ? <p className={message === "Published." ? "mt-3 text-sm text-muted-foreground" : "mt-3 text-sm text-red-700"}>{message}</p> : null}
    </section>
  );
}
