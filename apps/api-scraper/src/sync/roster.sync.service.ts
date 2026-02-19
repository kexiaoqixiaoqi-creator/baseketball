import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, Player } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';
import { parsePosition } from '../common/position.util';

const SOURCE = 'sina';

/**
 * Syncs all 30 NBA teams and their rosters from Sina Sports.
 *
 * Strategy
 * ─────────
 * 1. Fetch `rosters` → 30 teams → upsert `teams` table (EN + CN names), update ext_id_map
 * 2. For each team, fetch `roster` → detailed player list → upsert `players`
 *    including Chinese name (first_name_cn·last_name_cn) and team_id FK
 */
@Injectable()
export class RosterSyncService {
  private readonly logger = new Logger(RosterSyncService.name);

  constructor(
    private readonly sina: SinaClientService,
    private readonly mapping: MappingService,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
  ) {}

  async syncAllRosters(): Promise<{ teams: number; players: number }> {
    this.logger.log('Starting roster sync…');

    const allTeamsData = await this.sina.getAllTeams();
    const sinaTeams = allTeamsData.teams;

    // ── Step 1: upsert teams table ──────────────────────────────────────────
    const tidToTeam = new Map<string, Team>();

    for (const t of sinaTeams) {
      const { tid, name, name_cn, market, market_cn } = t.team;

      let internalTeamId = await this.mapping.getInternalId(SOURCE, 'team', tid);

      if (internalTeamId === null || internalTeamId === 0) {
        // New team (or previously stored as placeholder 0) → create/find in DB
        let team = await this.teamRepo.findOne({ where: { name } });
        if (!team) {
          team = await this.teamRepo.save(
            this.teamRepo.create({ name, nameCn: name_cn, market, marketCn: market_cn ?? null }),
          );
          this.logger.debug(`Created team ${name} (id=${team.id})`);
        } else {
          // Update Chinese fields if they changed
          await this.teamRepo.update(team.id, { nameCn: name_cn, market, marketCn: market_cn ?? null });
          team = (await this.teamRepo.findOne({ where: { id: team.id } }))!;
        }
        await this.mapping.upsert(SOURCE, 'team', tid, team.id);
        internalTeamId = team.id;
        tidToTeam.set(tid, team);
      } else {
        // Already mapped — refresh Chinese names in case they were updated
        await this.teamRepo.update(internalTeamId, { nameCn: name_cn, market, marketCn: market_cn ?? null });
        const team = (await this.teamRepo.findOne({ where: { id: internalTeamId } }))!;
        tidToTeam.set(tid, team);
      }
    }

    this.logger.log(`Upserted ${sinaTeams.length} teams`);

    // ── Step 2: upsert players per team ─────────────────────────────────────
    let playerCount = 0;

    for (const t of sinaTeams) {
      const tid = t.team.tid;
      const team = tidToTeam.get(tid)!;

      let roster;
      try {
        const data = await this.sina.getTeamRoster(tid);
        roster = data.roster;
      } catch (err) {
        this.logger.warn(`Failed to fetch roster for ${team.name}: ${(err as Error).message}`);
        continue;
      }

      for (const rp of roster) {
        const pid = rp.pid;
        const name = `${rp.first_name} ${rp.last_name}`.trim();
        const nameCn = rp.first_name_cn && rp.last_name_cn
          ? `${rp.first_name_cn}·${rp.last_name_cn}`
          : null;
        const position = parsePosition(rp.position);
        const jerseyNumber = String(rp.jersey_number ?? '');

        let internalId = await this.mapping.getInternalId(SOURCE, 'player', pid);

        if (internalId === null) {
          const player = await this.playerRepo.save(
            this.playerRepo.create({
              name,
              nameCn,
              position,
              team: team.name,
              teamId: team.id,
              jerseyNumber,
              isActive: true,
            }),
          );
          internalId = player.id;
          await this.mapping.upsert(SOURCE, 'player', pid, internalId);
          this.logger.debug(`Created player ${name} (id=${internalId})`);
        } else {
          await this.playerRepo.update(internalId, {
            name,
            nameCn,
            position,
            team: team.name,
            teamId: team.id,
            jerseyNumber,
            isActive: true,
          });
        }

        playerCount++;
      }
    }

    this.logger.log(`Roster sync complete: ${sinaTeams.length} teams, ${playerCount} players processed`);
    return { teams: sinaTeams.length, players: playerCount };
  }
}
