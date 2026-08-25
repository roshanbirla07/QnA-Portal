import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import RichTextEditor from "./RichTextEditor";
import { publishingApi } from "../../../services/publishing.api";
import "./publishing.css";

const PostComposer = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("question");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (status) => {
    if (!title.trim() || !content.trim()) return toast.error("Title and content are required");
    setSaving(true);
    try {
      const payload = {
        type,
        title,
        subtitle: type === "article" ? subtitle : undefined,
        content: { format: "markdown", value: content },
        contentText: content,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        status,
      };
      const res = await publishingApi.createPost(payload);
      const post = res.data?.data;
      toast.success(status === "published" ? "Published" : "Draft saved");
      navigate(post?.slug ? `/posts/${post.slug}` : "/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="composer-shell">
      <div className="composer-topline"><span>Create</span><div><button disabled={saving} onClick={() => submit("draft")}>Save draft</button><button className="publish-action" disabled={saving} onClick={() => submit("published")}>Publish</button></div></div>
      <div className="composer-type">
        <button className={type === "question" ? "active" : ""} onClick={() => setType("question")}>Ask a question</button>
        <button className={type === "article" ? "active" : ""} onClick={() => setType("article")}>Write an article</button>
      </div>
      <input className="composer-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "question" ? "What do you want to ask?" : "Article title"} />
      {type === "article" && <input className="composer-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Add a subtitle" />}
      <RichTextEditor value={content} onChange={setContent} placeholder={type === "question" ? "Explain the problem, what you tried, logs, and code…" : "Share your ideas, examples, code, and conclusions…"} />
      <input className="composer-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags separated by commas: javascript, kafka, system-design" />
    </main>
  );
};

export default PostComposer;
