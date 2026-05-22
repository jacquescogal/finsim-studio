"use client";

import React, { useMemo, useRef, useState } from "react";
import type { LessonChoice, LessonContent } from "@/lib/lessons/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    "h-auto min-h-[44px] w-full justify-start whitespace-normal px-4 py-3 text-left text-sm",
    isSelected ? "border-primary bg-muted" : "hover:border-primary hover:bg-muted"
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
  const completionSubmittedRef = useRef(false);

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
    if (isComplete || completionSubmittedRef.current) {
      return;
    }

    const nextChoices = [...choices, { sceneId: currentScene.id, choiceId: choice.id }];
    setChoices(nextChoices);
    setSelectedChoice(choice);

    if (choice.nextSceneId) {
      setCurrentSceneId(choice.nextSceneId);
      setIsComplete(false);
      return;
    }

    completionSubmittedRef.current = true;
    setIsComplete(true);
    void recordCompletion(nextChoices);
  }

  function chooseKnowledgeAnswer(checkId: string, option: string) {
    setKnowledgeAnswers((answers) => ({ ...answers, [checkId]: option }));
  }

  function replay() {
    completionSubmittedRef.current = false;
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
      <Card className="rounded-md shadow-sm">
        <CardHeader className="p-5 pb-0">
          <Badge variant="secondary" className="w-fit">Scene {currentSceneIndex + 1} of {content.scenes.length}</Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{currentScene.title}</h2>
        </CardHeader>
        <CardContent className="p-5">
          <p className="text-xl leading-8 text-card-foreground">{currentScene.body}</p>

          <div className="mt-6 grid gap-3">
            {currentScene.choices.map((choice) => (
              <Button
                key={choice.id}
                type="button"
                variant="outline"
                className={optionButtonClass(selectedChoice?.id === choice.id)}
                onClick={() => choose(choice)}
                disabled={isComplete}
              >
                {choice.label}
              </Button>
            ))}
          </div>

          {selectedChoice ? (
            <div className="mt-5 rounded-md bg-muted p-4">
              <div className="text-sm font-medium">Choice feedback</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedChoice.feedback}</p>
            </div>
          ) : null}

          {isComplete ? (
            <div className="mt-5 rounded-md bg-muted p-4 text-sm">
              <p className="font-medium">Scenario complete</p>
              <Button className="mt-3 min-h-[44px]" variant="outline" type="button" onClick={replay}>
                Replay
              </Button>
              {sessionError ? <p className="mt-3 text-red-700">{sessionError}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card className="rounded-md shadow-sm">
          <CardHeader className="p-4 pb-0">
            <h2 className="text-base font-semibold tracking-tight">Knowledge checks</h2>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            {content.knowledgeChecks.map((check, index) => {
              const selectedAnswer = knowledgeAnswers[check.id];
              const answeredCorrectly = selectedAnswer === check.correctOption;

              return (
                <div key={check.id} className="space-y-3">
                  {index > 0 ? <Separator /> : null}
                  <p className="text-sm font-medium">{check.question}</p>
                  <div className="grid gap-2">
                    {check.options.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant="outline"
                        className={optionButtonClass(selectedAnswer === option)}
                        onClick={() => chooseKnowledgeAnswer(check.id, option)}
                      >
                        {option}
                      </Button>
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
          </CardContent>
        </Card>

        {content.reflectionPrompts.length > 0 ? (
          <Card className="rounded-md shadow-sm">
            <CardHeader className="p-4 pb-0">
              <h2 className="text-base font-semibold tracking-tight">Reflection</h2>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {content.reflectionPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-md shadow-sm">
          <CardHeader className="p-4 pb-0">
            <h2 className="text-base font-semibold tracking-tight">Disclaimer</h2>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm leading-6 text-muted-foreground">{content.disclaimer}</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
