import "./App.css";
import "./components/features/publishing/reader.css";
import { MyPending, MyPosts, QuestionForm, QuestionPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
import { PrivateRoute, OpenRoute } from "./components/common";
import PublishingHome from "./components/features/publishing/PublishingHome";
import PostComposer from "./components/features/publishing/PostComposer";
import PostDetail from "./components/features/publishing/PostDetail";
import Bookmarks from "./components/features/publishing/Bookmarks";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<PublishingHome />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route path="/write" element={<PrivateRoute><PostComposer /></PrivateRoute>} />
        <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
        <Route path="/pendings" element={<PrivateRoute><MyPending /></PrivateRoute>} />
        <Route path="/myposts" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
        <Route path="/login" element={<OpenRoute><Login /></OpenRoute>} />
        <Route path="/signup" element={<OpenRoute><SignUp /></OpenRoute>} />
        <Route path="/question/:questionId?" element={<PrivateRoute><QuestionPage /></PrivateRoute>} />
        <Route path="/submitquestion" element={<PrivateRoute><QuestionForm /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
