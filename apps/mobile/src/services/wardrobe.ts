import * as FileSystem from 'expo-file-system';
import { apolloClient } from './apollo';
import { gql } from '@apollo/client';

const GET_PRESIGNED_URL = gql`
  query PresignedUploadUrl($filename: String!, $contentType: String!) {
    presignedUploadUrl(filename: $filename, contentType: $contentType) {
      uploadUrl
      publicUrl
    }
  }
`;

const ADD_WARDROBE_ITEM = gql`
  mutation AddWardrobeItem($input: AddWardrobeItemInput!) {
    addWardrobeItem(input: $input) {
      id
      name
      category
      imageUrls
    }
  }
`;

export async function uploadImageToS3(localUri: string): Promise<string> {
  const filename = `wardrobe/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { data } = await apolloClient.query({
    query: GET_PRESIGNED_URL,
    variables: { filename, contentType: 'image/jpeg' },
    fetchPolicy: 'network-only',
  });

  const { uploadUrl, publicUrl } = data.presignedUploadUrl;

  const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (uploadResult.status !== 200) {
    throw new Error(`S3 upload failed: ${uploadResult.status}`);
  }

  return publicUrl;
}

export interface AddItemInput {
  name: string;
  category: string;
  brand?: string;
  purchasePrice?: number;
  notes?: string;
  imageUrls: string[];
}

export async function addWardrobeItem(input: AddItemInput) {
  const { data } = await apolloClient.mutate({
    mutation: ADD_WARDROBE_ITEM,
    variables: { input },
    refetchQueries: ['WardrobeItems', 'WardrobeStats'],
  });
  return data.addWardrobeItem;
}
