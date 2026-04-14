import { useState } from 'react';
import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CreateFunctionForm, CreateFunctionFormData } from '../components/CreateFunctionForm';
import { useFunctionService } from '../services/function/useFunctionService';
import { useGitHubService } from '../services/github/useGitHubService';
import { usePat } from '../hooks/usePat';
import { PatModal } from '../components/PatModal';

export default function FunctionCreatePage() {
  const { t } = useTranslation('plugin__console-functions-plugin');
  const navigate = useNavigate();
  const functionService = useFunctionService();
  const gitHubService = useGitHubService();
  const { pat, setPat } = usePat();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateFunctionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const files = await functionService.generateFunction({
        name: data.name,
        runtime: data.runtime,
        registry: data.registry,
        namespace: data.namespace,
        branch: data.branch,
      });

      await gitHubService.pushFiles(
        { owner: data.owner, repo: data.repo, branch: data.branch },
        pat,
        files,
        'Initialize Knative function project',
      );

      navigate('/functions');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/functions');
  };

  return (
    <>
      <PatModal isOpen={!pat} onSave={setPat} />
      <DocumentTitle>{t('Create function')}</DocumentTitle>
      <ListPageHeader title={t('Create function')} />
      <PageSection>
        {error && (
          <Alert variant="danger" title={t('Error creating function')} isInline>
            {error}
          </Alert>
        )}
        <CreateFunctionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </>
  );
}
