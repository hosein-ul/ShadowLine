const jimpLib = require("jimp");

async function run() {
  const JimpClass = jimpLib.Jimp || jimpLib;
  console.log("Reading image...");
  const image = await JimpClass.read("public/logo-text.jpg");
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  console.log("Image loaded:", width, "x", height);

  // Sample top-left corner as background color reference
  const bgR = image.bitmap.data[0];
  const bgG = image.bitmap.data[1];
  const bgB = image.bitmap.data[2];
  console.log("Background color sample:", bgR, bgG, bgB);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];

      // Euclidean distance from background color
      const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
      
      if (dist < 40) {
        image.bitmap.data[idx + 3] = 0; // 100% transparent
      } else if (dist < 80) {
        // Smooth alpha edge transition
        image.bitmap.data[idx + 3] = Math.floor(((dist - 40) / 40) * 255);
      }
    }
  }

  console.log("Saving transparent PNG...");
  if (typeof image.writeAsync === "function") {
    await image.writeAsync("public/logo-text-transparent.png");
  } else if (typeof image.write === "function") {
    await image.write("public/logo-text-transparent.png");
  }
  console.log("Successfully created public/logo-text-transparent.png!");
}

run().catch(err => {
  console.error("Error processing image:", err);
  process.exit(1);
});
