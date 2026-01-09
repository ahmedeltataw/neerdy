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

const sync = browserSync.create();
const isProd = process.env.NODE_ENV === "production"; // بيحدد لو إحنا في مرحلة الرفع النهائي
const __filename = path.resolve(import.meta.url.replace('file://', ''));
const __dirname = path.dirname(__filename);

// --- المسارات ---
const paths = {
  pug: { src: ["src/**/*.pug", "!src/component/**/*.pug", "!src/mixins/**/*.pug"], dest: "dist/" },
  styles: { src: ["src/styles/scss/**/*.scss", "src/styles/plugins/**/*.css", "!src/styles/plugins/AE.css"], dest: "dist/css/" },
  scripts: { src: "src/js/**/*.js", dest: "dist/js/" },
  images: { src: "src/assets/images/**/*.{jpg,jpeg,png,svg,gif}", dest: "dist/assets/images" },
  fonts: { src: "src/assets/fonts/**/*.{ttf,woff,woff2,eot}", dest: "dist/assets/fonts" },
  icons: { src: "src/assets/icons/**/*.svg", dest: "dist/assets/icons" },
  static: { src: "src/assets/images/**/*.ico", dest: "dist/assets/images" },
};

// --- المهام (Tasks) ---

// 1. تنظيف الملفات
export const clean = () => deleteAsync(["dist"]);

// 2. معالجة Pug (HTML)
export const compilePug = () => {
  return gulp.src(paths.pug.src)
    .pipe(plumber())
    .pipe(pug({
      pretty: !isProd, // في الـ Dev بيكون الكود مقروء، في الـ Prod بيضغط
      locals: {
        // ميكسين ذكي لقراءة أبعاد الصور تلقائياً
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
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(sync.stream());
};

// 3. معالجة CSS (SCSS + PostCSS)
const sassCompiler = gulpSass(sass);
export const styles = () => {
  const plugins = [
    postcssPresetEnv({ stage: 3, autoprefixer: { grid: true } }),
    postcssFlexbugsFixes(),
    postcssPxToRem({ rootValue: 16, propList: ["*"] }),
  ];

  if (isProd) {
    plugins.push(postcssCsso({ restructure: false, comments: false }));
    plugins.push(purgecss({
      content: ["src/**/*.pug", "src/**/*.js"],
      safelist: { standard: [/btn-/, /swiper-/], deep: [/modal-/] }
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

// 4. معالجة JavaScript
export const scripts = () => {
  return gulp.src(paths.scripts.src)
    .pipe(plumber())
    .pipe(gulpIf(isProd, terser({ compress: { drop_console: true } }))) // بيمسح الـ console.log في الـ Prod
    .pipe(size({ title: "JS Size:" }))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(sync.stream());
};

// 5. تحسين الصور (WebP)
export const optimizeImages = () => {
  return gulp.src(paths.images.src)
    .pipe(changed(paths.images.dest, { extension: ".webp" }))
    .pipe(through2.obj(async (file, _, cb) => {
      if (!file.isBuffer() || file.extname === '.svg') return cb(null, file);
      try {
        file.contents = await sharp(file.contents)
          .webp({ quality: 75, effort: isProd ? 6 : 2 }) // جهد أكبر في الـ Prod لتقليل الحجم
          .toBuffer();
        file.extname = ".webp";
        cb(null, file);
      } catch (err) { cb(err); }
    }))
    .pipe(gulp.dest(paths.images.dest));
};

// 6. الرفع لـ GitHub Pages
export const deploy = (cb) => {
  ghPages.publish(path.join(__dirname, 'dist'), { branch: 'gh-pages' }, (err) => {
    if (err) console.error('❌ الرفع فشل:', err);
    else console.log('✅ الموقع Live الآن!');
    cb();
  });
};

// --- باقي المهام (SVG, Fonts, Static) ---
export const createSvgSprite = () => {
  return gulp.src(paths.icons.src)
    .pipe(svgmin())
    .pipe(cheerio({ run: ($) => $('[fill]').removeAttr('fill'), parserOptions: { xmlMode: true } }))
    .pipe(svgSprite({ mode: { symbol: { dest: ".", sprite: "sprite.svg" } }, shape: { id: { generator: "icon-%s" } } }))
    .pipe(gulp.dest(paths.icons.dest));
};

export const optimizeFonts = () => gulp.src(paths.fonts.src, { encoding: false }).pipe(ttf2woff2()).pipe(gulp.dest(paths.fonts.dest));

// --- التشغيل وسيرفر التطوير ---
export const serve = (done) => {
  sync.init({ server: "dist", port: 3000 });
  gulp.watch("src/**/*.pug", compilePug);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.images.src, optimizeImages);
  gulp.watch(paths.icons.src, createSvgSprite);
  done();
};

export const build = gulp.series(clean, gulp.parallel(styles, scripts, optimizeImages, optimizeFonts, createSvgSprite), compilePug);
export default gulp.series(build, serve);