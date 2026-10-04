import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import ApiError from "../utils/ApiError.js";

const isPublicAddress = (address) => {
  const version = net.isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) || (a === 203 && b === 0));
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    return /^(2|3)[0-9a-f]{0,3}:/.test(lower) && !lower.startsWith("2001:db8:");
  }
  return false;
};

const normalizeJobUrl = (value) => {
  let url;
  try { url = new URL(value); } catch { throw new ApiError(400, "Enter a valid HTTPS job URL"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      net.isIP(url.hostname) || url.hostname.length > 253 || !url.hostname.includes(".") ||
      url.toString().length > 2048) {
    throw new ApiError(400, "Enter a public HTTPS job URL");
  }
  url.hash = "";
  return url;
};

const decodeEntities = (value = "") => value
  .replace(/&(?:amp|lt|gt|quot|#39);/gi, (entity) => ({
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  })[entity.toLowerCase()] || entity)
  .replace(/\s+/g, " ").trim();

const metaContent = (html, key) => {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]));
    if (attrs.property === key || attrs.name === key) return decodeEntities(attrs.content);
  }
  return "";
};

const extractJobMetadata = (html, url) => {
  const title = metaContent(html, "og:title") ||
    decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  return {
    sourceUrl: url.toString(),
    title: title.slice(0, 220),
    company: url.hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ").slice(0, 160),
    description: (metaContent(html, "og:description") || metaContent(html, "description")).slice(0, 1000),
  };
};

const previewJob = async (value) => {
  const url = normalizeJobUrl(value);
  let addresses;
  try { addresses = await dns.lookup(url.hostname, { all: true }); }
  catch { throw new ApiError(422, "Could not resolve the job website"); }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ApiError(400, "The job website must resolve to a public address");
  }

  return new Promise((resolve, reject) => {
    const address = addresses[0];
    const req = https.get(url, {
      timeout: 5000,
      headers: { Accept: "text/html", "User-Agent": "QnAPortalJobPreview/1.0" },
      lookup: (_host, _options, callback) => callback(null, address.address, address.family),
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300 ||
          !String(res.headers["content-type"] || "").toLowerCase().includes("text/html")) {
        res.resume();
        reject(new ApiError(422, "The job page could not be previewed; check its URL"));
        return;
      }
      let html = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        html += chunk;
        if (html.length > 262144) req.destroy(new ApiError(422, "Job page is too large to preview"));
      });
      res.on("end", () => resolve(extractJobMetadata(html, url)));
    });
    req.on("timeout", () => req.destroy(new ApiError(422, "Job page timed out")));
    req.on("error", (error) => reject(error instanceof ApiError ? error : new ApiError(422, "Could not preview the job page")));
  });
};

export { normalizeJobUrl, extractJobMetadata, previewJob };
