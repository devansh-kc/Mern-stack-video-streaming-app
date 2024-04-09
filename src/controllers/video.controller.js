import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const sortTypeNum = Number(sortType) || -1;
  if (userId && !isValidObjectId(userId)) {
    throw new APIError(400, "User Id is not valid");
  }
  // for aggregation
  /*
  (1)fiter on the basis 
  (a)whether the user exists
  (b)whether video is published or not
  (c)of given query
  (2)added sortby:
  (a)by adding a field for the sort by info
  (b)if no sortby than add createdAt
  (c)sort with sortby passing sortTypeNum
  (3)get videos, owner, matchedVideosCount
  (a)for pagination skip (page-1)*limit and then limit=limit
  (b)use lookup for users  to get username, avatar, createdAt, updatedAt of the creator of the video
  (c)use $count 
  */
  try {
    await Video.createIndexes({ title: "text", description: "text" });

    const getVideos = await Video.aggregate([
      {
        $match: {
          owner: userId ? userId : "",
          isPublished: true,

          $text: {
            $search: query ? query : "",
          },
        },
      },
      {
        $addFields: {
          sortFields: { $toString: "$" + (sortBy || "createdAt") },
        },
      },
      {
        $facet: {
          videos: [
            {
              $sort: { sortFields: sortTypeNum },
            },
            {
              $skip: (pageNum - 1) * limitNum,
            },
            {
              $limit: limitNum,
            },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                      createdAt: 1,
                      updatedAt: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$ownerDetails",
                },
              },
            },
          ],
          matchedVideoCount: [
            {
              $count: "videos",
            },  
          ],
        },
      },
    ]);
    res.status(200).json(new ApiResponse(200, getVideos, "videos fetched"));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while fetching the  videos "
    );
  }
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
  const video = await Video.create({
    title,
    description,
    videoFile: videoURL.url,
    thumbnail: thumbnailURL.url,
    duration: videoURL.duration,
    views: 0,
    isPublished: true,
    owner: req.user._id,
  });
  if (!video) {
    throw new APIError(500, "error while  uploading the video");
  } else {
    res
      .status(200)
      .json(new ApiResponse(200, video, "video has been uploaded "));
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  // TODO: check  , is it valid object id or not , after that find the document ,
  // TODO: after finding the document use aggregations to show the number of likes and comments
  // and thats it
  // 3- add owner,likes, comments, subscribers and subscription and like status of this user
  if (!videoId) {
    throw new APIError(400, "VideoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new APIError(400, "Video id is not valid ");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIError(404, "this video doesn't exists anymore ");
  } else {
    await Video.findByIdAndUpdate(videoId, {
      $inc: { views: 1 },
    });
  }
  const getCommentsAndLikeFortheRequestedVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
      },
    },
    {
      $facet: {
        getVideoDetails: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner_details",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner_details: {
                $first: "$owner_details",
              },
            },
          },
        ],
        getLikeCommentAndSubscription: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likedByUser: {
                $in: [req.user?._id, "$likes.likedBy"],
              },
              totalNumberOfLikes: {
                $sum: { $size: "$likes" },
              },
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "Comments",
            },
          },
          {
            $addFields: {
              totalNumberOfComments: {
                $sum: {
                  $size: "$Comments",
                },
              },
            },
          },
        ],
      },
    },
    // TODO: I have to work after working on the subscription controller.
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getCommentsAndLikeFortheRequestedVideo,
        "details fetched"
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnail = req.file?.path;
  try {
    if (!videoId) {
      throw new APIError(400, "Video id is required");
    }

    if (!isValidObjectId(videoId)) {
      throw new APIError(400, "the Video id is not valid");
    }

    const video = await Video.findById(videoId);

    if (video.owner.toString() != req.user._id.toString()) {
      throw new APIError(400, "you are not allowed to update this video ");
    }
    await deleteFromCloudinary(video.thumbnail);
    const updatedImage = await uploadOnCloudinary(thumbnail);
    const updatedDetails = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          thumbnail: updatedImage.url,
          title,
          description,
        },
      },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, "the data has been updated", updatedDetails));
  } catch (error) {
    throw new APIError(400, error, "error from update video ");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  // TODO: check  that the id is valid or not
  // TODO:  id the id is valid   get the collection based on id
  // TODO: match the user id and owner id in video model
  //  TODO: if it matches delete the collection and delete the image and video by using the delete method

  try {
    if (!isValidObjectId(videoId)) {
      throw new APIError(400, "invalid video");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new APIError(400, "this video does not exists");
    }

    const videoFile = video.videoFile;
    const thumbnail = video.thumbnail;
    if (video.owner.toString() != req.user._id.toString()) {
      throw new APIError(400, "you are not allowed to delte this video ");
    } else {
      await deleteFromCloudinary(videoFile);
      await deleteFromCloudinary(thumbnail);
      await Comment.deleteMany({ video: videoId });
      await Like.deleteMany({ video: videoId });
      await await Video.findByIdAndDelete(videoId);
    }
    res.status(200).json(new ApiResponse(200, "Video Successfully  deleted "));
  } catch (error) {
    throw new APIError(400, error);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new APIError(400, "videoId is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new APIError(400, "Vidoe id is not valid");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIError(404, "this video doesn't exists");
  }
  try {
    if (video.owner.toString() != req.user._id) {
      throw new APIError(
        400,
        "you can not change the publish status of this video"
      );
    } else {
      const updatedStatus = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: {
            isPublished: !video.isPublished,
          },
        },
        { new: true }
      );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedStatus,
            "video published status changed successfully"
          )
        );
    }
  } catch (error) {
    throw new APIError(
      500,
      error,
      "something went wrong while changing status "
    );
  }
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
