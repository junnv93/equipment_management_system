import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './dto';
import { Team, TeamListResponse } from '@equipment-management/schemas';
import { parseSortString, sortByField } from '../../common/utils/sort';

// 임시 데이터 저장소 (실제로는 DB를 사용)
// ✅ Best Practice: 팀 이름 = 분류 이름 (통일)
// ✅ 사이트별 팀 구성:
//    - 수원(SUW): FCC EMC/RF(E), General EMC(R), SAR(S), Automotive EMC(A)
//    - 의왕(UIW): General RF(W)
//    - 평택(PYT): Automotive EMC(A)
const teams: Team[] = [
  // ========== 수원 사이트 (SUW) ==========
  {
    id: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    name: 'FCC EMC/RF', // 팀 이름 = 분류 이름
    type: 'FCC_EMC_RF',
    site: 'suwon',
    classificationCode: 'E',
    description: 'FCC EMC/RF 시험 장비 관리 - 수원',
    equipmentCount: 42,
    memberCount: 12,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15'),
    deletedAt: null,
  },
  {
    id: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289',
    name: 'General EMC', // 팀 이름 = 분류 이름
    type: 'GENERAL_EMC',
    site: 'suwon',
    classificationCode: 'R',
    description: 'General EMC 시험 장비 관리 - 수원',
    equipmentCount: 28,
    memberCount: 10,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-04-10'),
    deletedAt: null,
  },
  {
    id: '7fd28076-fd5e-4d36-b051-bbf8a97b82db',
    name: 'SAR', // 팀 이름 = 분류 이름
    type: 'SAR',
    site: 'suwon',
    classificationCode: 'S',
    description: 'SAR(비흡수율) 시험 장비 관리 - 수원',
    equipmentCount: 35,
    memberCount: 8,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-05-20'),
    deletedAt: null,
  },
  {
    id: 'f0a32655-00f9-4ecd-b43c-af4faed499b6',
    name: 'Automotive EMC', // 팀 이름 = 분류 이름
    type: 'AUTOMOTIVE_EMC',
    site: 'suwon',
    classificationCode: 'A',
    description: 'Automotive EMC 시험 장비 관리 - 수원',
    equipmentCount: 30,
    memberCount: 15,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-07-05'),
    deletedAt: null,
  },
  // ========== 의왕 사이트 (UIW) ==========
  {
    id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    name: 'General RF', // 팀 이름 = 분류 이름
    type: 'GENERAL_RF',
    site: 'uiwang',
    classificationCode: 'W',
    description: 'General RF 시험 장비 관리 - 의왕',
    equipmentCount: 20,
    memberCount: 6,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-08-01'),
    deletedAt: null,
  },
  // ========== 평택 사이트 (PYT) ==========
  {
    id: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
    name: 'Automotive EMC', // 팀 이름 = 분류 이름 (평택)
    type: 'AUTOMOTIVE_EMC',
    site: 'pyeongtaek',
    classificationCode: 'A',
    description: 'Automotive EMC 시험 장비 관리 - 평택',
    equipmentCount: 25,
    memberCount: 10,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-09-01'),
    deletedAt: null,
  },
];

@Injectable()
export class TeamsService {
  async findAll(query: TeamQueryDto): Promise<TeamListResponse> {
    let filteredTeams = [...teams];

    // ✅ 사이트 필터링 추가: 사용자 사이트에 맞는 팀만 표시
    if (query.site) {
      filteredTeams = filteredTeams.filter((team) => team.site === query.site);
    }

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
    const sortConfig = parseSortString(query.sort);
    if (sortConfig) {
      filteredTeams = sortByField(filteredTeams, sortConfig.field, sortConfig.direction);
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
    // 이름 중복 확인
    const existingTeam = teams.find((team) => team.name === createTeamDto.name);
    if (existingTeam) {
      throw new BadRequestException(`팀 이름 '${createTeamDto.name}'는 이미 사용 중입니다.`);
    }

    const now = new Date();
    const team: Team = {
      id: randomUUID(), // ✅ UUID 자동 생성
      ...createTeamDto,
      equipmentCount: 0,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
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
