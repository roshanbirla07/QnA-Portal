import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { COMPANIES_ROUTER } from "../../../services/apis";

const Section = ({ title, href, children, empty }) => <section className="rounded-xl border border-white/10 bg-bg-secondary p-6">
  <div className="flex flex-wrap justify-between gap-3 mb-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    <Link to={href} className="text-primary-blue hover:underline">Explore all →</Link>
  </div>
  {children?.length ? <div className="space-y-4">{children}</div> : <p className="text-text-secondary">{empty}</p>}
</section>;

const CompaniesPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiConnector("GET", slug ? `${COMPANIES_ROUTER}/${slug}` : COMPANIES_ROUTER)
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-10">Loading companies…</main>;
  if (error) return <main className="max-w-5xl mx-auto px-4 py-10" role="alert">{error}</main>;
  if (!slug) {
    const items = data.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
    return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
      <h1 className="text-3xl font-bold">Companies</h1>
      <p className="text-text-secondary mt-2 mb-6">Explore jobs and firsthand community insights by company.</p>
      <label className="block mb-6">Find a company
        <input className="input-field w-full mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company name" />
      </label>
      {items.length ? <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <Link key={item.slug}
        to={`/companies/${item.slug}`} className="rounded-xl border border-white/10 bg-bg-secondary p-5 hover:border-primary-blue">
        <h2 className="text-xl font-semibold">{item.name}</h2>
        <p className="text-text-secondary mt-2">{item.jobs} jobs · {item.reviews} reviews · {item.interviews} interviews</p>
      </Link>)}</div> : <p>No companies found.</p>}
    </main>;
  }

  const filter = encodeURIComponent(data.name);
  const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  return <main className="max-w-5xl mx-auto px-4 py-10 space-y-6 text-text-primary">
    <Link to="/companies" className="text-primary-blue hover:underline">← All companies</Link>
    <header><h1 className="text-3xl font-bold">{data.name}</h1>
      <p className="text-text-secondary mt-2">{data.counts.jobs} open jobs · {data.counts.reviews} reviews · {data.counts.interviews} interviews</p>
    </header>
    <Section title="Jobs" href={`/jobs?company=${filter}`} empty="No shared jobs yet.">
      {data.jobs.map((job) => <article key={job._id}><Link to={`/jobs/${job._id}`} className="font-semibold text-primary-blue hover:underline">{job.title}</Link>
        <p className="text-text-secondary">{job.location || "Location not provided"} · {job.verificationStatus.replace(/_/g, " ")}</p></article>)}
    </Section>
    <Section title="Salary insights" href={`/salaries?company=${filter}`} empty="No salary group with enough contributors yet.">
      {data.salaries.map((row) => <article key={`${row.role}-${row.location}`}><h3 className="font-semibold">{row.role.replace(/-/g, " ")} · {row.location}</h3>
        <p className="text-text-secondary">Average annual base {money(row.averageBase)} · {row.contributors} contributors</p></article>)}
    </Section>
    <Section title="Interviews" href={`/interviews?company=${filter}`} empty="No interview experiences yet.">
      {data.interviews.map((item) => <article key={item._id}><h3 className="font-semibold">{item.role} · {item.difficulty}</h3>
        <p className="text-text-secondary line-clamp-3">{item.summary}</p></article>)}
    </Section>
    <Section title="Reviews" href={`/reviews?company=${filter}`} empty="No company reviews yet.">
      {data.reviews.map((item) => <article key={item._id}><h3 className="font-semibold">{item.headline} · {item.rating}/5</h3>
        <p className="text-text-secondary">{item.role} · {item.verificationStatus}</p>
        <p className="line-clamp-3 mt-1">{item.pros}</p></article>)}
    </Section>
    <section className="rounded-xl border border-white/10 bg-bg-secondary p-6">
      <h2 className="text-xl font-semibold">Discussions and engineering content</h2>
      <p className="text-text-secondary mt-2">Explore the job links above for their community discussion. Company engineering articles will appear here when they are associated with a company.</p>
    </section>
  </main>;
};

export default CompaniesPage;
