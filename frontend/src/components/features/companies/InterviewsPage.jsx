import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { INTERVIEWS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const empty = {
  company: "", role: "", date: "", difficulty: "medium", outcome: "pending",
  summary: "", rounds: [{ name: "", details: "" }],
};

const InterviewsPage = () => {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    company: params.get("company") || "", role: params.get("role") || "",
  });
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState({ items: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const { token } = useAuth();
  const page = Math.max(Number.parseInt(params.get("page"), 10) || 1, 1);
  const query = params.toString();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiConnector("GET", INTERVIEWS_ROUTER, null, null, Object.fromEntries(params.entries()))
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, reload]); // URL changes and new submissions drive public results.

  const submit = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", INTERVIEWS_ROUTER, form);
      toast.success("Interview experience shared");
      setForm(empty);
      setShowForm(false);
      setParams({});
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason.message);
    }
  };

  const setRound = (index, field, value) => setForm({
    ...form, rounds: form.rounds.map((round, position) =>
      position === index ? { ...round, [field]: value } : round),
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Interview experiences</h1>
          <p className="text-text-secondary mt-2">Read interview rounds and outcomes shared by the community.</p>
        </div>
        {token && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Share experience"}
        </button>}
      </div>
      {showForm && <form onSubmit={submit} className="bg-bg-secondary border border-white/10 rounded-xl p-6 space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Your interview</h2>
        {[["company", "Company"], ["role", "Role"], ["date", "Interview date"]].map(([field, label]) =>
          <label className="block" key={field}>{label}
            <input required type={field === "date" ? "date" : "text"} maxLength={160}
              value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              className="input-field w-full mt-1" />
          </label>)}
        <div className="grid sm:grid-cols-2 gap-4">
          {[["difficulty", ["easy", "medium", "hard"]], ["outcome", ["pending", "offer", "rejected", "withdrew"]]]
            .map(([field, options]) => <label key={field} className="capitalize">{field}
              <select value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="input-field w-full mt-1">
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>)}
        </div>
        <label className="block">Summary
          <textarea required maxLength={4000} rows={4} className="input-field w-full mt-1"
            value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        </label>
        <h3 className="font-semibold">Rounds</h3>
        {form.rounds.map((round, index) => <div key={index} className="border border-white/10 rounded-lg p-4 space-y-3">
          <input required aria-label={`Round ${index + 1} name`} placeholder="Round name" maxLength={100}
            className="input-field w-full" value={round.name}
            onChange={(event) => setRound(index, "name", event.target.value)} />
          <textarea aria-label={`Round ${index + 1} details`} placeholder="Questions and notes" maxLength={2000}
            className="input-field w-full" value={round.details}
            onChange={(event) => setRound(index, "details", event.target.value)} />
        </div>)}
        {form.rounds.length < 12 && <button type="button" onClick={() => setForm({ ...form, rounds: [...form.rounds, { name: "", details: "" }] })}>+ Add round</button>}
        <button type="submit" className="btn-primary block">Publish experience</button>
      </form>}
      <form className="grid sm:grid-cols-3 gap-3 mb-6" onSubmit={(event) => {
        event.preventDefault();
        setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())));
      }}>
        <input aria-label="Filter company" placeholder="Company" value={filters.company} className="input-field"
          onChange={(event) => setFilters({ ...filters, company: event.target.value })} />
        <input aria-label="Filter role" placeholder="Role" value={filters.role} className="input-field"
          onChange={(event) => setFilters({ ...filters, role: event.target.value })} />
        <button type="submit" className="btn-primary">Filter</button>
      </form>
      {loading ? <p>Loading experiences…</p> : error ? <p role="alert" className="text-red-400">{error}</p> :
        data.items.length ? <div className="space-y-4">
          {data.items.map((item) => <article key={item._id} className="bg-bg-secondary border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold">{item.role} at {item.company}</h2>
            <p className="text-sm text-text-muted mt-1">
              {new Date(item.date).toLocaleDateString()} · {item.difficulty} · {item.outcome}
            </p>
            <p className="my-4 whitespace-pre-wrap">{item.summary}</p>
            <ol className="list-decimal pl-5 space-y-2">{item.rounds.map((round) =>
              <li key={round._id || round.name}><strong>{round.name}:</strong> {round.details}</li>)}</ol>
          </article>)}
          <nav aria-label="Interview result pages" className="flex justify-center gap-4">
            <button disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page - 1) })}>Previous</button>
            <span>Page {page}</span>
            <button disabled={!data.hasMore} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page + 1) })}>Next</button>
          </nav>
        </div> : <p>No interview experiences found.</p>}
    </main>
  );
};

export default InterviewsPage;
