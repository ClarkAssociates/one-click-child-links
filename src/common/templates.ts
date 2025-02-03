export type TemplateReference = {
  name: string;
  id: string;
  description: string;
  workItemTypeName: string;
};

export type Template = TemplateReference & {
  fields: Record<string, unknown>;
};
