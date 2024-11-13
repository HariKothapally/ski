import Image from "../models/imageModel.js";
import FormData from "form-data";
import axios from "axios";

export const uploadImage = async (req, res) => {
  try {
    const newImage = new Image({
      name: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });

    await newImage.save();
    res
      .status(201)
      .json({ message: "Image uploaded successfully", imageId: newImage._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading image" });
  }
};

export const getImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.imageId);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving image" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.imageId);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting image" });
  }
};

export const referbilltoGemini = async (req, res) => {
  try {
    const GEMINI_API_URL = "https://api.gemini.com/v1/completions"; // Replace if necessary
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const formData = new FormData();
    formData.append("prompt", req.body.prompt || "Describe this image");
    formData.append("image", req.file.buffer, {
      // Use req.file.buffer directly
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.buffer.length,
    });

    const response = await axios.post(GEMINI_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error interacting with Gemini:",
      error.response?.data || error.message,
    );
    res.status(500).json({ message: "Error interacting with Gemini API" });
  }
};
