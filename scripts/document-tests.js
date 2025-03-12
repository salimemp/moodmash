#!/usr/bin/env node

/**
 * Test Documentation Automation Script
 * 
 * This script automatically adds documentation comments to test files
 * following the established pattern in the project.
 * 
 * Usage: node scripts/document-tests.js [pattern]
 * Example: node scripts/document-tests.js "src/__tests__/lib/auth/*.test.ts"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const DEFAULT_TEST_FILES_PATTERN = 'src/**/*.test.ts';
const ALREADY_DOCUMENTED_MARKER = 'Tests for';
const SKIP_FILES = []; // Add files you want to skip

// Function to check if a file is already documented
function isAlreadyDocumented(content) {
  return content.includes(ALREADY_DOCUMENTED_MARKER);
}

// Function to add documentation to a test file
function documentTestFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Skip specified files
  if (SKIP_FILES.some(skipPattern => filePath.includes(skipPattern))) {
    console.log(`  ⚠️ Skipped (in skip list)`);
    return false;
  }
  
  // Read file content
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.log(`  ❌ Error reading file: ${err.message}`);
    return false;
  }
  
  // Skip if already documented
  if (isAlreadyDocumented(content)) {
    console.log(`  ✓ Already documented`);
    return false;
  }
  
  try {
    // Parse the test file to identify structure
    const { imports, mocks, mainDescribe, nestedDescribes, testCases } = parseTestFile(content);
    
    // Get module info
    const moduleInfo = getModuleInfo(filePath, mainDescribe);
    
    // Generate documentation
    const documentedContent = generateDocumentedContent(
      content,
      imports,
      mocks,
      mainDescribe,
      nestedDescribes,
      testCases,
      moduleInfo
    );
    
    // Write the file
    fs.writeFileSync(filePath, documentedContent);
    console.log(`  ✓ Documentation added`);
    return true;
  } catch (err) {
    console.log(`  ❌ Error processing file: ${err.message}`);
    return false;
  }
}

// Function to extract module information from the file path and describe block
function getModuleInfo(filePath, mainDescribe) {
  // Extract the directory structure
  const pathParts = filePath.split(path.sep);
  const testsIndex = pathParts.findIndex(part => part === '__tests__');
  
  // Get relevant path sections
  const modulePathParts = pathParts.slice(testsIndex + 1);
  
  // Extract module type and name
  const moduleType = modulePathParts[0] || 'lib'; // lib, api, pages, etc.
  const moduleCategory = modulePathParts[1] || ''; // auth, encryption, etc.
  
  // Extract the base name without extension
  const fileName = path.basename(filePath, '.test.ts');
  
  // Generate a human-readable module name
  const baseName = fileName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Generate description based on file path and name
  let moduleDescription;
  if (moduleCategory === 'auth') {
    moduleDescription = `authentication ${fileName.replace(/-/g, ' ')}`;
  } else if (moduleCategory === 'encryption') {
    moduleDescription = `encryption ${fileName.replace(/-/g, ' ')}`;
  } else {
    moduleDescription = `${fileName.replace(/-/g, ' ')}`;
  }
  
  return {
    type: moduleType,
    category: moduleCategory,
    name: baseName,
    description: moduleDescription,
    mainDescribe: mainDescribe
  };
}

// Function to parse a test file
function parseTestFile(content) {
  // Extract imports
  const importMatches = content.match(/import\s+.*?;/gs) || [];
  const imports = importMatches.join('\n');
  
  // Extract mocks (vi.mock calls)
  const mockMatches = content.match(/vi\.mock\(.*?\)\);/gs) || [];
  const mocks = mockMatches.join('\n');
  
  // Extract the main describe block
  const mainDescribeMatch = content.match(/describe\(\s*['"]([^'"]+)['"]/);
  const mainDescribe = mainDescribeMatch ? mainDescribeMatch[1] : 'Test Suite';
  
  // Extract nested describe blocks with their contents
  const nestedDescribeRegex = /describe\(\s*['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\{([\s\S]*?)(?=describe\(|}\)\;[\s]*$)/g;
  const nestedDescribes = [];
  
  let match;
  while ((match = nestedDescribeRegex.exec(content)) !== null) {
    const blockName = match[1];
    const blockContent = match[2];
    
    // Extract it blocks within this describe
    const itBlocks = [];
    const itRegex = /it\(\s*['"]([^'"]+)['"]\s*,\s*.*?=>\s*\{([\s\S]*?)(?=it\(|}\)\;)/g;
    let itMatch;
    
    while ((itMatch = itRegex.exec(blockContent)) !== null) {
      itBlocks.push({
        name: itMatch[1],
        content: itMatch[2]
      });
    }
    
    nestedDescribes.push({
      name: blockName,
      content: blockContent,
      tests: itBlocks
    });
  }
  
  // Extract individual test cases
  const testCases = [];
  const itBlockRegex = /it\(\s*['"]([^'"]+)['"]\s*,\s*.*?=>\s*\{([\s\S]*?)(?=it\(|}\)\;)/g;
  
  while ((match = itBlockRegex.exec(content)) !== null) {
    testCases.push({
      name: match[1],
      content: match[2]
    });
  }
  
  return {
    imports,
    mocks,
    mainDescribe,
    nestedDescribes,
    testCases
  };
}

// Function to generate documented content
function generateDocumentedContent(
  originalContent,
  imports,
  mocks,
  mainDescribe,
  nestedDescribes,
  testCases,
  moduleInfo
) {
  let content = originalContent;
  
  // Generate main file description
  const mainDescription = generateMainDescription(moduleInfo);
  
  // Find the position to insert the documentation
  // Look for the first describe block
  const firstDescribeIndex = content.indexOf(`describe(`);
  
  if (firstDescribeIndex === -1) {
    console.log('  ⚠️ No describe block found, cannot add documentation');
    return content;
  }
  
  // Insert main description just before the first describe
  // First, add some whitespace if needed
  let insertText = mainDescription;
  if (!content.substring(firstDescribeIndex - 2, firstDescribeIndex).includes('\n\n')) {
    insertText = '\n' + insertText;
  }
  
  content = content.slice(0, firstDescribeIndex) + insertText + content.slice(firstDescribeIndex);
  
  // Insert nested describe documentation
  content = documentDescribeBlocks(content, moduleInfo, nestedDescribes);
  
  // Document individual test cases
  content = documentTestCases(content, testCases);
  
  return content;
}

// Generate the main file description
function generateMainDescription(moduleInfo) {
  // Build a description based on the module info
  let description;
  
  if (moduleInfo.category === 'auth') {
    description = `// Tests for ${moduleInfo.name} functionality\n`;
    description += `// Validates authentication behaviors and security properties\n\n`;
  } else if (moduleInfo.category === 'encryption') {
    description = `// Tests for ${moduleInfo.name} functionality\n`;
    description += `// Validates encryption operations and security properties\n\n`;
  } else {
    description = `// Tests for ${moduleInfo.name} functionality\n`;
    description += `// Validates core behaviors and edge cases\n\n`;
  }
  
  return description;
}

// Document describe blocks
function documentDescribeBlocks(content, moduleInfo, nestedDescribes) {
  let documentedContent = content;
  
  // Document the main describe block
  const mainDescribeRegex = new RegExp(`(describe\\(\\s*['"]${escapeRegExp(moduleInfo.mainDescribe)}['"]\\s*,\\s*\\(\\)\\s*=>\\s*\\{)`, 'g');
  
  let mainDescription;
  if (moduleInfo.category === 'auth') {
    mainDescription = `// Tests for the ${moduleInfo.description} module\n`;
    mainDescription += `// Validates security, functionality, and edge cases\n$1`;
  } else if (moduleInfo.category === 'encryption') {
    mainDescription = `// Tests for the ${moduleInfo.description} module\n`;
    mainDescription += `// Validates cryptographic operations and security properties\n$1`;
  } else {
    mainDescription = `// Tests for the ${moduleInfo.description} module\n`;
    mainDescription += `// Validates core functionality and edge cases\n$1`;
  }
  
  documentedContent = documentedContent.replace(mainDescribeRegex, mainDescription);
  
  // Document each nested describe block
  nestedDescribes.forEach(block => {
    const blockRegex = new RegExp(`(describe\\(\\s*['"]${escapeRegExp(block.name)}['"]\\s*,\\s*\\(\\)\\s*=>\\s*\\{)`, 'g');
    
    // Generate description based on block name
    let blockDescription;
    if (block.name.toLowerCase().includes('config') || block.name.toLowerCase().includes('options')) {
      blockDescription = `// Tests for configuration and options\n`;
      blockDescription += `// Ensures settings are correctly applied and validated\n$1`;
    } else if (block.name.toLowerCase().includes('callback')) {
      blockDescription = `// Tests for ${block.name.toLowerCase()} functionality\n`;
      blockDescription += `// Verifies correct behavior during authentication flows\n$1`;
    } else if (block.name.toLowerCase().includes('authorization') || block.name.toLowerCase().includes('auth')) {
      blockDescription = `// Tests for authorization functionality\n`;
      blockDescription += `// Validates security checks and access controls\n$1`;
    } else if (block.name.toLowerCase().includes('token') || block.name.toLowerCase().includes('jwt')) {
      blockDescription = `// Tests for token management\n`;
      blockDescription += `// Ensures tokens are secure and properly handled\n$1`;
    } else if (block.name.toLowerCase().includes('password')) {
      blockDescription = `// Tests for password handling\n`;
      blockDescription += `// Verifies secure password operations\n$1`;
    } else if (block.name.toLowerCase().includes('generate') || block.name.toLowerCase().includes('creation')) {
      blockDescription = `// Tests for ${block.name.toLowerCase()} functionality\n`;
      blockDescription += `// Ensures items are correctly generated with expected properties\n$1`;
    } else {
      blockDescription = `// Tests for ${block.name.toLowerCase()} functionality\n`;
      blockDescription += `// Validates expected behavior in various scenarios\n$1`;
    }
    
    documentedContent = documentedContent.replace(blockRegex, blockDescription);
  });
  
  return documentedContent;
}

// Document individual test cases
function documentTestCases(content, testCases) {
  let documentedContent = content;
  
  testCases.forEach(test => {
    const testRegex = new RegExp(`(it\\(\\s*['"]${escapeRegExp(test.name)}['"]\\s*,\\s*.*?=>\\s*\\{)`, 'g');
    
    // Generate description based on test name
    let testDescription;
    if (test.name.toLowerCase().includes('should return') || test.name.toLowerCase().includes('returns')) {
      testDescription = `// Verifies the correct return value\n`;
      testDescription += `// Ensures the function behaves as expected\n$1`;
    } else if (test.name.toLowerCase().includes('should throw') || test.name.toLowerCase().includes('throws')) {
      testDescription = `// Verifies error handling behavior\n`;
      testDescription += `// Ensures appropriate errors are thrown for invalid inputs\n$1`;
    } else if (test.name.toLowerCase().includes('should call') || test.name.toLowerCase().includes('calls')) {
      testDescription = `// Verifies that dependencies are called correctly\n`;
      testDescription += `// Ensures proper integration with external systems\n$1`;
    } else if (test.name.toLowerCase().includes('valid') || test.name.toLowerCase().includes('match')) {
      testDescription = `// Verifies validation logic\n`;
      testDescription += `// Ensures data meets expected format and requirements\n$1`;
    } else if (test.name.toLowerCase().includes('should have') || test.name.toLowerCase().includes('has')) {
      testDescription = `// Verifies object properties\n`;
      testDescription += `// Ensures returned data has expected structure\n$1`;
    } else if (test.name.toLowerCase().includes('should generate') || test.name.toLowerCase().includes('generates')) {
      testDescription = `// Verifies generation functionality\n`;
      testDescription += `// Ensures generated items meet expected criteria\n$1`;
    } else {
      testDescription = `// Verifies ${test.name.toLowerCase()}\n`;
      testDescription += `// Ensures expected behavior in this scenario\n$1`;
    }
    
    documentedContent = documentedContent.replace(testRegex, testDescription);
  });
  
  return documentedContent;
}

// Utility function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main function
async function main() {
  console.log('📝 Test Documentation Automation');
  console.log('===============================');
  
  // Get test files pattern from command line argument or use default
  const pattern = process.argv[2] || DEFAULT_TEST_FILES_PATTERN;
  console.log(`🔍 Finding test files matching: ${pattern}`);
  
  // Get all test files
  const files = glob.sync(pattern);
  console.log(`Found ${files.length} test files.`);
  
  if (files.length === 0) {
    console.log('No files found. Check the pattern and try again.');
    return;
  }
  
  // Document each file
  let documentedCount = 0;
  let alreadyDocumentedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    try {
      const wasDocumented = documentTestFile(file);
      if (wasDocumented) {
        documentedCount++;
      } else if (isAlreadyDocumented(fs.readFileSync(file, 'utf8'))) {
        alreadyDocumentedCount++;
      } else {
        // Skipped for other reasons
      }
    } catch (err) {
      console.log(`  ❌ Error processing ${file}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Documentation Summary');
  console.log('=====================');
  console.log(`✅ ${documentedCount} files documented`);
  console.log(`📝 ${alreadyDocumentedCount} files already had documentation`);
  console.log(`⚠️ ${files.length - documentedCount - alreadyDocumentedCount} files skipped`);
  console.log(`❌ ${errorCount} errors encountered`);
  
  if (documentedCount > 0) {
    console.log('\n🎉 Documentation complete!');
  } else {
    console.log('\n⚠️ No new documentation added.');
  }
}

// Run the script
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
}); 