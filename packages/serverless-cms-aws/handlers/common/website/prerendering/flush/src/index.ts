import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import flushPlugins from "@webiny/api-prerendering-service-aws/flush/flush";
import flushAwsPlugins from "@webiny/api-prerendering-service-aws/flush";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        createLogger({
            documentClient
        }),
        flushPlugins({
            storage: {
                name: String(process.env.DELIVERY_BUCKET)
            },
            website: {
                url: String(process.env.APP_URL)
            },
            meta: {
                // TODO Add proper typing.
                cloudfront: {
                    distributionId: String(process.env.DELIVERY_CLOUDFRONT)
                }
            },
            storageOperations: createPrerenderingServiceStorageOperations({
                table(table) {
                    return {
                        ...table,
                        name: String(process.env.DB_TABLE)
                    };
                },
                documentClient
            })
        }),
        flushAwsPlugins()
    ]
});
