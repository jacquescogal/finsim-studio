insert into public.lessons (
  id,
  title,
  summary,
  topic,
  category,
  tags,
  language,
  difficulty,
  target_audience,
  status,
  visibility,
  public_slug,
  disclaimer,
  publisher_display_name,
  published_at
) values (
  '00000000-0000-4000-8000-000000000001',
  'Checking Before Acting',
  'A short scenario about spotting suspicious investment messages.',
  'Avoiding investment scams',
  'Scams',
  array['scams', 'online safety', 'checking'],
  'en',
  'introductory',
  'older_adult',
  'published',
  'public',
  'checking-before-acting',
  'This lesson is for education only. It does not provide personal financial advice.',
  'Community Financial Learning Lab',
  now()
) on conflict (id) do nothing;

insert into public.source_materials (id, lesson_id, title, source_text, approved) values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Approved scam prevention guide',
  'Messages promising high returns with no risk should be treated as suspicious. Take time to check with official sources or a trusted person before transferring money.',
  true
) on conflict (id) do nothing;

insert into public.lesson_content (lesson_id, generation_model, generation_warnings, content) values (
  '00000000-0000-4000-8000-000000000001',
  'seed',
  '{}',
  '{
    "title": "Checking Before Acting",
    "summary": "A short scenario about spotting suspicious investment messages.",
    "sourceSummary": "High returns with no risk and pressure to act quickly are warning signs.",
    "learningObjectives": ["Identify warning signs in suspicious messages", "Practice checking before transferring money"],
    "targetAudience": "older_adult",
    "readingLevel": "simple",
    "category": "Scams",
    "tags": ["scams", "online safety", "checking"],
    "characters": ["Mr. Tan"],
    "scenes": [
      {
        "id": "scene_1",
        "title": "A message arrives",
        "body": "Mr. Tan receives a message promising high returns with no risk if he acts today.",
        "visualPrompt": "Older adult reading a phone message at a kitchen table",
        "sourceRefs": ["source:paragraph_1"],
        "choices": [
          { "id": "choice_1", "label": "Reply and ask how to invest", "feedback": "This may lead to more pressure. High returns with no risk is a warning sign.", "nextSceneId": "scene_2" },
          { "id": "choice_2", "label": "Check with a trusted source first", "feedback": "Checking before acting helps reduce scam risk.", "nextSceneId": "scene_2" }
        ]
      },
      {
        "id": "scene_2",
        "title": "Taking time to verify",
        "body": "Mr. Tan pauses and compares the message with official guidance before doing anything.",
        "sourceRefs": ["source:paragraph_2"],
        "choices": [
          { "id": "choice_3", "label": "Continue", "feedback": "Taking time creates space to make a safer decision.", "nextSceneId": null }
        ]
      }
    ],
    "reflectionPrompts": ["What warning sign would you discuss with the group?"],
    "knowledgeChecks": [
      { "id": "check_1", "question": "Which phrase is a warning sign?", "options": ["Guaranteed high return", "Take time to check", "Ask someone trusted"], "correctOption": "Guaranteed high return", "feedback": "Promises of guaranteed high returns can be a scam warning sign." }
    ],
    "disclaimer": "This lesson is for education only. It does not provide personal financial advice.",
    "safetyWarnings": []
  }'::jsonb
) on conflict (lesson_id) do nothing;

insert into public.review_checklists (
  lesson_id,
  source_approved,
  no_personalized_advice,
  no_product_recommendation,
  claims_supported,
  audience_appropriate,
  disclaimer_present,
  respectful_feedback,
  public_metadata_accurate,
  warnings_acknowledged,
  reviewed_at
) values (
  '00000000-0000-4000-8000-000000000001',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  now()
) on conflict (lesson_id) do nothing;
