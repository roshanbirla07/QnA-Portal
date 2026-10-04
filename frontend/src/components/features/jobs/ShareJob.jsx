import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER } from "../../../services/apis";

const ShareJob = () => {
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const preview = async (event) => {
    event.preventDefault();
    setBusy(true);
    setDetails(null);
    try {
      const response = await apiConnector("POST", `${JOBS_ROUTER}/preview`, { url });
      setDetails(response.data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const publish = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiConnector("POST", JOBS_ROUTER, details);
      toast.success("Job link published");
      navigate("/jobs");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-text-primary">
      <h1 className="text-3xl font-bold mb-2">Share a job link</h1>
      <p className="text-text-secondary mb-8">Paste an existing job posting. Review the extracted details before sharing it.</p>
      <form onSubmit={preview} className="space-y-4">
        <label htmlFor="job-url" className="block font-medium">Job posting URL</label>
        <input id="job-url" type="url" required value={url} onChange={(event) => { setUrl(event.target.value); setDetails(null); }}
          placeholder="https://company.com/careers/job" className="input-field w-full" />
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Loading…" : "Preview job"}</button>
      </form>
      {details && (
        <form onSubmit={publish} className="mt-8 space-y-5 bg-bg-secondary rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold">Confirm job details</h2>
          {["title", "company", "location"].map((field) => (
            <label key={field} className="block capitalize">{field}
              <input required={field !== "location"} maxLength={field === "title" ? 220 : 160}
                value={details[field] || ""} onChange={(event) => setDetails({ ...details, [field]: event.target.value })}
                className="input-field w-full mt-2" />
            </label>
          ))}
          <label className="block">Description
            <textarea maxLength={1000} value={details.description || ""}
              onChange={(event) => setDetails({ ...details, description: event.target.value })}
              className="input-field w-full mt-2" rows={4} />
          </label>
          <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-blue underline break-all">
            Check the source job posting
          </a>
          <button type="submit" disabled={busy} className="btn-primary block disabled:opacity-50">Publish job link</button>
        </form>
      )}
    </main>
  );
};

export default ShareJob;
