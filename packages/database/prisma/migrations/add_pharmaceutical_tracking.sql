-- Migration: Add Pharmaceutical Tracking Fields
-- Created: December 2, 2025
-- Purpose: Enable tablet-level tracking, package management, and cost calculations

-- ========================================
-- PART 1: Update PrescriptionItem table
-- ========================================

-- Add new columns for tablet quantities and pricing
ALTER TABLE prescription_items 
ADD COLUMN packages_needed INTEGER,
ADD COLUMN unit_price DECIMAL(10, 2),
ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN hmo_contribution DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN patient_pays DECIMAL(10, 2) DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN prescription_items.packages_needed IS 'Number of packages to dispense (calculated based on tablets_per_package)';
COMMENT ON COLUMN prescription_items.unit_price IS 'Price per individual tablet/unit at time of prescription';
COMMENT ON COLUMN prescription_items.subtotal IS 'Total cost before HMO contribution (total_tablets × unit_price)';
COMMENT ON COLUMN prescription_items.hmo_contribution IS 'Amount HMO pays from tariff';
COMMENT ON COLUMN prescription_items.patient_pays IS 'Amount patient pays (subtotal - hmo_contribution)';

-- ========================================
-- PART 2: Ensure Inventory has required fields
-- ========================================

-- These fields should already exist in schema, but add if missing
-- Packaging tracking fields
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS packaging_unit VARCHAR(50) DEFAULT 'tablet',
ADD COLUMN IF NOT EXISTS tablets_per_package INTEGER DEFAULT 1;

-- Add comments
COMMENT ON COLUMN inventory.packaging_unit IS 'Type of packaging: tablet, blister_pack, bottle, strip, box, vial, sachet';
COMMENT ON COLUMN inventory.tablets_per_package IS 'Number of individual units (tablets/capsules) per package';
COMMENT ON COLUMN inventory.stock_quantity IS 'Number of packages in stock (NOT individual tablets)';
COMMENT ON COLUMN inventory.unit_price IS 'Price per individual tablet/unit (Self-pay)';
COMMENT ON COLUMN inventory.corporate_price IS 'Price per individual tablet/unit (Corporate)';
COMMENT ON COLUMN inventory.hmo_price IS 'Price per individual tablet/unit (HMO)';

-- ========================================
-- PART 3: Update existing records
-- ========================================

-- Set default values for existing inventory records
UPDATE inventory 
SET 
  packaging_unit = COALESCE(packaging_unit, 'tablet'),
  tablets_per_package = COALESCE(tablets_per_package, 1)
WHERE 
  packaging_unit IS NULL 
  OR tablets_per_package IS NULL;

-- ========================================
-- PART 4: Create helpful views
-- ========================================

-- View: Inventory with calculated total units
CREATE OR REPLACE VIEW inventory_with_units AS
SELECT 
  i.*,
  (i.stock_quantity * i.tablets_per_package) as total_units_in_stock,
  CASE 
    WHEN i.stock_quantity <= i.reorder_level THEN true
    ELSE false
  END as needs_reorder
FROM inventory i;

-- View: Prescription items with calculated costs
CREATE OR REPLACE VIEW prescription_items_with_costs AS
SELECT 
  pi.*,
  p.patient_id,
  p.dispensed_by,
  p.dispensed_at,
  pat.first_name,
  pat.last_name,
  pat.enrollment_type,
  inv.item_name as drug_name_from_inventory,
  inv.tablets_per_package,
  CASE 
    WHEN pi.total_tablets IS NOT NULL AND inv.tablets_per_package IS NOT NULL 
    THEN CEIL(pi.total_tablets::DECIMAL / inv.tablets_per_package::DECIMAL)
    ELSE pi.packages_needed
  END as calculated_packages_needed
FROM prescription_items pi
LEFT JOIN prescriptions p ON pi.prescription_id = p.id
LEFT JOIN patients pat ON p.patient_id = pat.id
LEFT JOIN inventory inv ON pi.inventory_id = inv.id;

-- ========================================
-- PART 5: Create indexes for performance
-- ========================================

-- Index for searching by packaging type
CREATE INDEX IF NOT EXISTS idx_inventory_packaging_unit 
ON inventory(packaging_unit);

-- Index for prescription cost queries
CREATE INDEX IF NOT EXISTS idx_prescription_items_pricing 
ON prescription_items(unit_price, subtotal);

-- ========================================
-- PART 6: Add constraints
-- ========================================

-- Ensure tablets_per_package is always positive
ALTER TABLE inventory 
ADD CONSTRAINT chk_tablets_per_package_positive 
CHECK (tablets_per_package > 0);

-- Ensure pricing fields are non-negative
ALTER TABLE prescription_items
ADD CONSTRAINT chk_unit_price_non_negative 
CHECK (unit_price IS NULL OR unit_price >= 0);

ALTER TABLE prescription_items
ADD CONSTRAINT chk_subtotal_non_negative 
CHECK (subtotal IS NULL OR subtotal >= 0);

ALTER TABLE prescription_items
ADD CONSTRAINT chk_hmo_contribution_non_negative 
CHECK (hmo_contribution IS NULL OR hmo_contribution >= 0);

ALTER TABLE prescription_items
ADD CONSTRAINT chk_patient_pays_non_negative 
CHECK (patient_pays IS NULL OR patient_pays >= 0);

-- ========================================
-- PART 7: Create audit trigger (optional)
-- ========================================

-- Track inventory changes for dispensing
CREATE TABLE IF NOT EXISTS inventory_audit (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  packages_before INTEGER,
  packages_after INTEGER,
  units_before INTEGER,
  units_after INTEGER,
  changed_by INTEGER,
  prescription_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO inventory_audit (
      inventory_id,
      action,
      packages_before,
      packages_after,
      units_before,
      units_after,
      changed_by,
      created_at
    ) VALUES (
      NEW.id,
      'stock_change',
      OLD.stock_quantity,
      NEW.stock_quantity,
      OLD.stock_quantity * OLD.tablets_per_package,
      NEW.stock_quantity * NEW.tablets_per_package,
      NULL, -- Will be set by application
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to inventory table
DROP TRIGGER IF EXISTS inventory_change_trigger ON inventory;
CREATE TRIGGER inventory_change_trigger
AFTER UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION log_inventory_change();

-- ========================================
-- Migration Complete!
-- ========================================

-- Verify the migration
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_inventory_items,
  COUNT(*) FILTER (WHERE packaging_unit IS NOT NULL) as items_with_packaging,
  COUNT(*) FILTER (WHERE tablets_per_package > 1) as items_with_multi_unit_packages
FROM inventory;
