import { TemplateReference } from "~/common/templates";
import { WorkItem } from "~/common/workitem";

/**
 * Interface for the TemplateFilter class that filters templates based on the current work item.
 */
export default interface ITemplateFilter {
  /**
   * Filters the given templates based on the current work item.
   * @param templates The templates to filter.
   * @param currentWorkItem The current work item.
   * @returns The filtered templates.
   */
  filterTemplateReferences(templates: TemplateReference[], currentWorkItem: WorkItem): TemplateReference[];
}
