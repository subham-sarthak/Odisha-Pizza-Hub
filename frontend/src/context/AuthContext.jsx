import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authApi } from "../api";
import { registerAuthFailureHandler, registerAuthRefreshHandler, registerCsrfTokenLoader } from "../api/client";

const AuthContext = createContext(null);

const clearStoredSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("csrfToken");
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("accessToken") || localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [csrfToken, setCsrfToken] = useState(localStorage.getItem("csrfToken"));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const refreshPromiseRef = useRef(null);

  const saveAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("accessToken", nextToken);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
  };

  const fetchCsrfToken = async (forceRefresh = false) => {
    if (!forceRefresh && csrfToken) {
      return csrfToken;
    }

    const { data } = await authApi.csrfToken();
    const nextCsrfToken = data.data.csrfToken;
    setCsrfToken(nextCsrfToken);
    localStorage.setItem("csrfToken", nextCsrfToken);
    return nextCsrfToken;
  };

  const refreshToken = async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = authApi
      .refreshToken()
      .then(({ data }) => {
        const nextAccessToken = data.data.accessToken;
        const nextUser = data.data.user;
        saveAuth(nextAccessToken, nextUser);
        return nextAccessToken;
      })
      .catch((error) => {
        logout();
        throw error;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  };

  const login = async (credentials, expectedRole) => {
    await fetchCsrfToken();
    const { data } = await authApi.login(credentials);
    const nextUser = data.data.user;
    if (expectedRole && nextUser.role !== expectedRole) {
      throw new Error(`This account is not allowed on the ${expectedRole} login page.`);
    }
    saveAuth(data.data.accessToken, nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    await fetchCsrfToken();
    const { data } = await authApi.register(payload);
    return data.data;
  };

  const requestOtp = async (email) => {
    await fetchCsrfToken();
    const { data } = await authApi.sendOtp({ email });
    return data.data;
  };

  const verifyOtp = async ({ email, otp }, expectedRole) => {
    await fetchCsrfToken();
    const { data } = await authApi.verifyOtp({ email, otp });
    const nextUser = data.data.user;
    if (expectedRole && nextUser.role !== expectedRole) {
      throw new Error(`This account is not allowed on the ${expectedRole} login page.`);
    }
    saveAuth(data.data.accessToken, nextUser);
    return nextUser;
  };

  const logoutUser = async () => {
    try {
      await fetchCsrfToken();
      await authApi.logout();
    } catch (_error) {
      // Client-side cleanup still needs to happen if the backend cookie is already gone.
    } finally {
      logout();
    }
  };

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      try {
        if (!csrfToken) {
          try {
            await fetchCsrfToken();
          } catch (_csrfError) {
            // Do not force logout on initial CSRF fetch failure.
          }
        }

        if (!token) {
          return;
        }

        try {
          const { data } = await authApi.me();
          if (!ignore) {
            setUser(data.data);
          }
        } catch (_meError) {
          try {
            await refreshToken();
            const { data } = await authApi.me();
            if (!ignore) {
              setUser(data.data);
            }
          } catch (_refreshError) {
            if (!ignore) {
              logout();
            }
          }
        }
      } finally {
        if (!ignore) {
          setIsAuthLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    registerAuthRefreshHandler(refreshToken);
    registerAuthFailureHandler(logout);
    registerCsrfTokenLoader(fetchCsrfToken);

    return () => {
      registerAuthRefreshHandler(null);
      registerAuthFailureHandler(null);
      registerCsrfTokenLoader(null);
    };
  }, [token, csrfToken]);

  return (
    <AuthContext.Provider
      value={{
        token,
        accessToken: token,
        user,
        csrfToken,
        isAuthenticated: Boolean(token),
        isAuthLoading,
        saveAuth,
        login,
        register,
        requestOtp,
        verifyOtp,
        refreshToken,
        fetchCsrfToken,
        logout: logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
