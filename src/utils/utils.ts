import { CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api/Common/CommonServices";
import { getClient } from "azure-devops-extension-api/Common/Client";
import { TeamSetting, WorkRestClient } from "azure-devops-extension-api/Work";
import { IWorkItemFormService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingServices";
import { getService } from "azure-devops-extension-sdk";

export async function getActiveWorkItem(): Promise<number | null> {
  const workItemFormService = await getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);

  const hasActiveWorkItem = await workItemFormService.hasActiveWorkItem();
  if (!hasActiveWorkItem) {
    return null;
  }

  return workItemFormService.getId();
}

export async function getADOTeamSettings(team: { name: string; id: string }, project: { name: string; id: string }): Promise<TeamSetting> {
  const workRestClient = getClient(WorkRestClient);
  return workRestClient.getTeamSettings({ project: project.name, projectId: project.id, team: team.name, teamId: team.id });
}

export async function reloadWorkItem(): Promise<void> {
  const workItemFormService = await getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);

  workItemFormService.refresh();
}

export async function reloadPage(): Promise<void> {
  const navigationService = await getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
  navigationService.reload();
}
