const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

const generateRandomString = () => {
  const strings = ["Perusperjantai petosella", "Aram moment"];
  const randomIndex = Math.floor(Math.random() * strings.length);
  return strings[randomIndex];
};

const memeCommand = async (interaction) => {
  const memeFolderPath = "./Images";

  try {
    // Check if the meme folder exists
    if (!fs.existsSync(memeFolderPath)) {
      throw new Error(`Meme folder not found: ${memeFolderPath}`);
    }

    // Get a list of image files in the folder, filtering for supported formats
    const imageFiles = fs.readdirSync(memeFolderPath).filter((file) => {
      const ext = file.split(".").pop().toLowerCase();
      return ["png", "jpg", "jpeg"].includes(ext);
    });

    // Check if there are any images in the folder
    if (imageFiles.length === 0) {
      throw new Error("No meme images found in the folder.");
    }

    // Select a random image from the list
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const randomImagePath = `${memeFolderPath}/${imageFiles[randomIndex]}`;

    // Generate random top text
    const randomString = generateRandomString();

    // Load the random image
    const memeImage = await loadImage(randomImagePath);

    const canvas = createCanvas(memeImage.width, memeImage.height);
    const ctx = canvas.getContext("2d");

    // Draw the image
    ctx.drawImage(memeImage, 0, 0, memeImage.width, memeImage.height);

    // Draw top text with white background
    const text = randomString.toUpperCase(); // Ensure text is uppercase
    ctx.font = "bold 50px Impact"; // Increased font size to 50px
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    // Measure text dimensions
    const textX = canvas.width / 2;
    const textY = 60; // Adjusted position for larger text
    const textWidth = ctx.measureText(text).width;
    const textHeight = 50; // Adjusted height for larger text

    // Draw background rectangle with padding
    ctx.fillRect(textX - textWidth / 2 - 10, textY - textHeight / 2, textWidth + 20, textHeight + 10);

    // Draw the text in black
    ctx.fillStyle = "black";
    ctx.fillText(text, textX, textY + textHeight / 2 - 10); // Adjusted position to center the text vertically

    // Convert the canvas to a buffer for sending
    const memeBuffer = canvas.toBuffer("image/png");

    const interactionReply = {
      content: "Here's your meme!",
      files: [new AttachmentBuilder(memeBuffer, { name: "meme.png" })],
    };

    await interaction.reply(interactionReply); // Reply with the meme

  } catch (error) {
    console.error("Error sending meme command:", error);
    await interaction.reply(
      "An error occurred while sending the meme. Please check the logs for details."
    );
  }
};

module.exports = memeCommand;
