
const { tests } = require("./tests/tests.js");
const { NodeTestSuite } = require("./js/node/NodeTestSuite.js");
const { NodeTestReport } = require("./js/node//NodeTestReport.js");

const { JUnitExporter } = require("./js/exporter/JUnitExporter.js");

const { writeFile } = require('fs').promises;
const path = require('path');

const EXIT_CODE_ERROR = 1;
const JUNIT_EXPORT_FILE = "./TEST-sieve.xml";
const WORKSPACE_ARG_INDEX = 2;

/**
 * The entry point.
 *
 * @returns {Promise<number>}
 *  process exit code (0 on success, 1 when tests failed)
 */
async function main() {

  const workspace = process.argv[WORKSPACE_ARG_INDEX] || path.join(__dirname, "../build/test/web");
  const suite = new NodeTestSuite(workspace);
  const report = new NodeTestReport("Test");

  await suite.load(tests).run(report);

  await writeFile(JUNIT_EXPORT_FILE, (new JUnitExporter()).export(report));

  report.summary();

  return report.hasFailed() ? EXIT_CODE_ERROR : 0;

}

main().then((exitCode) => {
  if (exitCode)
    process.exitCode = exitCode;
});
