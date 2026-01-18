import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './dto';
import { Team, TeamListResponse } from '@equipment-management/schemas';

// 임시 데이터 저장소 (실제로는 DB를 사용)
const teams: Team[] = [
  {
    id: 'rf',
    name: 'RF 테스트팀',
    description: 'RF 관련 장비 관리 및 테스트를 담당하는 팀',
    equipmentCount: 42,
    memberCount: 12,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15'),
  },
  {
    id: 'sar',
    name: 'SAR 테스트팀',
    description: 'SAR 관련 장비 관리 및 테스트를 담당하는 팀',
    equipmentCount: 35,
    memberCount: 8,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-05-20'),
  },
  {
    id: 'emc',
    name: 'EMC 테스트팀',
    description: 'EMC 관련 장비 관리 및 테스트를 담당하는 팀',
    equipmentCount: 28,
    memberCount: 10,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-04-10'),
  },
  {
    id: 'auto',
    name: 'Automotive 테스트팀',
    description: 'Automotive 관련 장비 관리 및 테스트를 담당하는 팀',
    equipmentCount: 30,
    memberCount: 15,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-07-05'),
  },
];

@Injectable()
export class TeamsService {
  async findAll(query: TeamQueryDto): Promise<TeamListResponse> {
    let filteredTeams = [...teams];

    // 팀 ID 필터링
    if (query.ids) {
      const teamIds = query.ids.split(',');
      filteredTeams = filteredTeams.filter((team) => teamIds.includes(team.id));
    }

    // 검색어 필터링
    if (query.search) {
      const searchLowerCase = query.search.toLowerCase();
      filteredTeams = filteredTeams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchLowerCase) ||
          (team.description && team.description.toLowerCase().includes(searchLowerCase))
      );
    }

    // 정렬
    if (query.sort) {
      const [field, direction] = query.sort.split('.');
      const sortDir = direction === 'desc' ? -1 : 1;

      filteredTeams.sort((a, b) => {
        if (a[field] < b[field]) return -1 * sortDir;
        if (a[field] > b[field]) return 1 * sortDir;
        return 0;
      });
    }

    // 페이지네이션
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = filteredTeams.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const items = filteredTeams.slice(skip, skip + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Team | null> {
    const team = teams.find((team) => team.id === id);
    return team || null;
  }

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    // ID 중복 확인
    const existingTeam = teams.find((team) => team.id === createTeamDto.id);
    if (existingTeam) {
      throw new BadRequestException(`팀 ID '${createTeamDto.id}'는 이미 사용 중입니다.`);
    }

    const now = new Date();
    const team: Team = {
      ...createTeamDto,
      equipmentCount: 0,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    teams.push(team);
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null> {
    const teamIndex = teams.findIndex((team) => team.id === id);
    if (teamIndex === -1) {
      return null;
    }

    const updatedTeam = {
      ...teams[teamIndex],
      ...updateTeamDto,
      updatedAt: new Date(),
    };

    teams[teamIndex] = updatedTeam;
    return updatedTeam;
  }

  async remove(id: string): Promise<boolean> {
    const teamIndex = teams.findIndex((team) => team.id === id);
    if (teamIndex === -1) {
      return false;
    }

    // 실제 시스템에서는 팀에 연결된 장비나 사용자가 있는지 확인 필요
    teams.splice(teamIndex, 1);
    return true;
  }
}
