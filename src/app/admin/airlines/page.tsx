/**
 * 항공사 관리 페이지
 * GET /admin/airlines
 *
 * 기능:
 * - 항공사 목록 표시 (display_order 기준)
 * - 항공사 생성
 * - 항공사 수정 (인라인 편집)
 * - 항공사 삭제
 * - 순서 변경 (▲▼ 버튼)
 */

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useAdminAirlines,
  useCreateAirline,
  useUpdateAirline,
  useDeleteAirline,
  Airline,
} from '@/hooks/useAirlines';

interface EditingAirline {
  id: string;
  code: string;
  name_ko: string;
  name_en: string;
}

interface NewAirlineForm {
  code: string;
  name_ko: string;
  name_en: string;
}

export default function AirlinesAdminPage() {
  const [editingAirline, setEditingAirline] = useState<EditingAirline | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAirline, setNewAirline] = useState<NewAirlineForm>({
    code: '',
    name_ko: '',
    name_en: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: airlines = [], isLoading } = useAdminAirlines();
  const createMutation = useCreateAirline();
  const updateMutation = useUpdateAirline();
  const deleteMutation = useDeleteAirline();

  // 순서 변경 (위로)
  async function handleMoveUp(airline: Airline) {
    const index = airlines.findIndex((a) => a.id === airline.id);
    if (index <= 0) return;

    const previousAirline = airlines[index - 1];
    try {
      await Promise.all([
        updateMutation.mutateAsync({
          id: airline.id,
          display_order: previousAirline.display_order,
        }),
        updateMutation.mutateAsync({
          id: previousAirline.id,
          display_order: airline.display_order,
        }),
      ]);
    } catch (err) {
      console.error('순서 변경 실패:', err);
    }
  }

  // 순서 변경 (아래로)
  async function handleMoveDown(airline: Airline) {
    const index = airlines.findIndex((a) => a.id === airline.id);
    if (index >= airlines.length - 1) return;

    const nextAirline = airlines[index + 1];
    try {
      await Promise.all([
        updateMutation.mutateAsync({
          id: airline.id,
          display_order: nextAirline.display_order,
        }),
        updateMutation.mutateAsync({
          id: nextAirline.id,
          display_order: airline.display_order,
        }),
      ]);
    } catch (err) {
      console.error('순서 변경 실패:', err);
    }
  }

  // 편집 시작
  function handleStartEdit(airline: Airline) {
    setEditingAirline({
      id: airline.id,
      code: airline.code,
      name_ko: airline.name_ko,
      name_en: airline.name_en,
    });
  }

  // 편집 취소
  function handleCancelEdit() {
    setEditingAirline(null);
  }

  // 편집 저장
  async function handleSaveEdit() {
    if (!editingAirline) return;

    try {
      await updateMutation.mutateAsync({
        id: editingAirline.id,
        code: editingAirline.code,
        name_ko: editingAirline.name_ko,
        name_en: editingAirline.name_en,
      });
      setEditingAirline(null);
    } catch (err) {
      console.error('편집 실패:', err);
    }
  }

  // 항공사 생성
  async function handleCreateAirline() {
    if (!newAirline.code || !newAirline.name_ko) {
      alert('코드와 한글명은 필수입니다.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: newAirline.code,
        name_ko: newAirline.name_ko,
        name_en: newAirline.name_en,
      });
      setNewAirline({ code: '', name_ko: '', name_en: '' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('생성 실패:', err);
    }
  }

  // 항공사 삭제
  async function handleDeleteAirline(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pt-20">
        {/* 페이지 제목 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">항공사 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              항공사 목록 및 순서 관리
            </p>
          </div>
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '취소' : '+ 항공사 추가'}
            </Button>
          </div>
        </div>

        {/* 항공사 생성 폼 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              새 항공사 추가
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="new-code"
                type="text"
                label="코드"
                placeholder="예: KAL"
                value={newAirline.code}
                onChange={(e) =>
                  setNewAirline({ ...newAirline, code: e.target.value })
                }
                disabled={createMutation.isPending}
              />
              <Input
                id="new-name-ko"
                type="text"
                label="한글명"
                placeholder="예: 대한항공"
                value={newAirline.name_ko}
                onChange={(e) =>
                  setNewAirline({ ...newAirline, name_ko: e.target.value })
                }
                disabled={createMutation.isPending}
              />
              <Input
                id="new-name-en"
                type="text"
                label="영문명"
                placeholder="예: Korean Air"
                value={newAirline.name_en}
                onChange={(e) =>
                  setNewAirline({ ...newAirline, name_en: e.target.value })
                }
                disabled={createMutation.isPending}
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                disabled={createMutation.isPending}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAirline}
                isLoading={createMutation.isPending}
              >
                추가
              </Button>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">항공사 목록 로딩 중...</p>
          </div>
        ) : airlines.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">항공사가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    순서
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    코드
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    한글명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    영문명
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {airlines.map((airline, index) => (
                  <tr
                    key={airline.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-600">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveUp(airline)}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="위로 이동"
                        >
                          ▲
                        </button>
                        <span className="w-6 text-center">{index + 1}</span>
                        <button
                          onClick={() => handleMoveDown(airline)}
                          disabled={index === airlines.length - 1}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="아래로 이동"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingAirline?.id === airline.id ? (
                        <Input
                          id={`edit-code-${airline.id}`}
                          type="text"
                          value={editingAirline.code}
                          onChange={(e) =>
                            setEditingAirline({
                              ...editingAirline,
                              code: e.target.value,
                            })
                          }
                          className="text-sm"
                          disabled={updateMutation.isPending}
                        />
                      ) : (
                        <span className="font-medium text-gray-900">
                          {airline.code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingAirline?.id === airline.id ? (
                        <Input
                          id={`edit-name-ko-${airline.id}`}
                          type="text"
                          value={editingAirline.name_ko}
                          onChange={(e) =>
                            setEditingAirline({
                              ...editingAirline,
                              name_ko: e.target.value,
                            })
                          }
                          className="text-sm"
                          disabled={updateMutation.isPending}
                        />
                      ) : (
                        <span className="text-gray-700">{airline.name_ko}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingAirline?.id === airline.id ? (
                        <Input
                          id={`edit-name-en-${airline.id}`}
                          type="text"
                          value={editingAirline.name_en}
                          onChange={(e) =>
                            setEditingAirline({
                              ...editingAirline,
                              name_en: e.target.value,
                            })
                          }
                          className="text-sm"
                          disabled={updateMutation.isPending}
                        />
                      ) : (
                        <span className="text-gray-600">{airline.name_en}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {editingAirline?.id === airline.id ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={updateMutation.isPending}
                            >
                              취소
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              isLoading={updateMutation.isPending}
                            >
                              저장
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartEdit(airline)}
                            >
                              수정
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDeleteConfirm(airline.id)}
                            >
                              삭제
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 삭제 확인 다이얼로그 */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">항공사 삭제</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  정말 이 항공사를 삭제하시겠습니까?
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDeleteAirline(deleteConfirm)}
                  isLoading={deleteMutation.isPending}
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
