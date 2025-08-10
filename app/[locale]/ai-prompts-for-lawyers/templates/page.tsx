'use client'

import { Scale } from 'lucide-react'
import IndustryTemplatesPage from '../../../../components/industry-templates-page'

export default function LawyerTemplatesPage() {
  return (
    <IndustryTemplatesPage
      industryKey="lawyer"
      industryName="法律行业"
      industryTitle="法律行业AI提示词模板库"
      industryDescription="2025年最新专业法律提示词模板，涵盖合同审查、案例分析、法律研究等核心场景"
      industryIcon={Scale}
      gradientClass="gradient-lawyer"
    />
  )
}