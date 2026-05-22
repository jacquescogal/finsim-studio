import type { Route } from "next";
import Link from "next/link";
import { listStudioLessons } from "@/lib/lessons/repository";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const lessons = await listStudioLessons();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Facilitator Studio</h1>
          <p className="mt-2 text-muted-foreground">Create, review, and publish scenario lessons.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href={"/studio/new" as Route}>
          New Lesson
        </Link>
      </div>
      <div className="mt-8 grid gap-3">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/studio/lessons/${lesson.id}` as Route} className="rounded-md border p-4">
            <div className="font-medium">{lesson.metadata.title}</div>
            <div className="text-sm text-muted-foreground">{lesson.metadata.status} · {lesson.metadata.visibility}</div>
          </Link>
        ))}
      </div>
      {lessons.length === 0 ? <p className="mt-8 text-muted-foreground">No lessons yet.</p> : null}
    </section>
  );
}
