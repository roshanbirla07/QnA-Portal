import React from "react";

const PageState = ({ state, title, children }) => <div className="surface-card px-6 py-10 text-center" role={state === "error" ? "alert" : "status"}>
  {state === "loading" && <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-primary-blue border-t-transparent" />}
  <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
  {children && <div className="mt-2 text-sm text-text-secondary">{children}</div>}
</div>;

export default PageState;
