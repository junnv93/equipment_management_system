# rustfs 커스텀 이미지 — healthcheck 스크립트 내장 (bind mount 제거)
#
# build context = infra/ (base.yml에서 context: ..)
# digest 핀닝은 ARG로 관리 — 업그레이드 시 이 값만 변경
# multi-arch: docker buildx build --platform linux/amd64,linux/arm64

ARG RUSTFS_IMAGE=rustfs/rustfs@sha256:f1b59053332cdaa00c6a0d08b43f02fb2d12bf2749098b6d9d5eed693b39b695

FROM ${RUSTFS_IMAGE}

COPY --chmod=755 healthchecks/rustfs-liveness.sh /healthchecks/rustfs-liveness.sh
