import { mock } from "jest-mock-extended";
import MockTemplate from "~/__mocks__/MockTemplate";
import MockWorkitem from "~/__mocks__/MockWorkitem";
import ILoggerService from "~/utils/ILoggerService";
import TemplateFilter from "./TemplateFilter";

const getMocks = ({ templateReferencesToGenerate }: { templateReferencesToGenerate?: number }) => {
  const loggerService = mock<ILoggerService>();
  const currentWorkItem = MockWorkitem.generateWorkitems(1)[0];
  const templateReferences = MockTemplate.generateTemplateReferences(templateReferencesToGenerate);

  return { loggerService, templateReferences, currentWorkItem };
};

describe("TemplateFilter", () => {
  it("creates an instance of TemplateFilter", async () => {
    const mocks = getMocks({});
    const templateFilter = new TemplateFilter(mocks);

    expect(templateFilter).toBeInstanceOf(TemplateFilter);
  });

  describe("filterTemplateReferences", () => {
    it("filters out normal templateReferences", async () => {
      const mocks = getMocks({});

      const templateFilter = new TemplateFilter(mocks);

      const childTemplate = templateFilter.filterTemplateReferences(mocks.templateReferences, mocks.currentWorkItem);

      expect(childTemplate).toEqual([]);
    });

    it("filters correctly for any empty list", async () => {
      const mocks = getMocks({});
      const templateFilter = new TemplateFilter(mocks);

      const childTemplates = templateFilter.filterTemplateReferences([], mocks.currentWorkItem);

      expect(childTemplates).toEqual([]);
    });

    it("filters correctly for a list of workItemTypes", async () => {
      const mocks = getMocks({ templateReferencesToGenerate: 2 });
      mocks.currentWorkItem.fields["System.WorkItemType"] = "Task";

      mocks.templateReferences[0].description = "[Bug, Task]";
      mocks.templateReferences[1].description = "[Bug]";

      const templateFilter = new TemplateFilter(mocks);

      const childTemplates = templateFilter.filterTemplateReferences(mocks.templateReferences, mocks.currentWorkItem);

      expect(childTemplates).toEqual([mocks.templateReferences[0]]);
    });

    it.each([
      {
        description: "filters correctly for a list of applywhen with state 'Committed'",
        templateReferencesToGenerate: 3,
        currentWorkItemFields: { "System.WorkItemType": "Bug", "System.State": "Committed" },
        templateDescriptions: [
          `{"applywhen":[{"System.State": "Committed", "System.WorkItemType": "Bug"}]}`,
          `{"applywhen":[{"System.State": "Committed"}]}`,
          `{"applywhen":[{"System.State": "Done", "System.WorkItemType": "Product Backlog Item"}]}`,
        ],
        expected: [0, 1],
      },
      {
        description: "filters correctly for tags",
        templateReferencesToGenerate: 3,
        currentWorkItemFields: { "System.Tags": "test; tag1", "System.WorkItemType": "Bug" },
        templateDescriptions: [
          `{"applywhen":[{"System.Tags": ["test", "tag1"], "System.WorkItemType": "Bug"}]}`,
          `{"applywhen":[{"System.Tags": ["test"], "System.WorkItemType": "Bug"}]}`,
          `{"applywhen":[{"System.Tags": ["test3"], "System.WorkItemType": "Bug"}]}`,
        ],
        expected: [0, 1],
      },
      {
        description: "filters correctly when the workitem does not have tags",
        templateReferencesToGenerate: 1,
        currentWorkItemFields: { "System.WorkItemType": "Bug" },
        templateDescriptions: [`{"applywhen":[{"System.Tags": ["test"], "System.WorkItemType": "Bug"}]}`],
        expected: [],
      },
    ])("$description", async ({ templateReferencesToGenerate, currentWorkItemFields, templateDescriptions, expected }) => {
      const mocks = getMocks({ templateReferencesToGenerate });
      Object.assign(mocks.currentWorkItem.fields, currentWorkItemFields);

      templateDescriptions.forEach((desc, index) => {
        mocks.templateReferences[index].description = desc;
      });

      const templateFilter = new TemplateFilter(mocks);

      const childTemplates = templateFilter.filterTemplateReferences(mocks.templateReferences, mocks.currentWorkItem);

      expect(childTemplates).toEqual(expected.map((index) => mocks.templateReferences[index]));
    });
  });
});
