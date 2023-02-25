import * as vscode from "vscode";
import * as path from "path";

interface StringKeyObject {
  [key: string]: StringKeyObject | { [key: string]: never };
}

const genNewNotePath = async (categories: StringKeyObject): Promise<string> => {
  if (Object.keys(categories).length === 0) {
    vscode.window.showErrorMessage(
      "No categories defined. Please add some at .vscode/settings.json"
    );
    return "";
  }
  let category = (await vscode.window.showQuickPick(Object.keys(categories), {
    placeHolder: "Select a category",
  })) as unknown as string;

  if (Object.keys(categories[category]).length > 0) {
    const subs = await genNewNotePath(categories[category]);
    return category + "/" + subs;
  } else {
    return category;
  }
};

interface TemplatesObject {
  [key: string]: Array<string>;
}

const getTemplate = async (templates: TemplatesObject) => {
  let template = (await vscode.window.showQuickPick(Object.keys(templates), {
    placeHolder: "Select a template",
  })) as unknown as string;
  return new vscode.SnippetString(templates[template].join("\n"));
};

export const createNote = async () => {
  const config = vscode.workspace.getConfiguration(
    "vscode-note-taking-extension"
  );
  const notePath = await genNewNotePath(
    config.get("categories") as StringKeyObject
  );
  if (notePath === "") {
    return;
  }

  const template = await getTemplate(
    config.get("templates") as TemplatesObject
  );

  const fileName = await vscode.window.showInputBox({
    prompt: "Enter file name",
  });

  // create dir current workspace if not exists
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    vscode.window.showErrorMessage(
      "Please open a workspace before creating a note."
    );
    return;
  }
  const absolutePath = path.join(workspace[0].uri.fsPath, notePath);
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(absolutePath));
  } catch (e) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(absolutePath));
  }

  // create file and open
  const file = vscode.Uri.file(path.join(absolutePath, `${fileName}.md`));
  try {
    await vscode.workspace.fs.stat(file);
    vscode.window.showErrorMessage("File already exists.");
    return;
  } catch (e) {}

  await vscode.workspace.fs.writeFile(file, new Uint8Array());
  const editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(file)
  );

  if (editor) {
    editor.insertSnippet(template);
  }
};
