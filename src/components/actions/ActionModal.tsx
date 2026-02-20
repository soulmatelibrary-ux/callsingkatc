'use client';

import { useState } from 'react';
import { useCreateAction, useUpdateAction } from '@/hooks/useActions';
import { Callsign } from '@/types/action';

interface ActionModalProps {
  airlineId: string;
  callsigns: Callsign[];
  selectedCallsign?: Callsign;
  actionId?: string; // 수정 모드일 때
  initialData?: {
    actionType?: string;
    managerName?: string;
    description?: string;
    plannedDueDate?: string;
    status?: 'in_progress' | 'completed'; // 수정 모드일 때만 사용
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActionModal({
  airlineId,
  callsigns,
  selectedCallsign,
  actionId,
  initialData,
  onClose,
  onSuccess,
}: ActionModalProps) {
  const [callsignId, setCallsignId] = useState(selectedCallsign?.id || '');
  const [actionType, setActionType] = useState(initialData?.actionType || '');
  const [managerName, setManagerName] = useState(initialData?.managerName || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // 조치 예정일 기본값을 오늘로 설정
  const today = new Date().toISOString().split('T')[0];
  const [plannedDueDate, setPlannedDueDate] = useState(
    initialData?.plannedDueDate || today
  );
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    initialData?.status || 'in_progress'
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateAction();
  const updateMutation = useUpdateAction();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!callsignId) {
      setError('유사호출부호를 선택하세요.');
      return;
    }
    if (!actionType) {
      setError('조치 유형을 선택하세요.');
      return;
    }
    if (!managerName.trim()) {
      setError('담당자 이름을 입력하세요.');
      return;
    }

    try {
      if (actionId) {
        // 수정 모드
        await updateMutation.mutateAsync({
          id: actionId,
          description: description || undefined,
          manager_name: managerName,
          planned_due_date: plannedDueDate || undefined,
          status: status,
        });
      } else {
        // 신규 등록 모드
        await createMutation.mutateAsync({
          airlineId,
          callsign_id: callsignId,
          action_type: actionType,
          description: description || undefined,
          manager_name: managerName,
          planned_due_date: plannedDueDate || undefined,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: '720px',
          maxWidth: '95vw',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(15,23,42,0.25)',
          padding: '24px 24px 20px',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            {actionId ? '조치 수정' : '조치 등록'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '20px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              color: '#9ca3af',
              opacity: isLoading ? 0.5 : 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 유사호출부호 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '6px',
              }}
            >
              유사호출부호 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={callsignId}
              onChange={(e) => setCallsignId(e.target.value)}
              disabled={isLoading || !!actionId}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                opacity: isLoading || actionId ? 0.6 : 1,
                cursor: isLoading || actionId ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">선택하세요</option>
              {callsigns.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.callsign_pair} ({cs.risk_level})
                </option>
              ))}
            </select>
          </div>

          {/* 조치 유형 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '6px',
              }}
            >
              조치 유형 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">선택하세요</option>
              <option value="편명 변경">편명 변경</option>
              <option value="브리핑 시행">브리핑 시행</option>
              <option value="모니터링 강화">모니터링 강화</option>
              <option value="절차 개선">절차 개선</option>
              <option value="시스템 개선">시스템 개선</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 담당자 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '6px',
              }}
            >
              담당자 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="담당자 이름"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
          </div>

          {/* 조치 예정일 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '6px',
              }}
            >
              조치 예정일
            </label>
            <input
              type="date"
              value={plannedDueDate}
              onChange={(e) => setPlannedDueDate(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
          </div>

          {/* 상세내용 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '6px',
              }}
            >
              상세내용
            </label>
            <textarea
              rows={4}
              placeholder="조치 내용을 기술하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                resize: 'vertical',
                opacity: isLoading ? 0.6 : 1,
              }}
            />
          </div>

          {/* 상태 (수정 모드에서만 표시) */}
          {actionId && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#4b5563',
                  marginBottom: '6px',
                }}
              >
                상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'in_progress' | 'completed')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>
          )}

          {/* 버튼 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
