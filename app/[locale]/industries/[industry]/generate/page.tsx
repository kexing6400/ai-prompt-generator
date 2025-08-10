'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PromptGeneratorPage } from '@/components/industry/prompt-generator-page';
import { INDUSTRY_IDS } from '@/lib/constants/industries';
import { notFound } from 'next/navigation';

export default function GeneratePage() {
  const params = useParams();
  const industryId = params.industry as string;

  // 验证行业ID是否有效
  if (!INDUSTRY_IDS.includes(industryId as any)) {
    notFound();
  }

  return <PromptGeneratorPage industryId={industryId} />;
}