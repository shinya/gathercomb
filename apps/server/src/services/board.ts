import { v4 as uuidv4 } from 'uuid';
import { CustomError } from '../middleware/errorHandler.js';
import { CreateBoard, CreateMembership, Board } from '../../../../packages/shared/dist/index.js';
import { emailService } from './email.js';
import { queryOne, queryMany, getLatestSnapshot } from '../utils/database.js';
import { logger } from '../utils/logger.js';

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

  async updateBoard(boardId: string, userId: string, updates: { title?: string }): Promise<Board> {
    const board = await queryOne(
      'SELECT id, title, owner_id, created_at, updated_at FROM boards WHERE id = $1',
      [boardId]
    );

    if (!board) {
      throw new CustomError('Board not found', 404);
    }

    // Check if user has edit access
    const membership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      throw new CustomError('Insufficient permissions', 403);
    }

    const updatedAt = Date.now();
    const newTitle = updates.title || board.title;

    await queryOne(
      'UPDATE boards SET title = $1, updated_at = $2 WHERE id = $3',
      [newTitle, updatedAt, boardId]
    );

    return {
      id: board.id,
      title: newTitle,
      ownerId: board.owner_id,
      createdAt: board.created_at,
      updatedAt,
    };
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
      logger.error({ error, boardId }, 'Failed to send invitation email');
    }
  },

  async getMembers(boardId: string, requesterId: string): Promise<Array<{userId: string; email: string; displayName: string; role: string}>> {
    // Check if requester is a member
    const requesterMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, requesterId]
    );

    if (!requesterMembership) {
      throw new CustomError('Access denied', 403);
    }

    const members = await queryMany(
      `SELECT u.id AS user_id, u.email, u.display_name, m.role
       FROM memberships m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.board_id = $1
       ORDER BY m.role ASC, u.display_name ASC`,
      [boardId]
    );

    return members.map((m: any) => ({
      userId: m.user_id,
      email: m.email,
      displayName: m.display_name,
      role: m.role,
    }));
  },

  async updateMemberRole(boardId: string, targetUserId: string, newRole: string, requesterId: string): Promise<void> {
    // Only owner can change roles
    const requesterMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, requesterId]
    );

    if (!requesterMembership || requesterMembership.role !== 'owner') {
      throw new CustomError('Only the board owner can change member roles', 403);
    }

    // Cannot change own role
    if (targetUserId === requesterId) {
      throw new CustomError('Cannot change your own role', 400);
    }

    // Validate new role
    if (!['editor', 'viewer'].includes(newRole)) {
      throw new CustomError('Role must be editor or viewer', 400);
    }

    // Check target is a member
    const targetMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, targetUserId]
    );

    if (!targetMembership) {
      throw new CustomError('User is not a member of this board', 404);
    }

    await queryOne(
      'UPDATE memberships SET role = $1 WHERE board_id = $2 AND user_id = $3',
      [newRole, boardId, targetUserId]
    );

    logger.info({ boardId, targetUserId, newRole, requesterId }, 'Member role updated');
  },

  async removeMember(boardId: string, targetUserId: string, requesterId: string): Promise<void> {
    // Only owner can remove members
    const requesterMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, requesterId]
    );

    if (!requesterMembership || requesterMembership.role !== 'owner') {
      throw new CustomError('Only the board owner can remove members', 403);
    }

    // Cannot remove self
    if (targetUserId === requesterId) {
      throw new CustomError('Cannot remove yourself from the board', 400);
    }

    // Check target is a member
    const targetMembership = await queryOne(
      'SELECT role FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, targetUserId]
    );

    if (!targetMembership) {
      throw new CustomError('User is not a member of this board', 404);
    }

    await queryOne(
      'DELETE FROM memberships WHERE board_id = $1 AND user_id = $2',
      [boardId, targetUserId]
    );

    logger.info({ boardId, targetUserId, requesterId }, 'Member removed from board');
  },

  async getSnapshot(boardId: string, userId: string): Promise<Buffer> {
    // Check access
    await this.getBoard(boardId, userId);

    // Retrieve latest snapshot from database
    const snapshot = await getLatestSnapshot(boardId);
    if (!snapshot) {
      logger.info({ boardId }, 'No snapshot found for board');
      return Buffer.alloc(0);
    }

    logger.info({ boardId, size: snapshot.length }, 'Snapshot retrieved');
    return Buffer.from(snapshot);
  },
};
