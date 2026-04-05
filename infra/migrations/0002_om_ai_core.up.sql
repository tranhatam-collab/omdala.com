-- Om AI Core Schema
-- Domain: AI Human Call + Learning + Communication
-- Tables: personas, calls, transcript_segments, recaps, usage_events, conversation_memories

BEGIN;

-- 1) Personas
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'english_teacher', 'business_coach', 'wellness_companion',
    'language_tutor', 'sales_trainer', 'receptionist', 'custom'
  )),
  avatar_url TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
  system_prompt TEXT NOT NULL DEFAULT '',
  response_style TEXT NOT NULL DEFAULT 'casual' CHECK (response_style IN ('formal', 'casual', 'patient', 'encouraging')),
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (temperature >= 0 AND temperature <= 1),
  speaking_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (speaking_speed >= 0.5 AND speaking_speed <= 2.0),
  availability TEXT NOT NULL DEFAULT 'always' CHECK (availability IN ('always', 'business_hours')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'disabled')),
  total_calls INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_category ON personas(category);
CREATE INDEX IF NOT EXISTS idx_personas_status ON personas(status);

-- 2) Calls
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL REFERENCES personas(id),
  status TEXT NOT NULL DEFAULT 'initiating' CHECK (status IN (
    'initiating', 'ringing', 'active', 'paused', 'ended', 'failed'
  )),
  session_id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  end_reason TEXT CHECK (end_reason IN (
    'user_hangup', 'daily_limit', 'timeout', 'error', 'persona_unavailable'
  )),
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  rating_comment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_persona_id ON calls(persona_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);

-- 3) Transcript Segments
CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'persona')),
  text TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcript_segments_call_id ON transcript_segments(call_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_start_ms ON transcript_segments(call_id, start_ms);

-- 4) Recaps
CREATE TABLE IF NOT EXISTS recaps (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL REFERENCES personas(id),
  summary TEXT NOT NULL DEFAULT '',
  key_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  segment_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recaps_call_id ON recaps(call_id);
CREATE INDEX IF NOT EXISTS idx_recaps_user_id ON recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_recaps_persona_id ON recaps(persona_id);

-- 5) Usage Events
CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL DEFAULT 'om-ai',
  event_type TEXT NOT NULL CHECK (event_type IN (
    'call_started', 'call_ended', 'recap_viewed', 'subscription_changed'
  )),
  minutes_used NUMERIC(8,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_app_id ON usage_events(app_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_occurred_at ON usage_events(occurred_at);

-- 6) Conversation Memories
CREATE TABLE IF NOT EXISTS conversation_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL REFERENCES personas(id),
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  skill_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_call_id TEXT REFERENCES calls(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_user ON conversation_memories(user_id);

-- 7) Om AI Subscriptions
CREATE TABLE IF NOT EXISTS om_ai_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  daily_limit_minutes INTEGER DEFAULT 30,
  price_monthly NUMERIC(8,2) NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_om_ai_subscriptions_user ON om_ai_subscriptions(user_id);

-- Seed 3 MVP personas
INSERT INTO personas (id, slug, name, category, bio, expertise, system_prompt, response_style, status)
VALUES
  ('persona-english-teacher', 'english-teacher', 'English Teacher', 'english_teacher',
   'I am a certified English teacher with 10 years of experience helping students improve their speaking, pronunciation, and confidence.',
   '["Conversation Practice", "Pronunciation Coaching", "Grammar", "Business English"]'::jsonb,
   'You are a friendly, patient English teacher. Help the student practice speaking English. Correct mistakes gently. Focus on pronunciation and natural conversation flow. Ask follow-up questions to keep the conversation going.',
   'patient', 'active'),

  ('persona-business-coach', 'business-coach', 'Business Coach', 'business_coach',
   'I help professionals develop leadership skills, negotiate effectively, and communicate with confidence in any business setting.',
   '["Leadership", "Negotiation", "Presentation Skills", "Strategic Thinking"]'::jsonb,
   'You are a seasoned business coach. Help the user develop professional communication skills. Give practical advice. Use real-world examples. Be encouraging but direct. Focus on actionable takeaways.',
   'formal', 'active'),

  ('persona-wellness-companion', 'wellness-companion', 'Wellness Companion', 'wellness_companion',
   'I am here to listen, support, and help you navigate daily stress, mindfulness, and emotional well-being through thoughtful conversation.',
   '["Mindfulness", "Stress Management", "Active Listening", "Emotional Support"]'::jsonb,
   'You are a warm, empathetic wellness companion. Listen actively. Help the user process their thoughts and feelings. Suggest breathing exercises or reflection prompts when appropriate. Never diagnose or prescribe.',
   'encouraging', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;
