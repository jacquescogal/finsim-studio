import { GenerationForm } from "@/components/studio/generation-form";

export default function NewLessonPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Create Lesson</h1>
      <p className="mt-2 text-muted-foreground">Paste approved source material and generate a draft storyboard.</p>
      <GenerationForm />
    </section>
  );
}
