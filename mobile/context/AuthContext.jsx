import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// ─── Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Reducer ──────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // true on startup to check stored session
};

// ─── Provider ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from AsyncStorage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('techline_token');
        const userStr = await AsyncStorage.getItem('techline_user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch({ type: 'RESTORE_SESSION', payload: { token, user } });
        } else {
          dispatch({ type: 'RESTORE_SESSION', payload: { token: null, user: null } });
        }
      } catch {
        dispatch({ type: 'RESTORE_SESSION', payload: { token: null, user: null } });
      }
    };
    restoreSession();
  }, []);

  // ── Auth Actions ──────────────────────────────────────────────────────
  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, data: user } = response.data;

      await AsyncStorage.setItem('techline_token', token);
      await AsyncStorage.setItem('techline_user', JSON.stringify(user));

      dispatch({ type: 'LOGIN', payload: { token, user } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token, data: user } = response.data;

      await AsyncStorage.setItem('techline_token', token);
      await AsyncStorage.setItem('techline_user', JSON.stringify(user));

      dispatch({ type: 'LOGIN', payload: { token, user } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('techline_token');
    await AsyncStorage.removeItem('techline_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      const updatedUser = response.data.data;

      // Update stored user data
      await AsyncStorage.setItem('techline_user', JSON.stringify({ ...state.user, ...updatedUser }));
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile.';
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ──────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
