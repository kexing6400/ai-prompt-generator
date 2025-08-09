import { Shield } from 'lucide-react'
import IndustryTemplatesPage from '../../../../components/industry-templates-page'

export default function InsuranceTemplatesPage() {
  return (
    <IndustryTemplatesPage
      industryKey="insurance"
      industryName="保险行业"
      industryTitle="保险行业AI提示词模板库"
      industryDescription="2025年最新专业保险提示词模板，涵盖保单分析、风险评估、理赔处理等核心场景"
      industryIcon={Shield}
      gradientClass="gradient-insurance"
    />
  )
}