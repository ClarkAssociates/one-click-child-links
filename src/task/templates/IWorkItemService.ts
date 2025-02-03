import { Template, TemplateReference } from "~/common/templates";
import { WorkItem } from "~/common/workitem";

/**
 * Interface for the WorkItemService class that retrieves templates.
 */
export default interface IWorkItemService {
  /**
   * Creates a work item from a template.
   * @param template The template to create the work item from.
   * @param parentWorkItem The parent work item.
   */
  getWorkItem(workItemId: number): Promise<WorkItem>;

  /**
   * Creates a work item from a template.
   * @param template The template to create the work item from.
   * @param parentWorkItem The parent work item.
   */
  createWorkItemFromTemplate(template: Template, parentWorkItem?: WorkItem): Promise<WorkItem>;

  /**
   * Gets the child templates of the given template.
   * @returns The child templates.
   */
  getChildTemplateReferences(): Promise<TemplateReference[]>;

  /**
   * Gets the template based on the respective reference.
   * @param TemplateReference The template reference.
   * @returns The template.
   */
  getTemplate(templateReference: TemplateReference): Promise<Template>;
}
