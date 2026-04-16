# Contract: Container Security Hardening (Phase G)

## Slug: container-hardening

## Scope

base.yml + prod/lan override의 컨테이너 보안 하드닝.

## MUST Criteria

- [ ] **M1**: base.yml의 postgres/redis/rustfs에 `security_opt: [no-new-privileges:true]` 적용
- [ ] **M2**: base.yml의 postgres/redis/rustfs에 `cap_drop: [ALL]` 적용
- [ ] **M3**: prod.override.yml의 앱 서비스(frontend/backend/nginx/migration)와 모니터링 서비스에 동일 보안 설정 적용
- [ ] **M4**: `read_only: true` 적용 시 tmpfs 마운트 필요한 경로 확보 (postgres: /tmp, /run; redis: /tmp 등)
- [ ] **M5**: 기존 healthcheck/volume/environment 설정 유지
- [ ] **M6**: YAML 문법 유효
- [ ] **M7**: `docker compose -f infra/compose/base.yml config` 성공 (base 단독 파싱)

## SHOULD Criteria

- [ ] **S1**: YAML extension field (`x-security`) 사용하여 DRY 원칙 준수
- [ ] **S2**: lan.override.yml의 추가 서비스에도 동일 보안 설정 적용
- [ ] **S3**: node-exporter/cadvisor는 호스트 접근이 필요하므로 예외 처리 문서화
