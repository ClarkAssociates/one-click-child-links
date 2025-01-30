import { faker } from "@faker-js/faker";
import { Template, TemplateReference } from "~/common/templates";

export default class MockTemplate {
  static generateTemplates(length: number = faker.number.int({ min: 1, max: 10 })): Template[] {
    return Array.from({ length }, () => ({
      id: faker.lorem.slug(),
      name: faker.lorem.word(),
      description: faker.lorem.sentence(),
      workItemTypeName: faker.lorem.word(),
      fields: {},
    }));
  }

  static generateTemplateReferences(length: number = faker.number.int({ min: 1, max: 10 })): TemplateReference[] {
    return Array.from({ length }, () => ({
      id: faker.lorem.slug(),
      name: faker.lorem.word(),
      description: faker.lorem.sentence(),
      workItemTypeName: faker.lorem.word(),
    }));
  }
}
