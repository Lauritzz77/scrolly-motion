import chalk from "chalk";
import fs from "fs-extra";

const inputPath = "src/types/storyblok-temp/types-original.d.ts";
const outputPath = "src/types/storyblok.d.ts";

const changes = [
  // Asset storyblok (diff: source used to be optional; filename used to be null or string)
  {
    description: "AssetStoryblok has changed, so we want to support both old and new structure",
    from: `
export interface AssetStoryblok {
  _uid?: string;
  id: number | null;
  alt: string | null;
  name: string;
  focus: string | null;
  source: string | null;
  title: string | null;
  filename: string;
  copyright: string | null;
  fieldtype?: string;
  meta_data?: null | {
    [k: string]: any;
  };
  is_external_url?: boolean;
  [k: string]: any;
}`,
    to: `
export interface AssetStoryblok {
  _uid?: string;
  id: number | null;
  alt: string | null;
  name: string;
  focus: string | null;
  source?: string | null;
  title: string | null;
  filename: string | null;
  copyright: string | null;
  fieldtype?: string;
  meta_data?: null | {
    [k: string]: any;
  };
  is_external_url?: boolean;
  [k: string]: any;
}`,
  },
  // Multiasset storyblok api has also changed
  {
    description: "MultiassetStoryblok has changed, so we want to support both old and new structure",
    from: `
export type MultiassetStoryblok = {
  _uid?: string;
  id: number | null;
  alt: string | null;
  name: string;
  focus: string | null;
  source: string | null;
  title: string | null;
  filename: string;
  copyright: string | null;
  fieldtype?: string;
  meta_data?: null | {
    [k: string]: any;
  };
  [k: string]: any;
}[];`,
    to: `
export type MultiassetStoryblok = {
  _uid?: string;
  id: number | null;
  alt: string | null;
  name: string;
  focus: string | null;
  source?: string | null;
  title: string | null;
  filename: string;
  copyright: string | null;
  fieldtype?: string;
  meta_data?: null | {
    [k: string]: any;
  };
  [k: string]: any;
}[];`,
  },
  {
    description: "Author related content types are not generated correctly",
    from: `related?: ("" | "article" | "essay" | "news" | "podcast" | "video" | "sound" | "author" | "book")[];`,
    to: `related?: ("" | "article" | "essay" | "news" | "podcast" | "video" | "sound" | "author" | "book" | "readclub" | "readandtalk" | "interview")[];`,
  },
  {
    description: "Author oplevExist (show in search results) is not generated correctly",
    from: `oplevExist: "true" | "False";`,
    to: `oplevExist: "true" | "False" | "";`,
  },
  {
    description: "Book related content types are not generated correctly",
    from: `related?: ("" | "")[];`,
    to: `related?: ("" | "article" | "essay" | "news" | "podcast" | "video" | "sound" | "author" | "book" | "readclub" | "readandtalk" | "interview")[];`,
  },
];

const modifyTs = () => {
  if (fs.existsSync(outputPath)) fs.removeSync(outputPath);

  const fileContent = fs.readFileSync(inputPath, "utf8");

  // replace `Exclude` types
  const excludeRegex = /Exclude<(.+),(.+)>/g;
  let modifiedContent = fileContent.replaceAll(excludeRegex, "$1");

  // replace StoryblokStory type - will be 'any' in zod anyway
  const toReplace = `import {StoryblokStory} from 'storyblok-generate-ts'`;
  const replaceWith = `interface StoryblokStory {
  name: string;
  created_at: string;
  published_at: string;
  id: number;
  uuid: string;
  content: any;
  slug: string;
  full_slug: string;
  sort_by_date: string | null;
  position: number;
  tag_list: string[];
  is_startpage: boolean;
  parent_id: number;
  meta_data: any;
    group_id: string;
    first_published_at: string | null;
    release_id?: number | null;
    lang: string;
    path?: string;
    alternates: {
        id: number;
        name: string;
        slug: string;
        published: boolean;
        full_slug: string;
        is_folder: boolean;
        parent_id: number;
    }[];
    default_full_slug: string;
    translated_slugs: {
        path: string;
        name: string | null;
        lang: string;
    }[];
    _stopResolving?: boolean;
}`;
  modifiedContent = modifiedContent.replace(toReplace, replaceWith);

  changes.forEach(({ from, to }) => {
    modifiedContent = modifiedContent.replaceAll(from, to);
  });

  fs.writeFileSync(outputPath, modifiedContent, "utf-8");

  console.log(chalk.green("✅ ts types file modified successfully"));
  console.log(chalk.gray("· StoryblokStory type replaced with 'any'"));
  changes.forEach(({ description }) => console.log(chalk.gray(`· ${description}`)));
};

modifyTs();
