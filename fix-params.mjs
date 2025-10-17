import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const apiDir = 'apps/web/src/app/api';

function getAllRouteFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts' && currentDir.includes('[')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

console.log('🔧 Fixing Next.js 15 params Promise issue...\n');

const routeFiles = getAllRouteFiles(apiDir);
let fixedCount = 0;

for (const file of routeFiles) {
  try {
    let content = readFileSync(file, 'utf-8');
    let modified = false;
    
    // Pattern 1: Single id param
    if (content.includes('{ params }: { params: { id: string } }')) {
      content = content.replace(
        /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g,
        'context: { params: Promise<{ id: string }> }'
      );
      modified = true;
    }
    
    // Pattern 2: category and fileId params
    if (content.includes('{ params }: { params: { category: string; fileId: string } }')) {
      content = content.replace(
        /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*category:\s*string;\s*fileId:\s*string\s*\}\s*\}/g,
        'context: { params: Promise<{ category: string; fileId: string }> }'
      );
      modified = true;
    }
    
    // Add await params if modified and not already present
    if (modified && !content.includes('const params = await context.params')) {
      // Add const params = await context.params; after each try {
      content = content.replace(
        /(\)\s*\{\s*try\s*\{)/g,
        '$1\n    const params = await context.params;'
      );
    }
    
    if (modified) {
      writeFileSync(file, content, 'utf-8');
      fixedCount++;
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
}

console.log(`\n✨ Fixed ${fixedCount} files!`);
