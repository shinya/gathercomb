import { v4 as uuidv4 } from 'uuid';
import { CustomError } from '../middleware/errorHandler.js';
import { CreateBoard, CreateMembership, Board } from '@gathercomb/shared';
import { emailService } from './email.js';
import { queryOne, queryMany } from '../utils/database.js';

export const boardService = {
  async createBoard(boardData: CreateBoard, ownerId: string): Promise<Board> {
    const board: Board = {
      id: uuidv4(),
      title: boardData.title,
      ownerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Insert board into database
    await queryOne(
      'INSERT INTO boards (id, title, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [board.id, board.title, board.ownerId, board.createdAt, board.updatedAt]
    );

    // Add owner as member
    await queryOne(
      'INSERT INTO memberships (user_id, board_id, role) VALUES ($1, $2, $3)',
      [ownerId, board.id, 'owner']
    );

    return board;
  },

  async getBoard(boardId: string, userId: string): Promise<Board> {
    const board = await queryOne(
      'SELECT id, title, owner_id, created_at, updated_at FROM boards WHERE id = $1',
      [boardId]
    );

    if (!board) {
      throw new CustomError('Board not found', 404);
    }

    // Check if user has access to board
    const membership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (!membership) {
      throw new CustomError('Access denied', 403);
    }

    return {
      id: board.id,
      title: board.title,
      ownerId: board.owner_id,
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    };
  },

  async getUserBoards(userId: string): Promise<Board[]> {
    const boards = await queryMany(
      `SELECT b.id, b.title, b.owner_id, b.created_at, b.updated_at
       FROM boards b
       INNER JOIN memberships m ON b.id = m.board_id
       WHERE m.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return boards.map((board: any) => ({
      id: board.id,
      title: board.title,
      ownerId: board.owner_id,
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    }));
  },

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await queryOne(
      'SELECT owner_id FROM boards WHERE id = $1',
      [boardId]
    );

    if (!board) {
      throw new CustomError('Board not found', 404);
    }

    // Check if user is owner
    if (board.owner_id !== userId) {
      throw new CustomError('Only board owner can delete board', 403);
    }

    // Delete board (memberships will be deleted by CASCADE)
    await queryOne('DELETE FROM boards WHERE id = $1', [boardId]);
  },

  async addMember(boardId: string, membershipData: CreateMembership, requesterId: string): Promise<void> {
    const board = await queryOne(
      'SELECT id FROM boards WHERE id = $1',
      [boardId]
    );

    if (!board) {
      throw new CustomError('Board not found', 404);
    }

    // Check if requester is owner or editor
    const requesterMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, requesterId]
    );

    if (!requesterMembership || !['owner', 'editor'].includes(requesterMembership.role)) {
      throw new CustomError('Insufficient permissions', 403);
    }

    // Check if user is already a member
    const existingMembership = await queryOne(
      'SELECT id FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, membershipData.userId]
    );

    if (existingMembership) {
      throw new CustomError('User is already a member of this board', 400);
    }

    // Add membership
    await queryOne(
      'INSERT INTO memberships (user_id, board_id, role) VALUES ($1, $2, $3)',
      [membershipData.userId, boardId, membershipData.role]
    );

    // Send invitation email
    try {
      const boardInfo = await queryOne(
        'SELECT title FROM boards WHERE id = $1',
        [boardId]
      );
      const requester = await queryOne(
        'SELECT display_name FROM users WHERE id = $1',
        [requesterId]
      );

      if (boardInfo && requester) {
        await emailService.sendBoardInviteEmail(
          membershipData.userId, // This should be email, but for now using userId
          requester.display_name,
          boardInfo.title,
          boardId,
          membershipData.role
        );
      }
    } catch (error) {
      // Log error but don't fail the invitation
      console.error('Failed to send invitation email:', error);
    }
  },

  async getSnapshot(boardId: string, userId: string): Promise<Buffer> {
    // Check access
    await this.getBoard(boardId, userId);

    // TODO: Implement actual snapshot retrieval from database
    // For now, return empty buffer
    return Buffer.alloc(0);
  },
};
