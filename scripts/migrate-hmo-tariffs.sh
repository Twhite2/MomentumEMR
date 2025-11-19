#!/bin/bash
# HMO Tariff Migration Script

echo "========================================="
echo "HMO Tariff Database Migration"
echo "========================================="

echo ""
echo "Step 1: Generate Prisma Client..."
cd packages/database
pnpm prisma generate

echo ""
echo "Step 2: Create Migration..."
pnpm prisma migrate dev --name add_hmo_tariff_model

echo ""
echo "Step 3: Push to Database..."
pnpm prisma db push

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Navigate to /hmo/[id]/tariffs in the frontend"
echo "2. Import the 3 HMO tariff Excel files:"
echo "   - Reliance Tariff.xlsx (Type: reliance)"
echo "   - Leadway Provider Network.xlsx (Type: leadway)"
echo "   - Axa Mansard Tariff.xlsx (Type: axa)"
echo ""
echo "API Endpoints Created:"
echo "  POST /api/hmo/[id]/tariffs/import - Import tariffs"
echo "  GET  /api/hmo/[id]/tariffs        - Search tariffs"
echo "  DELETE /api/hmo/[id]/tariffs      - Clear tariffs"
echo ""
