import { faker } from "@faker-js/faker";
import { WorkItem } from "~/common/workitem";

export default class MockWorkitem {
  static generateWorkitems(length: number = faker.number.int({ min: 1, max: 10 })): WorkItem[] {
    return Array.from({ length }, () => ({
      id: faker.number.int(),
      fields: { title: faker.lorem.sentence() },
      url: faker.internet.url(),
    }));
  }
}
