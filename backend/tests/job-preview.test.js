import assert from "node:assert/strict";
import test from "node:test";
import { extractJobMetadata, isPublicAddress, normalizeJobUrl } from "../services/job-preview.service.js";

test("rejects local, private, and credentialed sources", () => {
  for (const url of ["http://jobs.example.com/post", "https://127.0.0.1/a", "https://user:pass@jobs.example.com/a", "https://jobs.example.com:8443/a"]) {
    assert.throws(() => normalizeJobUrl(url));
  }
  assert.equal(isPublicAddress("127.0.0.1"), false);
  assert.equal(isPublicAddress("10.1.2.3"), false);
  assert.equal(isPublicAddress("::ffff:127.0.0.1"), false);
  assert.equal(isPublicAddress("8.8.8.8"), true);
});

test("extracts a page preview with meta attributes in either order", () => {
  const url = normalizeJobUrl("https://jobs.example.com/role#apply");
  const html = `<html><head><meta content="Backend Engineer &amp; APIs" property="og:title">
    <meta name="description" content="Build services"><title>Fallback</title></head></html>`;
  assert.deepEqual(extractJobMetadata(html, url), {
    sourceUrl: "https://jobs.example.com/role",
    title: "Backend Engineer & APIs",
    company: "jobs",
    description: "Build services",
  });
});
