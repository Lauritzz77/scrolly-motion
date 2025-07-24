import fs from "fs-extra";
import path from "path";
import "dotenv/config";

interface TypographyComponent {
  name?: string;
  type: "" | "headline" | "body" | "display";
  fontSizeMobile: string;
  fontSizeDesktop: string;
  lineHeightMobile: string;
  lineHeightDesktop: string;
  _uid: string;
  component: "Typography";
  [k: string]: any;
}

interface StoryblokComponent {
  name: string;
  schema: {
    [key: string]: any;
  };
}

interface StoryblokData {
  components: StoryblokComponent[];
}

function generateClampValue(
  minValue: number,
  maxValue: number,
  minVw: number = 320,
  maxVw: number = 1440
): string {
  const factor = (maxValue - minValue) / (maxVw - minVw);
  const calcValue = `${(minValue - minVw * factor).toFixed(4)}px + ${(
    factor * 100
  ).toFixed(4)}vw`;

  const minClamp = Math.min(minValue, maxValue);
  const maxClamp = Math.max(minValue, maxValue);

  return `clamp(${minClamp}px, calc(${calcValue}), ${maxClamp}px)`;
}

function generateTypographyCSS(typography: TypographyComponent[]): string {
  let css = "@layer utilities {\n";

  typography.forEach((item) => {
    if (!item.name || !item.type) return;

    const className = `.text-${item.type}-${item.name}`;
    const fontSize = generateClampValue(
      parseInt(item.fontSizeMobile),
      parseInt(item.fontSizeDesktop)
    );
    const lineHeight = generateClampValue(
      parseInt(item.lineHeightMobile),
      parseInt(item.lineHeightDesktop)
    );

    css += `  ${className} {\n`;
    css += `    font-size: ${fontSize};\n`;
    css += `    line-height: ${lineHeight};\n`;
    css += `    font-weight: ${item.fontWeight || "normal"};\n`;
    css += `  }\n`;
  });

  css += "}\n";
  return css;
}

async function fetchStoryblokContent() {
  const spaceId = process.env.STORYBLOK_SPACE_ID;
  const token = process.env.STORYBLOK_TOKEN;
  const startsWith =
    process.env.STORYBLOK_STARTS_WITH_FOLDER_CONTENT || "dot-com";

  if (!spaceId || !token) {
    console.log(
      "⚠️  Storyblok credentials not found, using default typography"
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://api.storyblok.com/v2/cdn/stories?token=${token}&starts_with=${startsWith}&content_type=TemplateConfig`
    );

    if (!response.ok) {
      throw new Error(`Storyblok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.stories;
  } catch (error) {
    console.log(
      "⚠️  Failed to fetch from Storyblok API, using default typography"
    );
    return null;
  }
}

async function main() {
  try {
    let typographyData: TypographyComponent[] = [];

    // Try to fetch actual content from Storyblok
    const stories = await fetchStoryblokContent();
    if (stories && stories.length > 0) {
      // Look for TemplateConfig stories with typography data
      for (const story of stories) {
        if (story.content && story.content.typography) {
          const storyTypography = story.content.typography;

          for (const typo of storyTypography) {
            if (
              typo.name &&
              typo.type &&
              typo.fontSizeMobile &&
              typo.fontSizeDesktop
            ) {
              typographyData.push({
                name: typo.name,
                type: typo.type,
                fontSizeMobile: typo.fontSizeMobile,
                fontSizeDesktop: typo.fontSizeDesktop,
                lineHeightMobile: typo.lineHeightMobile,
                lineHeightDesktop: typo.lineHeightDesktop,
                fontWeight: typo.weight || "normal",
                _uid: typo._uid,
                component: "Typography",
              });
            }
          }
        }
      }

      if (typographyData.length > 0) {
        console.log(
          `📖 Found ${typographyData.length} typography definitions from Storyblok`
        );
      }
    }

    if (typographyData.length === 0) {
      console.error("❌ Error no typography data found");
    }

    // Generate the CSS
    const css = generateTypographyCSS(typographyData);

    // Write the CSS file
    const outputPath = path.join(
      process.cwd(),
      "src/assets/styles/typography.css"
    );
    await fs.writeFile(outputPath, css);

    console.log(`✅ Typography CSS generated successfully at ${outputPath}`);
    console.log(`Generated ${typographyData.length} typography classes`);
  } catch (error) {
    console.error("❌ Error generating typography CSS:", error);
    process.exit(1);
  }
}

main();
