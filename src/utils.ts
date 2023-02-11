import * as vscode from "vscode";
import * as path from "path";
import { execSync } from "child_process";

export interface StringKeyObject {
  [key: string]: StringKeyObject | { [key: string]: never };
}

export const genNewNotePath = async (
  categories: StringKeyObject
): Promise<string> => {
  if (Object.keys(categories).length === 0) {
    vscode.window.showErrorMessage(
      "No categories defined. Please add some at .vscode/settings.json"
    );
    return "";
  }
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

// function that get img file path and convert it to webp by using ffmepg cli and save
// see https://imagemagick.org/script/webp.php
export const convertToWebp = async (
  imgPath: string,
  outputDir: string,
  lossless: boolean = false,
  quality: number = 80
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const webpPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.webp`;
  execSync(
    `magick "${imgPath}" -define webp:lossless=${lossless} -define webp:quality=${quality} "${webpPath}"`
  );
};

// function that get img file path and convert it to avif and save
export const convertToAvif = async (
  imgPath: string,
  outputDir: string,
  quality: number = 80
) => {
  const imgNameWithoutExt = path
    .basename(vscode.Uri.file(imgPath).fsPath)
    .split(".")[0];
  const avifPath =
    vscode.Uri.file(outputDir).fsPath + `/${imgNameWithoutExt}.avif`;
  execSync(`magick "${imgPath}" -define avif:quality=${quality} "${avifPath}"`);
};

export const getSettingsJsonString = () => {
  return `{
{
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

export const getRecommendedExtensions = () => {
  return `{
  // List of extensions which should be recommended for users of this extension.
  "recommendations": [
    "yzhang.markdown-all-in-one",
    "shd101wyy.markdown-preview-enhanced",
    "mushan.vscode-paste-image"
  ]
}
  `;
};
