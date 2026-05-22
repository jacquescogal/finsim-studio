import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import { LessonEditor } from "./lesson-editor";

describe("LessonEditor", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("saves full lesson JSON content", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    } as Response);
    const updatedContent = {
      ...sampleLessonContent,
      sourceSummary: "Updated source summary that is available only in the JSON editor.",
      learningObjectives: ["Updated objective from JSON editing"]
    };

    render(<LessonEditor lessonId="lesson-1" initialContent={sampleLessonContent} />);

    fireEvent.change(screen.getByLabelText("Lesson JSON"), {
      target: { value: JSON.stringify(updatedContent, null, 2) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/lessons/lesson-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent })
      });
    });
  });
});
