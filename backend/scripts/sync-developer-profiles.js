import dbConnect from "../db/connection.js";
import ExternalProfile from "../schemas/external-profile.schema.js";
import { syncExternalProfile } from "../services/external-profile.service.js";

await dbConnect();

const accounts = await ExternalProfile.find({
  platform: { $in: ["github", "codeforces", "leetcode", "medium"] },
  visibility: "public",
}).sort({ lastSyncedAt: 1 }).limit(200);

let ok = 0;
let failed = 0;

for (const account of accounts) {
  try {
    await syncExternalProfile(account);
    ok += 1;
    console.log(`synced ${account.platform}:${account.handle}`);
  } catch (error) {
    failed += 1;
    console.error(`failed ${account.platform}:${account.handle}: ${error.message}`);
  }
}

console.log(JSON.stringify({ checked: accounts.length, synced: ok, failed }));
process.exit(failed ? 1 : 0);
