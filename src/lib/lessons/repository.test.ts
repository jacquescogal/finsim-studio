import { describe, expect, it, vi } from "vitest";
import { sampleLessonContent } from "./sample";

const supabaseMocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: supabaseMocks.createServiceClient
}));

import { updateLessonContent, updateReviewChecklist } from "./repository";

function setupEmptyUpdate() {
  supabaseMocks.createServiceClient.mockReturnValue({ from: supabaseMocks.from });
  supabaseMocks.from.mockReturnValue({ update: supabaseMocks.update });
  supabaseMocks.update.mockReturnValue({ eq: supabaseMocks.eq });
  supabaseMocks.eq.mockReturnValue({ select: supabaseMocks.select });
  supabaseMocks.select.mockReturnValue({ maybeSingle: supabaseMocks.maybeSingle });
  supabaseMocks.maybeSingle.mockResolvedValue({ data: null, error: null });
}

describe("lesson repository updates", () => {
  it("rejects content updates when no lesson row is updated", async () => {
    setupEmptyUpdate();

    await expect(updateLessonContent("missing-lesson", sampleLessonContent)).rejects.toThrow("Lesson not found.");
  });

  it("rejects checklist updates when no checklist row is updated", async () => {
    setupEmptyUpdate();

    await expect(updateReviewChecklist("missing-lesson", { source_approved: true })).rejects.toThrow("Review checklist not found.");
  });
});
