import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { APIError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  

});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;

  try {
    if(!isValidObjectId(videoId)){
      throw new APIError(400,"This video doesn't exists")
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
    }
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
  } catch (error) {
    throw new APIError(500, error, "something went wrong ");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
