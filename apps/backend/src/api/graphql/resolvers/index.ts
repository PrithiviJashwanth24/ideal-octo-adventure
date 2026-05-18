import { authResolvers } from './auth';
import { userResolvers } from './user';
import { wardrobeResolvers } from './wardrobe';
import { outfitResolvers } from './outfit';
import { aiResolvers } from './ai';
import { analyticsResolvers } from './analytics';
import { socialResolvers } from './social';
import { shoppingResolvers } from './shopping';
import { subscriptionResolvers } from './subscriptions';
import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: GraphQLJSON,
  Query: {
    ...userResolvers.Query,
    ...wardrobeResolvers.Query,
    ...outfitResolvers.Query,
    ...aiResolvers.Query,
    ...analyticsResolvers.Query,
    ...socialResolvers.Query,
    ...shoppingResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...wardrobeResolvers.Mutation,
    ...outfitResolvers.Mutation,
    ...aiResolvers.Mutation,
    ...socialResolvers.Mutation,
    ...shoppingResolvers.Mutation,
  },
  Subscription: subscriptionResolvers.Subscription,
  User: userResolvers.User,
  WardrobeItem: wardrobeResolvers.WardrobeItem,
  Outfit: outfitResolvers.Outfit,
};
