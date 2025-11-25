import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document { }

const UserSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUserDocument>('User', UserSchema);
