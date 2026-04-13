import { useMemo } from 'react';
import { GithubService } from './GithubService';
import { SourceControlService } from './SourceControlService';

export function useSourceControl(pat: string): SourceControlService {
  return useMemo(() => new GithubService(pat), [pat]);
}
