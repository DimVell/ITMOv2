export async function miniEcho(args) {
  const text = (args?.text ?? "").trim();
  if (!text) {
    throw new Error("empty text");
  }
  return { content: [{ type: "text", text }] };
}
