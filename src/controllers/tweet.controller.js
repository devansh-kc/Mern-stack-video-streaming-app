import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // TODO: i have to find current user
  // TODO: by useing findByID (req.user._id) and after that i will store it in a var and
  // TODO : while creating the tweet i will put the user in owner .
  const { content } = req.body;

  try {
    if (!content) {
      throw new APIError(404, "content is required");
    }
    const loggedInUser = await User.findById(req.user?._id);

    const tweet = await Tweet.create({
      owner: loggedInUser?._id,
      content,
    });

    res.status(200).json(new ApiResponse(200, tweet, "Tweet created"));
  } catch (error) {
    throw new APIError(500, "something went wrong while uploading tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) {
    throw new APIError(400, "user Id is required ");
  }
  if (!isValidObjectId(userId)) {
    throw new APIError(404, "User id is not valid ");
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new APIError(404, "User not found ");
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: user?._id,
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, userTweets, "user tweets fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  try {
    if (!tweetId) {
      throw new APIError(404, "tweetId is required");
    }
    if (!isValidObjectId(tweetId)) {
      throw new APIError(404, "this tweet doesn't exists anymore ");
    }
    if (!content) {
      throw new APIError(404, "content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (tweet.owner?.toString() != req.user?._id.toString()) {
      throw new APIError(
        400,
        "you are not allowed to update tweet because this is not created by you "
      );
    } else {
      const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
          $set: {
            content: content,
          },
        },
        { new: true }
      );
      res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "tweet updated "));
    }
  } catch (error) {
    throw new APIError(500, "Something went wrong while updating the video ");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new APIError(400, "tweet id is required");
  }
  if (!isValidObjectId(tweetId)) {
    throw new APIError(400, "tweet id is not valid");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new APIError(400, "tweet doesn't exists ");
  }
  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new APIError(400, "you cannot delete this tweet");
  }
  try {
    await Tweet.findByIdAndDelete(tweetId);
    res.status(200).json(new ApiResponse(200, {}, "tweet has been deleted "));
  } catch (error) {
    throw new APIError(500, "something went wrong while deleting the tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
