import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const supabaseMocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  maybeSingle: vi.fn(),
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
    Object.values(supabaseMocks).forEach((mock) => mock.mockReset());
    supabaseMocks.createServiceClient.mockReturnValue({ from: supabaseMocks.from });
    supabaseMocks.from.mockImplementation((table: string) => {
      if (table === "lessons") return { select: supabaseMocks.select };
      return { insert: supabaseMocks.insert };
    });
    supabaseMocks.select.mockReturnValue({ eq: supabaseMocks.eq });
    supabaseMocks.eq.mockReturnValue({ eq: supabaseMocks.eq, in: supabaseMocks.in });
    supabaseMocks.in.mockReturnValue({ maybeSingle: supabaseMocks.maybeSingle });
    supabaseMocks.maybeSingle.mockResolvedValue({ data: { id: validBody.lessonId }, error: null });
    supabaseMocks.insert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records a validated learner session for a published playable lesson", async () => {
    const response = await POST(postRequest(validBody));

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(supabaseMocks.from).toHaveBeenCalledWith("lessons");
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

  it("rejects sessions for unavailable lessons before writing", async () => {
    supabaseMocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const response = await POST(postRequest(validBody));

    await expect(response.json()).resolves.toEqual({ error: "Lesson is not available for learner sessions." });
    expect(response.status).toBe(400);
    expect(supabaseMocks.insert).not.toHaveBeenCalled();
  });

  it("returns a generic server error when persistence fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    supabaseMocks.insert.mockResolvedValueOnce({ error: { message: "duplicate key value violates constraint learner_sessions_pkey" } });

    const response = await POST(postRequest(validBody));

    await expect(response.json()).resolves.toEqual({ error: "Unable to record learner session." });
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalled();
  });
});
