#!/usr/bin/env node

/**
 * Test script for the enhanced PRD parser
 * This script tests the parsing of a PRD file with the addition of test tasks
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const core = require('../../src/core');

// Check if Gemini API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in environment variables.');
  console.error('Please create a .env file with your Gemini API key.');
  process.exit(1);
}

// Create test directory
const testDirName = `prd_test_${Math.floor(Date.now() / 1000)}`;
const testDir = path.join(process.cwd(), testDirName);

console.log('===========================================');
console.log('Testing Enhanced PRD Parser');
console.log('===========================================');

// Create the test directory
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

console.log(`Test directory: ${testDir}`);

// Initialize project in the test directory
async function runTest() {
  try {
    // Initialize the project
    console.log('\n--- Step 1: Initializing project ---');
    const initResult = core.initProject(testDir, {
      projectName: 'PRD Parser Test',
      projectDescription: 'Testing the enhanced PRD parser'
    });
    console.log(`Initialization ${initResult.success ? 'successful' : 'failed'}`);
    
    // Parse the sample PRD
    console.log('\n--- Step 2: Parsing sample PRD ---');
    const samplePrdPath = path.join(process.cwd(), 'sample_prd.md');
    
    if (!fs.existsSync(samplePrdPath)) {
      console.error(`ERROR: Sample PRD file not found at ${samplePrdPath}`);
      process.exit(1);
    }
    
    console.log(`Parsing PRD file: ${samplePrdPath}`);
    const parseResult = await core.parsePrd(testDir, samplePrdPath);
    
    if (!parseResult.success) {
      console.error(`ERROR: Failed to parse PRD - ${parseResult.message}`);
      process.exit(1);
    }
    
    console.log(`Successfully parsed PRD: ${parseResult.message}`);
    console.log(`Generated ${parseResult.tasks.length} tasks`);
    
    // List all tasks
    console.log('\n--- Step 3: Listing all generated tasks ---');
    const listResult = core.listTasks(testDir, { format: 'table' });
    
    // Count test tasks
    const tasks = listResult.tasks;
    const testTasks = tasks.filter(task => 
      task.title.startsWith('Test:') || 
      task.title.includes('Testing') || 
      task.title.includes('Rigorous Testing')
    );
    
    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Implementation tasks: ${tasks.length - testTasks.length}`);
    console.log(`Test tasks: ${testTasks.length}`);
    
    // Verify if Rigorous Testing Phase task exists
    const rigorousTestingTask = tasks.find(task => 
      task.title.includes('Rigorous Testing') || 
      task.title.includes('Final Testing')
    );
    
    if (rigorousTestingTask) {
      console.log('\n--- Found Rigorous Testing Phase task ---');
      console.log(`Task ID: ${rigorousTestingTask.id}`);
      console.log(`Task Title: ${rigorousTestingTask.title}`);
      console.log(`Dependencies: ${rigorousTestingTask.dependsOn.join(', ')}`);
    } else {
      console.log('\nWARNING: No Rigorous Testing Phase task found');
    }
    
    // Analyze task dependencies
    console.log('\n--- Step 4: Analyzing test task dependencies ---');
    let correctDependencies = 0;
    
    for (const task of testTasks) {
      // Skip the rigorous testing task
      if (task === rigorousTestingTask) continue;
      
      // For each test task, check if it depends on an implementation task
      if (task.dependsOn && task.dependsOn.length > 0) {
        const implementationTaskId = task.dependsOn[0];
        const implementationTask = tasks.find(t => t.id === implementationTaskId);
        
        if (implementationTask && !implementationTask.title.startsWith('Test:')) {
          correctDependencies++;
          console.log(`✅ Task "${task.title}" correctly depends on "${implementationTask.title}"`);
        } else {
          console.log(`❌ Task "${task.title}" has incorrect dependencies`);
        }
      } else {
        console.log(`❌ Task "${task.title}" has no dependencies`);
      }
    }
    
    console.log(`\n${correctDependencies} out of ${testTasks.length - (rigorousTestingTask ? 1 : 0)} test tasks have correct dependencies`);
    
    // Generate task files
    console.log('\n--- Step 5: Generating task files ---');
    const generateResult = core.generateTaskFiles(testDir);
    console.log(generateResult.message);
    
    // Success message
    console.log('\n===========================================');
    console.log('PRD Parser Test Completed Successfully');
    console.log('===========================================');
    console.log(`Results available in: ${testDir}`);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

runTest(); 