import { Home } from 'lucide-react'
import IndustryTemplatesPage from '../../../../components/industry-templates-page'

export default function RealtorTemplatesPage() {
  return (
    <IndustryTemplatesPage
      industryKey="realtor"
      industryName="房地产行业"
      industryTitle="房地产行业AI提示词模板库"
      industryDescription="2025年最新专业房地产提示词模板，涵盖房源描述、市场分析、客户沟通等核心场景"
      industryIcon={Home}
      gradientClass="gradient-realtor"
    />
  )
}