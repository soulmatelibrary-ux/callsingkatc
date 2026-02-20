"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api/client";

interface UserSearchResult {
  id: string;
  email: string;
  status: "active" | "suspended";
  role: string;
  lastLoginAt?: string;
  createdAt?: string;
  created_at?: string;
}

interface ResetResult {
  email: string;
  tempPassword: string;
  message: string;
}

export function PasswordResetSection() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const email = searchEmail.trim();
    if (!email) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setHasSearched(false);
    setResetResult(null);
    setResetError(null);

    try {
      const response = await apiFetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("사용자 목록을 불러오지 못했습니다.");
      }
      const data = await response.json();
      const allUsers: UserSearchResult[] = data.users;

      const filtered = allUsers.filter((u) =>
        u.email.toLowerCase().includes(email.toLowerCase()),
      );
      setSearchResults(filtered);
      setHasSearched(true);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "오류가 발생했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePasswordReset(user: UserSearchResult) {
    const confirmed = window.confirm(
      `"${user.email}" 사용자의 비밀번호를 초기화하시겠습니까?\n초기화된 임시 비밀번호를 사용자에게 전달해야 합니다.`,
    );
    if (!confirmed) return;

    setResettingId(user.id);
    setResetResult(null);
    setResetError(null);

    try {
      const response = await apiFetch(
        `/api/admin/users/${user.id}/password-reset`,
        { method: "PUT" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "비밀번호 초기화에 실패했습니다.");
      }

      setResetResult({
        email: data.email,
        tempPassword: data.tempPassword,
        message: data.message,
      });
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : "오류가 발생했습니다.",
      );
    } finally {
      setResettingId(null);
    }
  }

  function formatDate(isoString?: string) {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">비밀번호 초기화</h2>

      {resetResult && (
        <div
          role="alert"
          className="px-6 py-5 rounded-xl border-2 border-green-300 bg-green-50 space-y-3"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="font-bold text-green-800">비밀번호 초기화 완료</p>
          </div>
          <div className="space-y-1 text-sm text-green-900">
            <p>
              <span className="font-semibold">사용자:</span> {resetResult.email}
            </p>
            <p>
              <span className="font-semibold">임시 비밀번호:</span>{" "}
              <code className="px-2 py-0.5 bg-green-100 border border-green-300 rounded font-mono text-base">
                {resetResult.tempPassword}
              </code>
            </p>
          </div>
          <p className="text-xs text-green-700 border-t border-green-200 pt-2">
            위 임시 비밀번호를 사용자에게 안전하게 전달해주세요.
            사용자는 로그인 후 반드시 비밀번호를 변경해야 합니다.
          </p>
          <button
            className="text-xs text-green-600 underline"
            onClick={() => setResetResult(null)}
          >
            닫기
          </button>
        </div>
      )}

      {resetError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {resetError}
        </div>
      )}

      <Card>
        <CardHeader
          title="사용자 검색"
          description="이메일 주소로 사용자를 검색합니다."
        />
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                id="search-email"
                type="text"
                placeholder="이메일 주소 입력 (부분 일치 검색)"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearching}
              disabled={!searchEmail.trim()}
            >
              검색
            </Button>
          </form>

          {searchError && (
            <p className="mt-3 text-sm text-red-600">{searchError}</p>
          )}
        </CardBody>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader
            title="검색 결과"
            description={
              searchResults.length > 0
                ? `${searchResults.length}명의 사용자를 찾았습니다.`
                : "검색 결과가 없습니다."
            }
          />
          <CardBody className="p-0">
            {searchResults.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                &ldquo;{searchEmail}&rdquo; 에 해당하는 사용자가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                        이메일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchResults.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-900">{user.email}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {user.role === "admin" ? "관리자" : "사용자"}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {formatDate(user.created_at || user.createdAt)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePasswordReset(user)}
                            isLoading={resettingId === user.id}
                          >
                            비밀번호 초기화
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
