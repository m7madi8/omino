-- OMINO Supabase foundation migration
-- Apply via: supabase db push  OR  psql $DATABASE_URL -f supabase/migrations/20260302100000_omino_foundation.sql
--
-- Prerequisites: Prisma schema applied to the same PostgreSQL instance.

-- ---------------------------------------------------------------------------
-- JWT helpers for Supabase Realtime + RLS (works with custom JWT from NextAuth)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_organization_id() RETURNS uuid AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'organization_id', '')::uuid,
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS uuid AS $$
  SELECT COALESCE(
    NULLIF(auth.uid()::text, '')::uuid,
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_role_slug() RETURNS text AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'role', ''),
    'STAFF'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Storage: tenant-safe media bucket
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'omino-media',
  'omino-media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path: organizations/{orgId}/stores/{storeId}/... or organizations/{orgId}/products/{productId}/...
CREATE POLICY omino_media_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'omino-media'
    AND (storage.foldername(name))[1] = 'organizations'
  );

CREATE POLICY omino_media_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'omino-media'
    AND (storage.foldername(name))[1] = 'organizations'
    AND (storage.foldername(name))[2] = auth_organization_id()::text
  );

CREATE POLICY omino_media_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'omino-media'
    AND (storage.foldername(name))[2] = auth_organization_id()::text
  );

CREATE POLICY omino_media_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'omino-media'
    AND (storage.foldername(name))[2] = auth_organization_id()::text
  );

-- ---------------------------------------------------------------------------
-- Realtime: enable postgres_changes for key commerce tables
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stock_levels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stock_levels;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stores;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'business_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_actions;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Supabase-native RLS policies for realtime clients (JWT organization_id)
-- These complement prisma/migrations/rls_*.sql (app.current_organization_id)
-- ---------------------------------------------------------------------------

-- Orders: tenant isolation via JWT or session var
DROP POLICY IF EXISTS order_realtime_select ON orders;
CREATE POLICY order_realtime_select ON orders
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS payment_realtime_select ON payments;
CREATE POLICY payment_realtime_select ON payments
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS stock_level_realtime_select ON stock_levels;
CREATE POLICY stock_level_realtime_select ON stock_levels
  FOR SELECT
  USING (
    location_id IN (
      SELECT id FROM stock_locations
      WHERE organization_id = auth_organization_id()
    )
  );

DROP POLICY IF EXISTS customer_realtime_select ON customers;
CREATE POLICY customer_realtime_select ON customers
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS product_realtime_select ON products;
CREATE POLICY product_realtime_select ON products
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS store_realtime_select ON stores;
CREATE POLICY store_realtime_select ON stores
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS business_event_realtime_select ON business_events;
CREATE POLICY business_event_realtime_select ON business_events
  FOR SELECT
  USING (organization_id = auth_organization_id());

DROP POLICY IF EXISTS ai_action_realtime_select ON ai_actions;
CREATE POLICY ai_action_realtime_select ON ai_actions
  FOR SELECT
  USING (organization_id = auth_organization_id());

-- ---------------------------------------------------------------------------
-- Indexes for tenant-scoped realtime filters (idempotent)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_orders_org_store_created ON orders (organization_id, store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_org_store_created ON payments (organization_id, store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_org_created ON customers (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_org_status ON products (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_business_events_org_type ON business_events (organization_id, type, created_at DESC);
