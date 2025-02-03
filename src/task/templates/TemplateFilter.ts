import { TemplateReference } from "~/common/templates";
import { WorkItem } from "~/common/workitem";
import ILoggerService from "~/utils/ILoggerService";
import ITemplateFilter from "./ITemplateFilter";

type Filters = {
  applywhen: Record<string, string[] | string | undefined> | Record<string, string[] | string | undefined>[];
};

export default class TemplateFilter implements ITemplateFilter {
  private readonly loggerService: ILoggerService;

  constructor({ loggerService }: { loggerService: ILoggerService }) {
    this.loggerService = loggerService;
  }

  filterTemplateReferences(templateReferences: TemplateReference[], currentWorkItem: WorkItem): TemplateReference[] {
    const templatesToApply = templateReferences.filter((templateReference) =>
      this.filterTemplateReference(templateReference, currentWorkItem)
    );

    this.loggerService.writeTrace(`Found ${templatesToApply.length} templates to apply.`);
    this.loggerService.writeTrace(`Templates to apply: ${templatesToApply.map((t) => t.name).join(", ")}`);

    return templatesToApply;
  }

  /**
   * Filters the given templateReferences based on the description of the template. The description can be a JSON string or a list of work item types.
   * @param templateReference the template reference to determine if it should be filtered out
   * @param currentWorkItem the current work item
   * @returns true if the template should be included, false otherwise
   */
  private filterTemplateReference(templateReference: TemplateReference, currentWorkItem: WorkItem): boolean {
    if (isJsonString(templateReference.description)) {
      const jsonFilters: Filters = JSON.parse(templateReference.description);

      return this.matchFilters(jsonFilters, currentWorkItem);
    }

    const filters = templateReference.description.match(/\[([^[\]]*)\]/g)?.map((match) => match.slice(1, -1));

    if (filters) {
      return filters.some((filter) =>
        filter.split(",").some((f) => f.trim().toLowerCase() === String(currentWorkItem.fields["System.WorkItemType"]).toLowerCase())
      );
    }

    return false;

    function isJsonString(str: string): boolean {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Matches the filters with the current work item.
   * @param filters the filters to match
   * @param currentWorkItem the work item to compare
   * @returns true if the filters match the work item, false otherwise
   */
  private matchFilters(filters: Filters, currentWorkItem: WorkItem): boolean {
    const rules = Array.isArray(filters.applywhen) ? filters.applywhen : [filters.applywhen];

    return rules.some((filter) =>
      Object.keys(filter).every((fieldName) => this.matchField(fieldName, currentWorkItem.fields[fieldName], filter[fieldName]))
    );
  }

  /**
   * Matches the given field with the current work item.
   * @param filters the filters to match
   * @param currentWorkItem the work item to compare
   * @returns true if the filters match the work item, false otherwise
   */
  private matchField(fieldName: string, currentWorkItemField: unknown, filterObjectField: unknown): boolean {
    if (!currentWorkItemField || !filterObjectField) {
      return false;
    }

    const filterValue = Array.isArray(filterObjectField) ? filterObjectField.map(String) : [String(filterObjectField)];
    let currentWorkItemValue: string[];

    if (Array.isArray(currentWorkItemField)) {
      currentWorkItemValue = currentWorkItemField.map(String);
    } else if (fieldName === "System.Tags") {
      currentWorkItemValue = String(currentWorkItemField).split("; ");
    } else {
      currentWorkItemValue = [String(currentWorkItemField)];
    }

    return filterValue.some((i) => currentWorkItemValue.some((c) => i.toLowerCase() === c.toLowerCase()));
  }
}
