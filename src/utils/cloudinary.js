import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { APIError } from "./apiError.js";

cloudinary.config({
  cloud_name: "dcjh2tkr8",
  api_key: "537454131721289",
  api_secret: "0VKaZAwG0A5ZRq1eueyqrQ4gtgE",
});
// console.log(cloudinary.api);
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (filePath) => {
  try {
    if (!filePath) null;

     await cloudinary.uploader.destroy(
      filePath.split('/').pop().split(".")[0],
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
