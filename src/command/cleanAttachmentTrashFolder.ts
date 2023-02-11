import * as vscode from "vscode";
import * as path from "path";

export const cleanAttachmentTrashFolder = async () => {
  // check if workspace is open
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    vscode.window.showErrorMessage(
      "Please open a workspace before initializing."
    );
    return;
  }

  // yes no dialog
  const yesNo = await vscode.window.showQuickPick(["Yes", "No"], {
    placeHolder:
      "Are you sure you want to delete all files in the trash folder? (./attachments/.trash))",
  });
  if (yesNo === "No") {
    return;
  }

  // delete all files in trash folder
  const trashFolder = vscode.Uri.file(
    path.join(workspace[0].uri.fsPath, "attachments", ".trash")
  );
  const trashFolderFiles = await vscode.workspace.fs.readDirectory(trashFolder);
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Deleting files...",
      cancellable: false,
    },
    async (progress, token) => {
      for (const file of trashFolderFiles) {
        progress.report({
          message: `Deleting ${trashFolderFiles.indexOf(file)}/${
            trashFolderFiles.length
          }`,
        });
        await vscode.workspace.fs.delete(
          vscode.Uri.file(path.join(trashFolder.fsPath, file[0]))
        );
      }
    }
  );
};
