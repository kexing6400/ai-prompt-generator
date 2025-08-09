import { Calculator } from 'lucide-react'
import IndustryTemplatesPage from '../../../../components/industry-templates-page'

export default function AccountantTemplatesPage() {
  return (
    <IndustryTemplatesPage
      industryKey="accountant"
      industryName="会计行业"
      industryTitle="会计行业AI提示词模板库"
      industryDescription="2025年最新专业会计提示词模板，涵盖财务报表、税务筹划、审计分析等核心场景"
      industryIcon={Calculator}
      gradientClass="gradient-accountant"
    />
  )
}