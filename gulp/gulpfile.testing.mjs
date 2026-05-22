/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

import gulp from 'gulp';

import common from "./gulpfile.common.mjs";
import path from 'path';

const BUILD_DIR_TEST = path.join(common.BASE_DIR_BUILD, "test/");
const BASE_DIR_WEB = "./src/web/";

/**
 * Packs the unit test sources for the web application.
 */
async function packageWebTests() {
  await gulp.src([
    common.BASE_DIR_COMMON + "/**",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/doc/**",
    "!**/icons/**"
  ], { encoding: false}).pipe(gulp.dest(`${BUILD_DIR_TEST}/web/`));

  await gulp.src([
    path.join(BASE_DIR_WEB, "static/libs") + "/**",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html"
  ], { encoding: false}).pipe(gulp.dest(`${BUILD_DIR_TEST}/web/`));
}

/**
 * Copies the test suite files into the test folder.
 */
async function packageTestSuite() {

  const BASE_PATH = "./tests";

  await gulp.src([
    BASE_PATH + "/**"
  ], { encoding: false}).pipe(gulp.dest(BUILD_DIR_TEST + '/'));
}

/**
 * Watches for changed source files and copies them into the build directory.
 */
function watchTests() {

  gulp.watch(
    ['./src/**/*.js',
      './src/**/*.mjs',
      './tests/**/*.json',
      './tests/**/*.js'],
    gulp.parallel(
      packageWebTests,
      packageTestSuite)
  );
}

const packageTests = gulp.parallel(
  packageTestSuite,
  packageWebTests
);

export default {
  packageTests,
  watchTests
};
