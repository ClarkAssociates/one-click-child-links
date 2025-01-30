import { WorkItem } from "~/common/workitem";
import { Template, TemplateReference } from "../common/templates";

export type WorkItemField = {
  field: string;
  value: unknown;
};

export type WorkItemRelation = {
  rel: string;
  url: string;
  attributes: {
    isLocked: boolean;
  };
};

export type WorkItemType = {
  /**
   * The name of the work item type.
   */
  name: string;
  /**
   * The reference name of the work item type.
   */
  referenceName: string;
};

export default interface IWorkItemClient {
  /**
   * Creates a work item.
   * @param workItemFields The fields of the work item.
   * @param type The type of the work item.
   * @param relations The relations of the work item.
   * @returns The created work item.
   */
  createWorkItem(workItemFields: Record<string, unknown>, type: string, relations?: WorkItemRelation[]): Promise<WorkItem>;

  /**
   * Gets a work item.
   * @param workItemId The ID of the work item.
   * @returns The work item.
   */
  getWorkItem(workItemId: number): Promise<WorkItem>;

  /**
   * Gets the work item types.
   * @returns The work item types.
   */
  getWorkItemTypes(): Promise<WorkItemType[]>;

  /**
   * Gets a template.
   * @param templateId The ID of the template.
   * @returns The template.
   */
  getTemplate(templateId: string): Promise<Template>;

  /**
   * Gets the template References for a given work item type.
   * @param workItemType The work item type.
   * @returns The template references.
   */
  getTemplates(workItemType: string): Promise<TemplateReference[]>;
}
