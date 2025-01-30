import { faker } from "@faker-js/faker";
import { mock } from "jest-mock-extended";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import { WorkItem, WorkItemTemplate, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import WorkItemClient from "./WorkItemClient";

const getMocks = () => {
  const workItemTrackingClient = mock<WorkItemTrackingRestClient>();

  const project = faker.lorem.slug();
  const team = faker.lorem.slug();

  return { workItemTrackingClient, project, team };
};

describe("WorkItemClient", () => {
  it("creates an instance of AzureDevOpsDialogService", () => {
    const mocks = getMocks();
    const workItemClient = new WorkItemClient(mocks);

    expect(workItemClient).toBeInstanceOf(WorkItemClient);
  });

  describe("workItemCommands", () => {
    const fakeWorkItem: WorkItem = {
      id: faker.number.int(),
      fields: { title: faker.lorem.sentence() },
      url: faker.internet.url(),
      commentVersionRef: {
        url: faker.internet.url(),
        commentId: 0,
        createdInRevision: 0,
        isDeleted: false,
        text: "",
        version: 0,
      },
      relations: [],
      rev: 0,
      _links: undefined,
    };

    describe("createWorkItem", () => {
      const workItemFields = { title: faker.lorem.sentence() };
      const type = faker.lorem.word();

      it("should create a workitem", async () => {
        const mocks = getMocks();
        mocks.workItemTrackingClient.createWorkItem.mockResolvedValue(fakeWorkItem);

        const workItemClient = new WorkItemClient(mocks);
        const workItem = await workItemClient.createWorkItem(workItemFields, type);

        expect(workItem).toBeDefined();
        expect(workItem).toStrictEqual(fakeWorkItem);
        expect(mocks.workItemTrackingClient.createWorkItem).toHaveBeenCalledWith(
          [{ op: "add", path: "/fields/title", value: workItemFields.title }],
          mocks.project,
          type
        );
      });

      it("should create a workitem with relations", async () => {
        const mocks = getMocks();
        mocks.workItemTrackingClient.createWorkItem.mockResolvedValue(fakeWorkItem);

        const relations = [{ rel: faker.lorem.word(), url: faker.internet.url(), attributes: { isLocked: false } }];

        const workItemClient = new WorkItemClient(mocks);
        const workItem = await workItemClient.createWorkItem(workItemFields, type, relations);

        expect(workItem).toBeDefined();
        expect(workItem).toStrictEqual(fakeWorkItem);
        expect(mocks.workItemTrackingClient.createWorkItem).toHaveBeenCalledWith(
          [
            { op: "add", path: "/fields/title", value: workItemFields.title },
            { op: "add", path: "/relations/-", value: relations[0] },
          ],
          mocks.project,
          type
        );
      });
    });

    describe("getWorkItem", () => {
      it("should get a workitem", async () => {
        const mocks = getMocks();
        mocks.workItemTrackingClient.getWorkItem.mockResolvedValue(fakeWorkItem);

        const workItemClient = new WorkItemClient(mocks);
        const workItem = await workItemClient.getWorkItem(fakeWorkItem.id);

        expect(workItem).toBeDefined();
        expect(workItem).toStrictEqual({
          id: fakeWorkItem.id,
          fields: fakeWorkItem.fields,
          url: fakeWorkItem.url,
        });
      });
    });
  });

  describe("templateCommands", () => {
    const fakeWorkItemTemplate: WorkItemTemplate = {
      id: faker.lorem.slug(),
      name: faker.lorem.word(),
      description: faker.lorem.sentence(),
      workItemTypeName: faker.lorem.word(),
      fields: {},
      _links: undefined,
      url: "",
    };

    describe("getTemplate", () => {
      it("should get a template", async () => {
        const mocks = getMocks();
        mocks.workItemTrackingClient.getTemplate.mockResolvedValue(fakeWorkItemTemplate);

        const workItemClient = new WorkItemClient(mocks);
        const template = await workItemClient.getTemplate(fakeWorkItemTemplate.id);

        expect(template).toBeDefined();
        expect(template).toStrictEqual({
          id: fakeWorkItemTemplate.id,
          name: fakeWorkItemTemplate.name,
          description: fakeWorkItemTemplate.description,
          workItemTypeName: fakeWorkItemTemplate.workItemTypeName,
          fields: fakeWorkItemTemplate.fields,
        });
      });
    });

    describe("getTemplates", () => {
      it("should get templates", async () => {
        const mocks = getMocks();
        mocks.workItemTrackingClient.getTemplates.mockResolvedValue([fakeWorkItemTemplate]);

        const workItemClient = new WorkItemClient(mocks);
        const templates = await workItemClient.getTemplates(fakeWorkItemTemplate.workItemTypeName);

        expect(templates).toBeDefined();
        expect(templates).toHaveLength(1);
        expect(templates[0]).toStrictEqual({
          name: fakeWorkItemTemplate.name,
          id: fakeWorkItemTemplate.id,
          description: fakeWorkItemTemplate.description,
          workItemTypeName: fakeWorkItemTemplate.workItemTypeName,
        });
      });
    });
  });

  describe("getWorkItemTypes", () => {
    const fakeWorkItemTypes: WorkItemType[] = Array.from({ length: 5 }, () => ({
      name: faker.lorem.word(),
      referenceName: faker.lorem.word(),
      color: "",
      description: "",
      fieldInstances: [],
      fields: [],
      icon: { id: faker.lorem.word(), url: faker.internet.url() },
      isDisabled: false,
      states: [],
      transitions: {},
      xmlForm: "",
      _links: undefined,
      url: "",
    }));

    it("should get work item types", async () => {
      const mocks = getMocks();
      mocks.workItemTrackingClient.getWorkItemTypes.mockResolvedValue(fakeWorkItemTypes);

      const workItemClient = new WorkItemClient(mocks);

      const workItemTypes = await workItemClient.getWorkItemTypes();

      expect(workItemTypes).toBeDefined();
      expect(workItemTypes).toHaveLength(fakeWorkItemTypes.length);
      expect(workItemTypes).toStrictEqual(
        fakeWorkItemTypes.map((workItemType) => ({ name: workItemType.name, referenceName: workItemType.referenceName }))
      );
    });
  });
});
