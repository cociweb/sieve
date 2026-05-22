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

import common from './gulp/gulpfile.common.mjs';
import testing from './gulp/gulpfile.testing.mjs';
import web from "./gulp/gulpfile.web.mjs";

// Testing Related Tasks...
testing.watchTests.displayName = "test:watch";
testing.packageTests.displayName = "test:package";

export const { watchTests : testWatch, packageTests : testPackage } = testing;

// Web application relates Tasks
web.watch.displayName = "web:watch";
web.packageWeb.displayName = "web:package";

export const { watch : webWatch, packageWeb : webPackage } = web;

const webPackageZip = gulp.series(
  web.packageWeb,
  web.packageZip
);

webPackageZip.displayName = "web:package-zip";

export {
  webPackageZip
};


// Generic Tasks...
common.clean.displayName = "clean";
export const { clean } = common;

const commonBumpMajor = gulp.series(
  common.bumpMajorVersion,
  common.updateVersion
);
commonBumpMajor.displayName = "bump-major";

const commonBumpMinor = gulp.series(
  common.bumpMinorVersion,
  common.updateVersion
);
commonBumpMinor.displayName = "bump-minor";

const commonBumpPatch = gulp.series(
  common.bumpPatchVersion,
  common.updateVersion
);
commonBumpPatch.displayName = "bump-patch";

export {
  commonBumpMajor,
  commonBumpMinor,
  commonBumpPatch
};
