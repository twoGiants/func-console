import { FileEntry, ForgeUser as ForgeUserInfo, RepoInfo, SourceRepo } from '../types';

export interface SourceControlService {
  listFunctionRepos(): Promise<SourceRepo[]>;
  fetchFileContent(repo: SourceRepo, path: string): Promise<string>;
  push(repo: RepoInfo, files: FileEntry[], message: string): Promise<void>;
  fetchUserInfo(pat: string): Promise<ForgeUserInfo>;
}
