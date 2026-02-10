import "./App.css";
import { Home, MyPending, MyPosts, QuestionForm, QuestionPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
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
        <Route path="/pendings" element={<PrivateRoute><MyPending /></PrivateRoute>} />
        <Route path="/myposts" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
        <Route path="/login" element={<OpenRoute><Login /></OpenRoute>} />
        <Route path="/signup" element={<OpenRoute><SignUp /></OpenRoute>} />
        <Route path="/question" element={<PrivateRoute><QuestionPage /></PrivateRoute>} />
        <Route path="/submitquestion" element={<PrivateRoute><QuestionForm /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
