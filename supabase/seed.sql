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
  publisher_display_name
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
  'draft',
  'private',
  null,
  'This lesson is for education only. It does not provide personal financial advice.',
  'Community Financial Learning Lab'
)
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  topic = excluded.topic,
  category = excluded.category,
  tags = excluded.tags,
  language = excluded.language,
  difficulty = excluded.difficulty,
  target_audience = excluded.target_audience,
  status = excluded.status,
  visibility = excluded.visibility,
  public_slug = excluded.public_slug,
  disclaimer = excluded.disclaimer,
  publisher_display_name = excluded.publisher_display_name,
  updated_at = now();

insert into public.source_materials (
  id,
  lesson_id,
  title,
  source_text,
  approved
) values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Sample scam awareness source',
  'Messages promising high returns with no risk should be checked before acting. Take time to compare suspicious messages with official guidance or a trusted source.',
  true
)
on conflict (id) do update set
  title = excluded.title,
  source_text = excluded.source_text,
  approved = excluded.approved;

insert into public.lesson_content (
  lesson_id,
  content,
  generation_model,
  generation_warnings
) values (
  '00000000-0000-4000-8000-000000000001',
  '{
    "title": "Checking Before Acting",
    "summary": "A short scenario about spotting suspicious investment messages.",
    "sourceSummary": "Messages promising high returns with no risk should be checked before acting.",
    "learningObjectives": [
      "Identify warning signs in suspicious financial messages",
      "Practice checking with a trusted source before transferring money"
    ],
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
          {
            "id": "choice_1",
            "label": "Reply and ask how to invest",
            "feedback": "This may lead to more pressure. High returns with no risk is a warning sign.",
            "nextSceneId": "scene_2"
          },
          {
            "id": "choice_2",
            "label": "Check with a trusted source first",
            "feedback": "Checking before acting helps reduce scam risk.",
            "nextSceneId": "scene_2"
          }
        ]
      },
      {
        "id": "scene_2",
        "title": "Taking time to verify",
        "body": "Mr. Tan pauses and compares the message with official guidance before doing anything.",
        "sourceRefs": ["source:paragraph_2"],
        "choices": [
          {
            "id": "choice_3",
            "label": "Continue",
            "feedback": "Taking time creates space to make a safer decision.",
            "nextSceneId": null
          }
        ]
      }
    ],
    "reflectionPrompts": ["What warning sign would you discuss with the group?"],
    "knowledgeChecks": [
      {
        "id": "check_1",
        "question": "Which phrase is a warning sign?",
        "options": ["Guaranteed high return", "Take time to check", "Ask someone trusted"],
        "correctOption": "Guaranteed high return",
        "feedback": "Promises of guaranteed high returns can be a scam warning sign."
      }
    ],
    "disclaimer": "This lesson is for education only. It does not provide personal financial advice.",
    "safetyWarnings": []
  }'::jsonb,
  null,
  '{}'
)
on conflict (lesson_id) do update set
  content = excluded.content,
  generation_model = excluded.generation_model,
  generation_warnings = excluded.generation_warnings,
  updated_at = now();

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
  warnings_acknowledged
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
  true
)
on conflict (lesson_id) do update set
  source_approved = excluded.source_approved,
  no_personalized_advice = excluded.no_personalized_advice,
  no_product_recommendation = excluded.no_product_recommendation,
  claims_supported = excluded.claims_supported,
  audience_appropriate = excluded.audience_appropriate,
  disclaimer_present = excluded.disclaimer_present,
  respectful_feedback = excluded.respectful_feedback,
  public_metadata_accurate = excluded.public_metadata_accurate,
  warnings_acknowledged = excluded.warnings_acknowledged;
