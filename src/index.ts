import { ApolloServer } from 'apollo-server';
import { createContext } from './context';
import { buildNexusFederatedSchema } from './schema';

buildNexusFederatedSchema().then(schema => {
  const apolloServer = new ApolloServer({
    context: createContext,
    schema,
    tracing: process.env.NODE_ENV === 'development'
  });
  
  apolloServer.listen(80, () => {
      console.log('Listening on 80');
  });
});