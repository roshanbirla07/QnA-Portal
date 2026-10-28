import React, { useEffect, useRef } from "react";
import { apiConnector } from "../../../services/apiConnector";
import { GITHUB_COMPLETE } from "../../../services/apis";

const GitHubCallback = ({ onSuccess, onLink, onError }) => {
  const handlers = useRef({ onSuccess, onLink, onError });
  handlers.current = { onSuccess, onLink, onError };
  const request = useRef(null);
  useEffect(() => {
    let active = true;
    if (!request.current) {
      const params = new URLSearchParams(window.location.search);
      // Remove temporary authorization data before issuing further app requests.
      window.history.replaceState(window.history.state, "", window.location.pathname);
      request.current = apiConnector("POST", GITHUB_COMPLETE, { code: params.get("code"), state: params.get("state"), error: params.get("error") });
    }
    request.current.then((response) => { if (active) handlers.current.onSuccess(response); }).catch((reason) => {
      if (!active) return;
      if (reason.response?.data?.code === "GITHUB_LINK_REQUIRED") handlers.current.onLink();
      else handlers.current.onError("GitHub sign-in ended or could not be verified. Try again or use email and password.");
    });
    return () => { active = false; };
  }, []);
  return <p role="status">Finishing GitHub sign-in…</p>;
};
export default GitHubCallback;
