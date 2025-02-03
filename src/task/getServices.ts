import { CommonServiceIds, IGlobalMessagesService } from "azure-devops-extension-api/Common/CommonServices";
import { getClient } from "azure-devops-extension-api/Common/Client";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import { getService } from "azure-devops-extension-sdk";
import LoggerService from "../utils/LoggerService";
import WorkItemClient from "../utils/WorkItemClient";

import AzureDevOpsDialogService from "../utils/AzureDevOpsDialogService";
import IAzureDevOpsDialogService from "../utils/IAzureDevOpsDialogService";
import ILoggerService from "../utils/ILoggerService";
import WorkItemService from "./templates/WorkItemService";
import TemplateFilter from "./templates/TemplateFilter";
import IWorkItemService from "./templates/IWorkItemService";
import ITemplateFilter from "./templates/ITemplateFilter";
import { IAzureDevOpsContext } from "../utils/IAzureDevOpsContext";
import ChildTemplateCreationService from "./ChildTemplateCreationService";
import IChildTemplateCreationService from "./IChildTemplateCreationService";

/**
 * The services required for the task
 */
export type Services = {
  loggerService: ILoggerService;
  azureDevOpsDialogService: IAzureDevOpsDialogService;
  workItemService: IWorkItemService;
  templateFilter: ITemplateFilter;
  childTemplateCreationService: IChildTemplateCreationService;
};

/**
 * Get the services required for the task
 * @param currentContext the current Azure DevOps context of the task
 * @returns the services required for the task
 */
export async function getServices(currentContext: IAzureDevOpsContext): Promise<Services> {
  const { dialogSvc, workItemTrackingClient } = await getAzureDevOpsServices();
  const azureDevOpsDialogService = new AzureDevOpsDialogService({ dialogService: dialogSvc });

  const workItemClient = new WorkItemClient({
    workItemTrackingClient,
    project: currentContext.project.name,
    team: currentContext.team.name,
  });
  const workItemService = new WorkItemService({ workItemClient });

  const loggerService = new LoggerService();

  const templateFilter = new TemplateFilter({ loggerService });

  const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(currentContext);

  return {
    loggerService,
    azureDevOpsDialogService,
    workItemService,
    templateFilter,
    childTemplateCreationService,
  };
}

/**
 * The Azure DevOps services required for the task
 */
type AzureDevOpsServicesServices = {
  dialogSvc: IGlobalMessagesService;
  workItemTrackingClient: WorkItemTrackingRestClient;
};

/**
 * Get the Azure DevOps services required for the task
 * @returns the services required for the task
 */
async function getAzureDevOpsServices(): Promise<AzureDevOpsServicesServices> {
  const dialogSvc = await getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);

  const workItemTrackingClient = getClient(WorkItemTrackingRestClient);

  return {
    dialogSvc,
    workItemTrackingClient,
  };
}
