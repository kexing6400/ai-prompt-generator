'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ScenarioDetailPage } from '@/components/industry/scenario-detail-page';
import { INDUSTRY_IDS } from '@/lib/constants/industries';
import { notFound } from 'next/navigation';

// 法律场景列表
const LEGAL_SCENARIOS = [
  'litigation',
  'contract-review',
  'legal-research',
  'case-management',
  'client-consultation',
  'document-drafting',
  'compliance-check',
  'risk-assessment'
];

export default function ScenarioPage() {
  const params = useParams();
  const industryId = params.industry as string;
  const scenarioId = params.scenario as string;

  // 验证行业ID和场景ID是否有效
  if (!INDUSTRY_IDS.includes(industryId as any) || !LEGAL_SCENARIOS.includes(scenarioId)) {
    notFound();
  }

  return (
    <ScenarioDetailPage 
      industryId={industryId} 
      scenarioId={scenarioId}
    />
  );
}