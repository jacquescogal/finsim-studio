import React from "react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedLessonBySlug } from "@/lib/lessons/repository";

export const dynamic = "force-dynamic";

export default async function ScenarioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = await getPublishedLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span>{lesson.metadata.category}</span>
        <span>{lesson.metadata.targetAudience}</span>
        <span>{lesson.metadata.difficulty}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal">{lesson.metadata.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{lesson.metadata.summary}</p>

      <dl className="mt-6 grid gap-3 rounded-md border bg-card p-4 text-sm md:grid-cols-2">
        <div>
          <dt className="font-medium">Publisher</dt>
          <dd className="mt-1 text-muted-foreground">{lesson.metadata.publisherDisplayName}</dd>
        </div>
        <div>
          <dt className="font-medium">Scenes</dt>
          <dd className="mt-1 text-muted-foreground">{lesson.content.scenes.length}</dd>
        </div>
      </dl>

      <p className="mt-6 rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">{lesson.content.disclaimer}</p>
      <Link
        className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-primary px-5 py-2 text-primary-foreground"
        href={`/scenarios/${slug}/play` as Route}
      >
        Start scenario
      </Link>
    </section>
  );
}
