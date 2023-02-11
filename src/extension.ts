// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as utils from "./utils";
import * as path from "path";

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
        if (path === "") {
          return;
        }
        const templateSnippetString = await utils.getTemplate(
          config.get("templates") as utils.TemplatesObject
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
        const workspacePath = workspace[0].uri.fsPath;
        const absolutePath = workspacePath + "/" + path;
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(absolutePath));
        } catch (e) {
          await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(absolutePath)
          );
        }

        // create file and open
        const file = vscode.Uri.file(absolutePath + "/" + fileName + ".md");
        try {
          await vscode.workspace.fs.stat(file);
          vscode.window.showErrorMessage("File already exists.");
          return;
        } catch (e) {}

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
        try {
          await vscode.workspace.fs.stat(
            vscode.Uri.file(workspacePath + "/.vscode")
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
        await vscode.workspace.fs.createDirectory(
          vscode.Uri.file(workspacePath + "/.vscode")
        );
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(workspacePath + "/.vscode/extensions.json"),
          Buffer.from(utils.getRecommendedExtensions())
        );
        await vscode.workspace.fs.createDirectory(
          vscode.Uri.file(workspacePath + "/attachments/.trash")
        );

        // create file and open
        const file = vscode.Uri.file(workspacePath + "/.vscode/settings.json");
        await vscode.workspace.fs.writeFile(
          file,
          Buffer.from(utils.getSettingsJsonString())
        );
        const doc = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(doc);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.convertAttachedImageToWebp",
      async () => {
        // check if workspace is open
        const workspace = vscode.workspace.workspaceFolders;
        if (!workspace) {
          vscode.window.showErrorMessage(
            "Please open a workspace before converting."
          );
          return;
        }

        // check markdown file is open
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage(
            "Please open a markdown file before converting."
          );
          return;
        }
        const markdownFilePath = editor.document.uri.fsPath;

        // webp or avif?
        const webpOrAvif = await vscode.window.showQuickPick(["webp", "avif"], {
          placeHolder: "Choose a format",
        });

        // get ![]() and convert its extension to webp
        const workspacePath = workspace[0].uri.fsPath;
        const text = editor.document.getText();
        const imgPathRegExpMatchArray = text.match(/!\[.*\]\((.*)\)/g) || [];
        if (imgPathRegExpMatchArray.length === 0) {
          vscode.window.showErrorMessage("No image found.");
          return;
        }
        let imgPathArray = imgPathRegExpMatchArray.map((imgPath) => {
          return imgPath
            .replace(/^!\[.*\]/, "")
            .slice(1)
            .slice(0, -1);
        });

        if (webpOrAvif === "webp") {
          imgPathArray = imgPathArray.filter((imgPath) => {
            return !imgPath.endsWith(".webp");
          });
          for (const imgPath of imgPathArray) {
            try {
              await vscode.workspace.fs.stat(
                vscode.Uri.file(
                  path.isAbsolute(imgPath)
                    ? imgPath
                    : path.resolve(path.dirname(markdownFilePath), imgPath)
                )
              );
              await utils.convertToWebp(
                path.isAbsolute(imgPath)
                  ? imgPath
                  : path.resolve(path.dirname(markdownFilePath), imgPath),
                path.join(workspacePath, "attachments")
              );
            } catch (e) {
              vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
            }
          }
          editor.edit((editBuilder) => {
            editBuilder.replace(
              new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(text.length)
              ),
              text.replace(/!\[.*\]\((.*)\)/g, (match, p1) => {
                return match.replace(p1, p1.replace(/\.[^/.]+$/, ".webp"));
              })
            );
            editor.document.save();
          });
        } else if (webpOrAvif === "avif") {
          imgPathArray = imgPathArray.filter((imgPath) => {
            return !imgPath.endsWith(".avif");
          });
          for (const imgPath of imgPathArray) {
            try {
              await vscode.workspace.fs.stat(
                vscode.Uri.file(
                  path.isAbsolute(imgPath)
                    ? imgPath
                    : path.resolve(path.dirname(markdownFilePath), imgPath)
                )
              );
              await utils.convertToAvif(
                path.isAbsolute(imgPath)
                  ? imgPath
                  : path.resolve(path.dirname(markdownFilePath), imgPath),
                path.join(workspacePath, "attachments")
              );
            } catch (e) {
              vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
            }
          }
          editor.edit((editBuilder) => {
            editBuilder.replace(
              new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(text.length)
              ),
              text.replace(/!\[.*\]\((.*)\)/g, (match, p1) => {
                return match.replace(p1, p1.replace(/\.[^/.]+$/, ".avif"));
              })
            );
            editor.document.save();
          });
        }
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
