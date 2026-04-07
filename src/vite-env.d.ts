/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 배포 백엔드 origin (예: https://xxx.herokuapp.com). 설정 시 `/api/todos`가 붙어 API로 사용됩니다. */
  readonly VITE_BACKEND_URL?: string
  /** Todo API 전체 베이스 URL (선택). 있으면 VITE_BACKEND_URL보다 우선합니다. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
