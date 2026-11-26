import sanitizeHtml from "sanitize-html";

const options = {
  allowedTags: [],
  allowedAttributes: {},
};

export function sanitize(input) {
  if (input == null || typeof input !== "string") return "";
  return sanitizeHtml(input, options).trim();
}
