import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video, Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new APIError(400, "All fields are required");
  }

  // TODO: get video, upload to cloudinary, create video

  // TODO: Uploading Video
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new APIError(400, "Avatar Local file is required");
  }
  const videoURL = await uploadOnCloudinary(videoFileLocalPath);
  if (!videoURL) {
    throw new APIError(400, "Video Local file is required");
  }
  // TODO: Uploading thumbnail
  const ThumbnailFileLocalPath = req.files?.thumbnail[0]?.path;
  if (!ThumbnailFileLocalPath) {
    throw new APIError(400, "Avatar Local file is required");
  }
  const thumbnailURL = await uploadOnCloudinary(ThumbnailFileLocalPath);
  if (!thumbnailURL) {
    throw new APIError(400, "Thumbnail Local file is required");
  }
  const Video = await Video.create({
    title,
    description,
    videoFile: videoURL.url,
    thumbnail: thumbnailURL.url,
    duration: videoURL.duration(),
    views: 0,
    isPublished: true,
    owner: req.user._id,
  });
  if (!Video) {
    throw new APIError(500, "error while  uploading the video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
