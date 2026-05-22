import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLessonContent } from "@/lib/lessons/sample";
import { ScenarioPlayer } from "./scenario-player";

const lessonId = "00000000-0000-4000-8000-000000000001";

describe("ScenarioPlayer", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  });

  it("moves through scenes by choices and keeps choice feedback visible", () => {
    render(<ScenarioPlayer lessonId={lessonId} content={sampleLessonContent} />);

    expect(screen.getByRole("heading", { name: "A message arrives" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Check with a trusted source first" }));

    expect(screen.getByText("Checking before acting helps reduce scam risk.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Taking time to verify" })).toBeVisible();
  });

  it("records a learner session when a terminal choice completes the scenario", async () => {
    render(<ScenarioPlayer lessonId={lessonId} content={sampleLessonContent} />);

    fireEvent.click(screen.getByRole("button", { name: "Guaranteed high return" }));
    fireEvent.click(screen.getByRole("button", { name: "Check with a trusted source first" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Taking time creates space to make a safer decision.")).toBeVisible();
    expect(screen.getByText("Scenario complete")).toBeVisible();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/learner-sessions", expect.objectContaining({ method: "POST" }));
    });

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      lessonId,
      choices: [
        { sceneId: "scene_1", choiceId: "choice_2" },
        { sceneId: "scene_2", choiceId: "choice_3" }
      ],
      knowledgeCheckResults: [
        { checkId: "check_1", selectedOption: "Guaranteed high return", correct: true }
      ]
    });
  });

  it("does not record duplicate learner sessions after completion", async () => {
    render(<ScenarioPlayer lessonId={lessonId} content={sampleLessonContent} />);

    fireEvent.click(screen.getByRole("button", { name: "Check with a trusted source first" }));
    const terminalChoice = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(terminalChoice);
    fireEvent.click(terminalChoice);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(terminalChoice).toBeDisabled();
  });

  it("displays knowledge checks, reflection prompts, and disclaimer", () => {
    render(<ScenarioPlayer lessonId={lessonId} content={sampleLessonContent} />);

    expect(screen.getByText("Which phrase is a warning sign?")).toBeVisible();
    expect(screen.getByText("What warning sign would you discuss with the group?")).toBeVisible();
    expect(screen.getByText(sampleLessonContent.disclaimer)).toBeVisible();
  });
});
