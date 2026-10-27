import React, { useEffect, useRef, useState } from "react";
import { apiConnector } from "../../../services/apiConnector";
import { AUTH_CONFIG, GOOGLE_CHALLENGE } from "../../../services/apis";
import { loadGoogleIdentity } from "../../../services/googleIdentity";

const GoogleSignIn = ({ onCredential, disabled }) => {
  const button = useRef(null);
  const callback = useRef(onCredential);
  const blocked = useRef(disabled);
  callback.current = onCredential;
  blocked.current = disabled;
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let observer;
    setState("loading");
    const initialize = async () => {
      try {
        const response = await apiConnector("GET", AUTH_CONFIG);
        if (!active) return;
        const clientId = response.data.data.googleClientId;
        if (!clientId) { setState("unavailable"); return; }
        const identity = await loadGoogleIdentity();
        if (!active) return;
        const challenge = await apiConnector("POST", GOOGLE_CHALLENGE, {});
        if (!active) return;
        identity.initialize({ client_id: clientId, nonce: challenge.data.data.nonce, auto_select: false, ux_mode: "popup",
          callback: async (response) => {
            if (!active || blocked.current || !response.credential) return;
            try { await callback.current(response.credential); }
            catch { if (active) setState("error"); }
          },
        });
        // Keep the provider-rendered button within the responsive auth card.
        let renderedWidth = 0;
        const render = () => {
          if (!active || !button.current) return;
          const width = button.current.clientWidth;
          if (!width || width === renderedWidth) return;
          renderedWidth = width;
          button.current.replaceChildren();
          identity.renderButton(button.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width });
        };
        setState("ready");
        render();
        observer = new ResizeObserver(render);
        observer.observe(button.current);
      } catch { if (active) setState("error"); }
    };
    initialize();
    return () => { active = false; observer?.disconnect(); };
  }, [attempt]);
  return <section className="auth-google" aria-label="Google sign-in">
    <div ref={button} className="auth-google-button" hidden={state !== "ready"} inert={disabled ? "" : undefined} aria-busy={disabled} />
    {state === "loading" && <p role="status">Loading Google sign-in…</p>}
    {state === "unavailable" && <p>Google sign-in is unavailable. You can use email and password.</p>}
    {state === "error" && <><p role="alert">Google sign-in could not finish. Check your connection or browser settings and try again.</p><button type="button" className="glass-button" disabled={disabled} onClick={() => setAttempt((value) => value + 1)}>Retry Google sign-in</button></>}
  </section>;
};
export default GoogleSignIn;
