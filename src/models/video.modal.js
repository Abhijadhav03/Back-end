import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  videoFile: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  thumbnail: { type: String, default: 'https://example.com/default-thumbnail.png' },
  owner: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  }],
  ispublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  comments: { type: Array, default: [] },
}, { timestamps: true });

const Video = mongoose.model("Video", videoSchema);

videoSchema.plugin(require('mongoose-aggregate-paginate-v2'));
export default Video;
