import * as vscode from "vscode";
import * as path from "path";

import { execSync } from "child_process";

// function that get img file path and convert it to webp by using libvips cli and save
// see $ vips webpsave
const convertToWebp = async (
  imgPath: string,
  outputDir: string,
  config: vscode.WorkspaceConfiguration,
  lossless: boolean
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const webpPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.webp`;
  const command = lossless
    ? `vips webpsave "${imgPath}" "${webpPath}" --Q ${config.get(
        "quality"
      )} --lossless ${
        config.get("near-lossless") ? "--near-lossless" : ""
      } --effort ${config.get("effort")}`
    : `vips webpsave "${imgPath}" "${webpPath}" --Q ${config.get("quality")} ${
        config.get("smart-subsample") ? "--smart-subsample" : ""
      } --alpha-q ${config.get("alpha-quality")} --effort ${config.get(
        "effort"
      )}`;
  execSync(command);
};

// function that get img file path and convert it to avif and save
const convertToAvif = async (
  imgPath: string,
  outputDir: string,
  config: vscode.WorkspaceConfiguration
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const avifPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.avif`;
  const command = config.get("lossless")
    ? `vips heifsave "${imgPath}" "${avifPath}" --lossless --compression av1 --subsample-mode off --encoder aom`
    : `vips heifsave "${imgPath}" "${avifPath}" --Q ${config.get(
        "quality"
      )}  --compression av1 --effort ${config.get("effort")}`;
  execSync(command);
};

const initCheck = () => {
  // check we can use vips
  try {
    execSync("vips --version");
  } catch (e) {
    vscode.window.showErrorMessage(
      "Please install libvips before converting. Please see https://www.libvips.org/install.html"
    );
    return false;
  }

  // check if workspace is open
  const workspace = vscode.workspace.workspaceFolders;
  if (!workspace) {
    vscode.window.showErrorMessage(
      "Please open a workspace before converting."
    );
    return false;
  }

  // check markdown file is open
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage(
      "Please open a markdown file before converting."
    );
    return false;
  }

  // check open file is markdown
  if (editor.document.languageId !== "markdown") {
    vscode.window.showErrorMessage(
      "Please open a markdown file before converting."
    );
    return false;
  }
  const markdownFilePath = editor.document.uri.fsPath;

  return { workspace, editor, markdownFilePath };
};

export const convertAttachedImageToWebp = async () => {
  const initCheckResult = initCheck();
  if (!initCheckResult) {
    return;
  }
  const { workspace, editor, markdownFilePath } = initCheckResult;

  // get ![]() and convert its extension to webp
  const workspacePath = workspace[0].uri.fsPath;
  let text = editor.document.getText();
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

  imgPathArray = Array.from(
    new Set(
      imgPathArray.filter((imgPath) => {
        return !imgPath.endsWith(".webp");
      })
    )
  );
  const config = vscode.workspace.getConfiguration(
    "vscode-note-taking-extension.webp"
  );
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Converting images...",
      cancellable: false,
    },
    async (progress, token) => {
      for (const imgPath of imgPathArray) {
        progress.report({
          message: `Converting ${imgPathArray.indexOf(imgPath)}/${
            imgPathArray.length
          }...`,
        });
        try {
          const imgAbsPath = path.isAbsolute(imgPath)
            ? imgPath
            : path.resolve(path.dirname(markdownFilePath), imgPath);
          await vscode.workspace.fs.stat(vscode.Uri.file(imgAbsPath));
          if (
            path
              .dirname(imgAbsPath)
              .includes(path.join(workspacePath, "attachments"))
          ) {
            await convertToWebp(
              imgAbsPath,
              path.join(workspacePath, "attachments"),
              config,
              false
            );
            await vscode.workspace.fs.rename(
              vscode.Uri.file(imgAbsPath),
              vscode.Uri.file(
                path.join(
                  workspacePath,
                  "attachments",
                  ".trash",
                  path.basename(imgAbsPath)
                )
              ),
              { overwrite: true }
            );
            text = text.replace(
              `](${imgPath})`,
              `](${imgPath.replace(path.extname(imgPath), "")}.webp)`
            );
          }
        } catch (e) {
          console.log(e);

          vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
        }
      }
      editor.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          ),
          text
        );
      });
      await editor.document.save();
    }
  );
};

export const convertAttachedImageToLosslessWebp = async () => {
  const initCheckResult = initCheck();
  if (!initCheckResult) {
    return;
  }
  const { workspace, editor, markdownFilePath } = initCheckResult;

  // get ![]() and convert its extension to webp
  const workspacePath = workspace[0].uri.fsPath;
  let text = editor.document.getText();
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

  imgPathArray = Array.from(
    new Set(
      imgPathArray.filter((imgPath) => {
        return !imgPath.endsWith(".webp");
      })
    )
  );
  const config = vscode.workspace.getConfiguration(
    "vscode-note-taking-extension.webp"
  );
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Converting images...",
      cancellable: false,
    },
    async (progress, token) => {
      for (const imgPath of imgPathArray) {
        progress.report({
          message: `Converting ${imgPathArray.indexOf(imgPath)}/${
            imgPathArray.length
          }...`,
        });
        try {
          const imgAbsPath = path.isAbsolute(imgPath)
            ? imgPath
            : path.resolve(path.dirname(markdownFilePath), imgPath);
          await vscode.workspace.fs.stat(vscode.Uri.file(imgAbsPath));
          if (
            path
              .dirname(imgAbsPath)
              .includes(path.join(workspacePath, "attachments"))
          ) {
            await convertToWebp(
              imgAbsPath,
              path.join(workspacePath, "attachments"),
              config,
              true
            );
            await vscode.workspace.fs.rename(
              vscode.Uri.file(imgAbsPath),
              vscode.Uri.file(
                path.join(
                  workspacePath,
                  "attachments",
                  ".trash",
                  path.basename(imgAbsPath)
                )
              ),
              { overwrite: true }
            );
            text = text.replace(
              `](${imgPath})`,
              `](${imgPath.replace(path.extname(imgPath), "")}.webp)`
            );
          }
        } catch (e) {
          console.log(e);

          vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
        }
      }
      editor.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          ),
          text
        );
      });
      await editor.document.save();
    }
  );
};

export const convertAttachedImageToAvif = async () => {
  const initCheckResult = initCheck();
  if (!initCheckResult) {
    return;
  }
  const { workspace, editor, markdownFilePath } = initCheckResult;

  // get ![]() and convert its extension to webp
  const workspacePath = workspace[0].uri.fsPath;
  let text = editor.document.getText();
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

  imgPathArray = Array.from(
    new Set(
      imgPathArray.filter((imgPath) => {
        return !imgPath.endsWith(".avif");
      })
    )
  );
  const config = vscode.workspace.getConfiguration(
    "vscode-note-taking-extension.avif"
  );
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Converting images...",
      cancellable: false,
    },
    async (progress, token) => {
      for (const imgPath of imgPathArray) {
        progress.report({
          message: `Converting ${imgPathArray.indexOf(imgPath)}/${
            imgPathArray.length
          }...`,
        });
        try {
          const imgAbsPath = path.isAbsolute(imgPath)
            ? imgPath
            : path.resolve(path.dirname(markdownFilePath), imgPath);
          await vscode.workspace.fs.stat(vscode.Uri.file(imgAbsPath));
          if (
            path
              .dirname(imgAbsPath)
              .includes(path.join(workspacePath, "attachments"))
          ) {
            await convertToAvif(
              imgAbsPath,
              path.join(workspacePath, "attachments"),
              config
            );
            await vscode.workspace.fs.rename(
              vscode.Uri.file(imgAbsPath),
              vscode.Uri.file(
                path.join(
                  workspacePath,
                  "attachments",
                  ".trash",
                  path.basename(imgAbsPath)
                )
              ),
              { overwrite: true }
            );
            text = text.replace(
              `](${imgPath})`,
              `](${imgPath.replace(path.extname(imgPath), "")}.avif)`
            );
          }
        } catch (e) {
          console.log(e);
          vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
        }
      }
      editor.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          ),
          text
        );
      });
      await editor.document.save();
    }
  );
};
