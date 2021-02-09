import { queryType, makeSchema, objectType, mutationType, nonNull, stringArg, arg, declarativeWrappingPlugin, list } from '@nexus/schema';
import { transformSchemaFederation } from 'graphql-transform-federation';
import { nexusPrisma } from 'nexus-plugin-prisma';
import { GraphQLSchema } from 'graphql';
import path from 'path';

const GroupProduct = objectType({
    name: 'GroupProduct',
    definition(t) {
        t.string('id')
    }
})

const ProductGroup = objectType({
    name: 'ProductGroup',
    definition(t) {
        t.string('id');
        t.string('name');
        t.list.field('products', {
            type: 'GroupProduct',
        })
    }
});

const Query = queryType({
    definition(t) {
        t.list.field('productGroups', {
            type: 'ProductGroup',
            async resolve(_parent, _args, ctx) {
                return ctx.prisma.productGroup.findMany({
                    include: { products: true },

                });
            }
        });
    },

});

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
        types: [Query, ProductGroup, GroupProduct, Mutation],
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
        ProductGroup: {
            keyFields: ['id'],
            fields: {
                products: {
                    external: true,
                    provides: 'id'
                }
            },
        }
    });
}