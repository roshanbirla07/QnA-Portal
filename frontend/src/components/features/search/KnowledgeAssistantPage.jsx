import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { KNOWLEDGE_ASSISTANT_ROUTER } from "../../../services/apis";

const KnowledgeAssistantPage = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ask = async (event) => {
    event.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await apiConnector("POST", KNOWLEDGE_ASSISTANT_ROUTER, { question });
      setResult(response.data.data);
    } catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  };
  return <main className="max-w-4xl mx-auto px-4 py-10 space-y-6 text-text-primary">
    <header><h1 className="text-3xl font-bold">Knowledge assistant</h1>
      <p className="text-text-secondary mt-2">Ask a question about topics discussed in the community. Answers link to the posts used.</p></header>
    <form onSubmit={ask} className="space-y-3">
      <label htmlFor="assistant-question" className="block font-medium">Your question</label>
      <textarea id="assistant-question" className="input-field w-full" rows={4} required minLength={8} maxLength={1000}
        value={question} onChange={(event) => setQuestion(event.target.value)} />
      <button type="submit" disabled={loading} className="btn-primary">{loading ? "Finding an answer…" : "Ask"}</button>
    </form>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {result && <section className="rounded-xl bg-bg-secondary p-6 space-y-5" aria-live="polite">
      <h2 className="text-xl font-semibold">Answer</h2>
      <p className="whitespace-pre-wrap">{result.answer}</p>
      {!!result.sources?.length && <div><h3 className="font-semibold">Community sources</h3>
        <ol className="mt-2 space-y-2">{result.sources.map((source) => <li key={source.number}>
          [{source.number}] <Link to={`/posts/${source.slug}`} className="text-primary-blue hover:underline">{source.title}</Link>
        </li>)}</ol></div>}
    </section>}
  </main>;
};
export default KnowledgeAssistantPage;
