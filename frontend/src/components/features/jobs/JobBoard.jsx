import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER } from "../../../services/apis";
import JobCommunity from "./JobCommunity";

const JobBoard = () => {
  const { jobId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({
    q: searchParams.get("q") || "",
    company: searchParams.get("company") || "",
    location: searchParams.get("location") || "",
  });
  const [data, setData] = useState({ items: [], total: 0, hasMore: false });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const page = Math.max(Number.parseInt(searchParams.get("page"), 10) || 1, 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = Object.fromEntries(searchParams.entries());
    apiConnector("GET", jobId ? `${JOBS_ROUTER}/${jobId}` : JOBS_ROUTER, null, null, jobId ? null : params)
      .then((response) => {
        if (!active) return;
        if (jobId) setDetail(response.data.data);
        else setData(response.data.data);
      })
      .catch((reason) => { if (active) setError(reason.message || "Could not load jobs"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId, searchParams]);

  const search = (event) => {
    event.preventDefault();
    setSearchParams(Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim())));
  };

  const changePage = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    setSearchParams(params);
  };

  const card = (job) => (
    <article key={job._id} className="rounded-xl border border-white/10 bg-bg-secondary p-6 space-y-3">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold"><Link to={`/jobs/${job._id}`} className="hover:underline">{job.title}</Link></h2>
          <p className="text-text-secondary">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
        </div>
        <span className="text-sm text-text-muted">{new Date(job.createdAt).toLocaleDateString()}</span>
      </div>
      {job.description && <p className="text-text-secondary whitespace-pre-wrap line-clamp-3">{job.description}</p>}
      <div className="flex gap-4">
        <Link to={`/jobs/${job._id}`} className="text-primary-blue hover:underline">Details</Link>
        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline">
          Apply on source site ↗
        </a>
      </div>
    </article>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{jobId ? "Job details" : "Community job board"}</h1>
          <p className="text-text-secondary mt-2">Jobs are shared by the community. Applications open on the original site.</p>
        </div>
        <div className="flex flex-wrap gap-3"><Link to="/jobs/matches" className="btn-primary whitespace-nowrap">Matched jobs</Link><Link to="/jobs/share" className="btn-primary whitespace-nowrap">Share a job</Link></div>
      </header>

      {jobId ? (
        <>
          <Link to="/jobs" className="text-primary-blue hover:underline">← All jobs</Link>
          {loading ? <p className="mt-6">Loading job…</p> : error ? <p role="alert" className="mt-6 text-red-400">{error}</p> :
            detail && <div className="mt-6">{card(detail)}<JobCommunity jobId={detail._id} /></div>}
        </>
      ) : (
        <>
          <form onSubmit={search} className="grid gap-3 md:grid-cols-4 mb-8">
            {[
              ["q", "Search title or keywords"],
              ["company", "Company"],
              ["location", "Location"],
            ].map(([field, placeholder]) => (
              <input key={field} aria-label={placeholder} value={form[field]} placeholder={placeholder} maxLength={80}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                className="input-field w-full" />
            ))}
            <button type="submit" className="btn-primary">Search jobs</button>
          </form>
          {loading ? <p>Loading jobs…</p> : error ? <p role="alert" className="text-red-400">{error}</p> :
            data.items.length ? (
              <>
                <p className="text-text-secondary mb-4">{data.total} job{data.total === 1 ? "" : "s"} found</p>
                <div className="space-y-4">{data.items.map(card)}</div>
                <nav aria-label="Job results pages" className="flex items-center justify-center gap-4 mt-8">
                  <button disabled={page === 1} onClick={() => changePage(page - 1)} className="disabled:opacity-40">Previous</button>
                  <span>Page {page}</span>
                  <button disabled={!data.hasMore} onClick={() => changePage(page + 1)} className="disabled:opacity-40">Next</button>
                </nav>
              </>
            ) : <p>No jobs found. Try another search or share a job link.</p>}
        </>
      )}
    </main>
  );
};

export default JobBoard;
