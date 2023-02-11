import * as vscode from "vscode";
import * as path from "path";

const getSettingsJsonString = () => {
  return `{
  // Categories are used to organize your notes.
  // You can add as many categories as you want.
  // The categories are organized in a tree structure.
  // The categories are used to generate the path of the note.
  "vscode-note-taking-extension.categories": {
    "General": {
      "Daily Notes": {},
      "Progress Report": {}
    },
    "Tips": {
      "Programming": {
        "Python": {},
        "JavaScript": {}
      },
      "Life": {}
    }
  },

  // Templates are used to generate the content of the note.
  // You can add as many templates as you want.
  // You can use tabstops to navigate through the template.
  // See https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax
  "vscode-note-taking-extension.templates": {
    "default": [
      "---",
      "tags: \${1:First tabstop}",
      "---",
      "# \${2:A second tabstop}",
      "Note Created: \${CURRENT_YEAR}-\${CURRENT_MONTH}-\${CURRENT_DATE}",
      "",
      "## \${3:third tabstop}"
    ],
    "Template 2": ["# Title", "## Subtitle", "### Subsubtitle"]
  },

  // it is recommended to install the following extensions: mushan.vscode-paste-image
  "pasteImage.path": "\${projectRoot}/attachments/"
}`;
};

const getRecommendedExtensions = () => {
  return `{
  // List of extensions which should be recommended for users of this extension.
  "recommendations": [
      "yzhang.markdown-all-in-one",
      "shd101wyy.markdown-preview-enhanced",
      "mushan.vscode-paste-image"
  ]
}`;
};

export const initDir = async () => {
  // check if workspace is open
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    vscode.window.showErrorMessage(
      "Please open a workspace before initializing."
    );
    return;
  }

  // check if already .vscode dir exists
  const workspacePath = workspace[0].uri.fsPath;
  try {
    await vscode.workspace.fs.stat(
      vscode.Uri.file(path.join(workspacePath, ".vscode"))
    );
    const yesNo = await vscode.window.showInformationMessage(
      "A .vscode directory already exists. Do you want to overwrite it?",
      "Yes",
      "No"
    );
    if (yesNo === "No") {
      return;
    }
  } catch (e) {}

  // create .vscode dir and attachment dir
  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(path.join(workspacePath, ".vscode", "extensions.json")),
    Buffer.from(getRecommendedExtensions())
  );
  await vscode.workspace.fs.createDirectory(
    vscode.Uri.file(path.join(workspacePath, "attachments", ".trash"))
  );

  // create file and open
  const file = vscode.Uri.file(
    path.join(workspacePath, ".vscode", "settings.json")
  );
  await vscode.workspace.fs.writeFile(
    file,
    Buffer.from(getSettingsJsonString())
  );

  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(file)
  );
};
