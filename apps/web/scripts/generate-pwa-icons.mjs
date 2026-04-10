import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public", "icons");

const sizes = [180, 192, 512];

const main = async () => {
  await fs.mkdir(outDir, { recursive: true });
  const svg = await fs.readFile(svgPath);

  await Promise.all(
    sizes.map((size) =>
      sharp(svg)
        .resize(size, size)
        .png()
        .toFile(path.join(outDir, `icon-${size}.png`))
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
