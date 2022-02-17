import get from "lodash/get";
import { useQuery, useMutation } from "@apollo/react-hooks";
import {
    CREATE_CHANGE_REQUEST_MUTATION,
    GET_CHANGE_REQUEST_QUERY,
    LIST_CHANGE_REQUESTS_QUERY,
    DELETE_CHANGE_REQUEST_MUTATION,
    UPDATE_CHANGE_REQUEST_MUTATION
} from "../graphql/changeRequest.gql";
import { useSnackbar } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
import { useContentReviewId, useCurrentStepId } from "~/admin/hooks/useContentReviewId";
import { ApwChangeRequest } from "~/types";
import { GET_CONTENT_REVIEW_QUERY } from "~/admin/views/contentReviewDashboard/hooks/graphql";

interface UseChangeRequestParams {
    id?: string;
}

interface UseChangeRequestResult {
    create: Function;
    update: Function;
    deleteChangeRequest: (id: string) => Promise<any>;
    changeRequest: ApwChangeRequest;
    markResolved: (resolved: boolean) => Promise<void>;
}

export const useChangeRequest = ({ id }: UseChangeRequestParams): UseChangeRequestResult => {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { encodedId: stepId } = useCurrentStepId();
    const { encodedId, id: contentReviewId } = useContentReviewId();

    const step = `${contentReviewId}#${stepId}`;

    const getQuery = useQuery(GET_CHANGE_REQUEST_QUERY, {
        variables: { id },
        skip: !id,
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                history.push(`/apw/content-reviews/${encodedId}/${stepId}`);
            }
        }
    });

    const [create] = useMutation(CREATE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [
            {
                query: LIST_CHANGE_REQUESTS_QUERY,
                variables: { where: { step } }
            },
            { query: GET_CONTENT_REVIEW_QUERY, variables: { id: contentReviewId } }
        ],
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            const { id } = get(response, "apw.changeRequest.data");
            showSnackbar("Change request created successfully!");
            history.push(`/apw/content-reviews/${encodedId}/${stepId}/${encodeURIComponent(id)}`);
        }
    });

    const [update] = useMutation(UPDATE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [{ query: LIST_CHANGE_REQUESTS_QUERY, variables: { where: { step } } }],
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            const { id } = get(response, "apw.changeRequest.data");
            showSnackbar("Change request updated successfully!");
            history.push(`/apw/content-reviews/${encodedId}/${stepId}/${encodeURIComponent(id)}`);
        }
    });

    const [deleteChangeRequest] = useMutation(DELETE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [
            {
                query: LIST_CHANGE_REQUESTS_QUERY,
                variables: { where: { step } }
            },
            { query: GET_CONTENT_REVIEW_QUERY, variables: { id: contentReviewId } }
        ],
        onCompleted: response => {
            const error = get(response, "apw.deleteChangeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Change request deleted successfully!");

            history.push(`/apw/content-reviews/${encodedId}/${stepId}`);
        }
    });

    const [updateMutation] = useMutation(UPDATE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [
            { query: LIST_CHANGE_REQUESTS_QUERY },
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: { id: contentReviewId }
            }
        ],
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            const { title, resolved } = get(response, "apw.changeRequest.data");
            showSnackbar(
                `Successfully marked "${title}" as ${resolved ? "resolved" : "unresolved"}!`
            );
        }
    });

    const markResolved = async (resolved: boolean) => {
        await updateMutation({ variables: { id, data: { resolved } } });
    };

    return {
        create,
        update,
        deleteChangeRequest: async id => deleteChangeRequest({ variables: { id } }),
        changeRequest: get(getQuery, "data.apw.getChangeRequest.data"),
        markResolved
    };
};

export const useChangeRequestStep = (): string => {
    const { encodedId: stepId } = useCurrentStepId();
    const { id: contentReviewId } = useContentReviewId();

    return `${contentReviewId}#${stepId}`;
};
