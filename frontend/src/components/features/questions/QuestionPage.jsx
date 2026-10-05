import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { FETCH_QUESTION } from "../../../services/apis";
import QuestionDetail from "./QuestionDetail";
const QuestionPage = () => {
 const { questionId } = useParams();
 const [post, setPost] = useState(null), [error, setError] = useState("");
 useEffect(() => {
  let active = true;
  setPost(null); setError("");
  apiConnector("GET", `${FETCH_QUESTION}/${questionId}`).then((response) => { if(active) setPost(response.data.data); }).catch((reason) => { if(active) setError(reason.message); });
  return () => { active = false; };
 }, [questionId]);
 return error ? <main className="p-8" role="alert">{error}</main> : post ? <QuestionDetail post={post} /> : <main className="p-8" role="status">Loading question…</main>;
};
export default QuestionPage;
