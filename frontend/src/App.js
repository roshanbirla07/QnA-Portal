import "./App.css";
import { Home, MyPending, MyPosts, QuestionForm, QuestionPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
import { PrivateRoute } from "./components/common";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  const { token } = useAuth();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      {token !== null && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route path="/pendings" element={<MyPending />} />
        <Route path="/myposts" element={<MyPosts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/submitquestion" element={<QuestionForm />} />
      </Routes>
    </>
  );
}

export default App;
