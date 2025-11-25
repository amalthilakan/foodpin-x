import { NextFunction, Request, Response } from 'express';
import Bookmark from '../models/Bookmark';

// Extend Request to include user property (added by auth middleware, though we haven't typed it globally yet)
interface AuthRequest extends Request {
    user?: any;
}

export const addBookmark = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { placeId, name, address, location, rating } = req.body;
        const userId = req.user.id;

        const existingBookmark = await Bookmark.findOne({ userId, placeId });
        if (existingBookmark) {
            res.status(400).json({ message: 'Restaurant already bookmarked' });
            return;
        }

        const newBookmark = new Bookmark({
            userId,
            placeId,
            name,
            address,
            location,
            rating,
        });

        await newBookmark.save();

        res.status(201).json(newBookmark);
    } catch (error) {
        next(error);
    }
};

export const getBookmarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });
        res.json(bookmarks);
    } catch (error) {
        next(error);
    }
};

export const removeBookmark = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const bookmark = await Bookmark.findOneAndDelete({ _id: id, userId });

        if (!bookmark) {
            res.status(404).json({ message: 'Bookmark not found' });
            return;
        }

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        next(error);
    }
};

export const updateBookmark = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { notes, socialLink } = req.body;
        const userId = req.user.id;

        const bookmark = await Bookmark.findOneAndUpdate(
            { _id: id, userId },
            { notes, socialLink },
            { new: true }
        );

        if (!bookmark) {
            res.status(404).json({ message: 'Bookmark not found' });
            return;
        }

        res.json(bookmark);
    } catch (error) {
        next(error);
    }
};
