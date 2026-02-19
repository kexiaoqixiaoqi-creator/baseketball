import { User } from './user.entity';
import { RoomMember } from './room-member.entity';
import { Lineup } from './lineup.entity';
export declare class Room {
    id: number;
    name: string;
    owner: User | null;
    ownerId: number | null;
    isOfficial: boolean;
    ptsWeight: number;
    rebWeight: number;
    astWeight: number;
    stlWeight: number;
    blkWeight: number;
    toWeight: number;
    salaryCap: number;
    createdAt: Date;
    members: RoomMember[];
    lineups: Lineup[];
}
