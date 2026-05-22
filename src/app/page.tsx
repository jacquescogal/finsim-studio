import React from "react";
import type { Route } from "next";
import Link from "next/link";
import { listPublicLessons } from "@/lib/lessons/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lessons = await listPublicLessons();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Public Scenario Library</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Browse reviewed financial literacy scenarios for guided practice.
        </p>
      </div>

      {lessons.length > 0 ? (
        <div className="mt-8 grid gap-3">
          {lessons.map((lesson) => {
            const slug = lesson.metadata.publicSlug;

            if (!slug) return null;

            return (
              <Link
                key={lesson.id}
                href={`/scenarios/${slug}` as Route}
                className="rounded-md border bg-card p-4 hover:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-medium">{lesson.metadata.title}</h2>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {lesson.metadata.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.metadata.summary}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {lesson.metadata.category} · {lesson.metadata.publisherDisplayName}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">No public scenarios are available yet.</p>
      )}
    </section>
  );
}
