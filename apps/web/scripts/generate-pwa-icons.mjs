import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public", "icons");

const sizes = [120, 152, 167, 180, 192, 512, 1024];

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

  const appleTouchVariants = [
    { size: 120, file: "apple-touch-icon-120.png" },
    { size: 152, file: "apple-touch-icon-152.png" },
    { size: 167, file: "apple-touch-icon-167.png" },
    { size: 180, file: "apple-touch-icon.png" },
  ];

  await Promise.all(
    appleTouchVariants.map(({ size, file }) =>
      sharp(svg)
        .resize(size, size)
        .png()
        .toFile(path.join(root, "public", file))
    )
  );

  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(root, "public", "apple-touch-icon-precomposed.png"));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
