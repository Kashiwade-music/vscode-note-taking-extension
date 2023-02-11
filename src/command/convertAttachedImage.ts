import * as vscode from "vscode";
import * as path from "path";

import { execSync } from "child_process";

// function that get img file path and convert it to webp by using libvips cli and save
// see $ vips webpsave
const convertToWebp = async (
  imgPath: string,
  outputDir: string,
  config: vscode.WorkspaceConfiguration
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const webpPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.webp`;
  const command = `vips webpsave "${imgPath}" "${webpPath}" --Q ${config.get(
    "quality"
  )} ${config.get("lossless") ? "--lossless" : ""} ${
    config.get("smart-subsample") ? "--smart-subsample" : ""
  } ${
    config.get("near-lossless") ? "--near-lossless" : ""
  } --alpha-q ${config.get("alpha-quality")} --effort ${config.get("effort")}`;
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
  const command = `vips heifsave "${imgPath}" "${avifPath}" --Q ${config.get(
    "quality"
  )} ${
    config.get("lossless") ? "--lossless" : ""
  } --compression av1 --effort ${config.get("effort")}`;
  execSync(command);
};

export const convertAttachedImage = async () => {
  // check we can use vips
  try {
    execSync("vips --version");
  } catch (e) {
    vscode.window.showErrorMessage(
      "Please install libvips before converting. Please see https://www.libvips.org/install.html"
    );
    return;
  }

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
  const webpOrAvif = await vscode.window.showQuickPick(["WebP", "AVIF"], {
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

  if (webpOrAvif === "WebP") {
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
                )
              );
            }
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
      }
    );
  } else if (webpOrAvif === "AVIF") {
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
                )
              );
            }
          } catch (e) {
            console.log(e);

            vscode.window.showErrorMessage(`Failed to convert ${imgPath}.`);
          }
        }
      }
    );
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
};
