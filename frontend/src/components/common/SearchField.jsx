import React, { useRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const SearchField = ({ value, onChange, label = "Search the community", placeholder, id }) => {
  const input = useRef(null);
  return <div className="search-field">
    <FiSearch aria-hidden="true" />
    <input ref={input} id={id} type="search" aria-label={label} placeholder={placeholder}
      value={value} onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} />
    {value && <button type="button" className="search-clear" aria-label={"Clear " + label.toLowerCase()}
      onClick={() => { onChange(""); input.current?.focus(); }}><FiX aria-hidden="true" /></button>}
  </div>;
};
export default SearchField;

