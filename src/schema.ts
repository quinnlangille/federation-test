import { queryType, makeSchema, objectType, mutationType, stringArg, declarativeWrappingPlugin, list, nonNull } from '@nexus/schema';
import { transformSchemaFederation } from 'graphql-transform-federation';
import { nexusPrisma } from 'nexus-plugin-prisma';
import { GraphQLSchema } from 'graphql';
import path from 'path';

const Product = objectType({
    name: 'Product',
    definition(t) {
        t.field('id', {
            type: nonNull('ID')
        })
    }
});

const ProductHit = objectType({
    name: 'ProductHit',
    nonNullDefaults: { output: false, input: false },
    definition(t) {
        t.field('doc', {
            type: "Product",
        })
    }
});

const ProductSearchResults = objectType({
    name: 'ProductSearchResults',
    definition(t) {
        t.list.field('hits', {
            type: nonNull('ProductHit'),
        })
    }
});

const ProductGroup = objectType({
    name: 'ProductGroup',
    definition(t) {
        t.string('id')
        t.string('name')
        t.field('products', {
            type: 'ProductSearchResults'
        })
    }
});

/*
   For Product Groups, we want to first get a list of productIds from the collection service. We then send that list of ids to ms-product, where we fetch 
   the products + return them as ProductSearchResults (we need aggs/meta data for product groups)

   Our first thought is to pass the expected args to the product resovler, 
   but since we're extending the type in the collection service, we'll need to define them here. 
    
    ex: the query would ideally look like: 
        productGroups {
           products(language: EN, country: "CA", filters: [], ...restOfproductArgs) { 
              aggs { ... }
              hits { 
                  doc { name }
              }
              meta { ... }
           }
        }
    
    We'll never use any of these args in the collection service, so two questions:
    1. How can we get this behaviour without explicitly re-defining the args from the products resolver inside the collection service?
    2. Is there a better way to organize the schema to make the collection service less reliant on the types from ms-product?
*/
const Query = queryType({
    definition(t) {
        t.list.field('productGroups', {
            type: 'ProductGroup',
            async resolve(_parent, _args, ctx) {
                const groups = await ctx.prisma.productGroup.findMany({
                    include: { products: true },
                });
            
                // mapping here to return the expected for productGroup.products
                const mapped = groups.map(g => {
                    return {
                        id: g.id,
                        name: g.name,
                        products: {
                            hits: g.products.map(product => ({ doc: { id: product.id } }) )
                        }
                    }
                });
            
                return mapped;
            }
        });
    },

});

// Just added this mutation to add test data, we won't actually use this in production
const Mutation = mutationType({
    definition(t) {
        t.field('productGroups', {
            type: 'ProductGroup',
            args: {
                productIds: list(stringArg({
                    description: 'A list of product Ids inside a product group'
                })),
                group_name: stringArg({
                    description: 'The name of the product group'
                })
            },
            resolve(_parent, { productIds, group_name }, ctx) {
                try {
                    return ctx.prisma.productGroup.create({
                        data: {
                            name: group_name,
                            products: {
                                connectOrCreate: productIds.map((id) => ({
                                    where: { id },
                                    create: { id }
                                }))
                            }
                        }
                    }
                    );
                } catch (e) {
                    throw e;
                }
            }
        });
    }
});

export async function buildNexusFederatedSchema(
): Promise<GraphQLSchema> {
    const schema = makeSchema({
        types: [Mutation, Product, ProductGroup, ProductHit, ProductSearchResults, Query],
        plugins: [<any>nexusPrisma({ experimentalCRUD: true }), declarativeWrappingPlugin()],
        outputs: {
            typegen: path.join(process.cwd(), 'generated', 'nexus-typegen.ts'),
            schema: path.join(process.cwd(), 'generated', 'schema.graphql')
        },
        typegenAutoConfig: {
            contextType: 'Context.Context',
            sources: [
                {
                    source: '@prisma/client',
                    alias: 'prisma'
                },
                {
                    source: path.join(process.cwd(), 'src', 'context.ts'),
                    alias: 'Context'
                }
            ]
        }
    });

    return transformSchemaFederation(schema, {
        Query: {
            extend: true,
        },
        Product: {
            extend: true,
            fields: {
                id: {
                    external: true,
                }
            }
        },
        ProductSearchResults: {
            extend: true,
            fields: {
                hits: {
                    external: true,
                    provides: "hits { doc { id }}",
                }
            }
        },
        ProductHit: {
            extend: true,
            fields: {
                doc: {
                    external: true,
                }
            }
        },
        ProductGroup: {
            keyFields: ['id'],
        }
    });
}