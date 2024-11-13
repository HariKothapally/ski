import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  name: String,
  data: Buffer,
  contentType: String,
});

const Image = mongoose.model("Image", imageSchema);
export default Image;
