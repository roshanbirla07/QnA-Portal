import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { COMMUNITIES_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const CommunitiesPage = () => {
  const { slug } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", topics: "" });
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([apiConnector("GET", slug ? `${COMMUNITIES_ROUTER}/${slug}` : COMMUNITIES_ROUTER),
      token ? apiConnector("GET", `${COMMUNITIES_ROUTER}/me`) : Promise.resolve(null)])
      .then(([result, mine]) => { if (active) {
        setData(result.data.data); setMemberships(mine?.data.data || []); setError("");
      } })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, token, reload]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", COMMUNITIES_ROUTER, { ...form, topics: form.topics.split(",").map((topic) => topic.trim()) });
      toast.success("Community created"); setForm({ name: "", description: "", topics: "" });
      setReload((value) => value + 1);
    } catch (reason) { toast.error(reason.message); }
  };
  const toggleMembership = async () => {
    try {
      await apiConnector(memberships.includes(data._id) ? "DELETE" : "POST", `${COMMUNITIES_ROUTER}/${slug}/members`);
      setReload((value) => value + 1);
    } catch (reason) { toast.error(reason.message); }
  };
  const addJob = async (event) => {
    event.preventDefault();
    try { await apiConnector("POST", `${COMMUNITIES_ROUTER}/${slug}/jobs`, { jobId }); setJobId(""); setReload((value) => value + 1); }
    catch (reason) { toast.error(reason.message); }
  };

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-10">Loading communities…</main>;
  if (error) return <main role="alert" className="max-w-5xl mx-auto px-4 py-10 text-red-400">{error}</main>;
  if (!slug) return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-8">
    <header><h1 className="text-3xl font-bold">Developer communities</h1>
      <p className="text-text-secondary mt-2">Meet people around topics and share questions, articles, and jobs.</p></header>
    <div className="grid gap-4 md:grid-cols-2">{data.map((item) => <Link key={item._id} to={`/communities/${item.slug}`}
      className="rounded-xl border border-white/10 bg-bg-secondary p-5 hover:border-primary-blue">
      <h2 className="text-xl font-semibold">{item.name}</h2><p className="text-text-secondary mt-2">{item.description}</p>
      <p className="text-sm text-text-muted mt-3">{item.membersCount} members · {item.topics.map((topic) => `#${topic}`).join(" ")}</p>
    </Link>)}</div>
    {!data.length && <p>No communities yet.</p>}
    {token && <form onSubmit={submit} className="rounded-xl border border-white/10 bg-bg-secondary p-6 space-y-3">
      <h2 className="text-xl font-semibold">Start a community</h2>
      <input required maxLength={80} aria-label="Name" placeholder="Name" className="input-field w-full" value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <textarea required maxLength={500} aria-label="Description" placeholder="What is this community for?" className="input-field w-full" value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <input required aria-label="Topics" placeholder="Existing topics, comma separated (e.g. kafka, nodejs)" className="input-field w-full" value={form.topics}
        onChange={(event) => setForm({ ...form, topics: event.target.value })} />
      <button className="btn-primary" type="submit">Create community</button>
    </form>}
  </main>;

  const joined = memberships.includes(data._id);
  return <main className="max-w-6xl mx-auto px-4 py-10 text-text-primary space-y-8">
    <Link to="/communities" className="text-primary-blue">← All communities</Link>
    <header className="rounded-xl border border-white/10 bg-bg-secondary p-6">
      <h1 className="text-3xl font-bold">{data.name}</h1><p className="text-text-secondary mt-2">{data.description}</p>
      <p className="text-text-muted mt-2">{data.membersCount} members</p>
      <div className="flex flex-wrap gap-3 mt-4">{data.topics.map((topic) => <Link key={topic} to={`/topics/${topic}`} className="text-primary-blue">#{topic}</Link>)}</div>
      {token ? <button onClick={toggleMembership} className="btn-primary mt-4">{joined ? "Leave community" : "Join community"}</button> :
        <Link to="/login" className="text-primary-blue mt-4 inline-block">Sign in to join</Link>}
    </header>
    <section><h2 className="text-2xl font-semibold mb-4">Questions and discussions</h2>
      {data.questions.length ? data.questions.map((post) => <article key={post._id} className="bg-bg-secondary border border-white/10 rounded-xl p-4 mb-3">
        <h3 className="font-semibold">{post.title}</h3><p className="text-text-secondary">{post.excerpt} · {post.answerCount} answers</p>
      </article>) : <p>No questions yet. Ask one with a community topic tag.</p>}</section>
    <section><h2 className="text-2xl font-semibold mb-4">Articles</h2>
      {data.articles.length ? data.articles.map((post) => <article key={post._id} className="bg-bg-secondary border border-white/10 rounded-xl p-4 mb-3">
        <h3 className="font-semibold">{post.title}</h3><p className="text-text-secondary">{post.excerpt}</p>
      </article>) : <p>No articles yet.</p>}</section>
    <section><h2 className="text-2xl font-semibold mb-4">Jobs</h2>
      {data.jobs.length ? data.jobs.map((job) => <Link to={`/jobs/${job._id}`} key={job._id} className="block bg-bg-secondary border border-white/10 rounded-xl p-4 mb-3">
        {job.title} · {job.company}</Link>) : <p>No jobs shared here yet.</p>}
      {joined && <form onSubmit={addJob} className="flex gap-3 mt-4"><input required aria-label="Job ID" placeholder="Job ID from a shared job URL" value={jobId}
        onChange={(event) => setJobId(event.target.value)} className="input-field flex-1" /><button className="btn-primary" type="submit">Share job</button></form>}
    </section>
    <section><h2 className="text-2xl font-semibold mb-4">People</h2>
      <div className="grid gap-3 sm:grid-cols-2">{data.people.map((person) => <div key={person.userId} className="bg-bg-secondary border border-white/10 rounded-xl p-4">
        <strong>{person.displayName || person.username}</strong><p className="text-text-secondary">{person.headline} · topic score {person.score}</p>
      </div>)}</div>{!data.people.length && <p>No contributors yet.</p>}
    </section>
    <section><h2 className="text-2xl font-semibold mb-2">Projects</h2><p className="text-text-secondary">Community projects appear here as members publish them.</p></section>
  </main>;
};

export default CommunitiesPage;
