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
  UsePipes,
  UseInterceptors,
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
import { ZodResponse, ZodSerializerInterceptor } from 'nestjs-zod';
import {
  CheckoutsService,
  CheckoutWithMeta,
  type CheckoutListResponse,
  type Checkout,
} from './checkouts.service';
import {
  CreateCheckoutDto,
  CreateCheckoutValidationPipe,
  UpdateCheckoutDto,
  UpdateCheckoutValidationPipe,
  CheckoutQueryDto,
  CheckoutQueryValidationPipe,
  ApproveCheckoutDto,
  ApproveCheckoutValidationPipe,
  RejectCheckoutDto,
  RejectCheckoutValidationPipe,
  ReturnCheckoutDto,
  ReturnCheckoutValidationPipe,
  ApproveReturnDto,
  ApproveReturnValidationPipe,
  RejectReturnDto,
  RejectReturnValidationPipe,
  StartCheckoutDto,
  StartCheckoutValidationPipe,
  CreateConditionCheckDto,
  CreateConditionCheckValidationPipe,
  CancelCheckoutDto,
  CancelCheckoutValidationPipe,
  CheckoutResponseDto,
  PendingChecksQueryDto,
  PendingChecksQueryValidationPipe,
} from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import { CurrentEnforcedScope } from '../../common/decorators/current-scope.decorator';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import { Permission, CHECKOUT_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../types/auth';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { extractUserId } from '../../common/utils/extract-user';
import { HandoverTokenService } from './services/handover-token.service';
import {
  IssueHandoverTokenDto,
  IssueHandoverTokenValidationPipe,
  IssueHandoverTokenResponse,
  VerifyHandoverTokenDto,
  VerifyHandoverTokenValidationPipe,
  VerifyHandoverTokenResponse,
  HandoverTokenPurpose,
} from './dto/handover-token.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ErrorCode, type CheckoutStatus } from '@equipment-management/schemas';

@ApiTags('반출입 관리')
@ApiBearerAuth()
@Controller('checkouts')
export class CheckoutsController {
  constructor(
    private readonly checkoutsService: CheckoutsService,
    private readonly handoverTokenService: HandoverTokenService
  ) {}

  /** 체크아웃 상태 → handover 토큰 purpose 매핑. Record로 완전 열거 — 새 상태 추가 시 컴파일 에러. */
  private static readonly PURPOSE_BY_STATUS: Record<CheckoutStatus, HandoverTokenPurpose | null> = {
    lender_checked: 'borrower_receive',
    checked_out: 'borrower_return',
    borrower_returned: 'lender_receive',
    pending: null,
    approved: null,
    rejected: null,
    borrower_received: null,
    in_use: null,
    lender_received: null,
    returned: null,
    return_approved: null,
    overdue: null,
    canceled: null,
  };

  private derivePurposeFromStatus(status: CheckoutStatus): HandoverTokenPurpose | null {
    return CheckoutsController.PURPOSE_BY_STATUS[status];
  }

  @Post(':uuid/handover-token')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @UsePipes(IssueHandoverTokenValidationPipe)
  // ZodResponse 파일럿: 메서드 단위 interceptor 로 활성화 강제 (clase-wide 시 실수 유입 위험).
  // 승격 조건: docs/references/backend-patterns.md "ZodResponse 적용 조건".
  @UseInterceptors(ZodSerializerInterceptor)
  @AuditLog({ action: 'create', entityType: 'checkout', entityIdPath: 'params.uuid' })
  @ApiOperation({
    summary: 'QR 인수인계 토큰 발급',
    description:
      '대면 인수인계 순간 모바일 스캔용 1회성 서명 토큰을 발급합니다. 10분 TTL, jti 기반 재사용 차단. ' +
      '발급 권한은 해당 체크아웃의 신청자(requester) 또는 승인자(approver) + 관리자 역할.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: IssueHandoverTokenDto, required: false })
  @ZodResponse({
    status: HttpStatus.CREATED,
    description: '토큰 발급 성공',
    type: IssueHandoverTokenResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '체크아웃 관계자가 아님 또는 전이 불가능한 상태',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async issueHandoverToken(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: IssueHandoverTokenDto,
    @Request() req: AuthenticatedRequest
  ): Promise<IssueHandoverTokenResponse> {
    const userId = extractUserId(req);
    const checkout = await this.checkoutsService.findOne(uuid);
    if (!checkout) {
      throw new NotFoundException({
        code: ErrorCode.NotFound,
        message: `Checkout ${uuid} not found.`,
      });
    }

    // 권한: 신청자 또는 승인자 (양측 인수인계 당사자).
    // 추가 role 기반 권한은 @RequirePermissions(VIEW_CHECKOUTS)로 이미 체크됨 — 여기선 관계 검증만.
    const isParticipant = checkout.requesterId === userId || checkout.approverId === userId;
    if (!isParticipant) {
      throw new ForbiddenException({
        code: ErrorCode.PermissionDenied,
        message: 'Only checkout participants (requester or approver) can issue a handover token',
      });
    }

    // 상태로부터 purpose 도출 — DTO가 명시한 purpose가 있으면 일치 여부 검증.
    const derivedPurpose = this.derivePurposeFromStatus(checkout.status as CheckoutStatus);
    if (!derivedPurpose) {
      throw new BadRequestException({
        code: ErrorCode.BadRequest,
        message: `Handover token cannot be issued in status "${checkout.status}"`,
      });
    }
    if (dto.purpose && dto.purpose !== derivedPurpose) {
      throw new BadRequestException({
        code: ErrorCode.BadRequest,
        message: `Requested purpose "${dto.purpose}" mismatches checkout state "${checkout.status}"`,
      });
    }

    return this.handoverTokenService.issue(uuid, userId, derivedPurpose);
  }

  @Post('handover/verify')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @UsePipes(VerifyHandoverTokenValidationPipe)
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    action: 'read',
    entityType: 'checkout',
    entityIdPath: 'response.checkoutId',
  })
  @ApiOperation({
    summary: 'QR 인수인계 토큰 검증 + 소비',
    description:
      '스캔으로 수신한 서명 토큰을 검증하고 jti를 1회 소비합니다. 성공 시 checkoutId와 purpose를 ' +
      '반환하며, 프론트엔드는 이 정보로 기존 condition-check 페이지로 redirect합니다.',
  })
  @ApiBody({ type: VerifyHandoverTokenDto })
  @ZodResponse({
    status: HttpStatus.OK,
    description: '검증 성공 + jti 소비',
    type: VerifyHandoverTokenResponse,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '무효 토큰' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '만료 토큰' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 소비된 토큰' })
  async verifyHandoverToken(
    @Body() dto: VerifyHandoverTokenDto
  ): Promise<VerifyHandoverTokenResponse> {
    return this.handoverTokenService.verify(dto.token);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_CHECKOUT)
  @UsePipes(CreateCheckoutValidationPipe)
  @AuditLog({ action: 'create', entityType: 'checkout', entityIdPath: 'response.id' })
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
  ): Promise<unknown> {
    const requesterId = extractUserId(req);
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

  // ⚠️ @SiteScoped 의도적 미적용: 개인 action-item 엔드포인트.
  // 데이터는 userId/teamId 기반으로 서비스에서 직접 스코핑하며,
  // 역할 기반 데이터 가시성 정책(CHECKOUT_DATA_SCOPE)과 무관합니다.
  @Get('pending-checks')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @UsePipes(PendingChecksQueryValidationPipe)
  @ApiOperation({
    summary: '확인 필요 목록 조회',
    description:
      '현재 사용자가 확인해야 할 렌탈 반출입 건 목록을 조회합니다. ' +
      'role 파라미터로 빌려주는 측(lender)/빌리는 측(borrower) 필터링을 지원합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '확인 필요 목록 조회 성공' })
  async getPendingChecks(
    @Request() req: AuthenticatedRequest,
    @Query() query: PendingChecksQueryDto
  ): Promise<CheckoutListResponse> {
    const userId = extractUserId(req);
    const userTeamId = req.user?.teamId;
    return this.checkoutsService.getPendingChecks(
      userId,
      userTeamId,
      query.role,
      query.page ?? 1,
      query.pageSize
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @SiteScoped({ policy: CHECKOUT_DATA_SCOPE, failLoud: true })
  @UsePipes(CheckoutQueryValidationPipe)
  @ApiOperation({
    summary: '반출 목록 조회',
    description:
      '반출 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다. ' +
      'SiteScopeInterceptor가 CHECKOUT_DATA_SCOPE 정책에 따라 역할별 query.teamId/query.site를 자동 주입합니다. ' +
      '?includeSummary=true 사용 시 요약 정보(total, pending, approved 등)도 함께 반환됩니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 목록 조회 성공' })
  async findAll(
    @Query() query: CheckoutQueryDto,
    @CurrentEnforcedScope() scope: EnforcedScope
  ): Promise<CheckoutListResponse> {
    // failLoud: 인터셉터가 cross-site/cross-team 요청을 이미 403으로 거부.
    query.site = scope.site as CheckoutQueryDto['site'];
    if (scope.teamId) query.teamId = scope.teamId;
    return this.checkoutsService.findAll(query, query.includeSummary ?? false);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '반출 상세 조회',
    description: '특정 UUID를 가진 반출의 상세 정보를 조회합니다. meta.availableActions 포함.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반출 조회 성공 (meta.availableActions 포함)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<CheckoutWithMeta> {
    const userPermissions = req.user?.permissions || [];
    const userTeamId = req.user?.teamId;

    return this.checkoutsService.findOne(
      uuid,
      userPermissions,
      userTeamId
    ) as Promise<CheckoutWithMeta>;
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.UPDATE_CHECKOUT)
  @UsePipes(UpdateCheckoutValidationPipe)
  @AuditLog({ action: 'update', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
    @Body() updateCheckoutDto: UpdateCheckoutDto,
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
    return this.checkoutsService.update(uuid, updateCheckoutDto, req);
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.DELETE_CHECKOUT)
  @UsePipes(CancelCheckoutValidationPipe)
  @AuditLog({ action: 'delete', entityType: 'checkout', entityIdPath: 'params.uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '반출 취소',
    description: '특정 UUID를 가진 반출을 취소합니다. 승인 전만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: CancelCheckoutDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '반출 취소 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() cancelDto: CancelCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    return this.checkoutsService.remove(uuid, cancelDto.version, req);
  }

  @Patch(':uuid/approve')
  @RequirePermissions(Permission.APPROVE_CHECKOUT)
  @UsePipes(ApproveCheckoutValidationPipe)
  @AuditLog({ action: 'approve', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
    const approverId = extractUserId(req);
    // 스코프 접근 제어 + 팀 권한 체크는 서비스 내부에서 수행 (쿼리 중복 제거)
    return this.checkoutsService.approve(uuid, { ...approveDto, approverId }, req);
  }

  @Patch(':uuid/reject')
  @RequirePermissions(Permission.REJECT_CHECKOUT)
  @UsePipes(RejectCheckoutValidationPipe)
  @AuditLog({ action: 'reject', entityType: 'checkout', entityIdPath: 'params.uuid' })
  @ApiOperation({ summary: '반출 반려', description: '반출을 반려합니다. 반려 사유는 필수입니다.' })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: RejectCheckoutDto })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 반려 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '반려 불가능한 상태 또는 사유 누락' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async reject(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectDto: RejectCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    const approverId = extractUserId(req);
    return this.checkoutsService.reject(uuid, { ...rejectDto, approverId }, req);
  }

  @Post(':uuid/start')
  @RequirePermissions(Permission.START_CHECKOUT)
  @UsePipes(StartCheckoutValidationPipe)
  @AuditLog({ action: 'update', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
    @Body() startDto: StartCheckoutDto,
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
    return this.checkoutsService.startCheckout(
      uuid,
      {
        version: startDto.version,
        itemConditions: startDto.itemConditions,
      },
      req
    );
  }

  @Post(':uuid/return')
  @RequirePermissions(Permission.COMPLETE_CHECKOUT)
  @UsePipes(ReturnCheckoutValidationPipe)
  @AuditLog({ action: 'update', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
    const returnerId = extractUserId(req);
    return this.checkoutsService.returnCheckout(uuid, returnDto, returnerId, req);
  }

  @Patch(':uuid/approve-return')
  @RequirePermissions(Permission.APPROVE_CHECKOUT)
  @UsePipes(ApproveReturnValidationPipe)
  @AuditLog({ action: 'approve', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
    const approverId = extractUserId(req);
    return this.checkoutsService.approveReturn(uuid, { ...approveReturnDto, approverId }, req);
  }

  @Patch(':uuid/reject-return')
  @RequirePermissions(Permission.REJECT_CHECKOUT)
  @UsePipes(RejectReturnValidationPipe)
  @AuditLog({ action: 'reject', entityType: 'checkout', entityIdPath: 'params.uuid' })
  @ApiOperation({
    summary: '반입 반려',
    description:
      '기술책임자가 검사 결과가 미충족인 반입을 반려합니다. ' +
      '반려 시 상태가 checked_out으로 되돌아가며, 재검사 후 반입 처리가 필요합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: RejectReturnDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '반입 반려 성공 (상태: returned → checked_out)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '반려 불가능한 상태 (returned 상태만 반려 가능) 또는 사유 누락',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '기술책임자 권한 없음' })
  async rejectReturn(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rejectReturnDto: RejectReturnDto,
    @Request() req: AuthenticatedRequest
  ): Promise<Checkout> {
    const approverId = extractUserId(req);
    const approverTeamId = req.user?.teamId;
    return this.checkoutsService.rejectReturn(
      uuid,
      {
        ...rejectReturnDto,
        approverId,
        approverTeamId,
      },
      req
    );
  }

  @Post(':uuid/condition-check')
  @RequirePermissions(Permission.COMPLETE_CHECKOUT)
  @UsePipes(CreateConditionCheckValidationPipe)
  @AuditLog({ action: 'update', entityType: 'checkout', entityIdPath: 'params.uuid' })
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
  ): Promise<unknown> {
    const checkerId = extractUserId(req);
    return this.checkoutsService.submitConditionCheck(uuid, dto, checkerId, req);
  }

  @Get(':uuid/condition-checks')
  @RequirePermissions(Permission.VIEW_CHECKOUTS)
  @ApiOperation({
    summary: '상태 확인 이력 조회',
    description: '특정 반출의 양측 4단계 상태 확인 이력을 조회합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: '상태 확인 이력 조회 성공' })
  async getConditionChecks(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<unknown> {
    return this.checkoutsService.getConditionChecks(uuid);
  }

  @Patch(':uuid/cancel')
  @RequirePermissions(Permission.CANCEL_CHECKOUT)
  @UsePipes(CancelCheckoutValidationPipe)
  @AuditLog({ action: 'update', entityType: 'checkout', entityIdPath: 'params.uuid' })
  @ApiOperation({
    summary: '반출 취소',
    description: '승인 전 반출을 취소합니다. 신청자만 취소 가능합니다.',
  })
  @ApiParam({ name: 'uuid', description: '반출 UUID', type: String, format: 'uuid' })
  @ApiBody({ type: CancelCheckoutDto })
  @ApiResponse({ status: HttpStatus.OK, description: '반출 취소 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '취소 불가능한 상태' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '반출을 찾을 수 없음' })
  async cancel(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() cancelDto: CancelCheckoutDto,
    @Request() req: AuthenticatedRequest
  ): Promise<unknown> {
    return this.checkoutsService.cancel(uuid, cancelDto.version, req);
  }
}
