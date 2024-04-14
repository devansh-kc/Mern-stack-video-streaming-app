import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const loggedInUser = req.user._id;
  try {
    const videoStat = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(loggedInUser),
        },
      },
      {
        $facet: {
          likesAndComments: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likesOnVideo",
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
              },
            },
            {
              $group: {
                _id: null,
                totalVideoCount: { $sum: 1 },
                totalViewsCountOnVideo: { $sum: "$views" },
                totalLikeCountOnVideo: { $sum: { $size: ["$likesOnVideo"] } },
                totalCommentCountOnVideo: { $sum: { $size: ["$comments"] } },
              },
            },
          ],
        },
      },
    ]);

    const subscriptionStat = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(loggedInUser),
        },
      },
      {
        $group: {
          _id: null,
          SubscriberCount: { $sum: 1 },
        },
      },
    ]);
    const combinedStat = {
      ...videoStat[0],
      ...subscriptionStat[0],
    };
    res
      .status(200)
      .json(new ApiResponse(200, combinedStat, "user details fetched "));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while getting details "
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const loggedInUser = req.user._id;
  try {
    const channelVideo = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(loggedInUser),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "Likes",
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
          numberOfLike: {
            $size: "$Likes",
          },
        },
      },
      {
        $addFields: {
          numberOfComment: {
            $size: "$Comments",
          },
        },
      },
    ]);

    if (!channelVideo?.length) {
      throw new APIError(400, "you haven't uploadded any video");
    }
    res.status(200).json(new ApiResponse(200, channelVideo, "Videos fetched "));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while getting videos "
    );
  }
});

export { getChannelStats, getChannelVideos };
