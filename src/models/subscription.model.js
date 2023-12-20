import mongoose, { Schema, model } from "mongoose";

const subScriptionSchema = new Schema(
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

export const subscription = mongoose.model("Subscription", subScriptionSchema);
