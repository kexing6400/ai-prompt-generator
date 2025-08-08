/**
 * SafeScript组件
 * 安全地处理内联脚本，使用CSP nonce而不是unsafe-inline
 */
'use client';

interface SafeScriptProps {
  children: string;
  type?: string;
  id?: string | undefined;
  nonce?: string | undefined;
}

/**
 * 安全脚本组件 - 使用CSP nonce
 */
export function SafeScript({ 
  children, 
  type = "text/javascript",
  id,
  nonce
}: SafeScriptProps) {
  return (
    <script
      type={type}
      nonce={nonce || undefined}
      id={id}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

/**
 * 安全JSON-LD脚本组件
 */
interface SafeJSONLDProps {
  data: Record<string, any>;
  id?: string | undefined;
  nonce?: string | undefined;
}

export function SafeJSONLD({ data, id, nonce }: SafeJSONLDProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce || undefined}
      id={id}
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify(data) 
      }}
    />
  );
}