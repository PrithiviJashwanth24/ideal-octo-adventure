import * as SecureStore from 'expo-secure-store';
import { gqlRequest } from '../graphql';
import { STORAGE_KEYS } from '../../constants';
import { store } from '../../store';
import { setCredentials, clearCredentials } from '../../store/slices/authSlice';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id email username displayName avatarUrl premiumTier isOnboarded styleDna
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id email username displayName avatarUrl premiumTier isOnboarded styleDna
      }
    }
  }
`;

const REFRESH_MUTATION = `
  mutation Refresh($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      user { id email username displayName avatarUrl premiumTier isOnboarded }
    }
  }
`;

export class AuthService {
  static async register(email: string, password: string, username: string, displayName: string) {
    const data = await gqlRequest<{ register: any }>(REGISTER_MUTATION, {
      input: { email, password, username, displayName },
    });
    await AuthService.persistSession(data.register);
    return data.register;
  }

  static async login(email: string, password: string, deviceId?: string) {
    const data = await gqlRequest<{ login: any }>(LOGIN_MUTATION, {
      input: { email, password, deviceId },
    });
    await AuthService.persistSession(data.login);
    return data.login;
  }

  static async persistSession(session: { accessToken: string; refreshToken: string; user: any }) {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
    store.dispatch(setCredentials(session));
  }

  static async restoreSession(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const data = await gqlRequest<{ refreshToken: any }>(REFRESH_MUTATION, { token: refreshToken });
      await AuthService.persistSession(data.refreshToken);
      return true;
    } catch {
      await AuthService.logout();
      return false;
    }
  }

  static async logout() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    store.dispatch(clearCredentials());
  }
}
