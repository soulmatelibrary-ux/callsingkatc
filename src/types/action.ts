/**
 * 파일 업로드 인터페이스 (file_uploads 테이블)
 * 엑셀 파일 업로드 이력 및 처리 결과 추적
 */
export interface FileUpload {
  id: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  uploaded_at: string;

  // 처리 결과
  total_rows: number;
  success_count: number;
  failed_count: number;
  error_message?: string;

  // 상태
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;

  // API 응답용 camelCase 필드
  fileName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  totalRows?: number;
  successCount?: number;
  failedCount?: number;
  errorMessage?: string;
  processedAt?: string;
}

/**
 * 유사호출부호 인터페이스 (callsigns 테이블)
 * 항공사별 유사호출부호 마스터 데이터 및 위험도 정보
 */
export interface Callsign {
  id: string;
  airline_id: string;
  airline_code: string;

  // 호출부호 쌍 정보
  callsign_pair: string; // "KAL852 | KAL851"
  my_callsign: string; // "KAL852"
  other_callsign: string; // "KAL851"
  other_airline_code?: string; // "AAR", "JJA" 등

  // 위험도 정보
  error_type?: string; // "관제사 오류", "조종사 오류", "오류 미발생"
  sub_error?: string; // "복창오류", "무응답/재호출" 등
  risk_level?: string; // "매우높음", "높음", "낮음"
  similarity?: string; // "매우높음", "높음", "낮음"

  // 발생 통계
  occurrence_count: number;
  last_occurred_at?: string;

  // 업로드 정보
  file_upload_id?: string;
  uploaded_at?: string;

  created_at: string;
  updated_at: string;

  // API 응답용 camelCase 필드
  airlineId?: string;
  airlineCode?: string;
  callsignPair?: string;
  myCallsign?: string;
  otherCallsign?: string;
  otherAirlineCode?: string;
  errorType?: string;
  subError?: string;
  riskLevel?: string;
  occurrenceCount?: number;
  lastOccurredAt?: string;
  fileUploadId?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 조치 인터페이스 (actions 테이블)
 * 항공사별 조치 이력 관리 및 상태 추적
 */
export interface Action {
  id: string;
  airline_id: string;
  callsign_id: string;

  // 조치 정보
  action_type: string; // "편명 변경", "브리핑 시행", "모니터링 강화" 등
  description?: string;
  manager_name?: string;
  manager_email?: string;
  planned_due_date?: string;

  // 상태 추적
  status: 'pending' | 'in_progress' | 'completed';
  result_detail?: string;
  completed_at?: string;

  // 등록자/수정자
  registered_by: string;
  registered_at: string;
  updated_at: string;

  // 관리자 검토 (선택사항)
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;

  // API 응답 시 포함 정보
  airline?: any; // Airline 객체
  callsign?: Callsign; // Callsign 객체
  registeredUser?: any; // User 객체

  // API 응답용 camelCase 필드
  airlineId?: string;
  callsignId?: string;
  actionType?: string;
  managerName?: string;
  managerEmail?: string;
  plannedDueDate?: string;
  resultDetail?: string;
  completedAt?: string;
  registeredBy?: string;
  registeredAt?: string;
  updatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

/**
 * 조치 수정 이력 인터페이스 (action_history 테이블)
 * 감사 추적 용도로 조치 변경 이력 기록
 */
export interface ActionHistory {
  id: string;
  action_id: string;
  changed_by?: string;
  changed_at: string;

  field_name?: string;
  old_value?: string;
  new_value?: string;

  // API 응답용 camelCase 필드
  actionId?: string;
  changedBy?: string;
  changedAt?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}

/**
 * 조치 등록/수정 요청 타입
 */
export interface CreateActionRequest {
  callsign_id: string;
  action_type: string;
  description?: string;
  manager_name?: string;
  manager_email?: string;
  planned_due_date?: string;
}

export interface UpdateActionRequest {
  status?: 'pending' | 'in_progress' | 'completed';
  description?: string;
  manager_name?: string;
  manager_email?: string;
  planned_due_date?: string;
  result_detail?: string;
  completed_at?: string;
  review_comment?: string;
}

/**
 * 조치 목록 조회 응답 타입
 */
export interface ActionListResponse {
  data: Action[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 호출부호 목록 조회 응답 타입
 */
export interface CallsignListResponse {
  data: Callsign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 파일 업로드 응답 타입
 */
export interface UploadResponse {
  fileUpload: FileUpload;
  callsignsCreated: number;
  errors?: Array<{ row: number; reason: string }>;
}

/**
 * 조치 요약 통계 (대시보드용)
 */
export interface ActionStats {
  airline_id: string;
  total_actions: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  completion_rate: number; // 0-100 (%)
}

/**
 * 호출부호별 조치 정보 (상세 조회용)
 */
export interface CallsignActionDetail {
  callsign: Callsign;
  actions: Action[];
  actionStats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}
