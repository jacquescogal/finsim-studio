import type { LessonContent, LessonMetadata } from "./schema";

export const sampleLessonMetadata: LessonMetadata = {
  title: "Checking Before Acting",
  summary: "A short scenario about spotting suspicious investment messages.",
  topic: "Avoiding investment scams",
  category: "Scams",
  tags: ["scams", "online safety", "checking"],
  language: "en",
  difficulty: "introductory",
  targetAudience: "older_adult",
  status: "draft",
  visibility: "private",
  publicSlug: null,
  disclaimer: "This lesson is for education only. It does not provide personal financial advice.",
  publisherDisplayName: "Community Financial Learning Lab"
};

export const sampleLessonContent: LessonContent = {
  title: sampleLessonMetadata.title,
  summary: sampleLessonMetadata.summary,
  sourceSummary: "Messages promising high returns with no risk should be checked before acting.",
  learningObjectives: [
    "Identify warning signs in suspicious financial messages",
    "Practice checking with a trusted source before transferring money"
  ],
  targetAudience: "older_adult",
  readingLevel: "simple",
  category: "Scams",
  tags: ["scams", "online safety", "checking"],
  characters: ["Mr. Tan"],
  scenes: [
    {
      id: "scene_1",
      title: "A message arrives",
      body: "Mr. Tan receives a message promising high returns with no risk if he acts today.",
      visualPrompt: "Older adult reading a phone message at a kitchen table",
      sourceRefs: ["source:paragraph_1"],
      choices: [
        {
          id: "choice_1",
          label: "Reply and ask how to invest",
          feedback: "This may lead to more pressure. High returns with no risk is a warning sign.",
          nextSceneId: "scene_2"
        },
        {
          id: "choice_2",
          label: "Check with a trusted source first",
          feedback: "Checking before acting helps reduce scam risk.",
          nextSceneId: "scene_2"
        }
      ]
    },
    {
      id: "scene_2",
      title: "Taking time to verify",
      body: "Mr. Tan pauses and compares the message with official guidance before doing anything.",
      sourceRefs: ["source:paragraph_2"],
      choices: [
        {
          id: "choice_3",
          label: "Continue",
          feedback: "Taking time creates space to make a safer decision.",
          nextSceneId: null
        }
      ]
    }
  ],
  reflectionPrompts: ["What warning sign would you discuss with the group?"],
  knowledgeChecks: [
    {
      id: "check_1",
      question: "Which phrase is a warning sign?",
      options: ["Guaranteed high return", "Take time to check", "Ask someone trusted"],
      correctOption: "Guaranteed high return",
      feedback: "Promises of guaranteed high returns can be a scam warning sign."
    }
  ],
  disclaimer: sampleLessonMetadata.disclaimer,
  safetyWarnings: []
};
