import mongoose, { Schema, model } from "mongoose";

const SubScriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      //   COMMENT: here the user is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", SubScriptionSchema);
