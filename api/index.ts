import type { Request, Response } from 'express';
import app from '../serverApp';

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
