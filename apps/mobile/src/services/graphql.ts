import { GraphQLClient } from 'graphql-request';
import * as SecureStore from 'expo-secure-store';
import { GRAPHQL_URL, STORAGE_KEYS } from '../constants';

let client: GraphQLClient;

export function getClient(): GraphQLClient {
  if (!client) {
    client = new GraphQLClient(GRAPHQL_URL, {
      headers: async () => {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    });
  }
  return client;
}

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const c = getClient();
  return c.request<T>(query, variables);
}
