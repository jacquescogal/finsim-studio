"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Card className="rounded-md shadow-sm">
      <CardHeader className="p-4 pb-0">
        <h2 className="text-base font-semibold tracking-tight">Publish</h2>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-2">
          <Label htmlFor="publish-visibility">Visibility</Label>
          <Select value={selectedVisibility} onValueChange={(value) => setSelectedVisibility(value as "public" | "unlisted")}>
            <SelectTrigger id="publish-visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public library</SelectItem>
              <SelectItem value="unlisted">Unlisted link</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="mt-4 min-h-[44px] w-full" onClick={publish} disabled={isPublishing}>
          {isPublishing ? "Publishing..." : status === "published" ? "Update publish settings" : "Publish lesson"}
        </Button>
        {scenarioHref ? <Link className="mt-3 block text-sm underline" href={scenarioHref}>Open public lesson</Link> : null}
        {message ? <p className={message === "Published." ? "mt-3 text-sm text-muted-foreground" : "mt-3 text-sm text-red-700"}>{message}</p> : null}
      </CardContent>
    </Card>
  );
}
