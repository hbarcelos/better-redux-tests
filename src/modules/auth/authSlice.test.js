import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import reducer, {
  initialState,
  signInStart,
  signInSuccess,
  signInFailure,
  signIn,
  selectIsLoading,
  selectError,
  selectToken,
  selectUserName,
  selectIsAuthenticated,
} from './authSlice';
import api from '../../api';

jest.mock('../../api');

const mockStore = configureMockStore([thunk]);

describe('auth slice', () => {
  describe('reducer, action creators and selectors', () => {
    it('should return the initial state on first run', () => {
      // Arrange
      const nextState = initialState;

      // Act
      const result = reducer(undefined, {});

      // Assert
      expect(result).toEqual(nextState);
    });

    it('should properly set loading and error state when a sign in request is made', () => {
      // Arrange

      // Act
      const nextState = reducer(initialState, signInStart());

      // Assert
      const rootState = { auth: nextState };
      expect(selectIsAuthenticated(rootState)).toEqual(false);
      expect(selectIsLoading(rootState)).toEqual(true);
      expect(selectError(rootState)).toEqual(null);
    });

    it('should properly set loading, error and user information when a sign in request succeeds', () => {
      // Arrange
      const payload = { token: 'this is a token', userName: 'John Doe' };

      // Act
      const nextState = reducer(initialState, signInSuccess(payload));

      // Assert
      const rootState = { auth: nextState };
      expect(selectIsAuthenticated(rootState)).toEqual(true);
      expect(selectToken(rootState)).toEqual(payload.token);
      expect(selectUserName(rootState)).toEqual(payload.userName);
      expect(selectIsLoading(rootState)).toEqual(false);
      expect(selectError(rootState)).toEqual(null);
    });

    it('should properly set loading, error and remove user information when sign in request fails', () => {
      // Arrange
      const error = new Error('Incorrect password');

      // Act
      const nextState = reducer(
        initialState,
        signInFailure({ error: error.message })
      );

      // Assert
      const rootState = { auth: nextState };
      expect(selectIsAuthenticated(rootState)).toEqual(false);
      expect(selectToken(rootState)).toEqual('');
      expect(selectUserName(rootState)).toEqual('');
      expect(selectIsLoading(rootState)).toEqual(false);
      expect(selectError(rootState)).toEqual(error.message);
    });
  });

  describe('thunks', () => {
    it('creates both signInStart and signInSuccess when sign in succeeds', async () => {
      // Arrange
      const credentials = {
        email: 'john.doe@example.com',
        password: 'very secret',
      };
      const responsePayload = {
        token: 'this is a token',
        userName: 'John Doe',
      };
      const store = mockStore(initialState);

      api.signIn.mockResolvedValueOnce(responsePayload);

      // Act
      await store.dispatch(signIn(credentials));

      // Assert
      const expectedActions = [signInStart(), signInSuccess(responsePayload)];
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('creates both signInStart and signInFailure when sign in fails', async () => {
      // Arrange
      const credentials = {
        email: 'john.doe@example.com',
        password: 'wrong passoword',
      };
      const responseError = new Error('Invalid credentials');
      const store = mockStore(initialState);

      api.signIn.mockRejectedValueOnce(responseError);

      // Act
      await store.dispatch(signIn(credentials));

      // Assert
      const expectedActions = [
        signInStart(),
        signInFailure({ error: responseError }),
      ];
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
