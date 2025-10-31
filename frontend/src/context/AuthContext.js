import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase.config.js";
import { authApi } from "../api/authApi.js";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      const currentPath = location.pathname;

      if (user) {
        setFirebaseUser(user);

        const token = await user.getIdToken();

        try {
          const response = await authApi.getMe(token);
          setAppUser(response.data);
          if (currentPath === "/login" || currentPath === "/register") {
            navigate("/");
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setAppUser(null);
            if (currentPath !== "/choose-role") {
              navigate("/choose-role");
            } else {
              console.error("Lỗi khi lấy thông tin user:", error);
            }
          }
        }
      } else {
        setFirebaseUser(null);
        setAppUser(null);
        const publicPages = ["/login", "/register"];
        if (!publicPages.includes(currentPath)) {
          navigate("/login");
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate, location]);

  const loginLocal = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerLocal = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => {
        sendEmailVerification(userCredential.user);
        alert("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      }
    );
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const loginWithFacebook = () => {
    const provider = new FacebookAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const manualReloadFirebaseUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
        return auth.currentUser;
      } catch (error) {
        console.error("Lỗi khi reload user:", error);
      }
    }
  };

  const value = {
    firebaseUser,
    appUser,
    setAppUser,
    loading,
    loginLocal,
    registerLocal,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    manualReloadFirebaseUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
