import { WorkItem } from "~/common/workitem";
import { Template, TemplateReference } from "~/common/templates";
import IWorkItemClient, { WorkItemRelation } from "~/utils/IWorkItemClient";
import IWorkItemService from "./IWorkItemService";

export default class WorkItemService implements IWorkItemService {
  private readonly workItemClient: IWorkItemClient;

  constructor({ workItemClient }: { workItemClient: IWorkItemClient }) {
    this.workItemClient = workItemClient;
  }

  async getWorkItem(workItemId: number): Promise<WorkItem> {
    return this.workItemClient.getWorkItem(workItemId);
  }

  async createWorkItemFromTemplate(template: Template, parentWorkItem?: WorkItem): Promise<WorkItem> {
    const relations: WorkItemRelation[] | undefined = parentWorkItem
      ? [{ rel: "System.LinkTypes.Hierarchy-Reverse", url: parentWorkItem.url, attributes: { isLocked: false } }]
      : undefined;

    return this.workItemClient.createWorkItem(template.fields, template.workItemTypeName, relations);
  }

  async getTemplate(templateReference: TemplateReference): Promise<Template> {
    return this.workItemClient.getTemplate(templateReference.id);
  }

  async getChildTemplateReferences(): Promise<TemplateReference[]> {
    const workItemTypes = await this.workItemClient.getWorkItemTypes();

    const templates = (await Promise.all(workItemTypes.map((workItemType) => this.workItemClient.getTemplates(workItemType.name)))).flat();

    if (templates.length === 0) {
      throw new Error("No child templates found. Please add child templates for the project team.");
    }

    return templates;
  }
}
