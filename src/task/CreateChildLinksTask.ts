import ILoggerService from "../utils/ILoggerService";
import IWorkItemService from "./templates/IWorkItemService";
import ITemplateFilter from "./templates/ITemplateFilter";
import IChildTemplateCreationService from "./IChildTemplateCreationService";

export type CreateChildLinksTaskArgs = {
  loggerService: ILoggerService;
  workItemService: IWorkItemService;
  templateFilter: ITemplateFilter;
  childTemplateCreationService: IChildTemplateCreationService;
};

export default class CreateChildLinksTask {
  private readonly loggerService: ILoggerService;

  private readonly workItemService: IWorkItemService;

  private readonly templateFilter: ITemplateFilter;

  private readonly childTemplateCreationService: IChildTemplateCreationService;

  constructor({ loggerService, workItemService, templateFilter, childTemplateCreationService }: CreateChildLinksTaskArgs) {
    this.loggerService = loggerService;
    this.workItemService = workItemService;
    this.templateFilter = templateFilter;
    this.childTemplateCreationService = childTemplateCreationService;
  }

  async runTask(workItemId: number): Promise<void> {
    const currentWorkItem = await this.workItemService.getWorkItem(workItemId);

    const templateReferences = await this.workItemService.getChildTemplateReferences();

    const filteredTemplateReferences = this.templateFilter.filterTemplateReferences(templateReferences, currentWorkItem);

    const results = await Promise.allSettled(
      filteredTemplateReferences.map(async (template) => {
        const baseTemplate = await this.workItemService.getTemplate(template);
        const childTemplate = this.childTemplateCreationService.createChildTemplate(baseTemplate, currentWorkItem);
        return this.workItemService.createWorkItemFromTemplate(childTemplate, currentWorkItem);
      })
    );

    const errors = results.filter((result) => result.status === "rejected");

    if (errors.length) {
      errors.forEach((error) => this.loggerService.writeError(`Error creating work item for template: ${error.reason}`));
      throw new Error(`${errors.length} work item(s) failed to be created.`);
    }

    this.loggerService.writeTrace("Work items created successfully.");
  }
}
