import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckoutsService } from './checkouts.service';
import {
  CreateCheckoutDto,
  UpdateCheckoutDto,
  CheckoutQueryDto,
  ApproveCheckoutDto,
  RejectCheckoutDto,
  ReturnCheckoutDto,
  ApproveReturnDto,
  StartCheckoutDto,
  CreateConditionCheckDto,
  CheckoutResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';

@ApiTags('반출입 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('checkouts')
export class CheckoutsController {
  constructor(private readonly checkoutsService: CheckoutsService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_CHECKOUT)
  @ApiOperation({ summary: '반출 신청', description: '장비 담당자만 반출을 신청할 수 있습니다.' })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '반출 신청 성공',
    type: CheckoutResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async create(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    const requesterId = req.user?.userId || req.user?.sub;
    if (!requesterId) {
      throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
    }
    const userTeamId = req.user?.teamId; // 사용자 팀 ID
    // ✅ UUID 형식 검증 (서비스에서도 검증하지만, 컨트롤러에서도 사전 검증)
    // 개발 환경에서는 UUID가 아닌 ID도 허용할 수 있지만, 프로덕션에서는 UUID 필수
    // 서비스에서 validateUuid를 호출하므로 여기서는 기본 검증만 수행
    return this.checkoutsService.create(createCheckoutDto, requesterId, userTeamId);
  }

  @Get('destinations')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출지 목록 조회',
    description: 'DB에 저장된 고유 반출지(destination) 목록을 반환합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '반출지 목록 조회 성공' })
  async getDestinations(): Promise<string[]> {
    return this.checkoutsService.getDistinctDestinations();
  }

  @Get()
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출 목록 조회',
    description:
      '반출 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다. ' +
      '시험소장(lab_manager)은 전체 조회, 나머지 역할은 소속 팀 기반으로 자동 필터링됩니다. ' +
      '?includeSummary=true 사용 시 요약 정보(total, pending, approved 등)도 함께 반환됩니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 목록 조회 성공' })
  async findAll(
    @Query() query: CheckoutQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/checkouts/checkouts.service').CheckoutListResponse
  > {
    // lab_manager(시험소장)는 전체 조회, 나머지 역할은 소속 팀 기반 필터링
    const roles = req.user?.roles || [];
    const isLabManager = roles.includes('lab_manager');

    if (!isLabManager && !query.teamId && req.user?.teamId) {
      query.teamId = req.user.teamId;
    }

    // ✅ 성능 최적화: includeSummary 파라미터를 서비스에 전달
    return this.checkoutsService.findAll(query, query.includeSummary ?? false);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출 상세 조회',
    description: '특정 UUID를 가진 반출의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 조회 성공', type: CheckoutResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    return this.checkoutsService.findOne(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.UPDATE_CHECKOUT)
  @ApiOperation({
    summary: '반출 정보 수정',
    description: '특정 UUID를 가진 반출의 정보를 수정합니다. 승인 전만 수정 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateCheckoutDto })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 수정 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '수정 불가능한 상태' })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateCheckoutDto: UpdateCheckoutDto
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    return this.checkoutsService.update(uuid, updateCheckoutDto);
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.DELETE_CHECKOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '반출 취소',
    description: '특정 UUID를 가진 반출을 취소합니다. 승인 전만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '반출 취소 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    return this.checkoutsService.remove(uuid);
  }

  @Patch(':uuid/approve')
  @RequirePermissions(Permission.APPROVE_CHECKOUT)
  @ApiOperation({
    summary: '반출 승인',
    description:
      '반출을 승인합니다. 모든 목적(교정/수리/외부 대여)에 대해 1단계 승인으로 통합되었습니다. 기술책임자만 승인 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: ApproveCheckoutDto })
  @ApiResponse({ status: HttpStatus.OK, description: '승인 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '승인 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async approve(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() approveDto: ApproveCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    // 승인자 ID는 인증된 세션에서 추출 (클라이언트 입력 신뢰 금지)
    const approverId = req.user?.userId || req.user?.sub;
    if (!approverId) {
      throw new BadRequestException('승인자 정보를 찾을 수 없습니다.');
    }

    const approverTeamId = req.user?.teamId; // 승인자 팀 ID

    // DTO의 approverId는 무시하고 세션에서 추출한 값 사용
    return this.checkoutsService.approve(uuid, { ...approveDto, approverId }, approverTeamId);
  }

  @Patch(':uuid/reject')
  @RequirePermissions(Permission.REJECT_CHECKOUT)
  @ApiOperation({ summary: '반출 반려', description: '반출을 반려합니다. 반려 사유는 필수입니다.' })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: RejectCheckoutDto })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 반려 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반려 불가능한 상태 또는 사유 누락' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectDto: RejectCheckoutDto
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    // 반려 사유 필수 검증 (요구사항)
    if (!rejectDto.reason || rejectDto.reason.trim().length === 0) {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }
    return this.checkoutsService.reject(uuid, rejectDto);
  }

  @Post(':uuid/start')
  @RequirePermissions(Permission.START_CHECKOUT)
  @ApiOperation({
    summary: '반출 시작',
    description:
      '최종 승인된 반출을 실제로 반출 처리합니다. 장비별 반출 전 상태를 기록할 수 있습니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: StartCheckoutDto, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 시작 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반출 시작 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async startCheckout(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() startDto?: StartCheckoutDto
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    return this.checkoutsService.startCheckout(uuid, startDto?.itemConditions);
  }

  @Post(':uuid/return')
  @RequirePermissions(Permission.COMPLETE_CHECKOUT)
  @ApiOperation({
    summary: '반입 처리',
    description:
      '반출된 장비를 반입 처리합니다. 교정/수리 확인 및 작동 여부 확인을 포함합니다. ' +
      '반출 유형에 따라 필수 검사 항목이 다릅니다: 교정 목적(calibrationChecked 필수), ' +
      '수리 목적(repairChecked 필수), 모든 유형(workingStatusChecked 필수).',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: ReturnCheckoutDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반입 처리 성공 (상태: returned, 기술책임자 승인 대기)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '반입 처리 불가능한 상태 또는 필수 검사 항목 누락',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async returnCheckout(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() returnDto: ReturnCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    const returnerId = req.user?.userId || req.user?.sub;
    if (!returnerId) {
      throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
    }
    return this.checkoutsService.returnCheckout(uuid, returnDto, returnerId);
  }

  @Patch(':uuid/approve-return')
  @RequirePermissions(Permission.APPROVE_CHECKOUT) // 기술책임자 권한
  @ApiOperation({
    summary: '반입 최종 승인',
    description:
      '기술책임자가 검사 완료된 반입을 최종 승인합니다. ' +
      '승인 후 장비 상태가 자동으로 available로 복원됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: ApproveReturnDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반입 최종 승인 성공 (상태: return_approved, 장비 상태: available)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '승인 불가능한 상태 (returned 상태만 승인 가능)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '기술책임자 권한 없음' })
  async approveReturn(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() approveReturnDto: ApproveReturnDto,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    // 승인자 ID가 없으면 현재 로그인한 사용자 ID 사용
    const approverId = approveReturnDto.approverId || req.user.userId;
    if (!approverId) {
      throw new BadRequestException('승인자 정보를 찾을 수 없습니다.');
    }
    return this.checkoutsService.approveReturn(uuid, { ...approveReturnDto, approverId });
  }

  @Post(':uuid/condition-check')
  @RequirePermissions(Permission.COMPLETE_CHECKOUT)
  @ApiOperation({
    summary: '상태 확인 등록 (대여 목적)',
    description:
      '대여 목적 반출의 양측 4단계 상태 확인을 등록합니다. ' +
      '각 단계(lender_checkout, borrower_receive, borrower_return, lender_return)에 따라 ' +
      '반출 상태가 자동으로 전이됩니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: CreateConditionCheckDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: '상태 확인 등록 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 단계 또는 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async submitConditionCheck(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CreateConditionCheckDto,
    @Request() req: AuthenticatedRequest
  ) {
    const checkerId = req.user?.userId || req.user?.sub;
    if (!checkerId) {
      throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
    }
    return this.checkoutsService.submitConditionCheck(uuid, dto, checkerId);
  }

  @Get(':uuid/condition-checks')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '상태 확인 이력 조회',
    description: '특정 반출의 양측 4단계 상태 확인 이력을 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '상태 확인 이력 조회 성공' })
  async getConditionChecks(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.checkoutsService.getConditionChecks(uuid);
  }

  @Patch(':uuid/cancel')
  @RequirePermissions(Permission.CANCEL_CHECKOUT)
  @ApiOperation({
    summary: '반출 취소',
    description: '승인 전 반출을 취소합니다. 신청자만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 취소 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async cancel(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requesterId: string;
    approverId: string | null;
    returnerId: string | null;
    purpose: string;
    checkoutType: string;
    destination: string;
    lenderTeamId: string | null;
    lenderSiteId: string | null;
    phoneNumber: string | null;
    address: string | null;
    reason: string;
    checkoutDate: Date | null;
    expectedReturnDate: Date;
    actualReturnDate: Date | null;
    status: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    calibrationChecked: boolean | null;
    repairChecked: boolean | null;
    workingStatusChecked: boolean | null;
    inspectionNotes: string | null;
    returnApprovedBy: string | null;
    returnApprovedAt: Date | null;
    lenderConfirmedBy: string | null;
    lenderConfirmedAt: Date | null;
    lenderConfirmNotes: string | null;
  }> {
    return this.checkoutsService.cancel(uuid);
  }
}
