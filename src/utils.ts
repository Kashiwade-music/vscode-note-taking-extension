import * as vscode from "vscode";

export interface StringKeyObject {
  [key: string]: StringKeyObject | { [key: string]: never };
}

export const genNewNotePath = async (
  categories: StringKeyObject
): Promise<string> => {
  let category = (await vscode.window.showQuickPick(
    Object.keys(categories)
  )) as unknown as string;

  if (Object.keys(categories[category]).length > 0) {
    const subs = await genNewNotePath(categories[category]);
    return category + "/" + subs;
  } else {
    return category;
  }
};

export interface TemplatesObject {
  [key: string]: Array<string>;
}
export const getTemplate = async (templates: TemplatesObject) => {
  let template = (await vscode.window.showQuickPick(
    Object.keys(templates)
  )) as unknown as string;
  return new vscode.SnippetString(templates[template].join("\n"));
};
