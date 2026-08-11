// Comment related types for posts, polls, and events

export interface CommentUser {
    _id: string;
    fullName: string;
    profilePhotoUrl?: string;
}

export interface Comment {
    _id: string;
    user: CommentUser;
    text: string;
    createdAt: string;
    likes?: number;
    replies?: Comment[];
}

export interface CommentsModalProps {
    visible: boolean;
    onClose: () => void;
    postId: string;
    postType?: "post" | "poll" | "event";
    comments: Comment[];
    totalComments: number;
    totalShares?: number;
    totalLikes?: number;
    onSubmitComment: (text: string) => void;
    onLikeComment?: (commentId: string) => void;
    onReplyToComment?: (commentId: string, text: string) => void;
    currentUserAvatar?: string;
    currentUserName?: string;
}
