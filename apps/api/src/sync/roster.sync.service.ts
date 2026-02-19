import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, Player } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';
import { parsePosition } from '../common/position.util';

const SOURCE = 'sina';

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
    const sinaTeams = allTeamsData?.teams ?? [];
    if (sinaTeams.length === 0) {
      this.logger.warn('Sina API returned no teams');
      return { teams: 0, players: 0 };
    }

    const tidToTeam = new Map<string, Team>();

    for (const t of sinaTeams) {
      const { tid, name, name_cn, market, market_cn } = t.team;
      const teamName = name || 'Unknown';
      const teamNameCn = name_cn || teamName;
      const teamMarket = market ?? '';

      let internalTeamId = await this.mapping.getInternalId(SOURCE, 'team', tid);

      if (internalTeamId === null || internalTeamId === 0) {
        let team = await this.teamRepo.findOne({ where: { name: teamName } });
        if (!team) {
          team = await this.teamRepo.save(
            this.teamRepo.create({ name: teamName, nameCn: teamNameCn, market: teamMarket, marketCn: market_cn ?? null }),
          );
          this.logger.debug(`Created team ${teamName} (id=${team.id})`);
        } else {
          await this.teamRepo.update(team.id, { nameCn: teamNameCn, market: teamMarket, marketCn: market_cn ?? null });
          team = (await this.teamRepo.findOne({ where: { id: team.id } }))!;
        }
        await this.mapping.upsert(SOURCE, 'team', tid, team.id);
        internalTeamId = team.id;
        tidToTeam.set(tid, team);
      } else {
        await this.teamRepo.update(internalTeamId, { nameCn: teamNameCn, market: teamMarket, marketCn: market_cn ?? null });
        const team = (await this.teamRepo.findOne({ where: { id: internalTeamId } }))!;
        tidToTeam.set(tid, team);
      }
    }

    this.logger.log(`Upserted ${sinaTeams.length} teams`);

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
        if (!pid) continue;
        const name = `${rp.first_name ?? ''} ${rp.last_name ?? ''}`.trim();
        if (!name) continue;
        const nameCn = (rp.first_name_cn && rp.last_name_cn)
          ? `${rp.first_name_cn}·${rp.last_name_cn}`
          : null;
        const position = parsePosition(rp.position ?? '');
        const jerseyNumber = String(rp.jersey_number ?? '') || '0';

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
