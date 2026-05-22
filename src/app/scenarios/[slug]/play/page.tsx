import React from "react";
import { notFound } from "next/navigation";
import { ScenarioPlayer } from "@/components/learner/scenario-player";
import { getPublishedLessonBySlug } from "@/lib/lessons/repository";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ScenarioPlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = await getPublishedLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.metadata.category}</Badge>
          <span className="text-sm text-muted-foreground">{lesson.metadata.publisherDisplayName}</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">{lesson.metadata.title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{lesson.metadata.summary}</p>
      </div>

      <ScenarioPlayer lessonId={lesson.id} content={lesson.content} />
    </section>
  );
}
