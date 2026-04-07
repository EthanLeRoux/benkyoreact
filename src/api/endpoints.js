import { request } from './client';

export const getHealth = () => request('/health');

export const createMaterial = (payload) =>
  request('/materials', { method: 'POST', body: payload });

export const generateQuestions = (payload) =>
  request('/questions/generate', { method: 'POST', body: payload });

export const createTest = (payload) =>
  request('/tests/create', { method: 'POST', body: payload });

export const submitTest = (payload) =>
  request('/tests/submit', { method: 'POST', body: payload });

export const analyzePerformance = (payload) =>
  request('/analysis', { method: 'POST', body: payload });

export const rewriteMaterial = (payload) =>
  request('/rewrite', { method: 'POST', body: payload });
