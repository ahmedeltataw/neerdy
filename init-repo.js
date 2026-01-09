import { execSync } from 'child_process';

const repoUrl = 'https://github.com/ahmedeltataw/neerdy.git';

try {
  console.log('🚀 Starting the ultimate deployment...');

  // 1. تهيئة المستودع إذا لم يكن موجوداً
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (e) {
    console.log('📦 Initializing Git repository...');
    execSync('git init');
  }

  // 2. التعامل مع الـ Remote (المشكلة اللي كانت بتظهر لك)
  try {
    const remotes = execSync('git remote').toString();
    if (remotes.includes('origin')) {
      console.log('🔗 Updating existing remote origin...');
      execSync(`git remote set-url origin ${repoUrl}`);
    } else {
      execSync(`git remote add origin ${repoUrl}`);
    }
  } catch (e) {
    execSync(`git remote add origin ${repoUrl}`);
  }

  // 3. إضافة الملفات وعمل Commit ذكي
  execSync('git add .');
  try {
    // السطر ده هيحاول يعمل commit، ولو مفيش تغييرات مش هيطلع Error يوقف الإسكربت
    execSync('git commit -m "Automated deployment update"');
    console.log('✅ Changes committed successfully.');
  } catch (e) {
    console.log('⚠️ No new changes to commit.');
  }

  // 4. رفع الكود للمستودع (Main Branch)
  console.log('📤 Pushing source code to main...');
  // التأكد إننا على فرع main
  execSync('git branch -M main');
  execSync('git push -u origin main --force');
  console.log('✔️ Source code pushed to main!');

  // 5. الـ Gulp Deploy (رفع الـ Dist لـ GitHub Pages)
  console.log('🏗️ Building and deploying dist folder...');
  execSync('gulp deploy');

  console.log('✨ All done! Site is live and source is safe.');

} catch (error) {
  console.error('❌ Error during deployment:', error.message);
  process.exit(1);
}