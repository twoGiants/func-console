export interface ClusterCredentialService {
  getKubeconfig(namespace: string): Promise<string>;
}
