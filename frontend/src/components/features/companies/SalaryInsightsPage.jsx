import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { SALARIES_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const blank = {
  company: "", role: "", location: "", year: new Date().getFullYear(),
  yearsOfExperience: 0, base: "", bonus: 0, stock: 0,
};
const rupees = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const SalaryInsightsPage = () => {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    company: params.get("company") || "", role: params.get("role") || "",
    location: params.get("location") || "",
  });
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const query = params.toString();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiConnector("GET", `${SALARIES_ROUTER}/insights`, null, null, Object.fromEntries(new URLSearchParams(query)))
      .then((response) => { if (active) setItems(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, reload]);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form, year: Number(form.year), yearsOfExperience: Number(form.yearsOfExperience),
      base: Number(form.base), bonus: Number(form.bonus), stock: Number(form.stock),
    };
    try {
      await apiConnector("POST", `${SALARIES_ROUTER}/contributions`, payload);
      toast.success("Contribution recorded privately");
      setForm(blank);
      setShowForm(false);
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason.message);
    }
  };

  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
    <div className="flex flex-wrap justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold">Salary insights</h1>
        <p className="text-text-secondary mt-2">Annual INR averages from at least three different contributors per group.</p>
      </div>
      {token && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Contribute salary"}
      </button>}
    </div>
    {showForm && <form onSubmit={submit} className="bg-bg-secondary border border-white/10 rounded-xl p-6 grid sm:grid-cols-2 gap-4 mb-8">
      {[["company", "Company"], ["role", "Role"], ["location", "City or location"]].map(([field, label]) =>
        <label key={field}>{label}
          <input required maxLength={field === "location" ? 120 : 160} value={form[field]} className="input-field w-full mt-1"
            onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        </label>)}
      {[["year", "Salary year", 2000, new Date().getFullYear()],
        ["yearsOfExperience", "Years of experience", 0, 40],
        ["base", "Annual base (₹)", 1, 1000000000],
        ["bonus", "Annual bonus (₹)", 0, 1000000000],
        ["stock", "Annual stock value (₹)", 0, 1000000000]]
        .map(([field, label, min, max]) => <label key={field}>{label}
          <input type="number" min={min} max={max} required value={form[field]} className="input-field w-full mt-1"
            onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        </label>)}
      <p className="sm:col-span-2 text-sm text-text-muted">Individual submissions and contributor identities are never returned by the public insights API.</p>
      <button type="submit" className="btn-primary">Submit contribution</button>
    </form>}
    <form onSubmit={(event) => {
      event.preventDefault();
      setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())));
    }} className="grid sm:grid-cols-4 gap-3 mb-8">
      {["company", "role", "location"].map((field) => <input key={field} aria-label={`Filter ${field}`}
        placeholder={field} value={filters[field]} className="input-field"
        onChange={(event) => setFilters({ ...filters, [field]: event.target.value })} />)}
      <button type="submit" className="btn-primary">Filter</button>
    </form>
    {loading ? <p>Loading salary insights…</p> : error ? <p role="alert" className="text-red-400">{error}</p> :
      items.length ? <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => <article key={[item.company, item.role, item.location, item.experienceFrom].join("-")}
          className="bg-bg-secondary border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold capitalize">{item.role} at {item.company}</h2>
          <p className="text-text-secondary capitalize">{item.location} · {item.experienceFrom}–{item.experienceTo} YOE</p>
          <p className="mt-4">Average base: {rupees(item.averageBase)}</p>
          <p>Average bonus: {rupees(item.averageBonus)}</p>
          <p>Average stock value: {rupees(item.averageStock)}</p>
          <p className="text-sm text-text-muted mt-3">{item.contributors} contributors</p>
        </article>)}
      </div> : <p>No group has enough contributions yet. Try another filter.</p>}
  </main>;
};

export default SalaryInsightsPage;

