export interface DeployedFunction {
  name: string;
  namespace: string;
  runtime: string;
  status:
    | 'CreatingRepo'
    | 'Pushing'
    | 'PushedToGitHub'
    | 'Deploying'
    | 'Running'
    | 'ScaledToZero'
    | 'Error'
    | 'Unknown';
  url?: string;
  lastDeployed?: string;
  replicas: number;
}

export interface RepoInfo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

export interface FunctionListItem {
  name: string;
  namespace: string;
  runtime: string;
  status: DeployedFunction['status'] | 'NotDeployed';
  url?: string;
  replicas: number;
}
