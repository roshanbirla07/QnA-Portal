import "./App.css";
import { Home, MyPending, MyPosts, QuestionForm, QuestionPage } from "./components/features/questions";
import { SignUp, Login } from "./components/features/auth";
import { Navbar } from "./components/layout";
import { PrivateRoute } from "./components/common";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
// import OpenRoute from './components/Auth/OpenRoute.jsx';
function App() {
  const { token } = useAuth();
  console.log(token);
  return (
    <>
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
        <Route
          path="/pendings"
          element={
            // <PrivateRoute>
            <MyPending />
            // </PrivateRoute>
          }
        />
        <Route
          path="/myposts"
          element={
            // <PrivateRoute>
            <MyPosts />
            // </PrivateRoute>
          }
        />

        <Route
          path="/login"
          element={
            // <PrivateRoute>
            <Login />
            // </PrivateRoute>
          }
        />
        <Route
          path="/signup"
          element={
            // <PrivateRoute>
            <SignUp />
            // </PrivateRoute>
          }
        />
        <Route
          path="/question"
          element={
            // <PrivateRoute>
            <QuestionPage />
            // </PrivateRoute>
          }
        />

        <Route
          path="/submitquestion"
          element={
            // <PrivateRoute>
            <QuestionForm />
            // </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
