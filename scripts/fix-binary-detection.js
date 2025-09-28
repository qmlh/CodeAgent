/**
 * Fix binary file detection issues for TypeScript/TSX files
 * This script specifically handles files that are incorrectly detected as binary
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files that are commonly detected as binary but are actually text
const problematicFiles = [
  'src/renderer/components/debug/ServiceIntegrationTest.tsx',
  'src/renderer/components/settings/SettingsDemo.tsx',
  'src/renderer/components/settings/categories/ShortcutSettings.tsx',
  'src/renderer/components/tasks/TaskManagementView.tsx',
  'src/renderer/components/system/ShortcutVisualizer.tsx'
];

// Additional encoding fixes for specific patterns
const specificFixes = {
  // JSX attribute fixes
  'info={true}': 'type="info"',
  'warning={true}': 'type="warning"',
  'vertical={true}': 'direction="vertical"',
  'jsx={true}': '',
  'primary={true}': 'type="primary"',
  'left={true}': 'addonBefore',
  
  // Chinese character fixes
  '配置和管理键盘快捷键={true}': 'message="配置和管理键盘快捷键"',
  '配置代码编辑器的行为={true}': 'message="配置代码编辑器的行为"',
  '编辑文件={true}': 'title="编辑文件"',
  '本周统计={true}': 'title="本周统计"',
  '导入布局={true}': 'placeholder="导入布局"',
  '高级筛={true}': 'title="高级筛选"',
  
  // Fix unterminated strings
  '": "': '": "',
  '": \'': '": \'',
  
  // Fix JSX syntax issues
  '>{': '>{',
  '}<': '}<',
  
  // Fix object property syntax
  '文件:': 'category: "文件",',
  '编辑:': 'category: "编辑",',
  '视图:': 'category: "视图",',
  '导航:': 'category: "导航",'
};

async function fixBinaryDetectedFile(filePath) {
  try {
    console.log(`Fixing binary-detected file: ${filePath}`);
    
    // Try to read the file with different encodings
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      // Try with latin1 if utf8 fails
      content = await readFile(filePath, 'latin1');
      console.log(`  Used latin1 encoding for ${filePath}`);
    }
    
    let fixedContent = content;
    let hasChanges = false;
    
    // Remove BOM if present
    if (fixedContent.charCodeAt(0) === 0xFEFF) {
      fixedContent = fixedContent.slice(1);
      hasChanges = true;
      console.log(`  Removed BOM from ${filePath}`);
    }
    
    // Remove null bytes and other binary indicators
    const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/g;
    if (binaryPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(binaryPattern, '');
      hasChanges = true;
      console.log(`  Removed binary characters from ${filePath}`);
    }
    
    // Apply specific fixes
    for (const [pattern, replacement] of Object.entries(specificFixes)) {
      if (fixedContent.includes(pattern)) {
        fixedContent = fixedContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        hasChanges = true;
        console.log(`  Applied fix: "${pattern}" -> "${replacement}"`);
      }
    }
    
    // Fix common JSX issues
    const jsxFixes = [
      // Fix unclosed tags
      { pattern: /<(\w+)([^>]*?)(?<!\/)\s*$/gm, replacement: '<$1$2>' },
      // Fix malformed attributes
      { pattern: /(\w+)=\{true\}/g, replacement: '$1' },
      // Fix Chinese characters in object literals
      { pattern: /(\w+)�/g, replacement: '$1' },
      // Fix unterminated strings in JSX
      { pattern: /="([^"]*?)$/gm, replacement: '="$1"' }
    ];
    
    for (const { pattern, replacement } of jsxFixes) {
      const matches = fixedContent.match(pattern);
      if (matches) {
        fixedContent = fixedContent.replace(pattern, replacement);
        hasChanges = true;
        console.log(`  Fixed JSX pattern: ${matches.length} matches`);
      }
    }
    
    if (hasChanges) {
      // Write the file back with UTF-8 encoding
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`  ✓ Fixed binary detection issues in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting binary detection fix process...');
  
  let fixedCount = 0;
  
  for (const filePath of problematicFiles) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    // Check if file exists
    try {
      await fs.promises.access(fullPath);
      const wasFixed = await fixBinaryDetectedFile(fullPath);
      if (wasFixed) {
        fixedCount++;
      }
    } catch (error) {
      console.log(`  File not found: ${filePath}`);
    }
  }
  
  console.log(`\nBinary detection fix complete!`);
  console.log(`Files processed: ${problematicFiles.length}`);
  console.log(`Files fixed: ${fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\nRecommendation: Run TypeScript compilation to verify fixes');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixBinaryDetectedFile };