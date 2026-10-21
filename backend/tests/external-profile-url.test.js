import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExternalAccount } from "../services/external-profile.service.js";

const cases = [
  ["github", "roshanbirla07", "roshanbirla07"],
  ["github", "https://github.com/roshanbirla07", "roshanbirla07"],
  ["github", "https://www.github.com/roshanbirla07/", "roshanbirla07"],
  ["leetcode", "https://leetcode.com/u/example_123/", "example_123"],
  ["codeforces", "https://codeforces.com/profile/example.123", "example.123"],
  ["medium", "https://medium.com/@example_writer", "example_writer"],
  ["medium", "@example_writer", "example_writer"],
];
for (const [platform, input, expected] of cases) {
  test(`${platform}: normalizes ${input}`, () => {
    assert.equal(normalizeExternalAccount(platform, input).handle, expected);
  });
}
const invalid = [
  ["github", "https://evil.com/roshanbirla07"],
  ["github", "https://github.com.evil.com/roshanbirla07"],
  ["github", "https://github.com/roshanbirla07/repo"],
  ["github", "https://github.com@evil.com/roshanbirla07"],
  ["github", "https://github.com/"],
  ["github", "https://github.com/%2Fetc"],
  ["leetcode", "https://codeforces.com/profile/example"],
  ["codeforces", "https://codeforces.com/blog/example"],
  ["medium", "https://medium.com/some-article"],
];
for (const [platform, input] of invalid) {
  test(`${platform}: rejects invalid URL ${input}`, () => {
    assert.throws(() => normalizeExternalAccount(platform, input));
  });
}
