import gulp from "gulp";
import browserSync from "browser-sync";
import pug from "gulp-pug";
import * as sass from "sass";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import purgecss from "@fullhuman/postcss-purgecss";
import postcssPresetEnv from "postcss-preset-env";
import postcssCsso from "postcss-csso";
import postcssFlexbugsFixes from "postcss-flexbugs-fixes";
import postcssPxToRem from "postcss-pxtorem";
import terser from "gulp-terser";
import gulpIf from "gulp-if";
import changed from "gulp-changed";
import sharp from "sharp";
import through2 from "through2";
import path from 'path';
import { fileURLToPath } from 'url'
import ttf2woff2 from "gulp-ttf2woff2";
import { deleteAsync } from "del";
import fs from "fs";
import sourcemaps from "gulp-sourcemaps";
import plumber from "gulp-plumber";
import size from "gulp-size";
import svgSprite from "gulp-svg-sprite";
import svgmin from "gulp-svgmin";
import cheerio from "gulp-cheerio";
import sizeOf from "image-size";
import ghPages from 'gh-pages';
// إضافات الأداء القصوى
import { minify } from 'html-minifier-terser';
import { generate } from 'critical';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as esbuild from 'esbuild';

const sync = browserSync.create();
const isProd = process.env.NODE_ENV === "production"; 
const __filename = fileURLToPath(import.meta.url); // الطريقة الصحيحة لـ ESM
const __dirname = path.dirname(__filename);

const paths = {
  pug: { src: ["src/**/*.pug", "!src/component/**/*.pug", "!src/mixins/**/*.pug"], dest: "dist/" },
  styles: { src: ["src/styles/scss/**/*.scss", "src/styles/plugins/**/*.css", "!src/styles/plugins/AE.css"], dest: "dist/css/" },
  scripts: { src: "src/js/**/*.js", dest: "dist/js/" },
  images: { src: "src/assets/images/**/*.{jpg,jpeg,png,svg,gif}", dest: "dist/assets/images" },
  fonts: { src: "src/assets/fonts/**/*.{ttf,woff,woff2,eot}", dest: "dist/assets/fonts" },
  icons: { src: "src/assets/icons/**/*.svg", dest: "dist/assets/icons" },
  static: { src: "src/assets/images/**/*.ico", dest: "dist/assets/images" },
};

// 1. تنظيف الملفات
export const clean = () => deleteAsync(["dist"]);

// 2. معالجة الـ JS مع Tree Shaking (وقت البناء فقط)
//
export const scripts = () => {
  return esbuild.build({
    entryPoints: {
      vendors: 'src/js/vendors.js',
      main: 'src/js/main.js'
    },
    bundle: true,
    minify: isProd,
    treeShaking: isProd,
    target: ['es2015'],
    outdir: 'dist', // خليها dist بس هنا
    // السطر ده السحر اللي هيخلي كل حاجة تروح مكانها
    entryNames: '[ext]/[name]', 
    
    splitting: false, 
    format: 'esm', 
    sourcemap: !isProd,
  });
};

// 3. معالجة CSS (Critical CSS & Purge)

const sassCompiler = gulpSass(sass);
export const styles = () => {
  const plugins = [
    postcssPresetEnv({ stage: 3, autoprefixer: { grid: true } }),
    postcssFlexbugsFixes(),
    postcssPxToRem({ rootValue: 16, propList: ["*"] }),
  ];

  if (isProd) {
    plugins.push(postcssCsso({ restructure: false, comments: false }));
    // داخل وظيفة الـ styles في الـ gulpfile.js
    plugins.push(purgecss({
      content: ["src/**/*.pug", "src/**/*.js"],
      // الحل لمشكلة الـ lg:grid والـ selectors المعقدة
      defaultExtractor: content => {
        // Regex بيسمح بجميع الرموز الخاصة في Tailwind و Bootstrap
        const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
        const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
        return broadMatches.concat(innerMatches)
      },
      safelist: {
        // الكلاسات اللي PurgeCSS ممنوع يقرب منها مهما حصل
        standard: [
          'html',
          'body',
          /active$/,
          /show$/,
          /swiper/ // بيحمي كل كلاسات Swiper اللي بتبدأ بكلمة swiper
        ],
        // يحمي أي selector فيه attributes زي [lang="ar"]
        deep: [
          /swiper/,
          /\[lang="ar"\]/
        ],
        // يحمي الـ selectors اللي بتبدأ بـ html أو body
        greedy: [
          /html/,
          /body/,
          /swiper-/
        ]
      }
    }));
  }


  return gulp.src(paths.styles.src)
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(sassCompiler().on("error", sassCompiler.logError))
    .pipe(postcss(plugins))
    .pipe(gulpIf(!isProd, sourcemaps.write(".")))
    .pipe(size({ title: "CSS Size:" }))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(sync.stream());
};
// 4. Critical CSS (وقت البناء فقط)
export const criticalTask = async () => {
  if (!isProd) return;
  try {
    await generate({
      inline: true,
      base: 'dist/',
      src: 'index.html',
      target: 'index.html',
      width: 1300,
      height: 900,
      extract: true,
    });
  } catch (err) {
    console.error('Critical CSS Error:', err);
  }
};

// 5. معالجة Pug (Preload & Minify)
export const compilePug = () => {
  return gulp.src(paths.pug.src)
    .pipe(plumber())
    .pipe(pug({
      pretty: !isProd, //
      locals: {
        isProd: isProd, // عشان الـ Preload اللي ضفناه في الـ HTML
        getImageSize: (imgName) => {
          const baseDir = path.resolve('src/assets/images');
          const ext = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
          for (let e of ext) {
            const fullPath = path.join(baseDir, imgName.includes('.') ? imgName : imgName + e);
            if (fs.existsSync(fullPath)) return sizeOf(fs.readFileSync(fullPath));
          }
          return { width: 0, height: 0 };
        }
      }
    }))
    .pipe(through2.obj(async (file, _, cb) => {
      if (isProd && file.isBuffer()) {
        const minified = await minify(file.contents.toString(), {
          collapseWhitespace: true,
          removeComments: true,
          minifyJS: true, // بيضغط أي JS جوه الـ HTML
          minifyCSS: true // بيضغط أي CSS جوه الـ HTML
        });
        file.contents = Buffer.from(minified);
      }
      cb(null, file);
    }))
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(sync.stream());
};

// 6. أتمتة الـ SEO (وقت البناء فقط)
export const seoAutomation = (done) => {
  if (!isProd) return done();

  fs.writeFileSync(
    path.join('dist', 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml`
  );

  const stream = new SitemapStream({ hostname: 'https://example.com/' });
  streamToPromise(Readable.from([{ url: '/', priority: 1 }]).pipe(stream))
    .then(data => {
      fs.writeFileSync('dist/sitemap.xml', data.toString());
      done();
    })
    .catch(done);
};

// 7. تحسين الصور (WebP)
export const optimizeImages = () => {
  return gulp.src(paths.images.src)
    .pipe(changed(paths.images.dest, { extension: ".webp" }))
    .pipe(through2.obj(async (file, _, cb) => {
      if (!file.isBuffer() || file.extname === '.svg') return cb(null, file);
      try {
        file.contents = await sharp(file.contents)
          .webp({ quality: 75, effort: isProd ? 6 : 2 })
          .toBuffer();
        file.extname = ".webp";
        cb(null, file);
      } catch (err) { cb(err); }
    }))
    .pipe(gulp.dest(paths.images.dest));
};

// استمرار باقي المهام الأصلية...
export const createSvgSprite = () => {
  return gulp.src(paths.icons.src)
    .pipe(svgmin())
    .pipe(cheerio({
      run: ($) => {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke'); // أضف هذا السطر إذا كانت الأيقونات تعتمد على الخطوط
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgSprite({
      mode: { symbol: { dest: ".", sprite: "sprite.svg" } },
      shape: { id: { generator: "icon-%s" } }
    }))
    .pipe(gulp.dest(paths.icons.dest));
};
// 6. الرفع لـ GitHub Pages
export const deploy = (cb) => {
  ghPages.publish(path.join(__dirname, 'dist'), { branch: 'gh-pages' }, (err) => {
    if (err) console.error('❌ الرفع فشل:', err);
    else console.log('✅ الموقع Live الآن!');
    cb();
  });
};
export const copyStatic = () => gulp.src(paths.static.src, { allowEmpty: true }).pipe(gulp.dest(paths.static.dest)).pipe(sync.stream());
export const optimizeFonts = () => gulp.src(paths.fonts.src, { encoding: false }).pipe(ttf2woff2()).pipe(gulp.dest(paths.fonts.dest));

export const serve = (done) => {
  sync.init({ server: "dist", port: 3000 });
  gulp.watch("src/**/*.pug", compilePug);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.images.src, optimizeImages);
  gulp.watch(paths.icons.src, gulp.series(createSvgSprite, (done) => {
    sync.reload(); 
    done();
  }));
  done();
};

// المهام المجمعة
const buildTasks = gulp.series(
  clean,
  gulp.parallel(styles, scripts, optimizeImages, optimizeFonts, createSvgSprite, copyStatic),
  compilePug,
  // criticalTask,
  seoAutomation
);

const serveTasks = gulp.series(buildTasks, serve);

// التصدير الرسمي المتوافق مع ESM
export { buildTasks as build };
export default serveTasks;