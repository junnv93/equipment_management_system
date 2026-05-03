# Evaluation Report: Calibration 리소스 스코프 가드 보강

## 반복 #1 (2026-05-03T18:17:18+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter backend run test -- calibration-factors.controller` 성공 | PASS | 1 suite, 13 tests passed |
| `pnpm --filter backend run test -- calibration.service` 성공 | PASS | 1 suite, 10 tests passed |
| `calibration-factors.controller.ts` create/findByEquipment/findOne/approve/reject/remove 스코프 검증 | PASS | create/findByEquipment는 `enforceEquipmentAccess`, findOne/approve/reject/remove는 `enforceFactorAccess`를 거쳐 `enforceSiteAccess` 수행 |
| `calibration.controller.ts` create/findOne/findByEquipment/중간점검/예정/담당자/요약 조회 스코프 검증 | PASS | create/findByEquipment는 equipment 기반 `enforceSiteAccess`, findOne은 calibration 기반 `enforceSiteAccess`, 컬렉션 조회는 `@SiteScoped` + `CurrentEnforcedScope` 값을 서비스 필터로 전달 |
| 클라이언트는 보정계수 생성 요청 body에 `requestedBy`를 포함하지 않는다 | FAIL | `apps/frontend/lib/api/calibration-factors-api.ts:64`의 생성 DTO가 `requestedBy?: string`을 계속 허용하고, `createCalibrationFactor`가 `data`를 그대로 POST하므로 호출자가 전달하면 body에 포함됨 |
| 행위자 필드는 계속 서버 인증 컨텍스트에서 추출한다 | PASS | 교정 `registeredBy`/`calibrationManagerId`, 교정 승인/반려 `approverId`, 보정계수 `requestedBy`/`approverId`는 컨트롤러에서 `extractUserId(req)` 기반으로 주입 |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | WARN | 별도 스킬 실행은 하지 않았으나, MUST 실패 1건 확인 |
| 변경 파일 수 제한 | PASS | 변경은 calibration/calibration-factors controller/service/spec 및 프론트 호출부 중심 |
| 컬렉션 조회의 클라이언트 제공 `site`/`teamId`가 enforced scope 밖으로 확장되지 않는다 | PASS | 팀 scope가 있으면 enforced `teamId`를 우선 적용하고, site scope는 enforced `site`를 서비스 쿼리에 전달 |

## 전체 판정: FAIL (필수 1개 미달)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| 해당 없음 | - | - | - |

## 수정 지시 (FAIL 시)
### 이슈 1: 프론트 API 생성 DTO가 `requestedBy`를 계속 허용하고 전달 가능
- **파일**: `apps/frontend/lib/api/calibration-factors-api.ts:64`
- **문제**: `CreateCalibrationFactorDto`에 `requestedBy?: string`이 남아 있고, `createCalibrationFactor`는 `apiClient.post(..., data)`로 객체를 그대로 전송한다. 현재 UI 호출부는 제거됐지만 API 클라이언트 레벨에서는 생성 요청 body에 `requestedBy`가 포함될 수 있다.
- **수정**: 프론트 생성 요청 타입에서 `requestedBy`를 제거하거나, 최소한 `createCalibrationFactor`에서 `requestedBy`를 구조분해로 버린 뒤 나머지 payload만 POST한다.
- **검증**: `rg -n "requestedBy\\??:" apps/frontend/lib/api/calibration-factors-api.ts`가 생성 DTO에서 매칭되지 않아야 하며, `pnpm --filter frontend run type-check`를 재실행한다.

## 반복 #2 (2026-05-03T18:19:13+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter backend run test -- calibration-factors.controller` 성공 | PASS | 1 suite, 13 tests passed |
| `pnpm --filter backend run test -- calibration.service` 성공 | PASS | 1 suite, 10 tests passed |
| `calibration-factors.controller.ts` create/findByEquipment/findOne/approve/reject/remove 스코프 검증 | PASS | create/findByEquipment는 `enforceEquipmentAccess`, findOne/approve/reject/remove는 `enforceFactorAccess`를 거쳐 `enforceSiteAccess` 수행 |
| `calibration.controller.ts` create/findOne/findByEquipment/중간점검/예정/담당자/요약 조회 스코프 검증 | PASS | create/findByEquipment는 equipment 기반 `enforceSiteAccess`, findOne은 calibration 기반 `enforceSiteAccess`, 중간점검/예정/담당자/요약 조회는 `@SiteScoped` + `CurrentEnforcedScope` 값을 서비스 필터로 전달 |
| 클라이언트는 보정계수 생성 요청 body에 `requestedBy`를 포함하지 않는다 | PASS | `CreateCalibrationFactorDto`에서 `requestedBy` 제거 확인. `rg -n "requestedBy"` 결과는 응답 모델 `CalibrationFactor.requestedBy`만 남음 |
| 행위자 필드는 계속 서버 인증 컨텍스트에서 추출한다 | PASS | 교정 `registeredBy`/`calibrationManagerId`, 교정 승인/반려 `approverId`, 보정계수 `requestedBy`/`approverId`는 컨트롤러에서 `extractUserId(req)` 기반으로 주입 |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | PASS | 수동 정적 검토 기준 Critical 없음 |
| 변경 파일 수 제한 | PASS | 변경은 calibration/calibration-factors controller/service/spec 및 프론트 호출부 중심 |
| 컬렉션 조회의 클라이언트 제공 `site`/`teamId`가 enforced scope 밖으로 확장되지 않는다 | PASS | 팀 scope가 있으면 enforced `teamId`를 우선 적용하고, site scope는 enforced `site`를 서비스 쿼리에 전달 |

## 전체 판정: PASS (필수 전체 충족)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| 프론트 API 생성 DTO가 `requestedBy`를 계속 허용하고 전달 가능 | FAIL | PASS | 아니오 |

## 수정 지시 (FAIL 시)
해당 없음.

## 반복 #3 (2026-05-03T18:31:00+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter backend run test -- calibration-factors.controller` 성공 | PASS | 1 suite, 13 tests passed |
| `pnpm --filter backend run test -- calibration.service` 성공 | PASS | 1 suite, 10 tests passed |
| `calibration-factors.controller.ts` create/findByEquipment/findOne/approve/reject/remove 스코프 검증 | PASS | create/findByEquipment는 `enforceEquipmentAccess`, findOne/approve/reject/remove는 `enforceFactorAccess`를 거쳐 `enforceSiteAccess` 수행 |
| `calibration.controller.ts` create/findOne/findByEquipment/중간점검/예정/담당자/요약 조회 스코프 검증 | PASS | create/findByEquipment는 equipment 기반 `enforceSiteAccess`, findOne은 calibration 기반 `enforceSiteAccess`, 주요 컬렉션 조회는 `@SiteScoped` + `CurrentEnforcedScope` 사용 |
| 클라이언트는 보정계수 생성 요청 body에 `requestedBy`를 포함하지 않는다 | PASS | 프론트 `CreateCalibrationFactorDto`에는 `requestedBy` 없음. `requestedBy` 검색 결과는 응답 모델 필드만 남음 |
| 행위자 필드는 계속 서버 인증 컨텍스트에서 추출한다 | PASS | 교정 `registeredBy`/`calibrationManagerId`, 교정 승인/반려 `approverId`, 보정계수 `requestedBy`/`approverId`는 컨트롤러에서 `extractUserId(req)` 기반으로 주입 |

## 최종 추가 확인: scoped collection raw fallback 제거
| 기준 | 판정 | 상세 |
|------|------|------|
| calibration collection endpoints use enforced scope only, not raw site/team fallback | FAIL | `apps/backend/src/modules/calibration/calibration.controller.ts:268`에서 `scope.teamId ?? query.teamId`를 전달 |
| calibration-factors collection endpoints use enforced scope only, not raw site/team fallback | FAIL | `apps/backend/src/modules/calibration-factors/calibration-factors.controller.ts:160`, `apps/backend/src/modules/calibration-factors/calibration-factors.controller.ts:188`에서 `scope.teamId ?? query.teamId`를 전달 |

## 전체 판정: FAIL (최종 추가 기준 미달)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| 프론트 API 생성 DTO가 `requestedBy`를 계속 허용하고 전달 가능 | PASS | PASS | 아니오 |
| scoped collection raw `teamId` fallback 제거 | 미확인 | FAIL | 아니오 |

## 수정 지시 (FAIL 시)
### 이슈 1: scoped collection endpoint가 raw `query.teamId` fallback을 계속 사용
- **파일**: `apps/backend/src/modules/calibration/calibration.controller.ts:268`
- **문제**: `findPendingApprovals`가 `scope.teamId ?? query.teamId`를 서비스에 전달한다. 최종 요구사항은 scoped collection endpoint에서 raw `site`/`teamId` fallback 없이 `CurrentEnforcedScope`만 사용하는 것이다.
- **수정**: 서비스 호출 인자의 팀 필터를 `scope.teamId`로 제한한다.

### 이슈 2: calibration-factors scoped collection endpoint가 raw `query.teamId` fallback을 계속 사용
- **파일**: `apps/backend/src/modules/calibration-factors/calibration-factors.controller.ts:160`
- **파일**: `apps/backend/src/modules/calibration-factors/calibration-factors.controller.ts:188`
- **문제**: `findPendingApprovals`, `getRegistry`가 `scope.teamId ?? query.teamId`를 서비스에 전달한다. 최종 요구사항은 scoped collection endpoint에서 raw `site`/`teamId` fallback 없이 `CurrentEnforcedScope`만 사용하는 것이다.
- **수정**: 서비스 호출 인자의 팀 필터를 `scope.teamId`로 제한한다.

## 반복 #4 (2026-05-03T18:25:21+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | `tsc --noEmit` 성공 |
| `pnpm --filter backend run test -- calibration-factors.controller` 성공 | PASS | 1 suite, 13 tests passed |
| `pnpm --filter backend run test -- calibration.service` 성공 | PASS | 1 suite, 10 tests passed |
| `calibration-factors.controller.ts` create/findByEquipment/findOne/approve/reject/remove 스코프 검증 | PASS | create/findByEquipment는 `enforceEquipmentAccess`, findOne/approve/reject/remove는 `enforceFactorAccess`를 거쳐 `enforceSiteAccess` 수행 |
| `calibration.controller.ts` create/findOne/findByEquipment/중간점검/예정/담당자/요약 조회 스코프 검증 | PASS | create/findByEquipment는 equipment 기반 `enforceSiteAccess`, findOne은 calibration 기반 `enforceSiteAccess`, 컬렉션 조회는 `@SiteScoped` + `CurrentEnforcedScope` 값을 서비스 필터로 전달 |
| 클라이언트는 보정계수 생성 요청 body에 `requestedBy`를 포함하지 않는다 | PASS | 프론트 `CreateCalibrationFactorDto`에는 `requestedBy` 없음. `requestedBy` 검색 결과는 응답 모델 필드만 남음 |
| 행위자 필드는 계속 서버 인증 컨텍스트에서 추출한다 | PASS | 교정 `registeredBy`/`calibrationManagerId`, 교정 승인/반려 `approverId`, 보정계수 `requestedBy`/`approverId`는 컨트롤러에서 `extractUserId(req)` 기반으로 주입 |

## 최종 추가 확인: scoped collection raw fallback 제거
| 기준 | 판정 | 상세 |
|------|------|------|
| `scope.teamId ?? query.teamId`가 calibration/calibration-factors controllers에 남아 있지 않다 | PASS | `rg -n "scope\\.teamId \\?\\? query\\.teamId" apps/backend/src/modules/calibration apps/backend/src/modules/calibration-factors` 매칭 없음 |
| calibration collection endpoints use enforced scope only, not raw site/team fallback | PASS | `findPendingApprovals`는 `scope.site`, `scope.teamId`만 전달. 나머지 컬렉션 조회도 `CurrentEnforcedScope`의 `site`/`teamId`를 사용 |
| calibration-factors collection endpoints use enforced scope only, not raw site/team fallback | PASS | `findPendingApprovals`와 `getRegistry`가 각각 `scope.site`, `scope.teamId`만 전달 |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | PASS | 수동 정적 검토 기준 Critical 없음 |
| 변경 파일 수 제한 | PASS | 변경은 calibration/calibration-factors controller/service/spec 및 프론트 호출부 중심 |
| 컬렉션 조회의 클라이언트 제공 `site`/`teamId`가 enforced scope 밖으로 확장되지 않는다 | PASS | scoped collection endpoint에서 raw `site`/`teamId` fallback 없음 |

## 전체 판정: PASS (필수 전체 충족)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| scoped collection raw `teamId` fallback 제거 | FAIL | PASS | 아니오 |

## 수정 지시 (FAIL 시)
해당 없음.
