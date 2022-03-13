/* eslint-disable no-console */
import { ApolloServer } from 'apollo-server';
import { envelop, useSchema, useTiming } from '@envelop/core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { useExtendedValidation, OneOfInputObjectsRule } from '@envelop/extended-validation';

const schema = makeExecutableSchema({
  typeDefs: /* GraphQL */ `
    directive @oneOf on INPUT_OBJECT | FIELD_DEFINITION 

    input UnionInput @oneOf {
      str1: String
      str2: String
    }

    type Query {
      hello(str1: String, str2: String): String @oneOf
      hi(input: UnionInput!): String
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'hello',
      hi: () => 'hi',
    },
  },
});

const getEnveloped = envelop({
  plugins: [
    useExtendedValidation({
      rules: [OneOfInputObjectsRule],
    }),
    useSchema(schema), 
  ],
});

const server = new ApolloServer({
  schema,
  executor: async requestContext => {
    const { schema, execute, contextFactory } = getEnveloped({ req: requestContext.request.http });

    return execute({
      schema: schema,
      document: requestContext.document,
      contextValue: await contextFactory(),
      variableValues: requestContext.request.variables,
      operationName: requestContext.operationName,
    });
  },
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({ endpoint: '/graphql' })],
});

server.listen(3000);
