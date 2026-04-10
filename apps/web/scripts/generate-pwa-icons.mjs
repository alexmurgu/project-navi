import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public", "icon.svg");
const touchSvgPath = path.join(root, "public", "icon.svg");
const outDir = path.join(root, "public", "icons");

const sizes = [120, 152, 167, 180, 192, 512, 1024];

const main = async () => {
  await fs.mkdir(outDir, { recursive: true });
  const svg = await fs.readFile(svgPath);
  const touchSvg = await fs.readFile(touchSvgPath);

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
      sharp(touchSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(root, "public", file))
    )
  );

  await sharp(touchSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(root, "public", "apple-touch-icon-precomposed.png"));

  await sharp(touchSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(root, "public", "navi-touch-icon.png"));

  await sharp(touchSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(root, "public", "navi-touch-icon-precomposed.png"));

  const splashSizes = [
    { width: 828, height: 1792, file: "ios-splash-828x1792.png" },
    { width: 1125, height: 2436, file: "ios-splash-1125x2436.png" },
    { width: 1170, height: 2532, file: "ios-splash-1170x2532.png" },
    { width: 1179, height: 2556, file: "ios-splash-1179x2556.png" },
    { width: 1290, height: 2796, file: "ios-splash-1290x2796.png" },
  ];

  await Promise.all(
    splashSizes.map(async ({ width, height, file }) => {
      const base = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: "#F5FBFA",
        },
      });

      const iconSize = Math.round(Math.min(width, height) * 0.16);
      const iconBuffer = await sharp(svg)
        .resize(iconSize, iconSize, { fit: "contain" })
        .png()
        .toBuffer();

      await base
        .composite([
          {
            input: iconBuffer,
            left: Math.round((width - iconSize) / 2),
            top: Math.round((height - iconSize) / 2) - Math.round(height * 0.06),
          },
        ])
        .png()
        .toFile(path.join(root, "public", file));
    })
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
