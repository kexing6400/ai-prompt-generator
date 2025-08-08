/**
 * NonceProvider组件
 * 服务端组件，用于获取CSP nonce并传递给客户端组件
 */
import { headers } from 'next/headers';
import { SafeScript, SafeJSONLD } from './SafeScript';

interface NonceProviderProps {
  children: React.ReactNode;
}

/**
 * 获取nonce的服务端组件
 */
export async function NonceProvider({ children }: NonceProviderProps) {
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') || '';
  
  return (
    <>
      {/* 将nonce作为全局变量注入 */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `window.__CSP_NONCE__ = '${nonce}';`
        }}
      />
      {children}
    </>
  );
}

/**
 * 安全的服务端脚本组件
 */
interface ServerSafeScriptProps {
  children: string;
  type?: string;
  id?: string;
}

export async function ServerSafeScript({ 
  children, 
  type = "text/javascript",
  id 
}: ServerSafeScriptProps) {
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') || '';

  return (
    <SafeScript
      nonce={nonce}
      type={type}
      id={id}
    >
      {children}
    </SafeScript>
  );
}

/**
 * 安全的服务端JSON-LD组件
 */
interface ServerSafeJSONLDProps {
  data: Record<string, any>;
  id?: string;
}

export async function ServerSafeJSONLD({ data, id }: ServerSafeJSONLDProps) {
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') || '';

  return (
    <SafeJSONLD
      nonce={nonce}
      data={data}
      id={id}
    />
  );
}