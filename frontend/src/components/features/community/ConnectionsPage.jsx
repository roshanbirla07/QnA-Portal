import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { CONNECTIONS_ROUTER } from "../../../services/apis";

const ConnectionsPage = () => {
  const [form, setForm] = useState({ username: "", purpose: "expertise", note: "" });
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiConnector("GET", `${CONNECTIONS_ROUTER}/me`)
      .then((response) => { if (active) { setRequests(response.data.data); setError(""); } })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const send = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", `${CONNECTIONS_ROUTER}/requests`, form);
      toast.success("Request sent");
      setForm({ username: "", purpose: "expertise", note: "" });
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason.message);
    }
  };

  const respond = async (id, status) => {
    try {
      await apiConnector("PATCH", `${CONNECTIONS_ROUTER}/requests/${id}`, { status });
      toast.success("Request updated");
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason.message);
    }
  };

  const section = (title, items, incoming) => <section className="mt-10">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    {items.length ? <div className="space-y-3">{items.map((item) =>
      <article key={item._id} className="bg-bg-secondary border border-white/10 rounded-xl p-5">
        <p className="font-semibold">
          {incoming ? item.senderId?.displayName || item.senderId?.username :
            item.recipientId?.displayName || item.recipientId?.username || "Member"}
          <span className="font-normal text-text-secondary"> · {item.purpose} · {item.status}</span>
        </p>
        <p className="whitespace-pre-wrap mt-2">{item.note}</p>
        {item.status === "pending" && <div className="flex gap-4 mt-4">
          {incoming ? <>
            <button onClick={() => respond(item._id, "accepted")} className="btn-primary">Accept</button>
            <button onClick={() => respond(item._id, "declined")}>Decline</button>
          </> : <button onClick={() => respond(item._id, "canceled")}>Cancel request</button>}
        </div>}
      </article>)}</div> : <p className="text-text-secondary">No requests yet.</p>}
  </section>;

  return <main className="max-w-4xl mx-auto px-4 py-10 text-text-primary">
    <h1 className="text-3xl font-bold">Purpose-based connections</h1>
    <p className="text-text-secondary mt-2">Reach out for a specific reason and give the other person context.</p>
    <form onSubmit={send} className="bg-bg-secondary border border-white/10 rounded-xl p-6 mt-8 space-y-4">
      <label className="block">Member username
        <input required maxLength={40} className="input-field w-full mt-1" value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })} />
      </label>
      <label className="block">Purpose
        <select className="input-field w-full mt-1" value={form.purpose}
          onChange={(event) => setForm({ ...form, purpose: event.target.value })}>
          {["expertise", "collaboration", "mentorship", "referral", "project"].map((purpose) =>
            <option key={purpose} value={purpose}>{purpose}</option>)}
        </select>
      </label>
      <label className="block">Why would you like to connect?
        <textarea required maxLength={500} rows={3} className="input-field w-full mt-1" value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })} />
      </label>
      <button type="submit" className="btn-primary">Send request</button>
    </form>
    {loading ? <p className="mt-8">Loading requests…</p> : error ? <p role="alert" className="mt-8 text-red-400">{error}</p> :
      <>{section("Received", requests.received, true)}{section("Sent", requests.sent, false)}</>}
  </main>;
};

export default ConnectionsPage;
