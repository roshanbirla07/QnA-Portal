import "./App.css";
import { Home, MyPending, MyPosts, QuestionForm, QuestionPage, TopicPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
import ShareJob from "./components/features/jobs/ShareJob";
import ExpertsPage from "./components/features/experts/ExpertsPage";
import InterviewsPage from "./components/features/companies/InterviewsPage";
import CompanyReviewsPage from "./components/features/companies/CompanyReviewsPage";
import JobBoard from "./components/features/jobs/JobBoard";
import { PrivateRoute, OpenRoute } from "./components/common";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics/:slug" element={<TopicPage />} />
        <Route path="/experts" element={<ExpertsPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/reviews" element={<CompanyReviewsPage />} />
        <Route path="/jobs/share" element={<PrivateRoute><ShareJob /></PrivateRoute>} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/jobs/:jobId" element={<JobBoard />} />
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
