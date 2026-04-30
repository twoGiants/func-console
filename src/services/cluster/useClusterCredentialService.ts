import { ClusterCredentialService } from './ClusterCredentialService';
import { OcpClusterCredentialService } from './OcpClusterCredentialService';

const instance = new OcpClusterCredentialService();

export function useClusterCredentialService(): ClusterCredentialService {
  return instance;
}
