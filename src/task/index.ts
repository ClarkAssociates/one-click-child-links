import { ready } from "azure-devops-extension-sdk";
import { getServices } from "./getServices";
import CreateChildLinksTask from "./CreateChildLinksTask";
import { getActiveWorkItem, reloadPage, reloadWorkItem } from "../utils/utils";
import AzureDevOpsContext from "../utils/AzureDevOpsContext";

export type ActionContext = {
  id: number;
  workItemIds: number[];
};

// eslint-disable-next-line import/prefer-default-export
export async function taskEntryPoint({ id, workItemIds }: ActionContext): Promise<void> {
  await ready();

  const currentContext = new AzureDevOpsContext();

  const { azureDevOpsDialogService, ...services } = await getServices(currentContext);
  azureDevOpsDialogService.SendDialogMessage("Creating Childs Links");

  const task = new CreateChildLinksTask(services);

  const activeWorkItemId = await getActiveWorkItem();

  try {
    if (activeWorkItemId) {
      await task.runTask(activeWorkItemId);

      reloadWorkItem();
    } else if (id) {
      await task.runTask(id);

      reloadPage();
    } else if (workItemIds && workItemIds.length > 0) {
      await Promise.all(workItemIds.map((workItemId) => task.runTask(workItemId)));
    }

    azureDevOpsDialogService.SendDialogMessage("Childs Links Successfully Created");
  } catch (error) {
    const message = error instanceof Error ? error : String(error);
    services.loggerService.writeError(message);

    azureDevOpsDialogService.SendErrorOccurredMessage();
  }
}
