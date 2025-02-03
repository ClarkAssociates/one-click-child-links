import { faker } from "@faker-js/faker";
import { mock } from "jest-mock-extended";
import ILoggerService from "~/utils/ILoggerService";
import MockWorkitem from "~/__mocks__/MockWorkitem";
import MockTemplate from "~/__mocks__/MockTemplate";
import IWorkItemService from "./templates/IWorkItemService";
import IChildTemplateCreationService from "./IChildTemplateCreationService";
import ITemplateFilter from "./templates/ITemplateFilter";
import CreateChildLinksTask from "./CreateChildLinksTask";

const getMocks = () => {
  const loggerService = mock<ILoggerService>();
  const workItemService = mock<IWorkItemService>();
  const templateFilter = mock<ITemplateFilter>();
  const childTemplateCreationService = mock<IChildTemplateCreationService>();

  const templateReferences = MockTemplate.generateTemplateReferences();

  workItemService.getWorkItem.mockResolvedValue(MockWorkitem.generateWorkitems(1)[0]);
  templateFilter.filterTemplateReferences.mockReturnValue(templateReferences);

  return { loggerService, workItemService, templateFilter, childTemplateCreationService, templateReferences };
};

describe("CreateChildLinksTask", () => {
  it("creates an instance of CreateChildLinksTask", () => {
    const mocks = getMocks();
    const task = new CreateChildLinksTask(mocks);

    expect(task).toBeInstanceOf(CreateChildLinksTask);
  });

  it("runs the task without error", async () => {
    const mocks = getMocks();
    const task = new CreateChildLinksTask(mocks);

    await task.runTask(faker.number.int());

    expect(mocks.workItemService.getWorkItem).toHaveBeenCalled();
    expect(mocks.templateFilter.filterTemplateReferences).toHaveBeenCalled();
    expect(mocks.childTemplateCreationService.createChildTemplate).toHaveBeenCalled();
    expect(mocks.workItemService.createWorkItemFromTemplate).toHaveBeenCalled();
  });

  it("runs throws errors if workitems cannot be created", async () => {
    const mocks = getMocks();
    mocks.workItemService.createWorkItemFromTemplate.mockRejectedValue("Failed to create work item");

    const task = new CreateChildLinksTask(mocks);

    await expect(task.runTask(faker.number.int())).rejects.toThrowError(
      `${mocks.templateReferences.length} work item(s) failed to be created.`
    );
  });
});
