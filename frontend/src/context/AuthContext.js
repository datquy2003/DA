import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
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
import apiClient from "../api/apiClient.js";
import BannedAccountModal from "../components/modals/BannedAccountModal.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);

  const interceptorId = useRef(null);
  const handleUserBanned = async () => {
    if (!isBannedModalOpen) {
      setIsBannedModalOpen(true);
      await signOut(auth);
      setFirebaseUser(null);
      setAppUser(null);
    }
  };

  useEffect(() => {
    interceptorId.current = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response &&
          error.response.status === 403 &&
          error.response.data?.code === "ACCOUNT_BANNED"
        ) {
          await handleUserBanned();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorId.current !== null) {
        apiClient.interceptors.response.eject(interceptorId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let pollingInterval;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setFirebaseUser(user);
        const token = await user.getIdToken();
        try {
          const response = await authApi.getMe(token);
          const userData = response.data;
          if (userData && userData.IsBanned) {
            await handleUserBanned();
            setLoading(false);
            return;
          }
          setAppUser(userData);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setAppUser(null);
          } else {
            console.error("Lỗi nghiêm trọng khi gọi getMe:", error);
            setFirebaseUser(null);
            setAppUser(null);
          }
        }
        pollingInterval = setInterval(async () => {
          const currentToken = await user.getIdToken().catch(() => null);
          if (currentToken) {
            authApi.getMe(currentToken).catch(() => {});
          }
        }, 60000);
      } else {
        setFirebaseUser(null);
        setAppUser(null);
        clearInterval(pollingInterval);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseBannedModal = () => {
    setIsBannedModalOpen(false);
    window.location.href = "/login";
  };

  const loginLocal = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
      }
      throw error;
    }
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
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
        return;
      }
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
      if (error.code === "auth/user-disabled") {
        setIsBannedModalOpen(true);
        return;
      }
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
      <BannedAccountModal
        isOpen={isBannedModalOpen}
        onClose={handleCloseBannedModal}
      />
    </AuthContext.Provider>
  );
};
