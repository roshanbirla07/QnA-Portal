import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LOGOUT_USER } from "../../services/apis";
import { FiHome, FiList, FiUser, FiLogOut, FiMenu, FiX, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import QuestionForm from "../features/questions/QuestionForm";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newPostPopup, setNewPostPopup] = useState(false);

  const logoutUser = async () => {
    try {
      await fetch(LOGOUT_USER, {
        method: "POST",
        credentials: "include",
      });
      console.log("logout successfull");
    } catch (err) {
      console.log(err);
    } finally {
      navigate("/");
    }
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isActive
            ? "bg-primary-purple/20 text-primary-purple font-medium"
            : "text-text-secondary hover:text-text-primary hover:bg-white/5"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <Icon className="text-lg" />
        <span>{children}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-bg-primary/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-blue to-accent-pink bg-clip-text text-transparent">
              QnA Portal
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" icon={FiHome}>Home</NavLink>
              <NavLink to="/myposts" icon={FiList}>My Questions</NavLink>
              <NavLink to="/pendings" icon={FiUser}>Pending</NavLink>
              
              <button
                onClick={() => setNewPostPopup(true)}
                className="ml-4 btn-primary flex items-center gap-2"
              >
                <FiPlus /> Ask Question
              </button>

              <button
                onClick={logoutUser}
                className="ml-2 p-2 text-text-muted hover:text-red-500 transition-colors"
                title="Logout"
              >
                <FiLogOut className="text-xl" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-text-primary p-2"
              >
                {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-bg-secondary border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <NavLink to="/" icon={FiHome}>Home</NavLink>
                <NavLink to="/myposts" icon={FiList}>My Questions</NavLink>
                <NavLink to="/pendings" icon={FiUser}>Pending</NavLink>
                <button
                  onClick={() => {
                    setNewPostPopup(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-4 btn-primary flex justify-center items-center gap-2"
                >
                  <FiPlus /> Ask Question
                </button>
                <button
                  onClick={logoutUser}
                  className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 rounded-lg"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setNewPostPopup(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-lg flex items-center justify-center text-2xl"
        >
          <FiPlus />
        </button>
      </div>

      {newPostPopup && (
        <QuestionForm
          setNewPostPopup={setNewPostPopup}
          newPostPopup={newPostPopup}
        />
      )}
    </>
  );
};

export default Navbar;
