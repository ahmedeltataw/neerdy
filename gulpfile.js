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
import stylelint from "gulp-stylelint";
import sizeOf from "image-size";
import ghPages from 'gh-pages';
const sync = browserSync.create();
const isProd = process.env.NODE_ENV === "production";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Task الرفع لـ GitHub Pages
export const deploy = (cb) => {
  ghPages.publish(path.join(__dirname, 'dist'), {
    branch: 'gh-pages',
    message: 'Deploying to GitHub Pages', // رسالة الـ Commit اللي هتظهر على البرانش
  }, cb);
};
// إعدادات Sharp للسرعة القصوى
const sharpConfig = {
  webp: {
    quality: 75,
    alphaQuality: 90,
    lossless: false,
    nearLossless: true,
    smartSubsample: true,
    effort: 2,
    chromaSubsampling: "4:2:0",
  },
};

const paths = {
  pug: {
    src: ["src/**/*.pug", "!src/component/**/*.pug", "!src/mixins/**/*.pug"],
    // watch: ["src/**/*.pug"], // أضف هذا السطر
    dest: "dist/",
  },
  styles: {
    src: [
      "src/styles/scss/**/*.scss",
      "src/styles/plugins/**/*.css",
      "!src/styles/plugins/AE.css",
    ],
    dest: "dist/css/",
  },
  scripts: {
    src: "src/js/**/*.js",
    dest: "dist/js/",
  },
  images: {
    src: "src/assets/images/**/*.{jpg,jpeg,png,svg,gif}",
    dest: "dist/assets/images",
  },
  fonts: {
    src: "src/assets/fonts/**/*.{ttf,woff,woff2,eot}",
    dest: "dist/assets/fonts",
  },
  icons: {
    src: "src/assets/icons/**/*.svg",
    dest: "dist/assets/icons",
  },
  static: {
    src: "src/assets/images/**/*.ico",
    dest: "dist/assets/images",
  },
};

// تأكد من وجود مجلد dist
function ensureDistExists(cb) {
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }
  cb();
}

// تنظيف مجلد dist
export const clean = () => deleteAsync(["dist"]);

// تحويل Pug إلى HTML
export const compilePug = () => {
  return gulp
    .src(paths.pug.src)
    .pipe(pug({
      locals: {
        getImageSize: (imgName) => {
          const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
          const baseDir = path.resolve('src/assets/images'); 
        
          const tryReadSize = (fullPath) => {
            try {
              if (fs.existsSync(fullPath)) {
                // الحل هنا: بنقرأ الملف كـ Buffer الأول
                const fileBuffer = fs.readFileSync(fullPath);
                // بنبعت الـ Buffer للمكتبة بدل المسار
                return sizeOf(fileBuffer);
              }
            } catch (e) {
              console.error(`❌ Error at: ${fullPath} -> ${e.message}`);
            }
            return null;
          };
        
          // 1. لو الاسم فيه امتداد
          if (imgName.includes('.')) {
            const result = tryReadSize(path.join(baseDir, imgName));
            if (result) return result;
          }
        
          // 2. البحث في الامتدادات
          for (let ext of extensions) {
            const result = tryReadSize(path.join(baseDir, `${imgName}${ext}`));
            if (result) return result;
          }
        
          return { width: 0, height: 0 };
        }
      }
    }))
    .pipe(
      plumber({
        errorHandler: function (err) {
          console.error("Pug Error:", err.message);
          this.emit("end");
        },
      })
    )
    .pipe(
      pug({
        // pretty: !isProd,
        verbose: true,
        locals: {},
        cache: false, // تعطيل الذاكرة المؤقتة للتطوير
      })
    )
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(sync.stream({ match: "**/*.html" })); // تحديث المتصفح للـ HTML فقط
};

// معالجة الأنماط
const sassCompiler = gulpSass(sass);
export const styles = () => {
  return (
    gulp
      .src(paths.styles.src)
      .pipe(
        plumber({
          errorHandler: function (err) {
            console.error(err.message);
            this.emit("end");
          },
        })
      )
      // .pipe(changed(paths.styles.dest))
      .pipe(gulpIf(!isProd, sourcemaps.init()))
      .pipe(
        gulpIf(
          (file) => file.extname === ".scss",
          sassCompiler({ outputStyle: "expanded" }).on(
            "error",
            sassCompiler.logError
          )
        )
      )
      .pipe(
        postcss([
          postcssPresetEnv({
            autoprefixer: { grid: true },
            overrideBrowserslist: ["> 0.5%", "last 2 versions", "not dead"],
            stage: 3,
            features: { "gap-properties": true },
          }),
          postcssFlexbugsFixes(),
          postcssPxToRem({
            rootValue: 16,
            propList: ["*"],
          }),
          ...(isProd
            ? [
                postcssCsso({ restructure: false, comments: false }),
                purgecss({
                  content: ["src/**/*.pug", "src/**/*.js"],
                  css: ["dist/**/*.css"], // مسار ملفات CSS المُخرجة
                  safelist: {
                    standard: [
                      "active",
                      "show",
                      "fade",
                      "collapse",
                      /^btn-/,
                      /^modal-/,
                      /^carousel-/,
                    ],
                    deep: [/^bs-/, /^swiper-/],
                  },
                  extractors: [
                    {
                      extractor: (content) => {
                        const matches = content.match(/[\w-/:]+(?<!:)/g);
                        return matches || [];
                      },
                      extensions: ["pug", "js"],
                    },
                  ],
                }),
              ]
            : []),
        ])
      )
      .pipe(gulpIf(!isProd, sourcemaps.write(".")))
      .pipe(size({ title: "CSS Size:" }))
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(sync.stream())
  );
};

// معالجة JavaScript
export const scripts = () => {
  return gulp
    .src(paths.scripts.src, { allowEmpty: true })
    .pipe(plumber())
    .pipe(gulpIf(isProd, terser()))
    .pipe(size({ title: "JS Size:" }))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(sync.stream());
};

// تحويل الصور إلى WebP وتحسينها باستخدام Sharp
export const optimizeImages = () => {
  return gulp
    .src(paths.images.src)
    .pipe(changed(paths.images.dest, { extension: ".webp" }))
    .pipe(
      through2.obj(async function (file, _, cb) { // لاحظ استخدام function عادية عشان نستخدم this
        if (![".jpg", ".jpeg", ".png"].includes(file.extname.toLowerCase())) {
          return cb(null, file);
        }

        try {
          const image = sharp(file.contents);
          const metadata = await image.metadata();

          // 1. إنشاء نسخة Retina (@2x)
          const retinaBuffer = await image.clone().webp(sharpConfig.webp).toBuffer();
          let retinaFile = file.clone();
          retinaFile.contents = retinaBuffer;
          retinaFile.stem += "@2x";
          retinaFile.extname = ".webp";
          this.push(retinaFile); // نستخدم this.push بدلاً من cb

          // 2. إنشاء النسخة العادية (نصف الحجم)
          const normalBuffer = await image
            .clone()
            .resize({ width: Math.round(metadata.width / 2) })
            .webp(sharpConfig.webp)
            .toBuffer();
          file.contents = normalBuffer;
          file.extname = ".webp";
          this.push(file); // نستخدم this.push للملف الثاني

          cb(); // هنا بننادي cb مرة واحدة فقط في النهاية بدون ملفات
        } catch (err) {
          console.error(`Error processing ${file.basename}:`, err);
          cb(err); // في حالة الخطأ بنمرر الخطأ للـ cb
        }
      })
    )
    .pipe(gulp.dest(paths.images.dest))
    .pipe(sync.stream());
};

// تحسين SVG مع استبعاد المحسنة مسبقاً
// تحسين SVG مع ضمان عدم التكرار
export const optimizeSVG = () => {
  return (
    gulp
      .src(paths.images.src.replace('{jpg,jpeg,png,svg,gif}', 'svg')) // استهداف الـ SVG فقط من مسار الصور
      .pipe(changed(paths.images.dest)) // مقارنة الملف الأصلي بالموجود في dist
      .pipe(
        svgmin({
          multipass: true,
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false, // مهم عشان الـ Icons متصغرش أو تبوظ
                  cleanupIDs: false,
                },
              },
            },
          ],
        })
      )
      // حذفنا الـ rename عشان ينزل بنفس اسمه الأصلي logo.svg -> logo.svg
      .pipe(gulp.dest(paths.images.dest))
      .pipe(sync.stream())
  );
};

// معالجة الخطوط
export const optimizeFonts = () => {
  return gulp
    .src(paths.fonts.src, { encoding: false, allowEmpty: true })
    .pipe(changed(paths.fonts.dest))
    .pipe(gulpIf((file) => file.extname === ".ttf", ttf2woff2()))
    .pipe(gulp.dest(paths.fonts.dest))
    .pipe(sync.stream());
};

// إنشاء SVG Sprite
export const createSvgSprite = () => {
  return gulp
    .src(paths.icons.src)
    .pipe(plumber())
    .pipe(svgmin({
      plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }]
    }))
    .pipe(cheerio({
      run: ($) => {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: ".",
          sprite: "sprite.svg"
        }
      },
      shape: {
        id: { generator: "icon-%s" }
      }
    }))
    .pipe(gulp.dest(paths.icons.dest))
    .pipe(sync.stream()); // تأكد أن هذه في النهاية تماماً
};

// نسخ الملفات الثابتة
export const copyStatic = () => {
  return gulp
    .src(paths.static.src, { allowEmpty: true })
    .pipe(gulp.dest(paths.static.dest))
    .pipe(sync.stream());
};

// فحص جودة CSS
export const lintCSS = () => {
  return gulp.src(paths.styles.src);
  // .pipe(stylelint({
  //   reporters: [{ formatter: 'string', console: true }]
  // }));
};

// تشغيل سيرفر تطوير
export const serve = (done) => {
  sync.init(
    {
      server: {
        baseDir: "dist",
        serveStaticOptions: {
          cacheControl: false,
        },
      },
      notify: true,
      open: true,
      ghostMode: false,
      injectChanges: true, // هذه الإضافة ضرورية
      port: 3000,
      logFileChanges: true, // تسجيل تغييرات الملفات
    },
    done
  );

  const watchOptions = {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000, // زيادة وقت الاستقرار
      pollInterval: 100,
    },
    usePolling: true, // مهم لأنظمة الملفات البطيئة
  };

  gulp.watch("src/**/*.pug", watchOptions, compilePug);
  gulp.watch(paths.styles.src, watchOptions, gulp.series(lintCSS, styles));
  gulp.watch(paths.scripts.src, watchOptions, scripts);
  gulp.watch(
    paths.images.src,
    watchOptions,
    gulp.parallel(optimizeImages, optimizeSVG)
  );
  gulp.watch(paths.fonts.src, watchOptions, optimizeFonts);
  gulp.watch(paths.icons.src, watchOptions, gulp.series(createSvgSprite));
  gulp.watch(paths.static.src, watchOptions, copyStatic);
};

// مهمة البناء النهائية
export const build = gulp.series(
  clean,
  ensureDistExists,
  gulp.parallel(
    lintCSS,
    gulp.series(optimizeImages, optimizeSVG),
    styles,
    scripts,
    optimizeFonts,
    createSvgSprite,
    copyStatic
  ),
  compilePug
);

export default gulp.series(build, serve);
