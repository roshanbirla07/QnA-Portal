import React, { useState } from "react";
import GeneratedAvatar from "boring-avatars";

// Fixed artwork presets; assignment never changes between renders or visits.
const DEFAULT_AVATARS = ["qna-sunny", "qna-sprout", "qna-pebble", "qna-orbit", "qna-mango", "qna-cloud", "qna-coral", "qna-comet"];
export const getDefaultAvatarSeed = (identity) => {
  const value = String(identity || "Community member");
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return DEFAULT_AVATARS[hash % DEFAULT_AVATARS.length];
};

const Avatar = ({ name = "Community member", userId, src, size = "default" }) => {
  const [failedSource, setFailedSource] = useState("");
  return <span className={"member-avatar member-avatar--" + size} aria-hidden="true">
    {src && src !== failedSource ? <img src={src} alt="" width="40" height="40" loading="lazy" onError={() => setFailedSource(src)} /> :
      <GeneratedAvatar name={getDefaultAvatarSeed(userId || name)} variant="beam" size="100%" square />}
  </span>;
};
export default Avatar;

