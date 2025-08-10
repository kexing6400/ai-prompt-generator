import { SimpleTemplate } from './types'

// 教师专业人员的简化模板库
export const teacherTemplates: SimpleTemplate[] = [
  {
    id: 'lesson-plan',
    title: '教案设计助手',
    description: '创建结构化、有趣的课堂教学计划',
    industry: 'teachers',
    icon: '📚',
    fields: [
      {
        name: 'subject',
        label: '学科',
        type: 'select',
        required: true,
        options: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育']
      },
      {
        name: 'gradeLevel',
        label: '年级',
        type: 'select',
        required: true,
        options: ['小学1-3年级', '小学4-6年级', '初中7-9年级', '高中10-12年级', '大学本科', '成人教育']
      },
      {
        name: 'topic',
        label: '课程主题',
        type: 'text',
        placeholder: '例如：分数的加减法、古诗词赏析、细胞结构',
        required: true
      },
      {
        name: 'duration',
        label: '课时安排',
        type: 'select',
        required: true,
        options: ['40分钟(1课时)', '80分钟(2课时)', '120分钟(3课时)', '一周系列课程']
      },
      {
        name: 'learningGoals',
        label: '学习目标',
        type: 'textarea',
        placeholder: '例如：掌握分数加减法运算规律，能够解决实际问题，培养逻辑思维能力',
        required: true
      }
    ],
    prompt: `你是一名经验丰富的教育专家和优秀教师。请为以下课程设计一份详细的教案：

学科：{{subject}}
年级：{{gradeLevel}}
课程主题：{{topic}}
课时安排：{{duration}}
学习目标：{{learningGoals}}

请设计一份完整的教案，包括：
1. 教学目标（知识、能力、情感态度价值观）
2. 教学重点和难点分析
3. 教学方法和策略选择
4. 详细的教学过程设计（导入、新课、练习、总结）
5. 学生活动安排和互动环节
6. 教学资源和工具准备
7. 作业布置和课后延伸
8. 教学反思和改进建议

要求教案结构清晰，内容丰富，符合教育教学规律，注重学生参与和能力培养。`
  },

  {
    id: 'student-feedback',
    title: '学生评价反馈',
    description: '个性化学生评价和成长建议',
    industry: 'teachers',
    icon: '⭐',
    fields: [
      {
        name: 'studentName',
        label: '学生姓名',
        type: 'text',
        placeholder: '例如：小明',
        required: true
      },
      {
        name: 'evaluationPeriod',
        label: '评价时期',
        type: 'select',
        required: true,
        options: ['月度评价', '期中评价', '期末评价', '学年总结', '特殊表现评价']
      },
      {
        name: 'strengths',
        label: '优点表现',
        type: 'textarea',
        placeholder: '例如：学习认真，作业完成质量高，乐于帮助同学，数学思维活跃',
        required: true
      },
      {
        name: 'improvements',
        label: '需要改进的方面',
        type: 'textarea',
        placeholder: '例如：上课发言不够积极，写字需要更加工整，需要加强英语口语练习',
        required: true
      },
      {
        name: 'parentCommunication',
        label: '家长沟通重点',
        type: 'select',
        required: true,
        options: ['表扬为主', '改进建议为主', '平衡反馈', '特殊关注事项', '家校合作重点']
      }
    ],
    prompt: `你是一名专业的班主任和学科教师。请为学生撰写一份温暖而专业的评价反馈：

学生姓名：{{studentName}}
评价时期：{{evaluationPeriod}}
优点表现：{{strengths}}
改进方面：{{improvements}}
沟通重点：{{parentCommunication}}

请撰写一份个性化的学生评价，包括：
1. 温暖的开场和对学生的肯定
2. 具体的优点表现和成长亮点
3. 建设性的改进建议和指导方向
4. 针对性的学习方法和习惯建议
5. 家长配合的具体建议
6. 对学生未来发展的鼓励和期望
7. 教师的支持承诺和联系方式

语言温和而专业，既要客观准确，又要鼓舞人心，体现教育者的关爱和智慧。字数300-400字。`
  },

  {
    id: 'parent-communication',
    title: '家长沟通模板',
    description: '专业的家校沟通信息模板',
    industry: 'teachers',
    icon: '👨‍👩‍👧‍👦',
    fields: [
      {
        name: 'communicationPurpose',
        label: '沟通目的',
        type: 'select',
        required: true,
        options: ['学习情况反馈', '行为问题讨论', '家校配合事宜', '特长发展建议', '心理关怀沟通', '重要通知告知']
      },
      {
        name: 'studentSituation',
        label: '学生具体情况',
        type: 'textarea',
        placeholder: '例如：最近数学成绩有所下降，上课注意力不够集中，但在美术方面表现突出',
        required: true
      },
      {
        name: 'urgencyLevel',
        label: '紧急程度',
        type: 'select',
        required: true,
        options: ['常规交流', '需要关注', '比较紧急', '非常紧急']
      },
      {
        name: 'preferredMethod',
        label: '沟通方式',
        type: 'select',
        required: true,
        options: ['微信消息', '电话沟通', '面谈约见', '家长会发言', '书面反馈']
      }
    ],
    prompt: `你是一名经验丰富的班主任。请为家长沟通准备一份专业而温暖的信息：

沟通目的：{{communicationPurpose}}
学生情况：{{studentSituation}}
紧急程度：{{urgencyLevel}}
沟通方式：{{preferredMethod}}

请准备一份家长沟通内容，包括：
1. 礼貌的问候和感谢家长的配合
2. 客观描述学生的具体情况
3. 分析问题或情况的可能原因
4. 提出具体的解决方案和建议
5. 明确家长需要配合的具体事项
6. 表达对学生成长的信心和支持
7. 邀请进一步沟通和反馈

语言要专业而亲和，既要准确传达信息，又要维护良好的家校关系，体现教育者的专业素养。字数250-350字。`
  },

  {
    id: 'classroom-activity',
    title: '课堂活动设计',
    description: '创意互动教学活动方案',
    industry: 'teachers',
    icon: '🎯',
    fields: [
      {
        name: 'activityType',
        label: '活动类型',
        type: 'select',
        required: true,
        options: ['小组讨论', '角色扮演', '实验探究', '游戏教学', '项目学习', '辩论比赛', '创作展示']
      },
      {
        name: 'subjectArea',
        label: '学科领域',
        type: 'select',
        required: true,
        options: ['语言文学', '数学逻辑', '科学探究', '社会人文', '艺术创作', '体育健康', '综合实践']
      },
      {
        name: 'classSize',
        label: '班级规模',
        type: 'select',
        required: true,
        options: ['小班(10-20人)', '中班(20-35人)', '大班(35-50人)', '大型活动(50人以上)']
      },
      {
        name: 'activityGoal',
        label: '活动目标',
        type: 'textarea',
        placeholder: '例如：培养学生合作能力，加深对课文内容的理解，提升表达沟通技巧',
        required: true
      },
      {
        name: 'availableResources',
        label: '可用资源',
        type: 'textarea',
        placeholder: '例如：多媒体设备、实验器材、图书资料、户外场地等',
        required: true
      }
    ],
    prompt: `你是一名富有创意的教学设计专家。请设计一个生动有趣的课堂活动：

活动类型：{{activityType}}
学科领域：{{subjectArea}}
班级规模：{{classSize}}
活动目标：{{activityGoal}}
可用资源：{{availableResources}}

请设计一个完整的课堂活动方案，包括：
1. 活动名称和创意理念
2. 详细的活动流程和时间安排
3. 学生分组和角色分配方案
4. 教师指导要点和关键环节
5. 所需材料和资源准备清单
6. 学生参与度和互动机制
7. 成果展示和评价方式
8. 活动延伸和课后思考

要求活动设计新颖有趣，操作性强，能够充分调动学生积极性，实现预期教学目标。字数400-500字。`
  },

  {
    id: 'assessment-rubric',
    title: '评价量规制定',
    description: '科学的学生学习评价标准',
    industry: 'teachers',
    icon: '📊',
    fields: [
      {
        name: 'assessmentTarget',
        label: '评价对象',
        type: 'select',
        required: true,
        options: ['作业完成情况', '课堂表现', '项目作品', '考试成绩', '合作能力', '创新思维', '综合素质']
      },
      {
        name: 'evaluationLevel',
        label: '评价层次',
        type: 'select',
        required: true,
        options: ['3级评价(优良差)', '4级评价(优良中差)', '5级评价(ABCDE)', '百分制评价', '等级+描述']
      },
      {
        name: 'keyDimensions',
        label: '主要评价维度',
        type: 'textarea',
        placeholder: '例如：内容准确性、表达清晰度、创新程度、完成质量、团队合作等',
        required: true
      },
      {
        name: 'studentAge',
        label: '学生年龄段',
        type: 'select',
        required: true,
        options: ['幼儿园(3-6岁)', '小学低年级(6-9岁)', '小学高年级(9-12岁)', '初中(12-15岁)', '高中(15-18岁)']
      }
    ],
    prompt: `你是一名专业的教育评价专家。请制定一套科学合理的评价量规：

评价对象：{{assessmentTarget}}
评价层次：{{evaluationLevel}}
评价维度：{{keyDimensions}}
学生年龄：{{studentAge}}

请制定一套详细的评价量规，包括：
1. 评价目标和评价原则说明
2. 各个评价维度的具体标准
3. 不同等级的详细描述和判断依据
4. 评价过程的操作指引
5. 学生自评和互评的参与方式
6. 评价结果的反馈和改进建议
7. 评价数据的记录和分析方法
8. 促进学生成长的激励机制

要求评价标准清晰具体，操作性强，既体现严谨性又兼顾发展性，符合学生年龄特点和认知水平。字数350-450字。`
  }
]