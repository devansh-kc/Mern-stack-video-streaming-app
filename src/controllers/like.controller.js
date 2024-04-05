import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  try {
    if (!isValidObjectId(videoId)) {
      throw new APIError(404, "Video Id is required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new APIError(404, "video id doesn't exists");
    }
    const loggedInUser = req.user?._id;
    const existingLike = await Like.findOne({
      likedBy: loggedInUser,
      video: video._id,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      res.status(200).json(new ApiResponse(200, "removed Like"));
    } else {
      const LikedVideo = await Like.create({
        video: videoId,
        likedBy: loggedInUser,
      });

      res
        .status(200)
        .json(new ApiResponse(200, LikedVideo, "video added to Like "));
    }
  } catch (error) {
    throw new APIError(500, error, "something went wrong");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new APIError(404, "Object id is not valid");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new APIError("This comment doesn't exists");
  }
  const loggedInUser = req.user?._id;
  const existingLike = await Like.findOne({
    likedBy: loggedInUser,
    comment: comment._id,
  });
  try {
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      res.status(200).json(new ApiResponse(200, "Like from comment removed "));
    } else {
      const addedCommentLike = await Like.create({
        comment: commentId,
        likedBy: loggedInUser,
      });
      res
        .status(200)
        .json(
          new ApiResponse(200, addedCommentLike, "Like in the comments added ")
        );
    }
  } catch (error) {
    throw new APIError(500, error, "Something went wrong ");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) {
    throw new APIError(400, "tweet id is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new APIError(400, "this tweet id is not valid ");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new APIError(400, "this tweet doesn't exists anymore");
  }
  const loggedInUser = req.user?._id;
  const existingLike = await Like.findOne({
    likedBy: loggedInUser,
    tweet: tweet._id,
  });

  try {
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      res
        .status(200)
        .json(new ApiResponse(200, {}, "Like from tweet removed "));
    } else {
      const tweetLike = await Like.create({
        tweet: tweetId,
        likedBy: loggedInUser,
      });
      res.status(200).json(new ApiResponse(200, tweetLike, "tweet Liked"));
    }
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while liking the tweet "
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
