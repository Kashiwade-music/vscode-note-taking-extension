// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { createNote } from "./command/createNote";
import { initDir } from "./command/initDir";
import * as Convert from "./command/convertAttachedImage";
import { cleanAttachmentTrashFolder } from "./command/cleanAttachmentTrashFolder";

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
      createNote
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.initDir",
      initDir
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.convertAttachedImageToWebp",
      Convert.convertAttachedImageToWebp
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.convertAttachedImageToLosslessWebp",
      Convert.convertAttachedImageToLosslessWebp
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.convertAttachedImageToAvif",
      Convert.convertAttachedImageToAvif
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-note-taking-extension.cleanAttachmentTrashFolder",
      cleanAttachmentTrashFolder
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
