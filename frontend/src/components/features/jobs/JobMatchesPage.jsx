import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER } from "../../../services/apis";
const JobMatchesPage = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiConnector("GET", `${JOBS_ROUTER}/matches`).then((response) => {
      if (active) setResult(response.data.data);
    }).catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  return <main className="max-w-4xl mx-auto px-4 py-10 text-text-primary space-y-6">
    <header><h1 className="text-3xl font-bold">Jobs matched to you</h1>
      <p className="text-text-secondary mt-2">Matches use your profile headline, bio, location, and earned topic reputation.</p></header>
    <Link to="/jobs" className="text-primary-blue hover:underline">← All jobs</Link>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {!result && !error && <p>Finding matches…</p>}
    {result?.needsProfile && <p>Add a headline, bio, or location to your profile, or earn topic reputation to see matches.</p>}
    {result && !result.needsProfile && !result.items.length && <p>No matching jobs yet. Browse all jobs for more options.</p>}
    <div className="space-y-4">{result?.items.map(({ job, signals }) => <article key={job._id}
      className="rounded-xl border border-white/10 bg-bg-secondary p-5">
      <h2 className="text-xl font-semibold"><Link to={`/jobs/${job._id}`} className="hover:underline">{job.title}</Link></h2>
      <p className="text-text-secondary">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
      <p className="text-sm mt-3">Why it matched: {signals.map((signal) => signal.label).join("; ")}</p>
      <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline">Apply on source site ↗</a>
    </article>)}</div>
  </main>;
};
export default JobMatchesPage;
