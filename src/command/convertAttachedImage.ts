import * as vscode from "vscode";
import * as path from "path";

import { execSync } from "child_process";

// function that get img file path and convert it to webp by using ffmepg cli and save
// see https://imagemagick.org/script/webp.php
const convertToWebp = async (
  imgPath: string,
  outputDir: string,
  quality: number,
  lossless: boolean,
  nearLossless: number
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const webpPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.webp`;
  execSync(
    `magick "${imgPath}" -define webp:lossless=${
      lossless ? "true" : "false"
    } -define webp:near-lossless=${nearLossless} -define webp:quality=${quality} "${webpPath}"`
  );
};

// function that get img file path and convert it to avif and save
const convertToAvif = async (
  imgPath: string,
  outputDir: string,
  quality: number,
  lossless: boolean
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const avifPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.avif`;
  execSync(
    `magick "${imgPath}" -define avif:quality=${quality} -define avif:lossless=${
      lossless ? "true" : "false"
    } "${avifPath}"`
  );
};

export const convertAttachedImage = async () => {
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
    imgPathArray = imgPathArray.filter((imgPath) => {
      return !imgPath.endsWith(".webp");
    });
    const config = vscode.workspace.getConfiguration(
      "vscode-note-taking-extension.webp"
    );
    const quality = config.get("quality") as number;
    const lossless = config.get("lossless") as boolean;
    const nearLossless = config.get("nearLossless") as number;
    for (const imgPath of imgPathArray) {
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
            quality,
            lossless,
            nearLossless
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
  } else if (webpOrAvif === "AVIF") {
    imgPathArray = imgPathArray.filter((imgPath) => {
      return !imgPath.endsWith(".avif");
    });
    const config = vscode.workspace.getConfiguration(
      "vscode-note-taking-extension.avif"
    );
    const quality = config.get("quality") as number;
    const lossless = config.get("lossless") as boolean;

    for (const imgPath of imgPathArray) {
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
            quality,
            lossless
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
          return match.replace(p1, p1.replace(/\.[^/.]+$/, ".avif"));
        })
      );
      editor.document.save();
    });
  }
};
