/**
 * Test Profile Fix
 * Verify that "teja" now correctly shows director Teja, not Ravi Teja
 */

import chalk from 'chalk';

async function testProfile(slug: string, expectedPerson: string) {
  console.log(chalk.blue(`\n🧪 Testing profile: ${slug}`));
  console.log(chalk.gray(`   Expected: ${expectedPerson}\n`));

  try {
    const response = await fetch(`http://localhost:3000/api/profile/${slug}`);
    
    if (!response.ok) {
      console.log(chalk.red(`   ❌ API returned ${response.status}`));
      const error = await response.json();
      console.log(chalk.red(`   Error: ${error.error}`));
      return false;
    }

    const data = await response.json();
    const personName = data.person?.name_en || data.person?.name;
    
    console.log(chalk.cyan(`   Person Found: ${personName}`));
    console.log(chalk.gray(`   Total Movies: ${data.stats?.total_movies || 'N/A'}`));
    
    // Show roles
    if (data.roles) {
      const roleEntries = Object.entries(data.roles);
      console.log(chalk.gray(`   Roles:`));
      roleEntries.forEach(([role, stats]: [string, any]) => {
        if (stats.count > 0) {
          console.log(chalk.gray(`     - ${role}: ${stats.count} movies`));
        }
      });
    }
    
    const isCorrect = personName?.toLowerCase().includes(expectedPerson.toLowerCase());
    
    if (isCorrect) {
      console.log(chalk.green(`   ✅ CORRECT! Matched expected person`));
    } else {
      console.log(chalk.red(`   ❌ WRONG! Expected "${expectedPerson}" but got "${personName}"`));
    }
    
    return isCorrect;
  } catch (error) {
    console.log(chalk.red(`   ❌ Error: ${error}`));
    return false;
  }
}

async function runTests() {
  console.log(chalk.bold.blue('\n🔬 Profile Disambiguation Test Suite\n'));
  console.log(chalk.yellow('Make sure the dev server is running on localhost:3000\n'));
  
  const tests = [
    { slug: 'teja', expected: 'Teja', description: 'Director Teja (not Ravi Teja)' },
    { slug: 'ravi-teja', expected: 'Ravi Teja', description: 'Actor Ravi Teja' },
    { slug: 'celeb-teja', expected: 'Teja', description: 'Celeb slug for Teja' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(chalk.white(`\nTest: ${test.description}`));
    const result = await testProfile(test.slug, test.expected);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(chalk.bold.blue('\n\n📊 Test Results\n'));
  console.log(chalk.green(`   Passed: ${passed}`));
  console.log(chalk.red(`   Failed: ${failed}`));
  
  if (failed === 0) {
    console.log(chalk.bold.green('\n✅ All tests passed!\n'));
  } else {
    console.log(chalk.bold.red('\n❌ Some tests failed\n'));
  }
}

runTests().catch(console.error);
