/**
 * AI Prompt Templates Data - TypeScript Module (English Version)
 * Converted from templates-2025.json to ensure proper loading on Vercel deployment
 */

// Type definitions
export interface PromptTemplate {
  system: string;
  context: string;
  task: string;
  format: string;
  examples: string;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prompt: PromptTemplate;
  tags: string[];
  useCases: string[];
  bestPractices: string[];
}

export interface Industry {
  name: string;
  description: string;
  icon: string;
  templates: Template[];
}

export interface TemplatesData {
  version: string;
  lastUpdated: string;
  totalTemplates: number;
  industries: Record<string, Industry>;
}

// Template Data
export const templatesData: TemplatesData = {
  "version": "2025.1",
  "lastUpdated": "2024-12-10",
  "totalTemplates": 50,
  "industries": {
    "lawyer": {
      "name": "Legal Services",
      "description": "Professional legal services AI prompt templates",
      "icon": "Scale",
      "templates": [
        {
          "id": "lawyer-contract-review",
          "title": "Smart Contract Review & Risk Analysis",
          "category": "Contract Management",
          "description": "Comprehensive commercial contract review, risk identification, and modification recommendations",
          "difficulty": "intermediate",
          "estimatedTime": "15-20 minutes",
          "prompt": {
            "system": "You are a senior commercial lawyer with 15 years of experience, specializing in contract law, corporate law, and risk management. Your task is to review contract texts in a professional, rigorous, and detailed manner.",
            "context": "A client needs you to review a commercial contract, identify potential legal risks, and provide professional modification recommendations. Please pay special attention to: completeness of clauses, balance of rights and obligations between parties, reasonableness of breach liability, and effectiveness of dispute resolution mechanisms.",
            "task": "Please conduct a comprehensive review of the following contract:\n1. Identify all potential legal risk points\n2. Assess the severity of each risk (High/Medium/Low)\n3. Provide specific modification recommendations\n4. Point out missing necessary clauses\n5. Summarize the overall risk assessment of the contract",
            "format": "Please output in the following format:\n【Contract Basic Information】\n- Contract Type:\n- Parties Involved:\n- Contract Term:\n\n【Risk Assessment Checklist】\n1. Risk Point: [Specific clause]\n   Risk Level: [High/Medium/Low]\n   Risk Description: [Detailed explanation]\n   Modification Recommendation: [Specific suggestion]\n\n【Missing Clause Recommendations】\n\n【Overall Assessment】\n\n【Next Action Recommendations】",
            "examples": "Input: Complete text of \"Technology Service Agreement\"\nOutput: Detailed risk analysis report including 10 risk point assessments and 5 improvement recommendations"
          },
          "tags": [
            "Contract Review",
            "Risk Assessment", 
            "Legal Compliance",
            "Commercial Legal Affairs"
          ],
          "useCases": [
            "M&A Transactions",
            "Partnership Agreements",
            "Service Contracts",
            "Procurement Contracts"
          ],
          "bestPractices": [
            "Always approach from the perspective of maximizing client interests",
            "Pay attention to identifying hidden unfavorable clauses",
            "Ensure recommendations comply with latest laws and regulations",
            "Provide actionable specific modification plans"
          ]
        },
        {
          "id": "lawyer-legal-research",
          "title": "Legal Research & Case Analysis",
          "category": "Legal Research",
          "description": "In-depth legal research, case analysis, and legal opinion provision",
          "difficulty": "advanced",
          "estimatedTime": "30-45 minutes",
          "prompt": {
            "system": "You are a legal research expert, proficient in case law analysis, comparative legal research, and legal reasoning. You need to conduct in-depth legal research and provide well-founded legal opinions.",
            "context": "Need to conduct in-depth research on specific legal issues, including: analysis of relevant legal provisions, study of judicial interpretations, comparison of typical cases, and compilation of academic viewpoints.",
            "task": "Please conduct research on the following legal issue:\n1. Clarify the core points of dispute in the legal issue\n2. List relevant legal and regulatory basis\n3. Analyze 3-5 related precedents\n4. Summarize different judicial viewpoints from various courts\n5. Provide clear legal opinions and basis",
            "format": "【Issue Overview】\n\n【Legal Basis】\n- Laws:\n- Judicial Interpretations:\n- Local Regulations:\n\n【Case Analysis】\nCase 1: [Case Number]\n- Basic Facts:\n- Court's View:\n- Judgment Result:\n\n【Viewpoint Summary】\n\n【Conclusion & Recommendations】",
            "examples": "Input: Legal issues regarding online platform liability\nOutput: Research report with 5 related case analyses and clear legal opinions"
          },
          "tags": [
            "Legal Research",
            "Case Analysis",
            "Judicial Precedents",
            "Legal Opinions"
          ],
          "useCases": [
            "Complex Litigation",
            "Legal Advisory Services",
            "Policy Interpretation",
            "Academic Research"
          ],
          "bestPractices": [
            "Use authoritative legal databases",
            "Focus on latest judicial trends",
            "Ensure reasoning logic is clear",
            "Provide practical guidance"
          ]
        }
      ]
    },
    "realtor": {
      "name": "Real Estate",
      "description": "Professional real estate marketing and services AI prompt templates",
      "icon": "Home", 
      "templates": [
        {
          "id": "realtor-listing-description",
          "title": "Premium Property Description Optimizer",
          "category": "Property Marketing",
          "description": "Create eye-catching property descriptions that highlight selling points and increase inquiry rates",
          "difficulty": "beginner",
          "estimatedTime": "10-15 minutes",
          "prompt": {
            "system": "You are a senior real estate marketing expert who excels at writing compelling property descriptions, accurately understanding buyer psychology, and highlighting unique property value.",
            "context": "Need to create marketing copy for properties with requirements: highlight core selling points, create lifestyle scenarios, stimulate purchase desire, and provide key information.",
            "task": "Please create an attractive property description based on the following information:\n1. Analyze property highlights and advantages\n2. Create vivid lifestyle scenarios\n3. Use persuasive marketing language\n4. Include all important details\n5. Add compelling call-to-action",
            "format": "【Headline】\n[Catchy title]\n\n【Core Highlights】\n• [Key selling point 1]\n• [Key selling point 2]\n• [Key selling point 3]\n\n【Lifestyle Description】\n[Vivid scenario description]\n\n【Property Details】\n- Area:\n- Layout:\n- Location:\n- Price:\n\n【Call to Action】\n[Contact information and viewing invitation]",
            "examples": "Input: 3-bedroom apartment information\nOutput: Compelling property description that increases viewing appointments by 40%"
          },
          "tags": [
            "Property Marketing",
            "Content Creation",
            "Sales Copy",
            "Lead Generation"
          ],
          "useCases": [
            "Property Listings",
            "Marketing Materials",
            "Social Media Posts",
            "Email Campaigns"
          ],
          "bestPractices": [
            "Focus on buyer benefits rather than features",
            "Use emotional triggers and lifestyle appeal",
            "Include specific details that build credibility",
            "End with clear next steps"
          ]
        }
      ]
    },
    "insurance": {
      "name": "Insurance",
      "description": "Professional insurance services AI prompt templates",
      "icon": "Shield",
      "templates": [
        {
          "id": "insurance-needs-analysis",
          "title": "Comprehensive Insurance Needs Analysis",
          "category": "Risk Assessment",
          "description": "Analyze client's insurance needs and recommend appropriate coverage solutions",
          "difficulty": "intermediate", 
          "estimatedTime": "20-25 minutes",
          "prompt": {
            "system": "You are a certified insurance advisor with extensive experience in risk assessment and insurance planning. Your goal is to provide personalized insurance recommendations based on client's specific situation.",
            "context": "A client wants to understand their insurance needs and find appropriate coverage. You need to analyze their current situation, identify potential risks, and recommend suitable insurance products.",
            "task": "Based on the client information provided:\n1. Assess current insurance coverage gaps\n2. Identify key risks that need protection\n3. Recommend appropriate insurance types and coverage amounts\n4. Prioritize recommendations by importance\n5. Provide cost-benefit analysis",
            "format": "【Client Profile Summary】\n\n【Current Coverage Analysis】\n\n【Risk Assessment】\n- High Priority Risks:\n- Medium Priority Risks:\n- Low Priority Risks:\n\n【Insurance Recommendations】\n1. [Insurance Type]\n   - Recommended Coverage:\n   - Estimated Premium:\n   - Key Benefits:\n   - Priority Level:\n\n【Implementation Timeline】\n\n【Next Steps】",
            "examples": "Input: Family of 4 with $80K annual income\nOutput: Comprehensive insurance plan with life, health, disability, and property coverage recommendations"
          },
          "tags": [
            "Insurance Planning",
            "Risk Assessment",
            "Financial Planning",
            "Client Advisory"
          ],
          "useCases": [
            "New Client Consultations",
            "Policy Reviews",
            "Life Event Planning",
            "Business Insurance Planning"
          ],
          "bestPractices": [
            "Focus on client's actual needs, not highest commission products",
            "Explain insurance concepts in simple terms",
            "Provide multiple options with pros and cons",
            "Include regular review recommendations"
          ]
        }
      ]
    },
    "teacher": {
      "name": "Education", 
      "description": "Professional education and teaching AI prompt templates",
      "icon": "GraduationCap",
      "templates": [
        {
          "id": "teacher-lesson-plan",
          "title": "Interactive Lesson Plan Creator",
          "category": "Curriculum Design",
          "description": "Design engaging lesson plans with clear objectives, activities, and assessments",
          "difficulty": "intermediate",
          "estimatedTime": "25-30 minutes", 
          "prompt": {
            "system": "You are an experienced educator with expertise in curriculum design, student engagement, and learning assessment. You create lesson plans that accommodate different learning styles and promote active learning.",
            "context": "You need to create a comprehensive lesson plan that includes clear learning objectives, engaging activities, and effective assessment methods. Consider student age group, subject matter, and available resources.",
            "task": "Create a detailed lesson plan including:\n1. Clear learning objectives (knowledge, skills, attitudes)\n2. Engaging opening activity to capture attention\n3. Main content delivery with interactive elements\n4. Practice activities for different learning styles\n5. Assessment methods to measure understanding\n6. Homework or extension activities",
            "format": "【Lesson Overview】\n- Subject:\n- Grade Level:\n- Duration:\n- Topic:\n\n【Learning Objectives】\nStudents will be able to:\n•\n•\n•\n\n【Materials Needed】\n\n【Lesson Structure】\n1. Opening (__ minutes)\n2. Introduction of New Material (__ minutes)\n3. Guided Practice (__ minutes)\n4. Independent Practice (__ minutes)\n5. Closure (__ minutes)\n\n【Assessment Methods】\n\n【Differentiation Strategies】\n\n【Extension Activities】",
            "examples": "Input: 5th grade science lesson on the solar system\nOutput: Complete 45-minute lesson plan with hands-on activities, visual aids, and formative assessments"
          },
          "tags": [
            "Lesson Planning",
            "Curriculum Design",
            "Student Engagement",
            "Learning Assessment"
          ],
          "useCases": [
            "Daily Lesson Planning",
            "Unit Development",
            "Substitute Teacher Plans",
            "Professional Development"
          ],
          "bestPractices": [
            "Align activities with learning objectives",
            "Include multiple learning modalities",
            "Plan for different ability levels",
            "Build in regular assessment checkpoints"
          ]
        }
      ]
    },
    "accountant": {
      "name": "Accounting",
      "description": "Professional accounting and finance AI prompt templates", 
      "icon": "Calculator",
      "templates": [
        {
          "id": "accountant-financial-analysis",
          "title": "Comprehensive Financial Statement Analysis", 
          "category": "Financial Analysis",
          "description": "Analyze financial statements and provide insights on company performance and recommendations",
          "difficulty": "advanced",
          "estimatedTime": "35-40 minutes",
          "prompt": {
            "system": "You are a CPA with extensive experience in financial analysis, business valuation, and strategic planning. You provide clear, actionable insights based on financial data analysis.",
            "context": "You need to analyze a company's financial statements to assess performance, identify trends, and provide recommendations for improvement. Focus on profitability, liquidity, efficiency, and solvency.",
            "task": "Perform a comprehensive financial analysis including:\n1. Calculate key financial ratios\n2. Analyze trends over multiple periods\n3. Compare performance to industry benchmarks\n4. Identify strengths and weaknesses\n5. Provide specific recommendations for improvement\n6. Assess financial risks and opportunities",
            "format": "【Executive Summary】\n\n【Financial Ratio Analysis】\nProfitability Ratios:\n- Gross Profit Margin:\n- Net Profit Margin:\n- ROA:\n- ROE:\n\nLiquidity Ratios:\n- Current Ratio:\n- Quick Ratio:\n- Cash Ratio:\n\nEfficiency Ratios:\n- Asset Turnover:\n- Inventory Turnover:\n- Receivables Turnover:\n\nLeverage Ratios:\n- Debt-to-Equity:\n- Interest Coverage:\n\n【Trend Analysis】\n\n【Industry Comparison】\n\n【Key Findings】\n\n【Recommendations】\n\n【Risk Assessment】",
            "examples": "Input: 3-year financial statements for manufacturing company\nOutput: Detailed analysis with 15+ ratios, trend analysis, and 8 specific improvement recommendations"
          },
          "tags": [
            "Financial Analysis",
            "Ratio Analysis", 
            "Performance Assessment",
            "Business Advisory"
          ],
          "useCases": [
            "Annual Reviews",
            "Investment Decisions",
            "Credit Applications",
            "Strategic Planning"
          ],
          "bestPractices": [
            "Use multiple years of data for trend analysis",
            "Compare to relevant industry benchmarks",
            "Focus on ratios most relevant to the business",
            "Provide actionable recommendations with timelines"
          ]
        }
      ]
    }
  }
}