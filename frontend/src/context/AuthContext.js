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
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setFirebaseUser(user);
        const token = await user.getIdToken();
        try {
          // Lấy user từ backend
          const response = await authApi.getMe(token);
          setAppUser(response.data);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // User đã auth với Firebase nhưng chưa có trong DB (user mới)
            setAppUser(null);
          } else {
            // Lỗi 500 hoặc lỗi mạng, coi như logout
            console.error("Lỗi nghiêm trọng khi gọi getMe:", error);
            setFirebaseUser(null);
            setAppUser(null);
          }
        }
      } else {
        // Không có user (đã logout)
        setFirebaseUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    // Cleanup listener khi component unmount
    return () => unsubscribe();
  }, []);

  const loginLocal = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerLocal = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => {
        sendEmailVerification(userCredential.user);
      }
    );
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Lỗi đăng nhập Google:", error);
      }
    }
  };

  const loginWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        return;
      }

      if (error.code === "auth/account-exists-with-different-credential") {
        try {
          const email = error.customData.email;
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (!methods || methods.length === 0) {
            alert(
              "Email này hiện tại đã được chuyển giao sang cho google. Vui lòng đăng nhập bằng google."
            );
            return;
          }
        } catch (fetchError) {
          console.error("Lỗi khi kiểm tra provider:", fetchError);
          alert("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
      } else {
        console.error("Lỗi đăng nhập Facebook:", error);
      }
    }
  };

  const sendPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
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
    sendPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
