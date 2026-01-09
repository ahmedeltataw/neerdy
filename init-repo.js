import { execSync } from 'child_process';

const repoUrl = 'https://github.com/ahmedeltataw/neerdy'; // حط رابط الـ Repo اللي كريته

try {
  console.log('🚀 Starting the ultimate deployment...');

  // 1. تهيئة الـ Git
  execSync('git init');
  
  // 2. رفع كود السورس على برانش main
  execSync('git add .');
  execSync('git commit -m "Initial source commit"');
  execSync('git branch -M main');
  execSync(`git remote add origin ${repoUrl}`);
  execSync('git push -u origin main --force');
  console.log('✅ Source code pushed to main!');

  // 3. تشغيل الـ Gulp Deploy لرفع الـ Dist على برانش gh-pages
  console.log('📦 Building and deploying dist folder...');
  execSync('gulp deploy'); 
  console.log('✨ All done! Site is live and source is safe.');

} catch (error) {
  console.error('❌ Error during deployment:', error.message);
}