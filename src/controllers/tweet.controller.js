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
  
    if (!content){
      throw new APIError(404,"content is required")
    }

  
} catch (error) {
  throw new APIError(500,"The tweets is not working ");

  
}
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
