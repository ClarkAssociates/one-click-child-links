import { Template } from "../common/templates";
import { WorkItem } from "../common/workitem";

/**
 * Interface for the ChildTemplateCreationService class that creates child templates.
 */
export default interface IChildTemplateCreationService {
  /**
   * Creates a child template based on the current work item.
   * @param template The template to create a child template from.
   * @param currentWorkItem The current work item.
   * @returns The created child template.
   */
  createChildTemplate(template: Template, currentWorkItem: WorkItem): Template;
}
