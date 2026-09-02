-- OMINO Phase 2: RLS policies for catalog & inventory tables
-- Apply after Prisma migration. Requires PostgreSQL.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY category_org_isolation ON categories
  FOR ALL USING (organization_id = app_current_organization_id());

-- Product options
CREATE POLICY product_option_org_isolation ON product_options
  FOR ALL USING (organization_id = app_current_organization_id());

-- Products
CREATE POLICY product_org_isolation ON products
  FOR ALL USING (organization_id = app_current_organization_id());

-- Product variants
CREATE POLICY product_variant_org_isolation ON product_variants
  FOR ALL USING (organization_id = app_current_organization_id());

-- Product images
CREATE POLICY product_image_org_isolation ON product_images
  FOR ALL USING (organization_id = app_current_organization_id());

-- Stock locations
CREATE POLICY stock_location_org_isolation ON stock_locations
  FOR ALL USING (organization_id = app_current_organization_id());

-- Stock levels
CREATE POLICY stock_level_org_isolation ON stock_levels
  FOR ALL USING (organization_id = app_current_organization_id());

-- Stock movements
CREATE POLICY stock_movement_org_isolation ON stock_movements
  FOR ALL USING (organization_id = app_current_organization_id());

-- Stock transfers
CREATE POLICY stock_transfer_org_isolation ON stock_transfers
  FOR ALL USING (organization_id = app_current_organization_id());

-- Product option values (via option org)
CREATE POLICY product_option_value_org_isolation ON product_option_values
  FOR ALL USING (
    option_id IN (
      SELECT id FROM product_options WHERE organization_id = app_current_organization_id()
    )
  );

-- Product option links (via product org)
CREATE POLICY product_option_link_org_isolation ON product_option_links
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE organization_id = app_current_organization_id()
    )
  );

-- Variant options (via variant org)
CREATE POLICY product_variant_option_org_isolation ON product_variant_options
  FOR ALL USING (
    variant_id IN (
      SELECT id FROM product_variants WHERE organization_id = app_current_organization_id()
    )
  );

-- Transfer items (via transfer org)
CREATE POLICY stock_transfer_item_org_isolation ON stock_transfer_items
  FOR ALL USING (
    transfer_id IN (
      SELECT id FROM stock_transfers WHERE organization_id = app_current_organization_id()
    )
  );
