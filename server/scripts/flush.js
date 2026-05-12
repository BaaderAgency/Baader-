import { flushQueue } from '../notion.js';

const result = await flushQueue();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
