"use client";

import React, { useMemo, useState } from "react";
import type { LessonChoice, LessonContent } from "@/lib/lessons/schema";

type ScenarioPlayerProps = {
  lessonId: string;
  content: LessonContent;
};

type KnowledgeCheckState = Record<string, string>;
type LearnerChoice = { sceneId: string; choiceId: string };

type KnowledgeCheckResult = {
  checkId: string;
  selectedOption: string;
  correct: boolean;
};

function optionButtonClass(isSelected: boolean) {
  return [
    "w-full rounded-md border px-4 py-3 text-left text-sm transition",
    isSelected
      ? "border-primary bg-muted"
      : "border-border bg-background hover:border-primary hover:bg-muted"
  ].join(" ");
}

function buildKnowledgeResults(content: LessonContent, answers: KnowledgeCheckState): KnowledgeCheckResult[] {
  return content.knowledgeChecks.flatMap((check) => {
    const selectedOption = answers[check.id];

    if (!selectedOption) {
      return [];
    }

    return [{
      checkId: check.id,
      selectedOption,
      correct: selectedOption === check.correctOption
    }];
  });
}

export function ScenarioPlayer({ lessonId, content }: ScenarioPlayerProps) {
  const [startedAt] = useState(() => new Date().toISOString());
  const [currentSceneId, setCurrentSceneId] = useState(content.scenes[0]?.id);
  const [selectedChoice, setSelectedChoice] = useState<LessonChoice | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<KnowledgeCheckState>({});
  const [choices, setChoices] = useState<LearnerChoice[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const sceneIndexById = useMemo(
    () => new Map(content.scenes.map((scene, index) => [scene.id, index])),
    [content.scenes]
  );
  const currentSceneIndex = currentSceneId ? sceneIndexById.get(currentSceneId) ?? 0 : 0;
  const currentScene = content.scenes[currentSceneIndex] ?? content.scenes[0];

  async function recordCompletion(nextChoices: LearnerChoice[]) {
    try {
      setSessionError(null);
      const response = await fetch("/api/learner-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          startedAt,
          completedAt: new Date().toISOString(),
          choices: nextChoices,
          knowledgeCheckResults: buildKnowledgeResults(content, knowledgeAnswers),
          confidenceBefore: null,
          confidenceAfter: null
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        setSessionError(payload.error ?? "Unable to record completion.");
      }
    } catch {
      setSessionError("Unable to record completion.");
    }
  }

  function choose(choice: LessonChoice) {
    const nextChoices = [...choices, { sceneId: currentScene.id, choiceId: choice.id }];
    setChoices(nextChoices);
    setSelectedChoice(choice);

    if (choice.nextSceneId) {
      setCurrentSceneId(choice.nextSceneId);
      setIsComplete(false);
      return;
    }

    setIsComplete(true);
    void recordCompletion(nextChoices);
  }

  function chooseKnowledgeAnswer(checkId: string, option: string) {
    setKnowledgeAnswers((answers) => ({ ...answers, [checkId]: option }));
  }

  function replay() {
    setCurrentSceneId(content.scenes[0]?.id);
    setSelectedChoice(null);
    setIsComplete(false);
    setKnowledgeAnswers({});
    setChoices([]);
    setSessionError(null);
  }

  if (!currentScene) {
    return <p className="text-sm text-muted-foreground">This scenario has no scenes.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border bg-card p-5">
        <div className="text-sm text-muted-foreground">
          Scene {currentSceneIndex + 1} of {content.scenes.length}
        </div>
        <h2 className="mt-2 text-2xl font-semibold">{currentScene.title}</h2>
        <p className="mt-4 leading-7 text-card-foreground">{currentScene.body}</p>

        <div className="mt-6 grid gap-3">
          {currentScene.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={optionButtonClass(selectedChoice?.id === choice.id)}
              onClick={() => choose(choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        {selectedChoice ? (
          <div className="mt-5 rounded-md border bg-muted p-4">
            <div className="text-sm font-medium">Choice feedback</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedChoice.feedback}</p>
          </div>
        ) : null}

        {isComplete ? (
          <div className="mt-5 rounded-md border border-primary bg-background p-4 text-sm">
            <p className="font-medium">Scenario complete</p>
            <button className="mt-3 min-h-[44px] rounded-md border px-4 py-2" type="button" onClick={replay}>
              Replay
            </button>
            {sessionError ? <p className="mt-3 text-red-700">{sessionError}</p> : null}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Knowledge checks</h2>
          <div className="mt-4 space-y-5">
            {content.knowledgeChecks.map((check) => {
              const selectedAnswer = knowledgeAnswers[check.id];
              const answeredCorrectly = selectedAnswer === check.correctOption;

              return (
                <div key={check.id} className="space-y-3">
                  <p className="text-sm font-medium">{check.question}</p>
                  <div className="grid gap-2">
                    {check.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={optionButtonClass(selectedAnswer === option)}
                        onClick={() => chooseKnowledgeAnswer(check.id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {selectedAnswer ? (
                    <p className="text-sm text-muted-foreground">
                      {answeredCorrectly ? "Correct. " : "Not quite. "}
                      {check.feedback}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {content.reflectionPrompts.length > 0 ? (
          <section className="rounded-md border bg-card p-4">
            <h2 className="text-base font-semibold">Reflection</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {content.reflectionPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Disclaimer</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.disclaimer}</p>
        </section>
      </aside>
    </div>
  );
}
