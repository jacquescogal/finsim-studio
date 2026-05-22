import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationForm } from "./generation-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

describe("GenerationForm", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects to the generated lesson detail page", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lessonId: "lesson-123" })
    } as Response);

    render(<GenerationForm />);

    fireEvent.change(screen.getByLabelText("Approved source text"), {
      target: { value: "Approved source copy for the lesson." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate storyboard" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/studio/lessons/lesson-123");
    });
  });
});
