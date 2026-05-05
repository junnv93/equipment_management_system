/**
 * HCT 교정성적서 표지 텍스트 fixture (anonymized).
 *
 * 실제 PDF에서 `pdftotext -layout`으로 추출한 텍스트를 PII만 제거한 형태.
 * 의뢰자명/시리얼/사람 이름은 가공하되 추출 대상 필드는 양식 그대로 유지.
 */

/** 케이스 1: 일반 성적서 — 모든 필드 존재 (Network Analyzer) */
export const HCT_COVER_BASELINE = `                                                            교정성적서
                                                          Certificate of Calibration
                                        주식회사 에이치시티 경기도 이천시 마장면 서이천로578번길 74
                                                   Tel : 031-645-6900, Fax : 031-645-6969
성적서번호(Certificate No) : IC-2026-044869                                                                           페이지(page) : 1 of   11
교정번호(Calibration No) : C-2026-051428

  1. 의뢰자 (Client)
     기관명 (Name) :           TEST 컴퍼니(주)
     주소 (Address) :         경기도 수원시 영통구 매영로 218

  2. 측정기 (Calibration subject)
     기기명 (Description)         : NETWORK ANALYZER
     제작회사 (Manufacturer) : ROHDE & SCHWARZ
     형식(Model name)            : ZNB 40
     기기번호 (Serial number) : 999999
     HCT 등록번호 (HCT ID) : 999999
     고객사 관리번호 (Asset ID) : SUW-E0149

  3. 교정일자 (Date of calibration) :            2026.04.20                    차기교정예정일자 (The due date of next Cal.) :         2027.04.20
    ※ 차기교정예정일자는 교정대상 및 주기설정을 위한 지침(KOLAS-G-008) 별표 1에 규정된 교정주기를 준용하여 기재됩니다.
`;

/** 케이스 2: 수정 성적서 R1 — certificateNumber에 -R1 suffix + 본문 parent 문구 (Wideband Radio Tester) */
export const HCT_COVER_REVISION_R1 = `                                                            교정성적서
                                                           Certificate of Calibration
                                         주식회사 에이치시티 경기도 이천시 마장면 서이천로578번길 74
                                                    Tel : 031-645-6900, Fax : 031-645-6969
성적서번호(Certificate No) : IC-2026-004871-R1                                                                       페이지(page) : 1 of   23
교정번호(Calibration No) : C-2026-006161
                                                                                  ※ 이 성적서는 제'IC-2026-004871'호의 수정 성적서 입니다.
  1. 의뢰자 (Client)
     기관명 (Name) :           TEST 컴퍼니(주)

  2. 측정기 (Calibration subject)
     기기명 (Description)         : WIDEBAND RADIO COMMUNICATION TESTER
     형식(Model name)            : CMW500
     고객사 관리번호 (Asset ID) : SUW-E0409

  3. 교정일자 (Date of calibration) :            2026.01.14                     차기교정예정일자 (The due date of next Cal.) :       2027.01.14
`;

/** 케이스 3: 차기교정예정일자 누락 양식 — KOLAS-G-008 비대상 장비 (Horn Antenna) */
export const HCT_COVER_NO_NEXT_DATE = `                                                            교정성적서
                                                           Certificate of Calibration
                                         주식회사 에이치시티 경기도 이천시 마장면 서이천로578번길 74
성적서번호(Certificate No) : IC-2025-028904                                                                           페이지(page) : 1 of 7
교정번호(Calibration No) : C-2025-033730

  1. 의뢰자 (Client)
     기관명 (Name) :           TEST 컴퍼니(주)

  2. 측정기 (Calibration subject)
     기기명 (Description)         : HORN ANTENNA
     형식(Model name)            : 3117
     고객사 관리번호 (Asset ID) : SUW-E0205

  3. 교정일자 (Date of calibration) :            2025.03.24


  4. 교정환경 (Environment)
     온도 (Temperature)               :    ( 22.8 ± 0.1 ) ℃
`;

/** 케이스 4 (negative): HCT marker 누락 — 다른 기관 양식 */
export const NON_HCT_FORM = `교정성적서
다른교정기관㈜ 서울특별시 ...
성적서번호 : KTL-2026-12345
고객사 관리번호 : SUW-E0001
`;

/** 케이스 5 (negative): 성적서번호 누락 */
export const HCT_COVER_MISSING_CERT_NO = `                                                            교정성적서
                                                          Certificate of Calibration
                                        주식회사 에이치시티 경기도 이천시 마장면
교정번호(Calibration No) : C-2026-051428

  2. 측정기 (Calibration subject)
     고객사 관리번호 (Asset ID) : SUW-E0149

  3. 교정일자 (Date of calibration) :            2026.04.20                    차기교정예정일자 (The due date of next Cal.) :         2027.04.20
`;
