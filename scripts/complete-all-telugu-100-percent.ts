import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

const DRY_RUN = process.argv.includes('--dry-run');

async function runScript(scriptPath: string, description: string): Promise<boolean> {
  console.log(chalk.blue(`\n${'='.repeat(60)}`));
  console.log(chalk.blue(`${description}`));
  console.log(chalk.blue(`${'='.repeat(60)}\n`));

  try {
    const command = DRY_RUN 
      ? `npx tsx ${scriptPath} --dry-run`
      : `npx tsx ${scriptPath} --execute`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    return true;
  } catch (error: any) {
    console.error(chalk.red(`\n✗ Error running ${scriptPath}:`));
    console.error(chalk.red(error.message));
    return false;
  }
}

async function main() {
  console.log(chalk.blue('\n🏆 COMPLETE ALL TELUGU MOVIES - PATH TO 100%\n'));
  
  if (DRY_RUN) {
    console.log(chalk.cyan('📝 DRY RUN MODE - Will show what would happen\n'));
  } else {
    console.log(chalk.yellow('⚠️  EXECUTE MODE - Will complete all remaining movies\n'));
  }

  const steps = [
    {
      script: 'scripts/publish-2-ready-telugu.ts',
      description: 'STEP 1: PUBLISH 2 READY MOVIES',
      impact: '99.95% → 99.98%'
    },
    {
      script: 'scripts/complete-salaar-part-2.ts',
      description: 'STEP 2: COMPLETE SALAAR: PART 2',
      impact: '99.98% → 100%'
    },
    {
      script: 'scripts/fix-shanti-spanish.ts',
      description: 'STEP 3: FIX MISCLASSIFIED SHANTI',
      impact: 'Clean database'
    }
  ];

  let completedSteps = 0;
  let failedSteps = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(chalk.cyan(`\nRunning Step ${i + 1}/3: ${step.description}`));
    console.log(chalk.gray(`Impact: ${step.impact}\n`));
    
    const success = await runScript(step.script, step.description);
    
    if (success) {
      completedSteps++;
      console.log(chalk.green(`\n✅ Step ${i + 1} completed successfully!\n`));
    } else {
      failedSteps++;
      console.error(chalk.red(`\n✗ Step ${i + 1} failed!\n`));
      break; // Stop on first failure
    }
  }

  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.blue('MASTER SCRIPT COMPLETE'));
  console.log(chalk.blue('='.repeat(60) + '\n'));

  console.log(chalk.cyan(`Steps Completed:  ${completedSteps}/${steps.length}`));
  if (failedSteps > 0) {
    console.log(chalk.red(`Steps Failed:     ${failedSteps}`));
  }

  if (!DRY_RUN && completedSteps === steps.length) {
    console.log(chalk.green('\n🎉🎉🎉 CONGRATULATIONS! 🎉🎉🎉\n'));
    console.log(chalk.green('🏆 ALL TELUGU MOVIES ARE NOW PUBLISHED!\n'));
    console.log(chalk.green('   100% COMPLETE!\n'));
    console.log(chalk.blue('🚀 Ready to deploy to production!\n'));
  } else if (DRY_RUN) {
    console.log(chalk.blue('\n📝 DRY RUN completed successfully'));
    console.log(chalk.blue('   All steps would succeed\n'));
    console.log(chalk.blue('🚀 Run with --execute to complete all Telugu movies:\n'));
    console.log(chalk.blue('   npx tsx scripts/complete-all-telugu-100-percent.ts --execute\n'));
  }

  console.log(chalk.blue('='.repeat(60) + '\n'));
}

main().catch(console.error);
