import React, { useState } from "react";
import "./App.css";
import { Home, MyPending, MyPosts, QuestionForm, QuestionPage, TopicPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
import AppShell from "./components/layout/AppShell";
import ShareJob from "./components/features/jobs/ShareJob";
import ExpertsPage from "./components/features/experts/ExpertsPage";
import InterviewsPage from "./components/features/companies/InterviewsPage";
import CompanyReviewsPage from "./components/features/companies/CompanyReviewsPage";
import SalaryInsightsPage from "./components/features/companies/SalaryInsightsPage";
import CompaniesPage from "./components/features/companies/CompaniesPage";
import ReferralsPage from "./components/features/jobs/ReferralsPage";
import CommunitiesPage from "./components/features/community/CommunitiesPage";
import ProjectsPage from "./components/features/community/ProjectsPage";
import RankingsPage from "./components/features/community/RankingsPage";
import SearchPage from "./components/features/search/SearchPage";
import SemanticSearchPage from "./components/features/search/SemanticSearchPage";
import KnowledgeAssistantPage from "./components/features/search/KnowledgeAssistantPage";
import PublicPostPage from "./components/features/search/PublicPostPage";
import ConnectionsPage from "./components/features/community/ConnectionsPage";
import JobBoard from "./components/features/jobs/JobBoard";
import { PrivateRoute, OpenRoute } from "./components/common";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Navbar onMenuToggle={() => setMobileOpen((value) => !value)} />
      <AppShell mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics/:slug" element={<TopicPage />} />
        <Route path="/experts" element={<ExpertsPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/reviews" element={<CompanyReviewsPage />} />
        <Route path="/salaries" element={<SalaryInsightsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:slug" element={<CompaniesPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/communities/:slug" element={<CommunitiesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectsPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/semantic-search" element={<SemanticSearchPage />} />
        <Route path="/assistant" element={<KnowledgeAssistantPage />} />
        <Route path="/posts/:slug" element={<PublicPostPage />} />
        <Route path="/connections" element={<PrivateRoute><ConnectionsPage /></PrivateRoute>} />
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
      </AppShell>
    </>
  );
}

export default App;
