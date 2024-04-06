import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { APIError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  /*
    1-verify videoId
    2-match comment for videoId
    3-pagination
    4-add number of likes for the comment from like model
    5-sort by date descending
    6-return comments
    */
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const PageNum = Number(page);
  const limitNum = Number(limit);
  if (!PageNum || !limitNum || !videoId) {
    throw new APIError(400, "Seems like you are not providing an valid input ");
  }
  if (!isValidObjectId(videoId)) {
    throw new APIError(400, "This video doesn't exists anymore");
  }

  const getComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $skip: (PageNum - 1) * limitNum,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "TotalNumberOfLikeOnComment",
      },
    },
    {
      $addFields: {
        LikedByUser: {
          $in: [req.user._id, "$TotalNumberOfLikeOnComment.likedBy"],
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        content: { $first: "$content" },
        owner: { $first: "$owner" },
        video: { $first: "$video" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        LikesOnComment: {
          $sum: { $size: "$TotalNumberOfLikeOnComment" },
        },
        likedByUser: { $first: "$LikedByUser" },
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        isOwner: {
          $cond: {
            if: { $eq: [req.user?._id, { $arrayElemAt: ["$owner._id", 0] }] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  if (!getComments?.length) {
    throw new APIError(
      400,
      "No comments found for this video. Or, you may try a lower page number."
    );
  }
  res.status(200).json(new ApiResponse(200, getComments, "comments"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;

  try {
    if (!isValidObjectId(videoId)) {
      throw new APIError(400, "This video doesn't exists");
    }

    if (!content) {
      throw new APIError(404, "commment is required");
    }
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user._id,
    });

    if (!comment) {
      throw new APIError(500, "Something went wrong ");
    }
    res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment created successfully"));
  } catch (error) {
    throw new APIError(400, error);
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    if (!isValidObjectId(commentId)) {
      throw new APIError(404, "Comment Does not exists");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new APIError(400, "comment doesn't exists");
    }
    if (comment.owner.toString() != req.user._id.toString()) {
      throw new APIError(400, " you are not allowed to change this comment");
    }
    const newComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: { content },
      },
      { new: true }
    );
    res
      .status(200)
      .json(new ApiResponse(200, newComment, "Comment updated sucessfully "));
  } catch (error) {
    throw new APIError(500, "Something went wrong ");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  try {
    if (!isValidObjectId(commentId)) {
      throw new APIError(400, "Invalid Comment id ");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new APIError(400, "comment doesn't exists");
    }

    if (comment.owner.toString() != req.user._id.toString()) {
      throw new APIError(400, "you are not allowed to delete this comment");
    } else {
      await Like.deleteMany({ comment: commentId });
      await Comment.findByIdAndDelete(commentId);

      res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
    }
  } catch (error) {
    throw new APIError(500, error, "something went wrong ");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
