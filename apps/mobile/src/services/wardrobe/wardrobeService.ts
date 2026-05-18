import { gqlRequest } from '../graphql';

const WARDROBE_ITEMS_QUERY = `
  query WardrobeItems($category: ClothingCategory, $limit: Int, $offset: Int) {
    wardrobeItems(category: $category, limit: $limit, offset: $offset) {
      id name brand category colorPrimary thumbnailUrl
      wearCount isFavorite isArchived laundryStatus
      versatilityScore confidenceBoost occasionTags styleArchetypes
      images { url isPrimary angle }
      costPerWear lastWornAt purchasePrice emotionalAttachment
    }
  }
`;

const WARDROBE_STATS_QUERY = `
  query WardrobeStats {
    wardrobeStats {
      totalItems totalValue utilizationRate neglectedItemCount
      totalWearEvents avgCostPerWear diversityScore sustainabilityScore closetHealthScore
    }
  }
`;

const ADD_ITEM_MUTATION = `
  mutation AddWardrobeItem($input: AddWardrobeItemInput!) {
    addWardrobeItem(input: $input) {
      id name brand category colorPrimary thumbnailUrl
      wearCount isFavorite laundryStatus versatilityScore
      images { url isPrimary }
    }
  }
`;

const TOGGLE_FAVORITE_MUTATION = `
  mutation ToggleFavorite($id: ID!) {
    toggleFavorite(id: $id) {
      id isFavorite
    }
  }
`;

const UPDATE_LAUNDRY_MUTATION = `
  mutation UpdateLaundry($id: ID!, $status: LaundryStatus!) {
    updateLaundryStatus(id: $id, status: $status) {
      id laundryStatus
    }
  }
`;

export class WardrobeService {
  static async fetchItems(args?: { category?: string; limit?: number; offset?: number }) {
    return gqlRequest<{ wardrobeItems: any[] }>(WARDROBE_ITEMS_QUERY, args);
  }

  static async fetchStats() {
    return gqlRequest<{ wardrobeStats: any }>(WARDROBE_STATS_QUERY);
  }

  static async addItem(input: {
    name: string;
    brand?: string;
    category: string;
    colorPrimary?: string;
    imageUrls: string[];
    purchasePrice?: number;
    notes?: string;
  }) {
    return gqlRequest<{ addWardrobeItem: any }>(ADD_ITEM_MUTATION, { input });
  }

  static async toggleFavorite(id: string) {
    return gqlRequest<{ toggleFavorite: any }>(TOGGLE_FAVORITE_MUTATION, { id });
  }

  static async updateLaundryStatus(id: string, status: string) {
    return gqlRequest<{ updateLaundryStatus: any }>(UPDATE_LAUNDRY_MUTATION, { id, status });
  }
}
