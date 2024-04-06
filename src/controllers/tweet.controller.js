import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

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
  /*
    1-get userId and match for owner id in  tweet collection
    2-add total liked, content,owner, created at and updated at to each tweet
    3-get tweet owner datails
    4-add tweet and tweet owner details inside TweetListAndOwner
    3- send res
    */
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
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetLikedBy",
      },
    },
    {
      $group: {
        _id: "$_id",
        owner: { $first: "$owner" },

        content: { $first: "$content" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        totalNumberOfLikes: {
          $sum: { $size: "$tweetLikedBy" },
        },
      },
    },
  ]);
  const tweetLikedByUser = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $addFields: {
        istweetOwner: {
          $cond: {
            if: { $eq: [req.user?._id.toString(), userId] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        avatar: 1,
        createdAt: 1,
        updatedAt: 1,
        istweetOwner: 1,
      },
    },
  ]);
  const TweetListAndOwner = {
    userTweets,
    tweetLikedByUser,
  };
  res
    .status(200)
    .json(new ApiResponse(200, TweetListAndOwner, "user tweets fetched"));
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
  // TODO: before deleting the tweet also delete the likes

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
    await Like.deleteMany({ tweet: tweet._id });
    await Tweet.findByIdAndDelete(tweetId);

    res.status(200).json(new ApiResponse(200, {}, "tweet has been deleted "));
  } catch (error) {
    throw new APIError(500, "something went wrong while deleting the tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
