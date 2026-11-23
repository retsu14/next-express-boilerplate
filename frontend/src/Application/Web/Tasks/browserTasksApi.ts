import { createTasksApi } from "@/Domain/Tasks/Api/TasksApi";
import { publicConfig } from "@/Support/Config/publicConfig";

/** Tasks API client for code that runs in the browser. */
export const browserTasksApi = createTasksApi(publicConfig.apiUrl);
