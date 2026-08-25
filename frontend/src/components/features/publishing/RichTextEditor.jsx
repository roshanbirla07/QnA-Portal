import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { FiBold, FiCode, FiEye, FiItalic, FiLink, FiList } from "react-icons/fi";

const wrap = (value, start, end = start, fallback = "text") => {
  const selected = value.selection || fallback;
  return `${value.before}${start}${selected}${end}${value.after}`;
};

const RichTextEditor = ({ value, onChange, placeholder = "Start writing…" }) => {
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);

  const apply = (start, end, fallback) => {
    const el = textareaRef.current;
    const from = el?.selectionStart || 0;
    const to = el?.selectionEnd || 0;
    const next = wrap({
      before: value.slice(0, from),
      selection: value.slice(from, to),
      after: value.slice(to),
    }, start, end, fallback);
    onChange(next);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar">
        <button type="button" onClick={() => apply("**", "**", "bold text")} title="Bold"><FiBold /></button>
        <button type="button" onClick={() => apply("_", "_", "italic text")} title="Italic"><FiItalic /></button>
        <button type="button" onClick={() => apply("## ", "", "Heading")} title="Heading">H2</button>
        <button type="button" onClick={() => apply("- ", "", "List item")} title="List"><FiList /></button>
        <button type="button" onClick={() => apply("`", "`", "inlineCode")} title="Inline code"><FiCode /></button>
        <button type="button" onClick={() => apply("\n```javascript\n", "\n```\n", "const value = true;")} title="Code block">{`</>`}</button>
        <button type="button" onClick={() => apply("[", "](https://)", "link text")} title="Link"><FiLink /></button>
        <button type="button" className={preview ? "active" : ""} onClick={() => setPreview((v) => !v)} title="Preview"><FiEye /></button>
      </div>

      {preview ? (
        <div className="rich-editor__preview prose-content">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <SyntaxHighlighter language={match[1]} PreTag="div">
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : <code className={className} {...props}>{children}</code>;
              },
            }}
          >{value || "Nothing to preview yet."}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="rich-editor__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
