/**
 * VITE_BACKEND_URL: 배포 백엔드 호스트 (예: https://xxx.herokuapp.com, 끝 슬래시 없음)
 * VITE_API_BASE_URL: Todo API 전체 베이스(선택). 지정 시 이 값이 우선합니다.
 */
const backendOrigin = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '') ?? ''

export const BACKEND_URL = backendOrigin

export function getApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit
  if (backendOrigin) return `${backendOrigin}/api/todos`
  if (import.meta.env.DEV) return '/api/todos'
  return 'http://localhost:5000/api/todos'
}
