// const path = require('path')
// const cli = require('next/dist/cli/next-build')
// // import { nextBuild } from 'next/dist/cli/next-build'
// import type { FullConfig } from '@playwright/test';

// async function globalSetup(configObject: FullConfig) {
//   // console.log(configObject.rootDir)
//   process.env.PLAYWRIGHT = "1";
//   if (process.env.SKIP_BUILD === "1") {
//     console.log("skipping build as SKIP_BUILD is set");
//   } else {
//     await cli.nextBuild(["../frontend"]);
//   }
// }

// export default globalSetup;

// const path = require("path");
// const cli = require("next/dist/cli/next-build");

// async function globalSetup() {
//   process.env.PLAYWRIGHT = "1";
//   if (process.env.SKIP_BUILD === "1") {
//     console.log("skipping build as SKIP_BUILD is set");
//   } else {
//     await cli.nextBuild([path.join(__dirname, "..")]);
//   }
// }

// module.exports = globalSetup;

const path = require("path");
import { server } from './mocks/server'

async function globalSetup() {
  process.env.PLAYWRIGHT = "1";
  server.listen()
}

module.exports = globalSetup;