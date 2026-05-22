import React from "react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedLessonBySlug } from "@/lib/lessons/repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ScenarioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = await getPublishedLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{lesson.metadata.category}</Badge>
        <Badge variant="outline">{lesson.metadata.targetAudience}</Badge>
        <Badge variant="outline">{lesson.metadata.difficulty}</Badge>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal">{lesson.metadata.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{lesson.metadata.summary}</p>

      <Card className="mt-6 rounded-md shadow-sm">
        <CardContent className="p-4">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium">Publisher</dt>
              <dd className="mt-1 text-muted-foreground">{lesson.metadata.publisherDisplayName}</dd>
            </div>
            <div>
              <dt className="font-medium">Scenes</dt>
              <dd className="mt-1 text-muted-foreground">{lesson.content.scenes.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <p className="mt-6 rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">{lesson.content.disclaimer}</p>
      <Button asChild className="mt-6 min-h-[44px]">
        <Link href={`/scenarios/${slug}/play` as Route}>Start scenario</Link>
      </Button>
    </section>
  );
}
