import Avatar from 'boring-avatars';

export type UserAvatarProps = {
    profileIcon?: string | null;
    fallbackName?: string;
    size?: number;
};

export function UserAvatar({ profileIcon, fallbackName, size = 40 }: UserAvatarProps) {
    const name = profileIcon || fallbackName || 'User';
    
    return (
        <Avatar
            size={size}
            name={name}
            variant="beam"
            colors={["#2563eb", "#00beff", "#323232", "#fde68a", "#3b82f6"]}
        />
    );
}
