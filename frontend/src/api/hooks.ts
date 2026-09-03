import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export const useFindings = () =>
  useQuery({ queryKey: ['findings'], queryFn: () => api.getFindings(), staleTime: 30_000 });

export const useAutomation = () =>
  useQuery({ queryKey: ['automation'], queryFn: () => api.getAutomation(), staleTime: 30_000 });

export const useRecon = () =>
  useQuery({ queryKey: ['recon'], queryFn: () => api.getRecon(), staleTime: 30_000 });

export const useCompliance = () =>
  useQuery({ queryKey: ['compliance'], queryFn: () => api.getCompliance(), staleTime: 30_000 });

export const useCvssDistribution = () =>
  useQuery({ queryKey: ['cvss'], queryFn: () => api.getCvssDistribution(), staleTime: 30_000 });

export const useScanHistory = () =>
  useQuery({ queryKey: ['scanHistory'], queryFn: () => api.getScanHistory(), staleTime: 15_000 });

export const useChangeFeed = () =>
  useQuery({ queryKey: ['changeFeed'], queryFn: () => api.getChangeFeed(), staleTime: 15_000 });
