import { z } from 'zod';

// User related schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  createdAt: z.number(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Board related schemas
export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  ownerId: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CreateBoardSchema = z.object({
  title: z.string().min(1),
});

export const UpdateBoardSchema = z.object({
  title: z.string().min(1).optional(),
});

// Membership related schemas
export const MembershipSchema = z.object({
  userId: z.string().uuid(),
  boardId: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']),
});

export const CreateMembershipSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['editor', 'viewer']),
});

// Sticky note related schemas
export const StickyNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  color: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number(),
  zIndex: z.number(),
  createdBy: z.string().uuid(),
});

export const CreateStickyNoteSchema = z.object({
  text: z.string().default(''),
  color: z.string().default('#ffff00'),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().default(200),
  height: z.number().positive().default(200),
});

export const UpdateStickyNoteSchema = z.object({
  text: z.string().optional(),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().optional(),
  zIndex: z.number().optional(),
});

// Awareness related schemas
export const AwarenessStateSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  color: z.string(),
  cursor: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  selection: z.array(z.string()).optional(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// WebSocket message schemas
export const WebSocketMessageSchema = z.object({
  type: z.string(),
  payload: z.any(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;

export type Board = z.infer<typeof BoardSchema>;
export type CreateBoard = z.infer<typeof CreateBoardSchema>;
export type UpdateBoard = z.infer<typeof UpdateBoardSchema>;

export type Membership = z.infer<typeof MembershipSchema>;
export type CreateMembership = z.infer<typeof CreateMembershipSchema>;

export type StickyNote = z.infer<typeof StickyNoteSchema>;
export type CreateStickyNote = z.infer<typeof CreateStickyNoteSchema>;
export type UpdateStickyNote = z.infer<typeof UpdateStickyNoteSchema>;

export type AwarenessState = z.infer<typeof AwarenessStateSchema>;

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T = any> = {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Constants
export const BOARD_ROLES = ['owner', 'editor', 'viewer'] as const;
export type BoardRole = typeof BOARD_ROLES[number];

export const STICKY_COLORS = [
  '#ffff00', // Yellow
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#feca57', // Orange
  '#ff9ff3', // Pink
  '#54a0ff', // Light Blue
] as const;

// Shape types
export type ShapeType = 'sticky' | 'rectangle' | 'circle' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
}

export interface Rectangle extends BaseShape {
  type: 'rectangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface Circle extends BaseShape {
  type: 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

// Tool types
export type ToolType = 'select' | 'sticky' | 'rectangle' | 'circle' | 'text';

export const DEFAULT_STICKY_SIZE = {
  width: 200,
  height: 200,
} as const;

export const DEFAULT_SHAPE_SIZE = {
  width: 100,
  height: 100,
} as const;
