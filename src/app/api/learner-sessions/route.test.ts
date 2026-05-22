import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const supabaseMocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  from: vi.fn(),
  insert: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: supabaseMocks.createServiceClient
}));

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/learner-sessions", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

const validBody = {
  lessonId: "00000000-0000-4000-8000-000000000001",
  startedAt: "2026-05-22T00:00:00.000Z",
  completedAt: "2026-05-22T00:05:00.000Z",
  choices: [{ sceneId: "scene_1", choiceId: "choice_1" }],
  knowledgeCheckResults: [{ checkId: "check_1", selectedOption: "Guaranteed high return", correct: true }],
  confidenceBefore: null,
  confidenceAfter: null
};

describe("learner session route", () => {
  beforeEach(() => {
    supabaseMocks.createServiceClient.mockReset();
    supabaseMocks.from.mockReset();
    supabaseMocks.insert.mockReset();
    supabaseMocks.createServiceClient.mockReturnValue({ from: supabaseMocks.from });
    supabaseMocks.from.mockReturnValue({ insert: supabaseMocks.insert });
    supabaseMocks.insert.mockResolvedValue({ error: null });
  });

  it("records a validated learner session", async () => {
    const response = await POST(postRequest(validBody));

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(supabaseMocks.from).toHaveBeenCalledWith("learner_sessions");
    expect(supabaseMocks.insert).toHaveBeenCalledWith({
      lesson_id: validBody.lessonId,
      started_at: validBody.startedAt,
      completed_at: validBody.completedAt,
      choices: validBody.choices,
      knowledge_check_results: validBody.knowledgeCheckResults,
      confidence_before: null,
      confidence_after: null
    });
  });

  it("rejects invalid session payloads before writing", async () => {
    const response = await POST(postRequest({ ...validBody, lessonId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(supabaseMocks.insert).not.toHaveBeenCalled();
  });
});
