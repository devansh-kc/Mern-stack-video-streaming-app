import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  // TODO:channelId === userID but try not to let user subscribe their own channel
  //  TODO: after validating the channel id ad an field in the user's collection  which is subscribed  = true or false
  if (!channelId) {
    throw new APIError(400, "Channel Id is required ");
  }
  if (!isValidObjectId(channelId)) {
    throw new APIError(404, "the channel ID is invalid");
  }
  const channel = await User.findById(channelId);
  if (channel._id.toString() === req.user._id.toString()) {
    throw new APIError(
      400,
      " you cannot subscribe this channel   because this is created by you "
    );
  }
  try {
    const LoggedInUser = req.user?._id;
    const subscribedUser = await Subscription.findOneAndDelete({
      subscriber: LoggedInUser,
      channel: channel,
    });
    if (subscribedUser) {
      res
        .status(200)
        .json(new ApiResponse(200, "you unsubscribed the channel"));
    } else {
      const subscrbedChannel = await Subscription.create({
        subscriber: LoggedInUser,
        channel: channel,
      });

      res
        .status(200)
        .json(
          new ApiResponse(200, subscrbedChannel, "you subscribed the channel")
        );
    }
  } catch (error) {
    throw new APIError(
      500,
      error,
      "something went wrong while subscribing the channel"
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
