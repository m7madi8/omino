-- Phase 8: AI tables RLS policies
-- Run after prisma migrate when PostgreSQL RLS is enabled

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_conversations_tenant ON ai_conversations
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY ai_messages_tenant ON ai_messages
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
    )
  );

CREATE POLICY ai_tool_calls_tenant ON ai_tool_calls
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations
      WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
    )
  );

CREATE POLICY ai_actions_tenant ON ai_actions
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY ai_memories_tenant ON ai_memories
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY ai_usage_tenant ON ai_usage
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
