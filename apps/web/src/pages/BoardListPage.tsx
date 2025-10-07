import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { boardService } from '../services/board';
import { Board, CreateBoard } from '@gathercomb/shared';

export const BoardListPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadBoards();
  }, [user, navigate]);

  const loadBoards = async () => {
    try {
      const userBoards = await boardService.getUserBoards();
      setBoards(userBoards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const boardData: CreateBoard = {
        title: newBoardTitle.trim(),
      };
      const newBoard = await boardService.createBoard(boardData);
      setBoards(prev => [newBoard, ...prev]);
      setNewBoardTitle('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;

    try {
      await boardService.deleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>My Boards</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Welcome, {user?.displayName}</span>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create New Board
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3>Create New Board</h3>
          <form onSubmit={handleCreateBoard}>
            <div className="form-group">
              <label className="form-label" htmlFor="boardTitle">
                Board Title
              </label>
              <input
                type="text"
                id="boardTitle"
                className="form-input"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board title"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">
                Create Board
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {boards.map(board => (
          <div key={board.id} className="card">
            <h3 style={{ marginBottom: '8px' }}>{board.title}</h3>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '16px' }}>
              Created: {new Date(board.createdAt).toLocaleDateString()}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate(`/board/${board.id}`)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Open Board
              </button>
              <button
                onClick={() => handleDeleteBoard(board.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="text-center" style={{ marginTop: '60px' }}>
          <p className="text-muted">No boards yet. Create your first board to get started!</p>
        </div>
      )}
    </div>
  );
};
