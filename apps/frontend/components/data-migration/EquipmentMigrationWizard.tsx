'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import FileUploadStep from './FileUploadStep';
import PreviewStep from './PreviewStep';
import ResultStep from './ResultStep';
import type {
  MigrationPreviewResult,
  MigrationExecuteResult,
  PreviewOptions,
} from '@/lib/api/data-migration-api';

type WizardStep = 'upload' | 'preview' | 'result';

const STEPS: WizardStep[] = ['upload', 'preview', 'result'];

export default function EquipmentMigrationWizard() {
  const t = useTranslations('data-migration');
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [previewResult, setPreviewResult] = useState<MigrationPreviewResult | null>(null);
  const [executeResult, setExecuteResult] = useState<MigrationExecuteResult | null>(null);
  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({});

  const stepIndex = STEPS.indexOf(currentStep);

  const handlePreviewComplete = (result: MigrationPreviewResult, options: PreviewOptions) => {
    setPreviewResult(result);
    setPreviewOptions(options);
    setCurrentStep('preview');
  };

  const handleExecuteComplete = (result: MigrationExecuteResult) => {
    setExecuteResult(result);
    setCurrentStep('result');
  };

  const handleReset = () => {
    setPreviewResult(null);
    setExecuteResult(null);
    setPreviewOptions({});
    setCurrentStep('upload');
  };

  return (
    <div className="space-y-8">
      {/* 스텝 인디케이터 */}
      <nav aria-label="마이그레이션 단계">
        <ol className="flex items-center gap-0">
          {STEPS.map((step, index) => {
            const isDone = index < stepIndex;
            const isActive = index === stepIndex;
            return (
              <li key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                      isDone
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isActive
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {t(`steps.${step}`)}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      isDone ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 스텝 콘텐츠 */}
      {currentStep === 'upload' && <FileUploadStep onPreviewComplete={handlePreviewComplete} />}
      {currentStep === 'preview' && previewResult && (
        <PreviewStep
          preview={previewResult}
          options={previewOptions}
          onExecuteComplete={handleExecuteComplete}
          onBack={handleReset}
        />
      )}
      {currentStep === 'result' && executeResult && (
        <ResultStep result={executeResult} onReset={handleReset} />
      )}
    </div>
  );
}
