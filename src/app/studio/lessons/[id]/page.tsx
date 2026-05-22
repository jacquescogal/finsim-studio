import { notFound } from "next/navigation";
import { LessonEditor } from "@/components/studio/lesson-editor";
import { PublishPanel } from "@/components/studio/publish-panel";
import { ReviewChecklist } from "@/components/studio/review-checklist";
import { getStudioLesson } from "@/lib/lessons/repository";

export const dynamic = "force-dynamic";

export default async function StudioLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getStudioLesson(id).catch(() => null);
  if (!lesson) notFound();

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-3xl font-semibold">{lesson.metadata.title}</h1>
        <p className="mt-2 text-muted-foreground">{lesson.metadata.summary}</p>
        <LessonEditor lessonId={id} initialContent={lesson.content} />
      </div>
      <aside className="space-y-4">
        <ReviewChecklist lessonId={id} initialChecklist={lesson.reviewChecklist} />
        <PublishPanel lessonId={id} status={lesson.metadata.status} visibility={lesson.metadata.visibility} slug={lesson.metadata.publicSlug} />
      </aside>
    </section>
  );
}
