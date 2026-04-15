# age 키 백업 Runbook

본 문서는 [ADR-0005 (sops+age 채택)](../adr/0005-secret-management-roadmap.md) §Mitigations 에 명시된 "키 백업 절차 필수" 요구를 이행한다. 개인 age 키는 모든 암호화 secret 의 **유일한 복호화 권한** 이므로, 분실 = 복호화 불가 = LAN/Prod 배포 불가 상태가 된다. **이중화 백업은 선택이 아니다.**

## TL;DR (새 PC 최초 설정 시)

```bash
# 1. sops + age 설치
sudo apt install -y age
curl -fsSL -o /tmp/sops.deb https://github.com/getsops/sops/releases/download/v3.9.1/sops_3.9.1_amd64.deb
sudo dpkg -i /tmp/sops.deb

# 2. age 키 생성
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt

# 3. public key 확인 → .sops.yaml 에 추가
grep 'public key:' ~/.config/sops/age/keys.txt

# 4. 백업 (아래 §이중 백업 절차)
# 5. 기존 메인테이너에게 신규 public key 전달 → sops updatekeys 요청
```

## 이중 백업 절차 (필수)

age 키 `~/.config/sops/age/keys.txt` (약 190 bytes) 는 다음 **두 경로 모두** 에 저장한다. 한쪽이 손상되거나 분실되어도 다른 쪽으로 복구 가능해야 한다.

### 경로 1: 1Password Secure Note

1. 1Password 에서 **"Secure Note"** 새로 생성
2. 제목: `equipment_management_system / age key / <PC 이름>` (예: `… / age key / wsl-home-desktop`)
3. 본문에 `keys.txt` 의 **전체 내용** 붙여넣기 (public key 주석 포함)
4. 태그: `secret-key`, `age`
5. Vault: 프로젝트 전용 Vault (있다면) 또는 개인 Vault

> 1Password 계정 자체가 손상되면 이것도 사라지므로 경로 2 필수.

### 경로 2: 외장 USB (암호화된 볼륨)

1. **암호화된 USB 파티션 마련**:
   - Windows: BitLocker To Go
   - macOS: FileVault 디스크 유틸리티 → Encrypted APFS 볼륨
   - Linux: LUKS (`cryptsetup luksFormat`)
2. 해당 볼륨에 디렉토리 생성: `<usb>/equipment_management_system/age-keys/`
3. 키 복사: `cp ~/.config/sops/age/keys.txt <usb>/.../age-keys/<PC 이름>-$(date +%Y%m%d).txt`
4. **분리 보관**: USB 는 평소 PC 와 분리된 물리적 장소(예: 집 금고)에 보관
5. 1년마다 가독성 검증 (USB 플래시 bit rot 가능성)

### 공유 금지 경로

- ❌ **Slack / 메신저 DM** — 수신자 측 로그 + 업체 데이터 사이드 리스크
- ❌ **이메일** — 스팸 필터/메타데이터 영구 로그
- ❌ **git 저장소** (암호화 없이) — 당연히 금지
- ❌ **GitHub secret** 에 개인 키 — CI 용 별도 키를 쓰고, 본인 개인 키는 CI 에 올리지 않음
- ❌ **클라우드 드라이브** (OneDrive / iCloud / Google Drive) — 업체 측 평문 저장 가정

## 신규 PC 등록 절차 (기존 메인테이너가 수행)

1. 신규 PC 측에서 위 절차로 age 키 생성 + public key 공유
2. 기존 메인테이너가 `.sops.yaml` 의 `keys:` 섹션에 새 public key 추가:
   ```yaml
   keys:
     - &pc_primary age1existing...
     - &pc_new age1newpublic...
   ```
3. `creation_rules` 의 `key_groups.age:` 리스트에 `*pc_new` 앵커 추가
4. 기존 암호화 파일 전체 재암호화:
   ```bash
   pnpm secrets:rotate-key
   ```
5. 변경사항 커밋 + 푸시
6. 신규 PC 측에서 `git pull && pnpm secrets:decrypt lan` 로 검증

## 키 분실 대응

### 시나리오 1: PC 고장/도난 (본인 통제 상실)

1. **유출로 간주** — 실제 키가 탈취되었다고 가정
2. `.sops.yaml` 에서 해당 PC 의 public key 즉시 제거
3. `pnpm secrets:rotate-key` 로 재암호화
4. **secret 값 자체도 회전**: DB 비밀번호, JWT_SECRET, Azure AD client secret 등 (상세: [secret-rotation.md](secret-rotation.md))

### 시나리오 2: 본인 PC 는 정상, 백업만 분실

- 1Password 와 USB 중 살아 있는 쪽으로 복구
- 둘 다 분실 + PC 도 손상: **유일 남은 메인테이너 키 하나만 있으면 복구 가능** (그래서 `.sops.yaml` 에 다수 recipient 등록이 필수)
- 다수 recipient 모두 분실: secret 값 재발급 (DB 비밀번호 재설정 등) + 새 키로 재암호화. 로그인/세션 전체 무효화.

## 보안 위생

- `keys.txt` 는 `chmod 600` (OS mode check)
- 복호화된 `.env` 파일은 `/run/secrets/` (tmpfs) 로만 — `secrets-decrypt.sh` 가 강제
- swap 비활성화 권장 (tmpfs → swap 유출 방지): `sudo swapoff -a`
- 터미널 히스토리에 키 내용 남지 않도록 `cat ~/.config/sops/age/keys.txt` 같은 직접 출력 금지 — 편집기로만 열기
