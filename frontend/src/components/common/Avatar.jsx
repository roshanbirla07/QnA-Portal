import React, { useState } from "react";

const Avatar = ({ name = "Community member", src, size = "default" }) => {
  const [failedSource, setFailedSource] = useState("");
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={"member-avatar member-avatar--" + size} aria-hidden="true">
    {src && src !== failedSource ? <img src={src} alt="" width="40" height="40" loading="lazy" onError={() => setFailedSource(src)} /> : initials || "?"}
  </span>;
};
export default Avatar;

