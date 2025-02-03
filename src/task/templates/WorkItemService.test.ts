import { faker } from "@faker-js/faker";
import { mock } from "jest-mock-extended";
import MockTemplate from "~/__mocks__/MockTemplate";
import MockWorkitem from "~/__mocks__/MockWorkitem";
import IWorkItemClient, { WorkItemType } from "~/utils/IWorkItemClient";
import WorkItemService from "./WorkItemService";

const getMocks = () => {
  const workItemClient = mock<IWorkItemClient>();

  const workItem = MockWorkitem.generateWorkitems(1)[0];
  const template = MockTemplate.generateTemplates(1)[0];
  const templateReferences = MockTemplate.generateTemplateReferences();

  const workItemTypes: WorkItemType[] = [
    {
      name: faker.lorem.word(),
      referenceName: faker.lorem.word(),
    },
  ];

  workItemClient.getWorkItemTypes.mockResolvedValue(workItemTypes);
  workItemClient.getWorkItem.mockResolvedValue(workItem);
  workItemClient.createWorkItem.mockResolvedValue(workItem);
  workItemClient.getTemplates.mockResolvedValue(templateReferences);
  workItemClient.getTemplate.mockResolvedValue(template);

  return { workItemClient, workItem, template, templateReferences };
};

describe("WorkItemService", () => {
  it("creates an instance of WorkItemService", async () => {
    const mocks = getMocks();
    const workItemService = new WorkItemService(mocks);

    expect(workItemService).toBeInstanceOf(WorkItemService);
  });

  describe("getWorkItem", () => {
    it("gets a WorkItem", async () => {
      const mocks = getMocks();
      const workItemService = new WorkItemService(mocks);

      const childTemplate = await workItemService.getWorkItem(mocks.workItem.id);

      expect(childTemplate).toEqual(mocks.workItem);
    });
  });

  describe("getTemplate", () => {
    it("gets a template", async () => {
      const mocks = getMocks();
      const workItemService = new WorkItemService(mocks);

      const template = await workItemService.getTemplate(mocks.template);

      expect(template).toEqual(mocks.template);
    });
  });

  describe("createWorkItemFromTemplate", () => {
    it("creates a WorkItem from a template", async () => {
      const mocks = getMocks();
      const workItemService = new WorkItemService(mocks);

      await workItemService.createWorkItemFromTemplate(mocks.template);
      expect(mocks.workItemClient.createWorkItem).toHaveBeenCalledWith(mocks.template.fields, mocks.template.workItemTypeName, undefined);
    });

    it("creates a WorkItem from a template and adds a reference to the parent workitem", async () => {
      const mocks = getMocks();
      const workItemService = new WorkItemService(mocks);

      await workItemService.createWorkItemFromTemplate(mocks.template, mocks.workItem);

      expect(mocks.workItemClient.createWorkItem).toHaveBeenCalledWith(mocks.template.fields, mocks.template.workItemTypeName, [
        { rel: "System.LinkTypes.Hierarchy-Reverse", url: mocks.workItem.url, attributes: { isLocked: false } },
      ]);
    });
  });

  describe("getChildTemplateReferences", () => {
    it("gets child template references", async () => {
      const mocks = getMocks();
      const workItemService = new WorkItemService(mocks);

      const templateReferences = await workItemService.getChildTemplateReferences();

      expect(templateReferences).toEqual(mocks.templateReferences);
    });

    it("throws an error if no child templates are found", async () => {
      const mocks = getMocks();
      mocks.workItemClient.getTemplates.mockResolvedValue([]);

      const workItemService = new WorkItemService(mocks);

      await expect(workItemService.getChildTemplateReferences()).rejects.toThrow(
        "No child templates found. Please add child templates for the project team."
      );
    });
  });
});
