// JSON-LD 结构化数据组件 - 世界级SEO
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Prompt Builder Pro',
    alternateName: 'AI提示词生成器',
    url: 'https://www.aiprompts.ink',
    logo: 'https://www.aiprompts.ink/icons/icon-base.svg',
    description: '专业垂直行业AI提示词生成器，为律师、教师、会计师、房产经纪、保险顾问等专业人士量身打造',
    sameAs: [
      'https://twitter.com/aiprompts_ink',
      'https://linkedin.com/company/aiprompts-ink',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@aiprompts.ink',
      contactType: 'customer service',
      availableLanguage: ['zh-CN', 'en'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Prompt Builder Pro',
    description: '智能AI提示词生成工具，支持5大垂直行业',
    url: 'https://www.aiprompts.ink',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '9000',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://www.aiprompts.ink${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQJsonLd() {
  const faqs = [
    {
      question: '什么是AI Prompt Builder Pro？',
      answer: 'AI Prompt Builder Pro是一个专业的垂直行业AI提示词生成器，为律师、教师、会计师等专业人士提供定制化的AI提示词模板。',
    },
    {
      question: '如何使用AI Prompt Builder Pro？',
      answer: '选择您的行业，填写相关表单，系统会自动生成专业的AI提示词，复制即可在ChatGPT、Claude等AI工具中使用。',
    },
    {
      question: 'AI Prompt Builder Pro是免费的吗？',
      answer: '是的，基础功能完全免费。我们提供700+专业模板供您使用。',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}