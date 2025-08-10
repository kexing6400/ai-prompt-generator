'use client'

import { GraduationCap } from 'lucide-react'
import IndustryTemplatesPage from '../../../../components/industry-templates-page'

export default function TeacherTemplatesPage() {
  return (
    <IndustryTemplatesPage
      industryKey="teacher"
      industryName="教育行业"
      industryTitle="教育行业AI提示词模板库"
      industryDescription="2025年最新专业教育提示词模板，涵盖课程设计、作业批改、学生评估等核心场景"
      industryIcon={GraduationCap}
      gradientClass="gradient-teacher"
    />
  )
}