/**
 * Fix encoding issues in specific problematic files
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Map of corrupted characters to their correct UTF-8 equivalents
const encodingFixes = {
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
  '列表视图': '列表视图'
};

// Files that need encoding fixes based on the task description
const problematicFiles = [
  'src/renderer/components/system/ShortcutVisualizer.tsx',
  'src/renderer/components/tasks/TaskManagementView.tsx'
];

async function fixFileEncoding(filePath) {
  try {
    console.log(`Fixing file: ${filePath}`);
    
    // Read file with explicit UTF-8 encoding
    const content = await readFile(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;
    
    // Apply direct character replacements
    for (const [corrupted, correct] of Object.entries(encodingFixes)) {
      if (fixedContent.includes(corrupted)) {
        console.log(`  Found corrupted text: "${corrupted}" -> "${correct}"`);
        fixedContent = fixedContent.replace(new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
        hasChanges = true;
      }
    }
    
    // Check for any remaining � characters
    const remainingCorrupted = fixedContent.match(/�/g);
    if (remainingCorrupted) {
      console.log(`  Warning: ${remainingCorrupted.length} unresolved corrupted characters remaining`);
    }
    
    if (hasChanges) {
      // Write file back with UTF-8 encoding
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`  ✓ Fixed encoding issues in ${filePath}`);
      return true;
    } else {
      console.log(`  No encoding issues found in ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting targeted encoding fix process...');
  
  let fixedCount = 0;
  
  for (const file of problematicFiles) {
    const filePath = path.join(__dirname, '..', file);
    const wasFixed = await fixFileEncoding(filePath);
    if (wasFixed) {
      fixedCount++;
    }
  }
  
  console.log(`\nTargeted encoding fix complete!`);
  console.log(`Files processed: ${problematicFiles.length}`);
  console.log(`Files fixed: ${fixedCount}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixFileEncoding };