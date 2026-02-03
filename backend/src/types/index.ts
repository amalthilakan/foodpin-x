export interface IUser {
    email: string;
    username: string;
    password: string;
    profilePicture?: string;
    createdAt: Date;
    updatedAt: Date;
}
