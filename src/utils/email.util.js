import { Buffer } from "buffer";

function decodeBase64(data) {
  if (!data) return null;

  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function walkParts(node, collector) {
  if (!node) return;

  if (node.body?.data) {
    const decoded = decodeBase64(node.body.data);
    if (decoded) {
      collector.push({
        mimeType: node.mimeType,
        content: decoded
      });
    }
  }


  if (Array.isArray(node.parts)) {
    for (const part of node.parts) {
      walkParts(part, collector);
    }
  }
}

export function extractEmailBody(payload) {
  if (!payload || typeof payload !== "object") return null;

  const collected = [];
  walkParts(payload, collected);

  if (collected.length === 0) return null;

  const html = collected.find(p => p.mimeType === "text/html");
  const text = collected.find(p => p.mimeType === "text/plain");

  return (html || text)?.content || null;
}