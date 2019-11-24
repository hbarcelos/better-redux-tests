import { createSlice, createSelector } from '@reduxjs/toolkit';
import api from '../../api';

export const initialState = {
  isLoading: false,
  user: {
    userName: '',
    token: '',
  },
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signInStart(state, action) {
      state.isLoading = true;
      state.error = null;
    },
    signInSuccess(state, action) {
      const { token, userName } = action.payload;

      state.user = { token, userName };
      state.isLoading = false;
      state.error = null;
    },
    signInFailure(state, action) {
      const { error } = action.payload;

      state.error = error;
      state.user = {
        userName: '',
        token: '',
      };
      state.isLoading = false;
    },
  },
});

export const { signInStart, signInSuccess, signInFailure } = authSlice.actions;

export default authSlice.reducer;

export const signIn = ({ email, password }) => async dispatch => {
  dispatch(signInStart());

  try {
    const { token, userName } = await api.signIn({
      email,
      password,
    });
    dispatch(signInSuccess({ token, userName }));
  } catch (error) {
    dispatch(signInFailure({ error }));
  }
};

export const selectToken = state => state.auth.user.token;
export const selectUserName = state => state.auth.user.userName;
export const selectError = state => state.auth.error;
export const selectIsLoading = state => state.auth.isLoading;
export const selectIsAuthenticated = createSelector(
  [selectToken],
  token => token !== ''
);
