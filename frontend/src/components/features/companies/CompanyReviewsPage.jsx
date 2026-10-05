import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { COMPANY_REVIEWS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const blank = { company: "", role: "", employment: "current", rating: 3, headline: "", pros: "", cons: "" };

const CompanyReviewsPage = () => {
  const [params, setParams] = useSearchParams();
  const [company, setCompany] = useState(params.get("company") || "");
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState({ items: [], hasMore: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const query = params.toString();
  const page = Math.max(Number.parseInt(params.get("page"), 10) || 1, 1);

  useEffect(() => {
    let active = true;
    setError("");
    setLoading(true);
    apiConnector("GET", COMPANY_REVIEWS_ROUTER, null, null, Object.fromEntries(new URLSearchParams(query)))
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, reload]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", COMPANY_REVIEWS_ROUTER, form);
      toast.success("Review shared");
      setShowForm(false);
      setForm(blank);
      setParams({});
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason.message);
    }
  };

  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
    <div className="flex flex-wrap justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold">Company reviews</h1>
        <p className="text-text-secondary mt-2">Firsthand work experiences shared by the community.</p>
      </div>
      {token && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Write a review"}
      </button>}
    </div>
    {showForm && <form onSubmit={submit} className="space-y-4 bg-bg-secondary border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold">Your experience</h2>
      {[["company", 160], ["role", 160], ["headline", 180]].map(([field, maxLength]) =>
        <label key={field} className="block capitalize">{field}
          <input required className="input-field w-full mt-1" maxLength={maxLength} value={form[field]}
            onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        </label>)}
      <div className="grid sm:grid-cols-2 gap-4">
        <label>Employment
          <select value={form.employment} className="input-field w-full mt-1"
            onChange={(event) => setForm({ ...form, employment: event.target.value })}>
            <option value="current">Current</option><option value="former">Former</option>
          </select>
        </label>
        <label>Rating
          <select value={form.rating} className="input-field w-full mt-1"
            onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>
            {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value} / 5</option>)}
          </select>
        </label>
      </div>
      {["pros", "cons"].map((field) => <label key={field} className="block capitalize">{field}
        <textarea required maxLength={2000} rows={4} className="input-field w-full mt-1" value={form[field]}
          onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
      </label>)}
      <p className="text-sm text-text-muted">Reviews start unverified. Verification requires a separate admin review.</p>
      <button type="submit" className="btn-primary">Publish review</button>
    </form>}
    <form onSubmit={(event) => { event.preventDefault(); setParams(company.trim() ? { company: company.trim() } : {}); }}
      className="flex flex-wrap gap-3 mb-6">
      <input aria-label="Filter by company" placeholder="Filter by company" value={company} className="input-field flex-1"
        onChange={(event) => setCompany(event.target.value)} />
      <button type="submit" className="btn-primary">Filter</button>
    </form>
    {loading ? <p>Loading reviews…</p> : error ? <p role="alert" className="text-red-400">{error}</p> :
      data.items.length ? <div className="space-y-4">
        {data.items.map((review) => <article key={review._id} className="bg-bg-secondary border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold">{review.headline}</h2>
          <p className="text-text-secondary">{review.role} at {review.company} · {review.rating}/5</p>
          <p className="text-sm text-text-muted mt-2">{review.employment} employee · {review.verificationStatus}</p>
          <p className="mt-4 whitespace-pre-wrap"><strong>Pros:</strong> {review.pros}</p>
          <p className="mt-2 whitespace-pre-wrap"><strong>Cons:</strong> {review.cons}</p>
        </article>)}
        <nav aria-label="Review result pages" className="flex justify-center gap-4">
          <button disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page - 1) })}>Previous</button>
          <span>Page {page}</span>
          <button disabled={!data.hasMore} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page + 1) })}>Next</button>
        </nav>
      </div> : <p>No company reviews found.</p>}
  </main>;
};

export default CompanyReviewsPage;

