import React, { useEffect, useState, useCallback } from 'react';
import { boardService } from '../services/board';

interface MemberPanelProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

interface Member {
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  boardId,
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState('viewer');
  const [addError, setAddError] = useState<string | null>(null);

  const currentUserIsOwner = members.some(
    (m) => m.userId === currentUserId && m.role === 'owner'
  );

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await boardService.getMembers(boardId);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await boardService.updateMemberRole(boardId, userId, newRole);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await boardService.removeMember(boardId, userId);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const trimmedUserId = addUserId.trim();
    if (!trimmedUserId) return;

    try {
      // Uses the existing POST /api/boards/:id/members endpoint
      // which expects { userId, role }
      const { getCsrfToken } = await import('../utils/csrf');
      const API_BASE_URL =
        import.meta.env?.VITE_API_URL ||
        (typeof window !== 'undefined'
          ? 'http://localhost:8080/api'
          : 'http://backend:8080/api');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/boards/${boardId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ userId: trimmedUserId, role: addRole }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to add member');
      }

      setAddUserId('');
      setAddRole('viewer');
      await fetchMembers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '100vw',
          backgroundColor: 'white',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px' }}>Board Members</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#666',
            }}
          >
            X
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Loading members...
            </div>
          ) : error ? (
            <div style={{ color: '#dc3545', padding: '12px', marginBottom: '12px' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Member list */}
              <div style={{ marginBottom: '24px' }}>
                {members.map((member) => (
                  <div
                    key={member.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.displayName}
                        {member.userId === currentUserId && (
                          <span style={{ color: '#666', fontWeight: 400, marginLeft: '6px' }}>
                            (you)
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#888',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.email}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                      {member.role === 'owner' ? (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#007bff',
                            padding: '4px 8px',
                            backgroundColor: '#e7f1ff',
                            borderRadius: '4px',
                          }}
                        >
                          Owner
                        </span>
                      ) : currentUserIsOwner ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            padding: '4px 8px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                          }}
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member section */}
              {currentUserIsOwner && (
                <div
                  style={{
                    borderTop: '1px solid #ddd',
                    paddingTop: '16px',
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Add Member</h4>
                  <form onSubmit={handleAddMember}>
                    <div style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="User ID"
                        value={addUserId}
                        onChange={(e) => setAddUserId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="submit"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {addError && (
                      <div style={{ color: '#dc3545', fontSize: '12px' }}>{addError}</div>
                    )}
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
