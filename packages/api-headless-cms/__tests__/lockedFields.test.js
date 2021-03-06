import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/lockedFields";

describe("Used fields", () => {
    const { database, environment } = useContentHandler();
    const ids = { environment: mdbid(), contentModelGroup: mdbid() };

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        await database.collection("CmsEnvironment").insert({
            id: ids.environment,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });

        await database.collection("CmsContentModelGroup").insert({
            id: ids.contentModelGroup,
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: "fas/star",
            environment: ids.environment
        });
    });

    it("must mark fields as used and prevent changes on it, as soon as the first entry is saved", async () => {
        const { content, createContentModel, getContentModel, updateContentModel } = environment(
            ids.environment
        );

        // 1. Create a content model with a single "title" field.
        let contentModel = await createContentModel(
            mocks.withTitleFieldOnly({ contentModelGroupId: ids.contentModelGroup })
        );

        expect(contentModel.lockedFields).toEqual([]);

        // 2. Create a new product entry.
        const products = await content("product");

        await products.create({
            data: mocks.createProduct
        });

        contentModel = await getContentModel({
            id: contentModel.id
        });

        expect(contentModel.lockedFields).toEqual([
            {
                fieldId: "someId",
                multipleValues: false,
                type: "text"
            },
            {
                fieldId: "title",
                multipleValues: false,
                type: "text"
            }
        ]);

        // 3. Let's try to remove the field. An error should be thrown because it's used.
        let error;
        try {
            await updateContentModel(
                mocks.tryToRemoveTitleField({ contentModelId: contentModel.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot remove the field "title" because it's already in use in created content.`
        );
    });
});
