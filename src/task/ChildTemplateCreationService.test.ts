import { faker } from "@faker-js/faker";
import { mock } from "jest-mock-extended";
import { IAzureDevOpsContext } from "~/utils/IAzureDevOpsContext";
import MockTemplate from "~/__mocks__/MockTemplate";
import MockWorkitem from "~/__mocks__/MockWorkitem";
import ChildTemplateCreationService from "./ChildTemplateCreationService";

const getMocks = () => {
  const azureDevOpsContext = mock<IAzureDevOpsContext>();
  azureDevOpsContext.user = { name: faker.lorem.slug(), id: faker.lorem.slug() };

  const iterationInformation = { backlogIterationName: faker.system.directoryPath(), defaultIterationPath: faker.system.directoryPath() };
  azureDevOpsContext.getTeamSettings.mockResolvedValue({
    iterationInformation,
  });

  const template = MockTemplate.generateTemplates(1)[0];
  const currentWorkItem = MockWorkitem.generateWorkitems(1)[0];

  return { azureDevOpsContext, iterationInformation, template, currentWorkItem };
};

describe("ChildTemplateCreationService", () => {
  it("creates an instance of ChildTemplateCreationService", async () => {
    const mocks = getMocks();

    const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

    expect(childTemplateCreationService).toBeInstanceOf(ChildTemplateCreationService);
  });

  describe("createChildTemplate", () => {
    it("creates a child template", async () => {
      const mocks = getMocks();

      mocks.template.fields = {
        "System.Title": faker.lorem.word(),
        "System.Description": faker.lorem.sentence(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields).toBeDefined();
      expect(childTemplate.fields["System.Title"]).toEqual(mocks.template.fields["System.Title"]);
      expect(childTemplate.fields["System.Description"]).toEqual(mocks.template.fields["System.Description"]);
    });

    it("creates a child template with default values", async () => {
      const mocks = getMocks();

      mocks.currentWorkItem.fields = {
        "System.Title": faker.lorem.word(),
        "System.AreaPath": faker.system.directoryPath(),
        "System.IterationPath": faker.system.directoryPath(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields).toEqual(
        expect.objectContaining({
          "System.Title": mocks.currentWorkItem.fields["System.Title"],
          "System.AreaPath": mocks.currentWorkItem.fields["System.AreaPath"],
          "System.IterationPath": mocks.currentWorkItem.fields["System.IterationPath"],
        })
      );
    });

    it("creates a child template with replaced values", async () => {
      const mocks = getMocks();

      const assginedToDisplayName = faker.lorem.word();

      mocks.template.fields = {
        "System.Title": "@me",
        "System.AssignedTo": "@assignedto",
        "System.IterationPath": "@currentiteration",
        Priority: faker.number.int({ min: 1, max: 4 }),
      };

      mocks.currentWorkItem.fields = {
        "System.Title": faker.lorem.word(),
        "System.AssignedTo": { displayName: assginedToDisplayName, name: assginedToDisplayName },
        "System.AreaPath": faker.system.directoryPath(),
        "System.IterationPath": faker.system.directoryPath(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields["System.AssignedTo"]).toEqual(assginedToDisplayName);
      expect(childTemplate.fields["System.Title"]).toEqual(mocks.azureDevOpsContext.user.id);
      expect(childTemplate.fields["System.IterationPath"]).toEqual(
        mocks.iterationInformation.backlogIterationName + mocks.iterationInformation.defaultIterationPath
      );
      expect(childTemplate.fields.Priority).toEqual(mocks.template.fields.Priority);
    });

    it("replaces @pairedwith if the custom.pairedwith field is present", async () => {
      const mocks = getMocks();

      mocks.template.fields = {
        "System.Description": "@pairedwith",
      };

      mocks.currentWorkItem.fields = {
        "System.Title": faker.lorem.word(),
        "Custom.PairedWith": faker.lorem.word(),
        "System.AreaPath": faker.system.directoryPath(),
        "System.IterationPath": faker.system.directoryPath(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields["System.Description"]).toEqual(mocks.currentWorkItem.fields["Custom.PairedWith"]);
    });

    it("replaces @pairedwith with empty string if the custom.pairedwith field is not present", async () => {
      const mocks = getMocks();

      mocks.template.fields = {
        "System.Description": "@pairedwith",
      };

      mocks.currentWorkItem.fields = {
        "System.Title": faker.lorem.word(),
        "System.AreaPath": faker.system.directoryPath(),
        "System.IterationPath": faker.system.directoryPath(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields["System.Description"]).toEqual("");
    });

    it("creates a child template without invalid fields", async () => {
      const mocks = getMocks();

      mocks.template.fields = {
        "System.Tags-Add": faker.lorem.word(),
        "System.Tags-Remove": faker.lorem.word(),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields["System.Tags-Add"]).toBeUndefined();
      expect(childTemplate.fields["System.Tags-Remove"]).toBeUndefined();
    });

    it("creates a child template with the right tags", async () => {
      const mocks = getMocks();

      mocks.template.fields = {
        "System.Tags-Add": Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.lorem.word()).join(","),
      };

      const childTemplateCreationService = await ChildTemplateCreationService.getChildTemplateCreationService(mocks.azureDevOpsContext);

      const childTemplate = childTemplateCreationService.createChildTemplate(mocks.template, mocks.currentWorkItem);

      expect(childTemplate).toBeDefined();
      expect(childTemplate.fields["System.Tags"]).toEqual(mocks.template.fields["System.Tags-Add"]);
    });
  });
});
