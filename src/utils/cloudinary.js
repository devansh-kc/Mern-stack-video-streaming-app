import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { APIError } from "./apiError.js";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// console.log(cloudinary.api);
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("Could not find the path");
      return null;
    }
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull

    // console.log("file is uploaded on cloudinary",response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error in uploading image on clodinary", error);
    fs.unlinkSync(localFilePath); //It will remove the locallly saved temp file as the operation fails
    return null;
  }
};

const deleteFromCloudinary = async (filePath) => {
  try {
    if (!filePath) null;

    await cloudinary.uploader.destroy(
      filePath.split("/").pop().split(".")[0],
      (error) => {
        if (error) {
          throw new APIError(404, error, "Image not found");
        }
      }
    );
  } catch (error) {
    console.log("error from cloudinay :", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
