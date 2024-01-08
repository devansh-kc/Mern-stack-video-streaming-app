// TODO: 1> sabse pahele ye dekhna hai ki user logged in hai ya nahi vo me verify jwt se kar lunga .
// TODO: 2>video me multer se  upload on Cloudinary se kar lunga
// TODO: 3> sabse main cheez user reggisterd hai ya nahi . (agar user is route tak pauch raha hai toh vo registered hi hoga naa )

import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const uploadVideo = asyncHandler(async (req, res) => {
  // TODO:  user jab video dalega tab hi toh ccloudinary par  upload hoga
  // TASK 1> user se video  lena hai
  // TASK 2> clodinary par upload karna hai
  // TASK 3> api response use kar ke message print  karna hai .
  try {
    const { title, description, duration, isPublished } = req.body;
    if (
      [title, description, duration, isPublished].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new APIError(400, "All fields are required");
    }
    console.log(req.files);
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if (!videoFileLocalPath) {
      throw new APIError(400, "Video Local File is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!videoFile) {
      throw new APIError(400, "Video file for cloudinary is required ");
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
      throw new APIError(400, "thumbnail Local File is required");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new APIError(400, "Video file for cloudinary is required ");
    }
    const NewVideo = await Video.create({
      title,
      description,
      duration,
      isPublished,
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      owner: req.user?._id,
    });
    if (!NewVideo) {
      throw new APIError(500, "error while uploading the video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, NewVideo, "Video uploaded successfully"));
  } catch (error) {
    throw new APIError(400, error);
  }
});
const updateThumbnail = asyncHandler(async (req, res) => {
  // TODO: sab se pahele ye dekhna hai ki user logged in hai ya nahi
  // TODO: logged in ho toh hi iska access milega
  // TODO:  phir current thumbnail nikal na hai
  // TODO: Usko change karna hai
  // TODO: previous  vale ko delete karna hai
  try {
    const { id } = req.params;
    const thumbnailLocalPath = req.file?.path;
    console.log(id);
    if (!thumbnailLocalPath) {
      throw new APIError(400, "thumbnail file is missing ");
    }
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(newThumbnail.url);
    if (!newThumbnail.url) {
      throw new APIError(500, "error while updating the thumbnail");
    }

    const video = await Video.findOneAndUpdate(
      id,
      {
        $set: {
          thumbnail: newThumbnail.url,
        },
      },
      { new: true }
    );
  } catch (error) {
    throw new APIError(400, error);
  }
  res
    .status(200)
    .json(new ApiResponse(200, video, "thumbnail successfully changed "));
});
export { uploadVideo, updateThumbnail };
