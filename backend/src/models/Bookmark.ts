import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    placeId: string;
    name: string;
    address: string;
    location: {
        latitude: number;
        longitude: number;
    };
    rating?: number;
    notes?: string;
    socialLink?: string;
    createdAt: Date;
}

const BookmarkSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        placeId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        rating: {
            type: Number,
        },
        notes: {
            type: String,
        },
        socialLink: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate bookmarks for the same place by the same user
BookmarkSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
