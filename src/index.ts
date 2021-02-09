import { ApolloServer } from 'apollo-server';

// we'll create these in a second!
import { buildNexusFederatedSchema } from './schema';
import { createContext } from './context';

buildNexusFederatedSchema().then(schema => {
  const apolloServer = new ApolloServer({
    context: createContext,
    schema,
    tracing: process.env.NODE_ENV === 'development'
  });
  
  apolloServer.listen(80, () => {
      console.log('Listening on 80');
  })
});