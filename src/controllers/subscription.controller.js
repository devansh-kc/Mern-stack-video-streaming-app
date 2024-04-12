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
// TODO: I have to check the channel id is valid or not
// TODO: After that I will check that  based on channelId the channel has subscribed how many channels
// TODO: after that I will show the info and number of count
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  console.log(subscriberId);
  if (!subscriberId) {
    throw new APIError(400, "channel Id is required ");
  }
  if (!isValidObjectId(subscriberId)) {
    throw new APIError(400, "the Channel Id is not valid");
  }

  if (req.user._id.toString() != subscriberId.toString()) {
    throw new APIError(
      400,
      "You are not the owner of this channel to get subscribers list"
    );
  }

  try {
    const getSubscribedChannelsByOwner = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $facet: {
          subscribers: [
            {
              $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
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
                subscriber: {
                  $first: "$subscribers",
                },
              },
            },
          ],
          subscriberCount:[
            {
              $count:"subscribers"
            }
          ]
        },
      },
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(200, getSubscribedChannelsByOwner[0], "subscriber fetched")
      );
  } catch (error) {}
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
