import fs from "fs-extra";
import chalk from "chalk";

const inputPath = "src/types/storyblok.zod.ts";
const outputOriginalPath = "src/types/storyblok-temp/types-original.zod.ts";
const outputPath = "src/types/storyblok.zod.ts";

const modifyZod = () => {
  if (fs.existsSync(outputOriginalPath)) fs.removeSync(outputOriginalPath);

  // make copy of original file
  fs.copySync(inputPath, outputOriginalPath);

  if (fs.existsSync(outputPath)) fs.removeSync(outputPath);

  const fileContent = fs.readFileSync(outputOriginalPath, "utf8");

  let modifiedContent = fileContent;

  fs.writeFileSync(outputPath, modifiedContent, "utf-8");

  console.log(chalk.green("✅ Zod file modified successfully"));
  // console.log(chalk.gray("· itemRichtextStoryblokSchema modified"));
};

modifyZod();
