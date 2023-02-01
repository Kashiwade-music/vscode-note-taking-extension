// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as utils from "./utils";
import * as fs from "fs";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-note-taking-extension" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.createNote",
      async () => {
        const config = vscode.workspace.getConfiguration(
          "vscode-note-taking-extension"
        );
        const path = await utils.genNewNotePath(
          config.get("categories") as utils.StringKeyObject
        );
        const templateSnippetString = await utils.getTemplate(
          config.get("templates") as utils.TemplatesObject
        );
        const fileName = await vscode.window.showInputBox({
          prompt: "Enter file name",
        });

        // create dir current workspace if not exists
        const workspace = vscode.workspace.workspaceFolders;
        let absolutePath = "";
        if (workspace) {
          const workspacePath = workspace[0].uri.fsPath;
          absolutePath = workspacePath + "/" + path;
          if (fs.existsSync(absolutePath) === false) {
            await vscode.workspace.fs.createDirectory(
              vscode.Uri.file(absolutePath)
            );
          }
        }

        // create file and open
        const file = vscode.Uri.file(absolutePath + "/" + fileName + ".md");
        await vscode.workspace.fs.writeFile(file, new Uint8Array());
        const doc = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(doc);

        // insert template
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.insertSnippet(templateSnippetString);
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.initDir",
      async () => {
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
        if (fs.existsSync(workspacePath + "/.vscode")) {
          // yes no check
          const yesNo = await vscode.window.showInformationMessage(
            "A .vscode directory already exists. Do you want to overwrite it?",
            "Yes",
            "No"
          );
          if (yesNo === "No") {
            return;
          }
        }

        // create .vscode dir
        const vscodeDir = vscode.Uri.file(workspacePath + "/.vscode");
        await vscode.workspace.fs.createDirectory(vscodeDir);
        // create file and open
        const file = vscode.Uri.file(workspacePath + "/.vscode/settings.json");
        await vscode.workspace.fs.writeFile(file, new Uint8Array());
        const doc = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(doc);

        // insert template
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(
              new vscode.Position(0, 0),
              utils.getSettingsJsonString()
            );
          });
        }
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
