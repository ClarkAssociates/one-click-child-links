import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import pLimit from "p-limit";
import { retry, handleAll, ExponentialBackoff } from "cockatiel";
import IWorkItemClient, { WorkItemRelation, WorkItemType } from "./IWorkItemClient";
import { Template, TemplateReference } from "../common/templates";
import { WorkItem } from "../common/workitem";

type workItemClientArgsProps = {
  workItemTrackingClient: WorkItemTrackingRestClient;
  project: string;
  team: string;
};

export default class WorkItemClient implements IWorkItemClient {
  private static readonly limit = pLimit(50);

  private static readonly retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff(),
  });

  private readonly workItemTrackingClient: WorkItemTrackingRestClient;

  private readonly project: string;

  private readonly team: string;

  constructor({ workItemTrackingClient, project, team }: workItemClientArgsProps) {
    this.workItemTrackingClient = workItemTrackingClient;
    this.project = project;
    this.team = team;
  }

  private async callAsyncWithLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
    return WorkItemClient.limit(async () => WorkItemClient.retryPolicy.execute(async () => fn()));
  }

  async createWorkItem(workItemFields: Record<string, unknown>, type: string, relations?: WorkItemRelation[]): Promise<WorkItem> {
    const workItem = Object.entries(workItemFields).map(([field, value]) => ({
      op: "add",
      path: `/fields/${field}`,
      value,
    }));

    const workItemRelations = relations?.map((relation) => ({ op: "add", path: "/relations/-", value: relation })) ?? [];

    return this.callAsyncWithLimitRetry(async () =>
      this.workItemTrackingClient.createWorkItem([...workItem, ...workItemRelations], this.project, type)
    );
  }

  async getWorkItem(workItemId: number): Promise<WorkItem> {
    const workItem = await this.callAsyncWithLimitRetry(async () => this.workItemTrackingClient.getWorkItem(workItemId));
    return {
      id: workItem.id,
      fields: workItem.fields,
      url: workItem.url,
    };
  }

  async getTemplate(templateId: string): Promise<Template> {
    const template = await this.callAsyncWithLimitRetry(async () =>
      this.workItemTrackingClient.getTemplate(this.project, this.team, templateId)
    );
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      workItemTypeName: template.workItemTypeName,
      fields: template.fields,
    };
  }

  async getTemplates(workItemType: string): Promise<TemplateReference[]> {
    const templates = await this.callAsyncWithLimitRetry(async () =>
      this.workItemTrackingClient.getTemplates(this.project, this.team, workItemType)
    );
    return templates.map((template) => ({
      name: template.name,
      description: template.description,
      id: template.id,
      workItemTypeName: template.workItemTypeName,
    }));
  }

  async getWorkItemTypes(): Promise<WorkItemType[]> {
    const workItemTypes = await this.callAsyncWithLimitRetry(async () => this.workItemTrackingClient.getWorkItemTypes(this.project));
    return workItemTypes.map((workItemType) => ({
      name: workItemType.name,
      referenceName: workItemType.referenceName,
    }));
  }
}
