import React from "react";
import Avatar from "./Avatar";
import { FiEye, FiMessageSquare, FiCheck, FiX, FiTrash2, FiEdit2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const QuestionCard = ({ question, isAdmin, isAuthor, onDelete, onEdit, onApprove, onReject, showActions = false }) => {
  const { _id, questionTitle, tags, author, views, answerCount, createdAt, status } = question;
  const timeAgo = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "";
  const authorName = author?.email?.split('@')[0] || author?.displayName || author?.username || "Unknown User";

  return (
    <div className="glass-card p-6 hovered-card transition-all duration-300 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <Link to={`/question/${_id}`} state={{ question }} className="flex-1">
          <h3 className="text-xl font-semibold text-text-primary group-hover:text-primary-blue transition-colors line-clamp-2">
            {questionTitle}
          </h3>
        </Link>
        {status && status !== "approved" && (
          <span className={`text-xs px-2 py-1 rounded-full border ${
            status === "pending" ? "border-yellow-500 text-yellow-500" :
            status === "rejected" ? "border-red-500 text-red-500" : ""
          }`}>
            {status}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tags?.map((tag) => (
          <Link
            key={tag}
            to={`/topics/${encodeURIComponent(tag)}`}
            className="topic-chip"
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-[color:var(--line)] flex items-center justify-between text-text-muted text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar name={authorName} size="small" />
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><FiEye /> {views || 0}</span>
            <span className="flex items-center gap-1.5"><FiMessageSquare /> {answerCount || 0}</span>
          </div>
        </div>
        <span className="text-xs">{timeAgo}</span>
      </div>

      {(showActions || isAdmin || isAuthor) && (
        <div className="mt-4 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {onApprove && <button onClick={() => onApprove(_id)} className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30" title="Approve"><FiCheck /></button>}
          {onReject && <button onClick={() => onReject(_id)} className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30" title="Reject"><FiX /></button>}
          {(isAdmin || isAuthor) && onEdit && <button onClick={() => onEdit(question)} className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30" title="Edit"><FiEdit2 /></button>}
          {(isAdmin || isAuthor) && onDelete && <button onClick={() => onDelete(_id)} className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30" title="Delete"><FiTrash2 /></button>}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
