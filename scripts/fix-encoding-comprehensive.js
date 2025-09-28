/**
 * Comprehensive encoding fix script for TypeScript/TSX files
 * This script identifies and fixes files with corrupted Chinese characters and binary detection issues
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Comprehensive map of corrupted characters to their correct UTF-8 equivalents
const encodingFixes = {
  // Common corrupted Chinese characters
  '另存�?': '另存为',
  '全�?': '全选',
  '资源管理�?': '资源管理器',
  '甘特�?': '甘特图',
  '高级筛�?': '高级筛选',
  '个任�?': '个任务',
  '创建新任�?': '创建新任务',
  '快捷�?': '快捷键',
  '未找到匹配的快捷�?': '未找到匹配的快捷键',
  '某些快捷键被多个功能使用，可能导致功能冲�?': '某些快捷键被多个功能使用，可能导致功能冲突',
  '仅显示冲�?': '仅显示冲突',
  '搜索快捷�?': '搜索快捷键',
  '快捷键列�?': '快捷键列表',
  '快捷键帮�?': '快捷键帮助',
  '如何使用快捷键可视化�?': '如何使用快捷键可视化器',
  '快捷键说�?': '快捷键说明',
  '修饰�?': '修饰键',
  '功能�?': '功能键',
  '此快捷键存在冲突': '此快捷键存在冲突',
  '已禁�?': '已禁用',
  '转到�?': '转到行',
  '格式化文�?': '格式化文档',
  '编辑�?': '编辑器',
  '复制�?': '复制行',
  '上移�?': '上移行',
  '下移�?': '下移行',
  '多光�?': '多光标',
  '开始调�?': '开始调试',
  '开发者工�?': '开发者工具',
  '当前按键组合': '当前按键组合',
  '排序选项': '排序选项',
  '视图设置': '视图设置',
  '任务管理': '任务管理',
  '创建任务': '创建任务',
  '看板视图': '看板视图',
  '列表视图': '列表视图',
  // Additional patterns from compilation errors
  '配置和管理键盘快捷�?': '配置和管理键盘快捷键',
  '配置代码编辑器的行�?': '配置代码编辑器的行为',
  '代码编辑器行为�?': '代码编辑器行为配置',
  '编辑文�?': '编辑文件',
  '本周统�?': '本周统计',
  '导入布�?': '导入布局',
  '编�?': '编辑',
  '文�?': '文件',
  '视�?': '视图',
  '导�?': '导航'
};

// Files that are commonly detected as binary but are actually text
const binaryDetectedFiles = [
  'ServiceIntegrationTest.tsx',
  'SettingsDemo.tsx',
  'ShortcutSettings.tsx',
  'TaskManagementView.tsx',
  'ShortcutVisualizer.tsx'
];

async function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  async function traverse(currentDir) {
    const items = await readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and dist directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(item)) {
          await traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

function isBinaryDetectedFile(filePath) {
  const fileName = path.basename(filePath);
  return binaryDetectedFiles.includes(fileName);
}

function detectAndFixBinaryContent(content) {
  // Check if content appears to be corrupted binary
  const binaryIndicators = [
    /[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, // Control characters
    /\uFFFD/g, // Replacement character
    /[\u0080-\u00FF]{3,}/g // Sequences of high bytes
  ];
  
  let hasChanges = false;
  let fixedContent = content;
  
  // Remove or replace binary indicators
  for (const indicator of binaryIndicators) {
    if (indicator.test(fixedContent)) {
      fixedContent = fixedContent.replace(indicator, '');
      hasChanges = true;
    }
  }
  
  return { content: fixedContent, hasChanges };
}

async function fixFileEncoding(filePath) {
  try {
    console.log(`Checking file: ${filePath}`);
    
    // Try to read file with different encodings
    let content;
    let encoding = 'utf8';
    
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      console.log(`  Trying latin1 encoding for ${filePath}`);
      content = await readFile(filePath, 'latin1');
      encoding = 'latin1';
    }
    
    let fixedContent = content;
    let hasChanges = false;
    
    // Check if this is a binary-detected file that should be text
    if (isBinaryDetectedFile(filePath)) {
      console.log(`  Fixing binary-detected file: ${path.basename(filePath)}`);
      const binaryFix = detectAndFixBinaryContent(fixedContent);
      fixedContent = binaryFix.content;
      hasChanges = binaryFix.hasChanges || hasChanges;
    }
    
    // Apply direct character replacements
    for (const [corrupted, correct] of Object.entries(encodingFixes)) {
      if (fixedContent.includes(corrupted)) {
        console.log(`  Found corrupted text: "${corrupted}" -> "${correct}"`);
        fixedContent = fixedContent.replace(new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
        hasChanges = true;
      }
    }
    
    // Fix common encoding patterns
    const patterns = [
      // Replace � with common endings
      { pattern: /(\w+)�(\w*)/g, replacement: (match, before, after) => {
        const commonEndings = {
          '另存': '另存为',
          '全': '全选',
          '资源管理': '资源管理器',
          '甘特': '甘特图',
          '高级筛': '高级筛选',
          '快捷': '快捷键',
          '编辑': '编辑器',
          '格式化文': '格式化文档',
          '开发者工': '开发者工具',
          '配置和管理键盘快捷': '配置和管理键盘快捷键',
          '配置代码编辑器的行': '配置代码编辑器的行为',
          '编辑文': '编辑文件',
          '本周统': '本周统计',
          '导入布': '导入布局'
        };
        return commonEndings[before] || match;
      }},
      // Fix unterminated strings and JSX issues
      { pattern: /(\w+)�/g, replacement: (match, before) => {
        const singleCharFixes = {
          '编': '编辑',
          '文': '文件',
          '视': '视图',
          '导': '导航',
          '筛': '筛选',
          '键': '快捷键',
          '器': '编辑器',
          '档': '文档',
          '具': '工具',
          '计': '统计',
          '局': '布局'
        };
        return singleCharFixes[before] || match;
      }}
    ];
    
    for (const { pattern, replacement } of patterns) {
      const matches = fixedContent.match(pattern);
      if (matches) {
        console.log(`  Found pattern matches: ${matches.join(', ')}`);
        fixedContent = fixedContent.replace(pattern, replacement);
        hasChanges = true;
      }
    }
    
    // Check for any remaining � characters
    const remainingCorrupted = fixedContent.match(/�/g);
    if (remainingCorrupted) {
      console.log(`  Warning: ${remainingCorrupted.length} unresolved corrupted characters in ${filePath}`);
    }
    
    if (hasChanges) {
      // Write file back with UTF-8 encoding
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`  ✓ Fixed encoding issues in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting comprehensive encoding fix process...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = await getAllFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript/TSX files to check`);
  
  let fixedCount = 0;
  let batchSize = 10; // Process files in batches to avoid session timeout
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
    
    for (const file of batch) {
      const wasFixed = await fixFileEncoding(file);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\nComprehensive encoding fix complete!`);
  console.log(`Files processed: ${files.length}`);
  console.log(`Files fixed: ${fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\nRecommendation: Run TypeScript compilation to verify fixes');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixFileEncoding, getAllFiles };