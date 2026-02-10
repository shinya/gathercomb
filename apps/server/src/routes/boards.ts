import { Router } from 'express';
import { boardService } from '../services/board.js';
import { authService } from '../services/auth.js';
import { CustomError } from '../middleware/errorHandler.js';
import { CreateBoardSchema, CreateMembershipSchema, UpdateBoardSchema } from '../../../../packages/shared/dist/index.js';

const router = Router();

// GET /api/boards
router.get('/', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const boards = await boardService.getUserBoards(user.id);

    res.json({
      success: true,
      data: boards,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/boards
router.post('/', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const boardData = CreateBoardSchema.parse(req.body);
    const board = await boardService.createBoard(boardData, user.id);

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/boards/:id
router.get('/:id', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const board = await boardService.getBoard(req.params.id, user.id);

    res.json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/boards/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const updates = UpdateBoardSchema.parse(req.body);
    const board = await boardService.updateBoard(req.params.id, user.id, updates);

    res.json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/boards/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    await boardService.deleteBoard(req.params.id, user.id);

    res.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/boards/:id/members
router.post('/:id/members', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const membershipData = CreateMembershipSchema.parse(req.body);

    await boardService.addMember(req.params.id, membershipData, user.id);

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/boards/:id/members
router.get('/:id/members', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const members = await boardService.getMembers(req.params.id, user.id);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/boards/:id/members/:userId
router.patch('/:id/members/:userId', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const { role } = req.body;

    await boardService.updateMemberRole(req.params.id, req.params.userId, role, user.id);

    res.json({
      success: true,
      message: 'Member role updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/boards/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    await boardService.removeMember(req.params.id, req.params.userId, user.id);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/boards/:id/snapshot
router.get('/:id/snapshot', async (req, res, next) => {
  try {
    const token = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const user = await authService.verifyToken(token);
    const snapshot = await boardService.getSnapshot(req.params.id, user.id);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(snapshot);
  } catch (error) {
    next(error);
  }
});

export { router as boardRoutes };
