import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { PROJECTS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const ProjectsPage = () => {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [inbox, setInbox] = useState({ owned: [], received: [], sent: [] });
  const [form, setForm] = useState({ title: "", description: "", repositoryUrl: "", tags: "", communitySlug: params.get("community") || "" });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const page = Math.max(Number.parseInt(params.get("page"), 10) || 1, 1);

  const query = params.toString();

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([apiConnector("GET", id ? `${PROJECTS_ROUTER}/${id}` : PROJECTS_ROUTER, null, null,
      id ? null : Object.fromEntries(new URLSearchParams(query))),
    token ? apiConnector("GET", `${PROJECTS_ROUTER}/me/requests`) : Promise.resolve(null)])
      .then(([result, requests]) => { if (active) {
        setData(result.data.data); setInbox(requests?.data.data || { owned: [], received: [], sent: [] }); setError("");
      } }).catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, query, token, reload]);

  const refresh = () => setReload((value) => value + 1);
  const create = async (event) => {
    event.preventDefault();
    try { await apiConnector("POST", PROJECTS_ROUTER, { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      toast.success("Project shared"); setForm({ title: "", description: "", repositoryUrl: "", tags: "", communitySlug: "" }); refresh(); }
    catch (reason) { toast.error(reason.message); }
  };
  const apply = async (event) => {
    event.preventDefault();
    try { await apiConnector("POST", `${PROJECTS_ROUTER}/${id}/applications`, { note }); toast.success("Request sent"); setNote(""); refresh(); }
    catch (reason) { toast.error(reason.message); }
  };
  const update = async (url, payload) => {
    try { await apiConnector("PATCH", url, payload); refresh(); }
    catch (reason) { toast.error(reason.message); }
  };

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-10">Loading projects…</main>;
  if (error) return <main role="alert" className="max-w-5xl mx-auto px-4 py-10 text-red-400">{error}</main>;
  if (id) {
    const { project, contributors } = data;
    return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-6">
      <Link to="/projects" className="text-primary-blue">← All projects</Link>
      <header><h1 className="text-3xl font-bold">{project.title}</h1><p className="text-text-secondary mt-2">{project.status} · by {project.ownerId?.displayName || project.ownerId?.username}</p></header>
      <p className="whitespace-pre-wrap">{project.description}</p>
      <div className="flex gap-3 flex-wrap">{project.tags.map((tag) => <Link to={`/projects?tag=${tag}`} key={tag} className="text-primary-blue">#{tag}</Link>)}</div>
      {project.communityId && <Link className="text-primary-blue" to={`/communities/${project.communityId.slug}`}>Community: {project.communityId.name}</Link>}
      {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-primary-blue block">Repository ↗</a>}
      <section><h2 className="text-xl font-semibold">Contributors</h2>
        {contributors.length ? contributors.map((member) => <p key={member._id}>{member.displayName || member.username} · {member.headline}</p>) : <p>Seeking collaborators.</p>}</section>
      {token && project.status === "open" && !inbox.owned.includes(id) && <form onSubmit={apply} className="rounded-xl border border-white/10 bg-bg-secondary p-5 space-y-3">
        <h2 className="text-xl font-semibold">Ask to collaborate</h2>
        <textarea required maxLength={1000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="input-field w-full" aria-label="Collaboration note" />
        <button type="submit" className="btn-primary">Send request</button>
      </form>}
      {token && inbox.owned.includes(id) && <button className="text-primary-blue"
        onClick={() => update(`${PROJECTS_ROUTER}/${id}`, { status: project.status === "open" ? "closed" : "open" })}>Change project status</button>}
    </main>;
  }
  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-8">
    <header><h1 className="text-3xl font-bold">Projects and collaboration</h1><p className="text-text-secondary mt-2">Find a project to contribute to, or share yours.</p></header>
    <div className="space-y-4">{data.items.map((project) => <article key={project._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5">
      <Link to={`/projects/${project._id}`} className="text-xl font-semibold text-primary-blue">{project.title}</Link>
      <p className="text-text-secondary mt-2 line-clamp-3">{project.description}</p>
      <p className="text-sm text-text-muted">{project.status} · {project.communityId?.name || "Independent"} · {project.tags.join(", ")}</p>
    </article>)}{!data.items.length && <p>No projects found.</p>}</div>
    <nav aria-label="Project results pages" className="flex gap-4"><button disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page - 1) })}>Previous</button>
      <span>Page {page}</span><button disabled={!data.hasMore} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: String(page + 1) })}>Next</button></nav>
    {token && <>
      <form onSubmit={create} className="rounded-xl border border-white/10 bg-bg-secondary p-5 space-y-3">
        <h2 className="text-xl font-semibold">Share a project</h2>
        <input required maxLength={180} aria-label="Project title" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-field w-full" />
        <textarea required maxLength={4000} aria-label="Project description" placeholder="Goals and needed help" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input-field w-full" rows={4} />
        <input type="url" aria-label="Repository URL" placeholder="HTTPS repository URL (optional)" value={form.repositoryUrl} onChange={(event) => setForm({ ...form, repositoryUrl: event.target.value })} className="input-field w-full" />
        <input aria-label="Project tags" placeholder="Tags separated by commas" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="input-field w-full" />
        <input aria-label="Community slug" placeholder="Community slug (optional)" value={form.communitySlug} onChange={(event) => setForm({ ...form, communitySlug: event.target.value })} className="input-field w-full" />
        <button className="btn-primary" type="submit">Publish project</button>
      </form>
      <section><h2 className="text-2xl font-semibold mb-4">Received collaboration requests</h2>
        {inbox.received.map((item) => <article key={item._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5 mb-3">
          <h3 className="font-semibold">{item.projectId?.title} · {item.applicantId?.displayName || item.applicantId?.username}</h3>
          <p className="whitespace-pre-wrap">{item.note}</p><p className="text-text-secondary">{item.status}</p>
          {item.status === "pending" && <div className="flex gap-4"><button className="btn-primary" onClick={() => update(`${PROJECTS_ROUTER}/applications/${item._id}`, { status: "accepted" })}>Accept</button>
            <button onClick={() => update(`${PROJECTS_ROUTER}/applications/${item._id}`, { status: "declined" })}>Decline</button></div>}
        </article>)}{!inbox.received.length && <p>No requests yet.</p>}
      </section>
      <section><h2 className="text-2xl font-semibold mb-4">Your contributions</h2>
        {inbox.sent.map((item) => <article key={item._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5 mb-3">
          <p>{item.projectId?.title} · {item.status}</p>
          {item.status === "pending" && <button className="text-primary-blue" onClick={() => update(`${PROJECTS_ROUTER}/applications/${item._id}`, { status: "withdrawn" })}>Withdraw</button>}
        </article>)}{!inbox.sent.length && <p>No contributions yet.</p>}
      </section>
    </>}
  </main>;
};

export default ProjectsPage;

