import { createImportFromUrlControllerTask } from "~/tasks";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { CmsImportExportFileType, Context, ICmsImportExportValidatedFile } from "~/types";
import { useHandler } from "~tests/helpers/useHandler";
import {
    ResponseDoneResult,
    ResponseErrorResult,
    TaskDataStatus,
    TaskResponseStatus
} from "@webiny/tasks";
import { categoryModel } from "~tests/helpers/models";
import { NonEmptyArray } from "@webiny/api/types";

describe("import from url controller", () => {
    let context: Context;

    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();
    });

    it("should run the task and fail because of missing model", async () => {
        const definition = createImportFromUrlControllerTask();

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {},
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "MISSING_MODEL_ID",
                message: `Missing "modelId" in the input.`,
                data: {
                    input: {}
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of missing files", async () => {
        const definition = createImportFromUrlControllerTask();

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId
            },
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "NO_FILES_FOUND",
                message: `No files found in the provided data.`,
                data: {
                    input: {
                        modelId: categoryModel.modelId
                    }
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task and fail because of non-existing model", async () => {
        const definition = createImportFromUrlControllerTask();

        const modelId = "nonExistingModelId";

        const files: NonEmptyArray<ICmsImportExportValidatedFile> = [
            {
                get: "https://some-url.com/file-1.we.zip",
                head: "https://some-url.com/file-1.we.zip",
                size: 1000,
                error: undefined,
                type: CmsImportExportFileType.ENTRIES,
                checksum: "checksum",
                checked: true,
                key: "file-1.we.zip"
            }
        ];

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId,
                files
            },
            name: "Import from URL Controller"
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            ...task
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            error: {
                code: "MODEL_NOT_FOUND",
                message: `Model "${modelId}" not found.`,
                data: {
                    input: {
                        modelId,
                        files
                    }
                }
            },
            status: TaskResponseStatus.ERROR,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id
        });
    });

    it("should run the task, trigger child tasks and return a continue response", async () => {
        expect.assertions(3);
        const definition = createImportFromUrlControllerTask();

        const files: NonEmptyArray<ICmsImportExportValidatedFile> = [
            {
                get: "https://some-url.com/file-1.we.zip",
                head: "https://some-url.com/file-1.we.zip",
                size: 1000,
                error: undefined,
                type: CmsImportExportFileType.ENTRIES,
                checksum: "checksum",
                checked: true,
                key: "file-1.we.zip"
            },
            {
                get: "https://some-url.com/file-2.wa.zip",
                head: "https://some-url.com/file-2.wa.zip",
                size: 1250,
                error: undefined,
                type: CmsImportExportFileType.ASSETS,
                checksum: "checksum",
                checked: true,
                key: "file-2.wa.zip"
            },
            {
                get: "https://some-url.com/file-3.unknown.zip",
                head: "https://some-url.com/file-3.unknown.zip",
                size: 2000,
                error: undefined,
                type: "unknown" as CmsImportExportFileType.ENTRIES,
                checksum: "checksum",
                checked: true,
                key: "something-unknown.zip"
            }
        ];

        const task = await context.tasks.createTask({
            definitionId: definition.id,
            input: {
                modelId: categoryModel.modelId,
                files
            },
            name: "Import from URL Controller"
        });

        console.warn = jest.fn();

        const runner = createRunner({
            context,
            task: definition,
            onContinue: async ({ taskId, iteration, result }) => {
                if (iteration === 1) {
                    return;
                }
                const children = await context.tasks.listTasks({
                    where: {
                        parentId: taskId
                    },
                    limit: 1000000
                });
                for (const child of children.items) {
                    await context.tasks.updateTask(child.id, {
                        taskStatus: TaskDataStatus.SUCCESS
                    });
                }
                /**
                 * This is a strange expect, but we can do it as we know that it will happen due to the
                 * continue result on the first iteration of the runner.
                 */
                // assertion #1
                expect(result).toMatchObject({
                    status: TaskResponseStatus.CONTINUE,
                    locale: "en-US",
                    tenant: "root",
                    webinyTaskDefinitionId: definition.id,
                    webinyTaskId: task.id,
                    input: {
                        modelId: categoryModel.modelId,
                        files: files.map(file => {
                            const output = {
                                ...file
                            };
                            delete output.error;
                            return output;
                        }),
                        steps: {
                            download: {
                                triggered: true
                            }
                        }
                    },
                    message: undefined,
                    delay: -1
                });
            }
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toEqual({
            message: undefined,
            output: {
                aborted: [],
                done: [],
                failed: [],
                files: [],
                invalid: []
            },
            locale: "en-US",
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "importFromUrlController",
            webinyTaskId: expect.any(String)
        });

        // assertion #2
        expect(result).toEqual({
            status: TaskResponseStatus.DONE,
            locale: "en-US",
            tenant: "root",
            webinyTaskDefinitionId: definition.id,
            webinyTaskId: task.id,
            output: {
                aborted: [],
                done: [],
                failed: [],
                invalid: [],
                files: []
            },
            message: undefined
        });

        // assertion #3
        expect(result).toBeInstanceOf(ResponseDoneResult);
    });
});