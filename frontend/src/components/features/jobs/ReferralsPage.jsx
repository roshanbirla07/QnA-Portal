import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { REFERRALS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const ReferralsPage = () => {
  const [params, setParams] = useSearchParams();
  const { token } = useAuth();
  const [offers, setOffers] = useState([]);
  const [inbox, setInbox] = useState({ offers: [], received: [], sent: [] });
  const [company, setCompany] = useState(params.get("company") || "");
  const [optIn, setOptIn] = useState({ company: "", note: "" });
  const [request, setRequest] = useState({ offerId: "", jobUrl: "", note: "" });
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const query = params.toString();

  useEffect(() => {
    let active = true;
    Promise.all([apiConnector("GET", `${REFERRALS_ROUTER}/offers`, null, null, Object.fromEntries(new URLSearchParams(query))),
      token ? apiConnector("GET", `${REFERRALS_ROUTER}/me`) : Promise.resolve(null)])
      .then(([publicResult, privateResult]) => {
        if (!active) return;
        setOffers(publicResult.data.data);
        if (privateResult) setInbox(privateResult.data.data);
        setError("");
      })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [query, token, reload]);

  const refresh = () => setReload((value) => value + 1);
  const saveOffer = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", `${REFERRALS_ROUTER}/offers`, optIn);
      toast.success("Availability published");
      setOptIn({ company: "", note: "" });
      refresh();
    } catch (reason) { toast.error(reason.message); }
  };
  const send = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", `${REFERRALS_ROUTER}/offers/${request.offerId}/requests`,
        { jobUrl: request.jobUrl, note: request.note });
      toast.success("Request sent");
      setRequest({ offerId: "", jobUrl: "", note: "" });
      refresh();
    } catch (reason) { toast.error(reason.message); }
  };
  const update = async (url, body) => {
    try { await apiConnector("PATCH", url, body); refresh(); }
    catch (reason) { toast.error(reason.message); }
  };

  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-8">
    <header><h1 className="text-3xl font-bold">Referral requests</h1>
      <p className="text-text-secondary mt-2">Members voluntarily offer referrals. Availability is self-declared and a request does not guarantee a referral.</p></header>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    <form onSubmit={(event) => { event.preventDefault(); setParams(company.trim() ? { company: company.trim() } : {}); }} className="flex gap-3">
      <input aria-label="Filter by company" className="input-field flex-1" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" />
      <button className="btn-primary" type="submit">Search</button>
    </form>
    <section><h2 className="text-2xl font-semibold mb-4">Available volunteers</h2>
      {offers.length ? <div className="grid gap-4 md:grid-cols-2">{offers.map((offer) => <article key={offer._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5">
        <h3 className="text-xl font-semibold">{offer.company}</h3>
        <p className="text-text-secondary">{offer.employeeId?.displayName || offer.employeeId?.username || "Member"} · {offer.employeeId?.headline || "Community member"}</p>
        <p className="mt-2 whitespace-pre-wrap">{offer.note}</p>
        {token ? <button className="text-primary-blue mt-3" onClick={() => setRequest({ offerId: offer._id, jobUrl: "", note: "" })}>Request referral</button> :
          <Link className="text-primary-blue mt-3 inline-block" to="/login">Sign in to request</Link>}
      </article>)}</div> : <p className="text-text-secondary">No volunteers found.</p>}
    </section>
    {request.offerId && <form onSubmit={send} className="rounded-xl border border-white/10 bg-bg-secondary p-5 space-y-3">
      <h2 className="text-xl font-semibold">Request a referral</h2>
      <label className="block">Link to the specific job<input required type="url" maxLength={2048} className="input-field w-full mt-1" value={request.jobUrl}
        onChange={(event) => setRequest({ ...request, jobUrl: event.target.value })} /></label>
      <label className="block">Why are you a fit?<textarea required maxLength={1000} rows={3} className="input-field w-full mt-1" value={request.note}
        onChange={(event) => setRequest({ ...request, note: event.target.value })} /></label>
      <p className="text-sm text-text-muted">Your public headline, bio, reputation, links, and published post count will be visible to this volunteer.</p>
      <button className="btn-primary" type="submit">Send request</button>
      <button className="ml-4" type="button" onClick={() => setRequest({ offerId: "", jobUrl: "", note: "" })}>Cancel</button>
    </form>}
    {token && <>
      <form onSubmit={saveOffer} className="rounded-xl border border-white/10 bg-bg-secondary p-5 space-y-3">
        <h2 className="text-xl font-semibold">Volunteer to refer</h2>
        <p className="text-text-secondary">Add a company only if you can consider referral requests there.</p>
        <input required maxLength={160} aria-label="Company" placeholder="Company" className="input-field w-full" value={optIn.company}
          onChange={(event) => setOptIn({ ...optIn, company: event.target.value })} />
        <textarea maxLength={500} aria-label="Referral guidelines" placeholder="Optional guidelines" className="input-field w-full" value={optIn.note}
          onChange={(event) => setOptIn({ ...optIn, note: event.target.value })} />
        <button type="submit" className="btn-primary">Save availability</button>
      </form>
      <section><h2 className="text-2xl font-semibold mb-4">Your availability</h2>
        {inbox.offers.map((offer) => <div key={offer._id} className="flex gap-4 items-center mb-3"><span>{offer.company} · {offer.active ? "Active" : "Paused"}</span>
          <button className="text-primary-blue" onClick={() => update(`${REFERRALS_ROUTER}/offers/${offer._id}`, { active: !offer.active })}>
            {offer.active ? "Pause" : "Resume"}</button></div>)}
      </section>
      <section><h2 className="text-2xl font-semibold mb-4">Received requests</h2>
        {inbox.received.length ? inbox.received.map((item) => <article key={item._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5 mb-3">
          <h3 className="font-semibold">{item.candidateId?.displayName || item.candidateId?.username || "Member"} · {item.offerId?.company}</h3>
          <p className="text-text-secondary">{item.candidateId?.headline} · Reputation {item.candidateId?.reputation || 0} · {item.publishedPosts} published posts</p>
          <p className="whitespace-pre-wrap">{item.note}</p><a className="text-primary-blue" href={item.jobUrl} target="_blank" rel="noopener noreferrer">Job link ↗</a>
          {item.candidateId?.bio && <p className="text-text-secondary mt-2">{item.candidateId.bio}</p>}
          <p className="text-text-secondary">{item.status}</p>
          {item.status === "pending" && <div className="flex gap-4"><button className="btn-primary" onClick={() => update(`${REFERRALS_ROUTER}/requests/${item._id}`, { status: "accepted" })}>Accept</button>
            <button onClick={() => update(`${REFERRALS_ROUTER}/requests/${item._id}`, { status: "declined" })}>Decline</button></div>}
        </article>) : <p>No requests yet.</p>}
      </section>
      <section><h2 className="text-2xl font-semibold mb-4">Sent requests</h2>
        {inbox.sent.length ? inbox.sent.map((item) => <article key={item._id} className="rounded-xl border border-white/10 bg-bg-secondary p-5 mb-3">
          <h3 className="font-semibold">{item.offerId?.company} · {item.status}</h3><p className="whitespace-pre-wrap">{item.note}</p>
          {item.status === "pending" && <button className="text-primary-blue" onClick={() => update(`${REFERRALS_ROUTER}/requests/${item._id}`, { status: "canceled" })}>Cancel request</button>}
        </article>) : <p>No requests yet.</p>}
      </section>
    </>}
  </main>;
};

export default ReferralsPage;

