import { Room } from './room.entity';
import { User } from './user.entity';
export declare class RoomMember {
    id: number;
    room: Room;
    roomId: number;
    user: User;
    userId: number;
    joinedAt: Date;
}
