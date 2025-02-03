import { init, ready, register } from "azure-devops-extension-sdk";
import { ActionContext, taskEntryPoint } from "./task/index";

async function initialize(): Promise<void> {
  try {
    await init();
    await ready();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error initializing the Azure DevOps SDK:", error);
  }
}

const createChildTask = {
  async execute(actionContext: ActionContext): Promise<void> {
    await taskEntryPoint(actionContext);
  },
};

initialize();

register("create-child-task-work-item-button", () => createChildTask);
