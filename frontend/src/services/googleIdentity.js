// Google requires loading the maintained SDK from this exact official URL.
let pending;
export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!pending) pending = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id);
      else { pending = null; script.remove(); reject(new Error("Google sign-in could not load.")); }
    };
    script.onerror = () => { pending = null; script.remove(); reject(new Error("Google sign-in could not load.")); };
    document.head.appendChild(script);
  });
  return pending;
};
