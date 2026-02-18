# Safe Form Watch Pattern (SSOT)

**CRITICAL**: react-hook-form의 `watch()` 사용 시 첫 렌더링에서 undefined 반환 가능 → `useWatch` 훅 사용 필수

## ❌ Anti-Pattern (위험)

```tsx
// 🔴 첫 렌더링 시 undefined → `alertDays.includes()` 크래시
const alertDays = form.watch('alertDays');
```

## ✅ Correct Pattern (안전)

### Option A: useWatch 훅 (권장)

```tsx
import { useWatch } from 'react-hook-form';

const alertDays = useWatch({
  control: form.control,
  name: 'alertDays',
  defaultValue: DEFAULT_CALIBRATION_ALERT_DAYS, // 항상 유효한 값 보장
});
```

**장점**:

- 첫 렌더링부터 defaultValue 보장
- react-hook-form 공식 권장 패턴
- 타입 안전성

### Option B: FormField 사용 (단일 필드만)

```tsx
<FormField
  control={form.control}
  name="alertDays"
  render={({ field }) => (
    <div>
      {/* field.value는 항상 정의됨 */}
      {field.value.map(...)}
    </div>
  )}
/>
```

**제약**:

- 배열 chip 토글처럼 여러 버튼이 하나의 필드를 제어하는 경우 부적합
- 단일 input/select에만 적합

## Architecture Pattern

### 1. Form 초기화

```tsx
const form = useForm<FormType>({
  resolver: zodResolver(schema),
  defaultValues: DEFAULT_VALUES, // SSOT에서 import
});
```

### 2. 서버 데이터 동기화 (isDirty 가드)

```tsx
useEffect(() => {
  // isDirty 가드: 사용자가 변경 중일 때 서버 refetch로 인한 리셋 방지
  if (data && !form.formState.isDirty) {
    form.reset(data);
  }
}, [data, form]);
```

### 3. 안전한 값 구독

```tsx
const fieldValue = useWatch({
  control: form.control,
  name: 'fieldName',
  defaultValue: DEFAULT_VALUE,
});
```

### 4. 프로그래밍 방식 변경

```tsx
const handleChange = (newValue: T) => {
  form.setValue('fieldName', newValue, {
    shouldDirty: true, // isDirty 상태 업데이트
    shouldValidate: true, // 검증 트리거 (optional)
  });
};
```

### 5. 저장 버튼 비활성화

```tsx
<Button
  disabled={
    mutation.isPending ||
    !form.formState.isDirty || // 변경 없음
    !form.formState.isValid // 검증 실패 (optional)
  }
>
  저장
</Button>
```

## Design Token Integration

Settings 페이지에서는 **SETTINGS_CHIP_TOKENS** 사용:

```tsx
import {
  getSettingsChipClasses,
  getSettingsChipIconClasses,
  SETTINGS_SPACING_TOKENS,
} from '@/lib/design-tokens';

<div className={SETTINGS_SPACING_TOKENS.chipGroup}>
  {AVAILABLE_OPTIONS.map((option) => {
    const isSelected = fieldValue.includes(option);
    return (
      <button className={getSettingsChipClasses(isSelected)} onClick={() => handleToggle(option)}>
        <Icon className={getSettingsChipIconClasses()} />
        {option.label}
      </button>
    );
  })}
</div>;
```

## Cross-Workflow Application

### 적용 대상

1. **교정 알림 설정** (`CalibrationSettingsContent.tsx`) ✅ 완료
2. **알림 카테고리 설정** (`NotificationSettingsContent.tsx`) - 후보
3. **시스템 설정** (`SystemSettingsContent.tsx`) - DisplayPreferencesContent 패턴 유지
4. **기타 다중 선택 UI** - 동일한 chip 토글 패턴 사용 시

### 마이그레이션 체크리스트

- [ ] `form.watch()` → `useWatch()` 전환
- [ ] `useEffect`에 `!form.formState.isDirty` 가드 추가
- [ ] `form.setValue(..., { shouldDirty: true })` 옵션 명시
- [ ] 하드코딩된 chip 스타일 → `getSettingsChipClasses()` 전환
- [ ] defaultValues를 SSOT에서 import

## Performance Considerations

**useWatch vs watch()**:

- `useWatch`: 값이 변경될 때만 리렌더링 (선택적 구독)
- `watch()`: 모든 폼 값 변경 시 리렌더링 (전체 구독)

→ 성능상 `useWatch` 권장 (특히 큰 폼)

## Error Boundary

```tsx
// error.tsx
'use client';

export default function SettingsError({ error, reset }: ErrorBoundaryProps) {
  return (
    <div>
      <h2>설정 페이지 오류</h2>
      <p>{error.message}</p>
      <button onClick={reset}>재시도</button>
    </div>
  );
}
```

## References

- react-hook-form 공식 문서: https://react-hook-form.com/docs/usewatch
- CLAUDE.md: Frontend Patterns - State Management
- Design Token System v2: `lib/design-tokens/components/settings.ts`
