import { createModelField } from "./utils";

const commentBody = () =>
    createModelField({
        label: "Body",
        type: "rich-text",
        parent: "comment"
    });

const changeRequestRef = modelId =>
    createModelField({
        label: "Change Request",
        type: "ref",
        parent: "comment",
        settings: {
            models: [
                {
                    modelId
                }
            ]
        }
    });

const stepField = () =>
    createModelField({
        label: "Step",
        type: "text",
        parent: "comment",
        validation: [
            {
                name: "required",
                message: "Value is required"
            }
        ]
    });

const mediaField = () =>
    createModelField({
        label: "Media",
        type: "file",
        parent: "comment"
    });

export const createCommentModelDefinition = ({ modelId }) => ({
    name: "APW - Comment",
    modelId: "apwCommentModelDefinition",
    titleFieldId: "displayName",
    layout: [["comment_body"], ["comment_displayName"]],
    fields: [commentBody(), changeRequestRef(modelId), stepField(), mediaField()]
});
