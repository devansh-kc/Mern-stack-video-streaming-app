import mongoose, { isValidObjectId } from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { APIError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (name && description === "") {
    throw new APIError(400, "name and description are both required");
  }
  const alreadyCreatedPlaylist = await PlayList.findOne({
    name,
  });
  if (alreadyCreatedPlaylist) {
    throw new APIError(409, "you cannot create playlist with same name ");
  }
  try {
    const createdPlayList = await PlayList.create({
      name,
      description,
      owner: req.user._id,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, createdPlayList, "playlist has been created ")
      );
  } catch (error) {
    throw new APIError(
      500,
      error,
      "unable to create an Playlist please try again "
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new APIError(400, "userId is required");
  }
  if (!isValidObjectId(userId)) {
    throw new APIError(400, "user id is not valid ");
  }

  const userPlayList = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "VideoThumbnail",
      },
    },
    {
      $addFields: {
        TotalNumbersOfViews: {
          $sum: "$VideoThumbnail.views",
        },
      },
    },
    {
      $addFields: {
        VideoThumbnail: {
          $ifNull: [{ $arrayElemAt: ["$VideoThumbnail.thumbnail", 0] }, null],
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  if (!userPlayList?.length) {
    return res
      .status(400)
      .json(new APIError(400, "this user haven't created any playlists yet "));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlayList, "Playlist of specified user fetched ")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!playlistId) {
    throw new APIError(400, "the playlist id is required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new APIError(400, "this PlayList doesN't exists");
  }
  try {
    const playListDetails = await PlayList.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "user_details",
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
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "Video_details",
        },
      },
      {
        $addFields: {
          totalViews: {
            $sum: "$Video_details.views",
          },
        },
      },
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, playListDetails, "PlayList details fetched "));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "something went wrong while fetching the user details "
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new APIError(
      400,
      "The playlist ID is not valid or the playlistId doesn't exist."
    );
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new APIError(
      400,
      "The playlist ID is not valid or the VideoId  doesn't exist."
    );
  }

  const findPlayList = await PlayList.findById(playlistId);
  const findVideo = await Video.findById(videoId);

  if (!findPlayList) {
    throw new APIError(404, "This playlist doesn't exists");
  }
  if (!findVideo) {
    throw new APIError(404, "this video doesn't exists");
  }
  if (req.user._id.toString() != findPlayList.owner.toString()) {
    throw new APIError(400, "You cannot make updates in this playlist");
  }
  const matchedVideo = findPlayList.videos.find((video) =>
    video.equals(videoId)
  );
  if (matchedVideo) {
    throw new APIError(409, "this video already exists in this playlist ");
  }
  try {
    const UpdatedPlayList = await PlayList.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, UpdatedPlayList, "video Added  to Playlist "));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while updating the video in playlist "
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId && !videoId) {
    throw new APIError(400, "Video and playlist id is important ");
  }
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new APIError(400, "Playlist or Video Id is not valid ");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new APIError(400, "this playlist doesn't exist or it may be deleted");
  }
  if (playlist.owner.toString() != req.user._id.toString()) {
    throw new APIError(
      400,
      "You cannot delete videos from this playlist because this is not created by you "
    );
  }

  const matchedVideo = playlist.videos.find((video) => video.equals(videoId));
  if (!matchedVideo) {
    throw new APIError(400, "this video doesn't  exists in the playlist");
  }
  try {
    const UpdatedPlayList = await PlayList.findByIdAndUpdate(
      playlist,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );
    res
      .status(200)
      .json(new ApiResponse(200, UpdatedPlayList, "video deleted "));
  } catch (error) {
    throw new APIError(
      400,
      "Some thing went wrong while  deleting the video from the playlist "
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId) {
    throw new APIError(400, "PlayListId is required ");
  }
  if (!isValidObjectId(playlistId)) {
    throw new APIError(400, "it is not valid playListId");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new APIError(400, "this play list Doesn't exists");
  }
  if (req.user._id.toString() != playlist.owner.toString()) {
    throw new APIError(
      400,
      "you cannot change this Playlist because this is not created by you "
    );
  }

  try {
    await PlayList.findByIdAndDelete(playlistId);
    res.status(200).json(new ApiResponse(200, {}, "playlist deleted"));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while deleting the playlist"
    );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) {
    throw new APIError(400, "playlist Id is required");
  }
  if (!name || !description) {
    throw new APIError(400, "name and description is required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new APIError(400, "the playlist id is not valid");
  }
  const playList = await PlayList.findById(playlistId);
  if (!playList) {
    throw new APIError(400, "this playlist doesn't exists");
  }
  if (req.user._id.toString() != playList.owner.toString()) {
    throw new APIError(
      400,
      "You cannot make changes in this playlist because this is not created by you "
    );
  }
  try {
    const updatedPlayList = await PlayList.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name,
          description,
        },
      },
      { new: true }
    );
    res
      .status(200)
      .json(new ApiResponse(200, updatedPlayList, "Playlist Updated "));
  } catch (error) {
    throw new APIError(
      500,
      error,
      "Something went wrong while updating the playlist "
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
