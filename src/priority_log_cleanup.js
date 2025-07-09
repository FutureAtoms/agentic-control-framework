#!/usr/bin/env node

/**
 * Priority Log Cleanup Utility
 * Removes excessive priority logging spam from tasks.json
 */

const fs = require('fs');
const path = require('path');

class PriorityLogCleanup {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.tasksFilePath = path.join(workspaceRoot, '.acf', 'tasks.json');
  }

  readTasks() {
    if (!fs.existsSync(this.tasksFilePath)) {
      throw new Error(`Tasks file not found: ${this.tasksFilePath}`);
    }
    
    const rawData = fs.readFileSync(this.tasksFilePath, 'utf-8');
    return JSON.parse(rawData);
  }

  writeTasks(data) {
    fs.writeFileSync(this.tasksFilePath, JSON.stringify(data, null, 2));
  }

  cleanupPriorityLogs(tasksData) {
    let totalLogsRemoved = 0;
    let totalLogsBefore = 0;
    let totalLogsAfter = 0;

    console.log('🧹 Cleaning up priority logging spam...');

    // Process main tasks
    tasksData.tasks.forEach(task => {
      if (task.activityLog && Array.isArray(task.activityLog)) {
        const originalCount = task.activityLog.length;
        totalLogsBefore += originalCount;

        // Clean up priority logs
        const cleanedLogs = this.cleanTaskLogs(task.activityLog);
        task.activityLog = cleanedLogs;

        const newCount = task.activityLog.length;
        totalLogsAfter += newCount;
        const removed = originalCount - newCount;
        totalLogsRemoved += removed;

        if (removed > 0) {
          console.log(`  📝 Task ${task.id}: Removed ${removed} priority logs (${originalCount} → ${newCount})`);
        }

        // Process subtasks
        if (task.subtasks && Array.isArray(task.subtasks)) {
          task.subtasks.forEach(subtask => {
            if (subtask.activityLog && Array.isArray(subtask.activityLog)) {
              const subOriginalCount = subtask.activityLog.length;
              totalLogsBefore += subOriginalCount;

              const subCleanedLogs = this.cleanTaskLogs(subtask.activityLog);
              subtask.activityLog = subCleanedLogs;

              const subNewCount = subtask.activityLog.length;
              totalLogsAfter += subNewCount;
              const subRemoved = subOriginalCount - subNewCount;
              totalLogsRemoved += subRemoved;

              if (subRemoved > 0) {
                console.log(`    📝 Subtask ${subtask.id}: Removed ${subRemoved} priority logs (${subOriginalCount} → ${subNewCount})`);
              }
            }
          });
        }
      }
    });

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Total logs before: ${totalLogsBefore}`);
    console.log(`   Total logs after: ${totalLogsAfter}`);
    console.log(`   Total logs removed: ${totalLogsRemoved}`);
    console.log(`   Reduction: ${((totalLogsRemoved / totalLogsBefore) * 100).toFixed(1)}%`);

    return {
      totalLogsBefore,
      totalLogsAfter,
      totalLogsRemoved,
      reductionPercent: (totalLogsRemoved / totalLogsBefore) * 100
    };
  }

  cleanTaskLogs(activityLog) {
    const priorityLogPatterns = [
      /Priority.*boost/i,
      /Priority.*adjust/i,
      /Priority.*update/i,
      /Priority.*ensure.*uniqueness/i,
      /Priority.*dependent.*task/i,
      /Priority.*blocking.*task/i
    ];

    // Group logs by type and time
    const priorityLogs = [];
    const otherLogs = [];

    activityLog.forEach(log => {
      const isPriorityLog = priorityLogPatterns.some(pattern => pattern.test(log.message));
      
      if (isPriorityLog) {
        priorityLogs.push(log);
      } else {
        otherLogs.push(log);
      }
    });

    // Keep only the most recent priority logs (last 3)
    const recentPriorityLogs = priorityLogs.slice(-3);

    // If we have many priority logs, create a summary
    if (priorityLogs.length > 3) {
      const summaryLog = {
        timestamp: new Date().toISOString(),
        type: 'log',
        message: `Priority auto-tuned (${priorityLogs.length} adjustments consolidated)`
      };
      
      // Combine other logs + summary + recent priority logs
      return [...otherLogs, summaryLog, ...recentPriorityLogs.slice(-1)];
    }

    // If few priority logs, keep them all
    return [...otherLogs, ...recentPriorityLogs];
  }

  analyzeCurrentState() {
    console.log('🔍 Analyzing current priority logging state...');
    
    const tasksData = this.readTasks();
    let totalLogs = 0;
    let priorityLogs = 0;
    let tasksWithPriorityLogs = 0;

    const priorityLogPatterns = [
      /Priority.*boost/i,
      /Priority.*adjust/i,
      /Priority.*update/i,
      /Priority.*ensure.*uniqueness/i,
      /Priority.*dependent.*task/i,
      /Priority.*blocking.*task/i
    ];

    // Analyze main tasks
    tasksData.tasks.forEach(task => {
      if (task.activityLog && Array.isArray(task.activityLog)) {
        totalLogs += task.activityLog.length;
        
        const taskPriorityLogs = task.activityLog.filter(log => 
          priorityLogPatterns.some(pattern => pattern.test(log.message))
        );
        
        if (taskPriorityLogs.length > 0) {
          tasksWithPriorityLogs++;
          priorityLogs += taskPriorityLogs.length;
        }

        // Analyze subtasks
        if (task.subtasks && Array.isArray(task.subtasks)) {
          task.subtasks.forEach(subtask => {
            if (subtask.activityLog && Array.isArray(subtask.activityLog)) {
              totalLogs += subtask.activityLog.length;
              
              const subtaskPriorityLogs = subtask.activityLog.filter(log => 
                priorityLogPatterns.some(pattern => pattern.test(log.message))
              );
              
              if (subtaskPriorityLogs.length > 0) {
                priorityLogs += subtaskPriorityLogs.length;
              }
            }
          });
        }
      }
    });

    const fileStats = fs.statSync(this.tasksFilePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);

    console.log(`📊 Current State:`);
    console.log(`   File size: ${fileSizeKB} KB`);
    console.log(`   Total tasks: ${tasksData.tasks.length}`);
    console.log(`   Total log entries: ${totalLogs}`);
    console.log(`   Priority-related logs: ${priorityLogs}`);
    console.log(`   Tasks with priority logs: ${tasksWithPriorityLogs}`);
    console.log(`   Priority log percentage: ${((priorityLogs / totalLogs) * 100).toFixed(1)}%`);

    return {
      fileSizeKB: parseFloat(fileSizeKB),
      totalTasks: tasksData.tasks.length,
      totalLogs,
      priorityLogs,
      tasksWithPriorityLogs,
      priorityLogPercentage: (priorityLogs / totalLogs) * 100
    };
  }

  async run() {
    try {
      console.log('🚀 Starting Priority Log Cleanup...');
      
      // Analyze current state
      const beforeState = this.analyzeCurrentState();
      
      // Backup original file
      const backupPath = this.tasksFilePath + '.backup.' + Date.now();
      fs.copyFileSync(this.tasksFilePath, backupPath);
      console.log(`💾 Backup created: ${backupPath}`);
      
      // Read and clean tasks
      const tasksData = this.readTasks();
      const cleanupResults = this.cleanupPriorityLogs(tasksData);
      
      // Write cleaned data
      this.writeTasks(tasksData);
      console.log('✅ Cleaned tasks.json written');
      
      // Analyze after state
      const afterState = this.analyzeCurrentState();
      
      // Generate report
      const newFileStats = fs.statSync(this.tasksFilePath);
      const newFileSizeKB = (newFileStats.size / 1024).toFixed(2);
      const fileSizeReduction = beforeState.fileSizeKB - parseFloat(newFileSizeKB);
      
      console.log(`\n🎯 CLEANUP RESULTS:`);
      console.log(`   File size: ${beforeState.fileSizeKB}KB → ${newFileSizeKB}KB (-${fileSizeReduction.toFixed(2)}KB)`);
      console.log(`   Total logs: ${beforeState.totalLogs} → ${afterState.totalLogs} (-${beforeState.totalLogs - afterState.totalLogs})`);
      console.log(`   Priority logs: ${beforeState.priorityLogs} → ${afterState.priorityLogs} (-${beforeState.priorityLogs - afterState.priorityLogs})`);
      console.log(`   Priority log %: ${beforeState.priorityLogPercentage.toFixed(1)}% → ${afterState.priorityLogPercentage.toFixed(1)}%`);
      
      const success = fileSizeReduction > 50 && (beforeState.priorityLogs - afterState.priorityLogs) > 1000;
      console.log(`\n🏆 Cleanup ${success ? 'SUCCESS' : 'COMPLETED'}: Significant log spam reduction achieved!`);
      
      return {
        success,
        beforeState,
        afterState,
        cleanupResults,
        fileSizeReduction,
        backupPath
      };
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const workspaceRoot = process.argv[2] || process.cwd();
  const cleanup = new PriorityLogCleanup(workspaceRoot);
  
  cleanup.run()
    .then(results => {
      console.log(`\n🏁 Priority log cleanup completed: ${results.success ? 'SUCCESS' : 'DONE'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Priority log cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = PriorityLogCleanup;
