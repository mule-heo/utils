#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "Usage: node image-format-converter.js <input-file> <output-file>"
    );
    console.log("");
    console.log("Supported formats: jpg, jpeg, png, gif, webp");
    console.log("");
    console.log("Examples:");
    console.log("  node image-format-converter.js input.png output.jpg");
    console.log("  node image-format-converter.js photo.jpg photo.webp");
    console.log("  node image-format-converter.js image.gif image.png");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  return { inputFile, outputFile };
}

function getFormatFromExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);

  const formatMap = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    gif: "gif",
    webp: "webp",
  };

  if (!formatMap[ext]) {
    throw new Error(
      `Unsupported format: ${ext}. Supported formats: ${Object.keys(
        formatMap
      ).join(", ")}`
    );
  }

  return formatMap[ext];
}

function validateInputFile(inputFile) {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file does not exist: ${inputFile}`);
  }

  if (!fs.statSync(inputFile).isFile()) {
    throw new Error(`Input path is not a file: ${inputFile}`);
  }
}

function ensureOutputDirectory(outputFile) {
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

async function convertImage(inputFile, outputFile) {
  try {
    validateInputFile(inputFile);

    const outputFormat = getFormatFromExtension(outputFile);

    ensureOutputDirectory(outputFile);

    console.log(`Converting ${inputFile} to ${outputFile} (${outputFormat})`);

    let sharpInstance = sharp(inputFile);

    switch (outputFormat) {
      case "jpeg":
        sharpInstance = sharpInstance.jpeg({
          quality: 90,
          progressive: true,
        });
        break;
      case "png":
        sharpInstance = sharpInstance.png({
          compressionLevel: 6,
          progressive: true,
        });
        break;
      case "webp":
        sharpInstance = sharpInstance.webp({
          quality: 90,
          effort: 4,
        });
        break;
      case "gif":
        sharpInstance = sharpInstance.gif();
        break;
    }

    await sharpInstance.toFile(outputFile);

    const inputStats = fs.statSync(inputFile);
    const outputStats = fs.statSync(outputFile);

    console.log("✅ Conversion completed successfully!");
    console.log(`📁 Input:  ${inputFile} (${formatBytes(inputStats.size)})`);
    console.log(`📁 Output: ${outputFile} (${formatBytes(outputStats.size)})`);

    const sizeDiff = outputStats.size - inputStats.size;
    const sizePercent = ((sizeDiff / inputStats.size) * 100).toFixed(1);

    if (sizeDiff > 0) {
      console.log(
        `📊 Size change: +${formatBytes(sizeDiff)} (+${sizePercent}%)`
      );
    } else if (sizeDiff < 0) {
      console.log(`📊 Size change: ${formatBytes(sizeDiff)} (${sizePercent}%)`);
    } else {
      console.log(`📊 Size change: No change`);
    }
  } catch (error) {
    console.error("❌ Conversion failed:", error.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function main() {
  try {
    const { inputFile, outputFile } = parseArguments();
    await convertImage(inputFile, outputFile);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

module.exports = {
  convertImage,
  getFormatFromExtension,
  formatBytes,
};

if (require.main === module) {
  main();
}
