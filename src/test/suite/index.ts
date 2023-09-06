import path from 'path';
import Mocha from 'mocha';
import fs from 'fs';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 15000,
  });

  const testsRoot = path.resolve(__dirname, '../suite');

  return new Promise((c, e) => {
    console.log('Running tests', testsRoot);

    fs.readdir(testsRoot, (err, files) => {
      if (err) {
        return e(err);
      }

      const testFiles = files.filter((file) => file.endsWith('.test.js'));

      console.log('Test files', testFiles);

      testFiles.forEach((file) => {
        console.log('Adding test file', file);
        mocha.addFile(path.resolve(testsRoot, file));
      });

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
}
