#!/bin/bash
echo "📋 Creating database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "📥 Importing data..."
npx tsx scripts/import-data.ts

echo ""
echo "✅ Database setup complete!"
