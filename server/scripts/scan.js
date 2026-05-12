import { runScan } from '../reddit.js';

const result = await runScan({ trigger: 'cli' });
console.log(JSON.stringify(result, null, 2));
process.exit(0);
