// pnpm stores sharp in a versioned folder; resolve through the project's pnpm store
// so this script doesn't need a top-level dependency just to run once.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("../node_modules/.pnpm/sharp@0.34.3/node_modules/sharp");
export default sharp;
