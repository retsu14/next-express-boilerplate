import "server-only";

import { createTasksApi } from "@/Domain/Tasks/Api/TasksApi";
import { serverConfig } from "@/Support/Config/serverConfig";

/** Tasks API client for Server Components (uses the internal API address). */
export const serverTasksApi = createTasksApi(serverConfig.apiUrl);
