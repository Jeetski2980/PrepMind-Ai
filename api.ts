// src/api.ts
export async function getQuestions(payload: {
  testType: string;
  subject: string;
  topic?: string;
  numQuestions: number;
}) {
  const res = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { questions: [...] }
}

export async function getChatResponse(message: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { content: "..." }
}
