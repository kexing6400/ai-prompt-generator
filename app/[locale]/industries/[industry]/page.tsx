'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ScenarioSelectionPage } from '@/components/industry/scenario-selection-page';
import { INDUSTRY_IDS } from '@/lib/constants/industries';
import { notFound } from 'next/navigation';

export default function IndustryPage() {
  const params = useParams();
  const industryId = params.industry as string;

  // 验证行业ID是否有效
  if (!INDUSTRY_IDS.includes(industryId as any)) {
    notFound();
  }

  return <ScenarioSelectionPage industryId={industryId} />;
}